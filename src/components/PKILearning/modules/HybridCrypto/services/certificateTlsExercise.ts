// SPDX-License-Identifier: AGPL-3.0-only
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'
import type { SimulationResult } from '@/store/tls-learning.store'

export type ExerciseFile = { name: string; data: Uint8Array }
export interface CertificateTlsEngine {
  execute(command: string, files?: ExerciseFile[]): Promise<OpenSSLCommandResult>
  deleteFile?(name: string): Promise<void>
  simulateTLS(
    client: string,
    server: string,
    files?: ExerciseFile[],
    commands?: string[]
  ): Promise<string>
}
export interface CertificateTlsRun {
  label: string
  group: string
  signature: string
  observedGroup: string
  observedSignature: string
  subjectKey: string
  issuerSignature: string
  passed: boolean
  trace: SimulationResult['trace']
}
export interface CertificateTlsEvidence {
  checks: { label: string; passed: boolean; detail: string }[]
  runs: CertificateTlsRun[]
  certificates: { label: string; pem: string }[]
  kemAuthenticationRejected: boolean
}
type SigningAlgorithm = 'RSA' | 'ML-DSA-65'
type SampleIssuer = { algorithm: SigningAlgorithm; ca: Uint8Array; caKey: Uint8Array }

const encoder = new TextEncoder()
const decoder = new TextDecoder()
export const TLS_EXERCISE_HOST = 'hybrid.example.test'
export const TLS_EXERCISE_HYBRID_GROUPS = [
  'X25519MLKEM768',
  'SecP256r1MLKEM768',
  'SecP384r1MLKEM1024',
] as const

/** Explicit groups and signing schemes prevent fallback from earning a pass. */
export function certificateTlsConfig(group: string, signature: string, client: boolean): string {
  return `openssl_conf = default_conf
[default_conf]
ssl_conf = ssl_sect
[ssl_sect]
system_default = system_default_sect
[system_default_sect]
MinProtocol = TLSv1.3
MaxProtocol = TLSv1.3
Ciphersuites = TLS_AES_256_GCM_SHA384
Groups = ${group}
SignatureAlgorithms = ${signature}
${client ? 'VerifyCAFile = /ssl/client-ca.crt' : ''}
`
}

/** Fresh, fictional CA-issued identities; no persisted keys or external connection. */
export async function runCertificateTlsExercise(
  engine: CertificateTlsEngine,
  progress: (stage: string) => void = () => {}
): Promise<CertificateTlsEvidence> {
  const checks: CertificateTlsEvidence['checks'] = []
  const prefix = `certtls-${crypto.randomUUID()}`
  const temporaryFiles = new Set<string>()
  try {
    const execute = async (files: Map<string, ExerciseFile>, cmd: string) => {
      const result = await engine.execute(cmd, [...files.values()])
      if (result.error) throw new Error(result.error)
      for (const file of result.files) files.set(file.name.replace(/^\//, ''), file)
      return result
    }
    const getFile = (files: Map<string, ExerciseFile>, path: string) => {
      const file = files.get(path)
      if (!file) throw new Error(`OpenSSL did not return ${path}`)
      return file.data
    }
    const issue = async (algorithm: SigningAlgorithm, issuer?: SampleIssuer) => {
      const issuerAlgorithm = issuer?.algorithm ?? algorithm
      const profile =
        algorithm === issuerAlgorithm ? algorithm : `${algorithm} leaf / ${issuerAlgorithm} CA`
      const name = `${prefix}-${algorithm}-from-${issuerAlgorithm}`
      const ca = `${name}-ca.pem`,
        caKey = `${name}-ca.key`
      const cert = `${name}.pem`,
        key = `${name}.key`,
        csr = `${name}.csr`,
        ext = `${name}.cnf`
      for (const path of [ca, caKey, cert, key, csr, ext]) temporaryFiles.add(path)
      const files = new Map<string, ExerciseFile>()
      const command = (cmd: string) => execute(files, cmd)
      progress(`Issuing ${profile} sample certificate`)
      const keyArg = algorithm === 'RSA' ? 'rsa:2048' : 'ML-DSA-65'
      if (issuer) {
        files.set(ca, { name: ca, data: issuer.ca })
        files.set(caKey, { name: caKey, data: issuer.caKey })
      } else {
        await command(
          `openssl req -x509 -newkey ${keyArg} -noenc -keyout ${caKey} -out ${ca} -days 2 -subj "/CN=Hybrid Exercise ${algorithm} CA" -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign"`
        )
      }
      await command(
        `openssl req -new -newkey ${keyArg} -noenc -keyout ${key} -out ${csr} -subj "/CN=${TLS_EXERCISE_HOST}"`
      )
      files.set(ext, {
        name: ext,
        data: encoder.encode(
          `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:${TLS_EXERCISE_HOST}\nsubjectKeyIdentifier=hash\nauthorityKeyIdentifier=keyid,issuer\n`
        ),
      })
      await command(
        `openssl x509 -req -in ${csr} -CA ${ca} -CAkey ${caKey} -set_serial ${issuer ? 4 : 2} -days 1 -extfile ${ext} -out ${cert}`
      )
      const verify = `openssl verify -x509_strict -purpose sslserver -verify_hostname ${TLS_EXERCISE_HOST} -CAfile ${ca} ${cert}`
      const verified = await command(verify)
      const decoded = await command(`openssl x509 -in ${cert} -noout -text`)
      const subjectKey = decoded.stdout.match(/^\s*Public Key Algorithm:[ \t]*(\S+)/im)?.[1] ?? ''
      const issuerSignature =
        decoded.stdout.match(/^\s*Signature Algorithm:[ \t]*(\S+)/im)?.[1] ?? ''
      const expectedKey = algorithm === 'RSA' ? 'rsaEncryption' : algorithm
      const expectedSignature =
        issuerAlgorithm === 'RSA' ? 'sha256WithRSAEncryption' : issuerAlgorithm
      const pathPassed =
        verified.stdout.includes(': OK') &&
        subjectKey.toLowerCase() === expectedKey.toLowerCase() &&
        issuerSignature.toLowerCase() === expectedSignature.toLowerCase()
      checks.push({
        label: `${profile}: CA path, validity, server purpose and DNS name`,
        passed: pathPassed,
        detail: `${verified.stdout.trim()}\nSubject public key: ${subjectKey}\nIssuer signature: ${issuerSignature}`,
      })
      let rejected = false,
        detail = ''
      try {
        const result = await command(verify.replace(TLS_EXERCISE_HOST, 'wrong.example.test'))
        detail = result.stderr
      } catch (error) {
        detail = String(error)
        rejected = /hostname mismatch/i.test(detail)
      }
      checks.push({ label: `${profile}: wrong hostname rejected`, passed: rejected, detail })
      return {
        cert: getFile(files, cert),
        key: getFile(files, key),
        ca: getFile(files, ca),
        caKey: getFile(files, caKey),
        subjectKey,
        issuerSignature,
        pathPassed,
      }
    }
    const rsa = await issue('RSA')
    const pq = await issue('ML-DSA-65')
    const mixed = await issue('RSA', { algorithm: 'ML-DSA-65', ca: pq.ca, caKey: pq.caKey })
    type Identity = Pick<typeof rsa, 'cert' | 'key' | 'ca'>
    const material = (identity: Identity, anchor = identity.ca): ExerciseFile[] => [
      { name: 'ssl/server.crt', data: identity.cert },
      { name: 'ssl/server.key', data: identity.key },
      { name: 'ssl/client-ca.crt', data: anchor },
    ]
    const simulate = async (
      identity: Identity,
      group: string,
      signature: string,
      anchor = identity.ca,
      serverSignature = signature,
      serverGroup = group
    ) => {
      const result: SimulationResult = JSON.parse(
        await engine.simulateTLS(
          certificateTlsConfig(group, signature, true),
          certificateTlsConfig(serverGroup, serverSignature, false),
          material(identity, anchor),
          [
            'CLIENT_SEND: certificate exercise',
            'SERVER_SEND: authenticated response',
            'CLIENT_DISCONNECT',
          ]
        )
      )
      if (!Array.isArray(result.trace)) throw new Error('TLS engine returned no trace')
      return result
    }
    const runs: CertificateTlsRun[] = []
    for (const [label, identity, group, signature, clientSignature] of [
      ['Classical baseline', rsa, 'X25519', 'rsa_pss_rsae_sha256'],
      ['Hybrid exchange + classical authentication', rsa, 'X25519MLKEM768', 'rsa_pss_rsae_sha256'],
      ['Hybrid exchange + PQ authentication', pq, 'X25519MLKEM768', 'mldsa65'],
      [
        'Hybrid exchange + RSA leaf issued by ML-DSA CA',
        mixed,
        'X25519MLKEM768',
        'rsa_pss_rsae_sha256',
        'rsa_pss_rsae_sha256:mldsa65',
      ],
      ...TLS_EXERCISE_HYBRID_GROUPS.slice(1).map(
        (group) =>
          [`${group} + the same RSA certificate`, rsa, group, 'rsa_pss_rsae_sha256'] as const
      ),
    ] as const) {
      progress(label)
      const result = await simulate(
        identity,
        group,
        clientSignature ?? signature,
        identity.ca,
        signature
      )
      const observedGroup = result.trace.find((e) => e.event === 'key_exchange')?.details ?? ''
      const observedSignature =
        result.trace.find((e) => e.event === 'signature_algorithm')?.details ?? ''
      runs.push({
        label,
        group,
        signature,
        observedGroup,
        observedSignature,
        subjectKey: identity.subjectKey,
        issuerSignature: identity.issuerSignature,
        passed:
          identity.pathPassed &&
          result.status === 'success' &&
          observedGroup.toLowerCase() === `Key Exchange: ${group}`.toLowerCase() &&
          observedSignature.toLowerCase().includes(signature),
        trace: result.trace,
      })
    }
    progress('Testing rejected trust and signature choices')
    const wrongGroup = await simulate(
      rsa,
      'SecP384r1MLKEM1024',
      'rsa_pss_rsae_sha256',
      rsa.ca,
      'rsa_pss_rsae_sha256',
      'X25519MLKEM768'
    )
    const wrongGroupErrors = wrongGroup.trace.filter((entry) => entry.event === 'error')
    checks.push({
      label: 'Peer limited to X25519MLKEM768 rejected by the SecP384r1MLKEM1024 client',
      passed:
        wrongGroup.status === 'failed' &&
        wrongGroupErrors.some((entry) =>
          /no suitable key share|no shared group|no common group/i.test(entry.details)
        ),
      detail: wrongGroupErrors.map((entry) => entry.details).join('\n'),
    })
    const wrongCa = await simulate(rsa, 'X25519MLKEM768', 'rsa_pss_rsae_sha256', pq.ca)
    checks.push({
      label: 'Unrelated CA rejected by TLS',
      passed:
        wrongCa.status === 'failed' &&
        wrongCa.trace.some((e) => /certificate verify failed/i.test(e.details)),
      detail: wrongCa.trace
        .filter((e) => e.event === 'error')
        .map((e) => e.details)
        .join('\n'),
    })
    const wrongMixedCa = await simulate(
      mixed,
      'X25519MLKEM768',
      'rsa_pss_rsae_sha256:mldsa65',
      rsa.ca,
      'rsa_pss_rsae_sha256'
    )
    const wrongMixedCaErrors = wrongMixedCa.trace.filter((entry) => entry.event === 'error')
    checks.push({
      label: 'RSA leaf with ML-DSA issuer rejected when only the RSA CA is trusted',
      passed:
        wrongMixedCa.status === 'failed' &&
        wrongMixedCaErrors.some((entry) => /certificate verify failed/i.test(entry.details)),
      detail: wrongMixedCaErrors.map((entry) => entry.details).join('\n'),
    })
    const wrongScheme = await simulate(
      pq,
      'X25519MLKEM768',
      'rsa_pss_rsae_sha256',
      pq.ca,
      'mldsa65'
    )
    checks.push({
      label: 'Incompatible CertificateVerify scheme rejected',
      passed:
        wrongScheme.status === 'failed' &&
        wrongScheme.trace.some((e) => /signature|sigalg/i.test(e.details)),
      detail: wrongScheme.trace
        .filter((e) => e.event === 'error')
        .map((e) => e.details)
        .join('\n'),
    })
    progress('Testing a certificate whose subject key can encapsulate')
    const kem = `${prefix}-kem`
    const kemCert = `${kem}.pem`
    const kemKey = `${kem}.key`
    const kemPublicKey = `${kem}-public.pem`
    const kemExtensions = `${kem}.cnf`
    const kemCa = `${kem}-issuer.pem`
    const kemCaKey = `${kem}-issuer.key`
    const challenge = `${kem}-challenge.txt`
    for (const path of [kemCert, kemKey, kemPublicKey, kemExtensions, kemCa, kemCaKey, challenge]) {
      temporaryFiles.add(path)
    }
    const kemFiles = new Map<string, ExerciseFile>([
      [kemCa, { name: kemCa, data: rsa.ca }],
      [kemCaKey, { name: kemCaKey, data: rsa.caKey }],
      [
        kemExtensions,
        {
          name: kemExtensions,
          data: encoder.encode(
            `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,keyEncipherment\nsubjectAltName=DNS:${TLS_EXERCISE_HOST}\nsubjectKeyIdentifier=hash\nauthorityKeyIdentifier=keyid,issuer\n`
          ),
        },
      ],
    ])
    await execute(kemFiles, `openssl genpkey -algorithm ML-KEM-768 -out ${kemKey}`)
    await execute(kemFiles, `openssl pkey -in ${kemKey} -pubout -out ${kemPublicKey}`)
    await execute(
      kemFiles,
      `openssl x509 -new -force_pubkey ${kemPublicKey} -CA ${kemCa} -CAkey ${kemCaKey} -set_serial 3 -days 1 -extfile ${kemExtensions} -subj "/CN=${TLS_EXERCISE_HOST}" -out ${kemCert}`
    )
    const kemPath = await execute(
      kemFiles,
      `openssl verify -x509_strict -verify_hostname ${TLS_EXERCISE_HOST} -CAfile ${kemCa} ${kemCert}`
    )
    const kemType = await execute(kemFiles, `openssl x509 -in ${kemCert} -noout -text`)
    const kemPathValid =
      kemPath.stdout.includes(': OK') &&
      /Public Key Algorithm: ML-KEM-768/i.test(kemType.stdout) &&
      /X509v3 Key Usage: critical\s+Key Encipherment\s*(?:\r?\n|$)/i.test(kemType.stdout)
    checks.push({
      label: 'ML-KEM-768 leaf: CA path and DNS name verified',
      passed: kemPathValid,
      detail: kemPath.stdout.trim(),
    })
    const kemIdentity = {
      cert: getFile(kemFiles, kemCert),
      key: getFile(kemFiles, kemKey),
      ca: rsa.ca,
    }
    kemFiles.set(challenge, {
      name: challenge,
      data: encoder.encode('Fictional TLS signing-capability check'),
    })
    let signRejected = false
    let signDetail = ''
    try {
      await execute(kemFiles, `openssl pkeyutl -sign -rawin -inkey ${kemKey} -in ${challenge}`)
    } catch (error) {
      signDetail = String(error)
      signRejected =
        /operation not supported for this keytype|operation not supported for this key type|supported signature operation/i.test(
          signDetail
        )
    }
    const kemTls = await simulate(kemIdentity, 'X25519MLKEM768', 'rsa_pss_rsae_sha256')
    const kemDetails = kemTls.trace.filter((row) => row.event === 'error').map((row) => row.details)
    const kemAuthenticationRejected = kemPathValid && signRejected && kemTls.status === 'failed'
    checks.push({
      label: 'ML-KEM-768 leaf rejected as the TLS signing credential',
      passed: kemAuthenticationRejected,
      detail: [signDetail, ...kemDetails].filter(Boolean).join('\n'),
    })
    return {
      checks,
      runs,
      kemAuthenticationRejected,
      certificates: [
        {
          label: 'RSA server certificate (used in the baseline and all three group comparisons)',
          pem: decoder.decode(rsa.cert),
        },
        { label: 'ML-DSA-65 server certificate', pem: decoder.decode(pq.cert) },
        {
          label: 'RSA server certificate issued by the ML-DSA-65 CA',
          pem: decoder.decode(mixed.cert),
        },
        { label: 'ML-KEM-768 encipherment certificate', pem: decoder.decode(kemIdentity.cert) },
      ],
    }
  } finally {
    if (engine.deleteFile)
      await Promise.all([...temporaryFiles].map((name) => engine.deleteFile!(name)))
  }
}
