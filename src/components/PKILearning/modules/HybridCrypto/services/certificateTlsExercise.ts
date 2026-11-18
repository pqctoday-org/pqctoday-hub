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
  passed: boolean
  trace: SimulationResult['trace']
}
export interface CertificateTlsEvidence {
  checks: { label: string; passed: boolean; detail: string }[]
  runs: CertificateTlsRun[]
  certificates: { label: string; pem: string }[]
}
const encoder = new TextEncoder()
const decoder = new TextDecoder()
export const TLS_EXERCISE_HOST = 'hybrid.example.test'

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
    const issue = async (algorithm: 'RSA' | 'ML-DSA-65') => {
      const name = `${prefix}-${algorithm}`
      const ca = `${name}-ca.pem`,
        caKey = `${name}-ca.key`
      const cert = `${name}.pem`,
        key = `${name}.key`,
        csr = `${name}.csr`,
        ext = `${name}.cnf`
      for (const path of [ca, caKey, cert, key, csr, ext]) temporaryFiles.add(path)
      const files = new Map<string, ExerciseFile>()
      const command = async (cmd: string) => {
        const result = await engine.execute(cmd, [...files.values()])
        if (result.error) throw new Error(result.error)
        for (const file of result.files) files.set(file.name.replace(/^\//, ''), file)
        return result
      }
      progress(`Issuing ${algorithm} sample certificate`)
      const keyArg = algorithm === 'RSA' ? 'rsa:2048' : 'ML-DSA-65'
      await command(
        `openssl req -x509 -newkey ${keyArg} -noenc -keyout ${caKey} -out ${ca} -days 2 -subj "/CN=Hybrid Exercise ${algorithm} CA" -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign"`
      )
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
        `openssl x509 -req -in ${csr} -CA ${ca} -CAkey ${caKey} -set_serial 2 -days 1 -extfile ${ext} -out ${cert}`
      )
      const verify = `openssl verify -x509_strict -purpose sslserver -verify_hostname ${TLS_EXERCISE_HOST} -CAfile ${ca} ${cert}`
      const verified = await command(verify)
      checks.push({
        label: `${algorithm}: CA path, validity, server purpose and DNS name`,
        passed: verified.stdout.includes(': OK'),
        detail: verified.stdout.trim(),
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
      checks.push({ label: `${algorithm}: wrong hostname rejected`, passed: rejected, detail })
      const get = (path: string) => {
        const file = files.get(path)
        if (!file) throw new Error(`OpenSSL did not return ${path}`)
        return file.data
      }
      return { cert: get(cert), key: get(key), ca: get(ca) }
    }
    const rsa = await issue('RSA')
    const pq = await issue('ML-DSA-65')
    const material = (identity: typeof rsa, anchor = identity.ca): ExerciseFile[] => [
      { name: 'ssl/server.crt', data: identity.cert },
      { name: 'ssl/server.key', data: identity.key },
      { name: 'ssl/client-ca.crt', data: anchor },
    ]
    const simulate = async (
      identity: typeof rsa,
      group: string,
      signature: string,
      anchor = identity.ca,
      serverSignature = signature
    ) => {
      const result: SimulationResult = JSON.parse(
        await engine.simulateTLS(
          certificateTlsConfig(group, signature, true),
          certificateTlsConfig(group, serverSignature, false),
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
    for (const [label, identity, group, signature] of [
      ['Classical baseline', rsa, 'X25519', 'rsa_pss_rsae_sha256'],
      ['Hybrid exchange + classical authentication', rsa, 'X25519MLKEM768', 'rsa_pss_rsae_sha256'],
      ['Hybrid exchange + PQ authentication', pq, 'X25519MLKEM768', 'mldsa65'],
    ] as const) {
      progress(label)
      const result = await simulate(identity, group, signature)
      const observedGroup = result.trace.find((e) => e.event === 'key_exchange')?.details ?? ''
      const observedSignature =
        result.trace.find((e) => e.event === 'signature_algorithm')?.details ?? ''
      runs.push({
        label,
        group,
        signature,
        observedGroup,
        observedSignature,
        passed:
          result.status === 'success' &&
          observedGroup.toLowerCase() === `Key Exchange: ${group}`.toLowerCase() &&
          observedSignature.toLowerCase().includes(signature),
        trace: result.trace,
      })
    }
    progress('Testing rejected trust and signature choices')
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
    return {
      checks,
      runs,
      certificates: [
        {
          label: 'RSA server certificate (used in both first runs)',
          pem: decoder.decode(rsa.cert),
        },
        { label: 'ML-DSA-65 server certificate', pem: decoder.decode(pq.cert) },
      ],
    }
  } finally {
    if (engine.deleteFile)
      await Promise.all([...temporaryFiles].map((name) => engine.deleteFile!(name)))
  }
}
