// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import {
  BasicConstraintsExtension,
  ExtendedKeyUsageExtension,
  KeyUsageFlags,
  KeyUsagesExtension,
  SubjectAlternativeNameExtension,
  X509Certificate,
} from '@peculiar/x509'
import { fromBER, Integer, Sequence } from 'asn1js'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

export const CHAIN_SAMPLE = {
  notBefore: '2026-01-01T00:00:00.000Z',
  notAfter: '2027-01-01T00:00:00.000Z',
  checkTime: '2026-11-08T00:00:00.000Z',
  hostname: 'example.test',
} as const
export type ChainAlgorithm = 'ML-DSA-65' | 'RSA-2048'
export type ChainRole = 'root' | 'intermediate' | 'leaf'
const ROLES: readonly ChainRole[] = ['root', 'intermediate', 'leaf']
function roleName(role: ChainRole): string {
  return role === 'root'
    ? 'SampleRoot'
    : role === 'intermediate'
      ? 'SampleIntermediate'
      : 'SampleLeaf'
}
function serialNumber(role: ChainRole): string {
  return role === 'root' ? '1' : role === 'intermediate' ? '2' : '3'
}
export interface PublicChainCertificate {
  role: ChainRole
  pem: string
  der: Uint8Array
  subject: string
  issuer: string
  serial: string
}
export interface MeasuredChain {
  algorithm: ChainAlgorithm
  certificates: readonly PublicChainCertificate[]
  certificateDerBytes: number
  certificateBody: Uint8Array
  handshakeMessage: Uint8Array
  verification: string
}
export type SampleChainEngine = Pick<typeof openSSLService, 'execute' | 'deleteFile'>

function uint24(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffff)
    throw new Error('TLS sample length does not fit uint24')
  return new Uint8Array([Math.floor(value / 65536), Math.floor(value / 256) % 256, value % 256])
}

/** RFC 8446 §4.4.2: empty request context, exactly leaf + intermediate, empty entry extensions.
 * This frames bytes; it does not validate certificates or establish a TLS connection. */
export function encodeSampleCertificateMessage(leaf: Uint8Array, intermediate: Uint8Array) {
  const certs = [leaf, intermediate]
  if (certs.some((cert) => !(cert instanceof Uint8Array) || cert.length === 0))
    throw new Error('Both transmitted certificate byte strings must be nonempty')
  const listLength = certs.reduce((sum, cert) => sum + 3 + cert.length + 2, 0)
  uint24(listLength + 4)
  const body = new Uint8Array(listLength + 4)
  body.set(uint24(listLength), 1)
  let offset = 4
  for (const cert of certs) {
    body.set(uint24(cert.length), offset)
    body.set(cert, offset + 3)
    offset += cert.length + 5 // Two zero extension-length bytes are already initialized.
  }
  const handshake = new Uint8Array(body.length + 4)
  handshake.set([11], 0) // Certificate handshake type.
  handshake.set(uint24(body.length), 1)
  handshake.set(body, 4)
  return {
    certificateDerBytes: leaf.length + intermediate.length,
    certificateBody: body,
    handshakeMessage: handshake,
  }
}

const config = `[req]
prompt = no
distinguished_name = dn
[dn]
CN = unused
[root]
basicConstraints = critical,CA:TRUE,pathlen:1
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
[intermediate]
basicConstraints = critical,CA:TRUE,pathlen:0
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
[leaf]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = DNS:example.test
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
`

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b.at(index))
}

/** Check the exact fictional metadata and selected algorithm before publishing measurements. */
export function inspectMeasuredCertificate(
  der: Uint8Array,
  pem: string,
  algorithm: ChainAlgorithm,
  role: ChainRole
): PublicChainCertificate {
  const raw = der.slice().buffer
  const parsed = fromBER(raw)
  if (parsed.offset !== der.length) throw new Error('Certificate is not one complete DER object')
  const cert = new X509Certificate(raw)
  if (!equalBytes(new Uint8Array(new X509Certificate(pem).rawData), der))
    throw new Error('PEM and DER certificate bytes differ')
  const asn = AsnConvert.parse(raw, Certificate)
  const expectedSubject = `CN=${roleName(role)}`
  const issuerRole = role === 'leaf' ? 'intermediate' : 'root'
  if (cert.subject !== expectedSubject || cert.issuer !== `CN=${roleName(issuerRole)}`)
    throw new Error('Certificate subject or issuer differs from the declared sample')
  if (
    cert.serialNumber.replace(/^0+/, '') !== serialNumber(role) ||
    cert.notBefore.toISOString() !== CHAIN_SAMPLE.notBefore ||
    cert.notAfter.toISOString() !== CHAIN_SAMPLE.notAfter
  )
    throw new Error('Certificate serial or validity differs from the declared sample')
  const basic = cert.getExtension(BasicConstraintsExtension)
  const expectedPath = role === 'root' ? 1 : role === 'intermediate' ? 0 : undefined
  if (!basic?.critical || basic.ca !== (role !== 'leaf') || basic.pathLength !== expectedPath)
    throw new Error('Certificate CA role or path length differs from the declared sample')
  const usage = cert.getExtension(KeyUsagesExtension)
  const expectedUsage =
    role === 'leaf'
      ? KeyUsageFlags.digitalSignature
      : KeyUsageFlags.keyCertSign | KeyUsageFlags.cRLSign
  if (!usage?.critical || usage.usages !== expectedUsage)
    throw new Error('Certificate key usage differs from the declared sample')
  const eku = cert.getExtension(ExtendedKeyUsageExtension)
  if (
    role === 'leaf'
      ? !eku || eku.critical || eku.usages.length !== 1 || eku.usages.at(0) !== '1.3.6.1.5.5.7.3.1'
      : Boolean(eku)
  )
    throw new Error('Certificate extended key usage differs from the declared sample')
  const sans = cert.getExtension(SubjectAlternativeNameExtension)?.names.toJSON() ?? []
  if (
    role === 'leaf'
      ? sans.length !== 1 ||
        sans.at(0)?.type !== 'dns' ||
        sans.at(0)?.value !== CHAIN_SAMPLE.hostname
      : sans.length !== 0
  )
    throw new Error('Certificate SAN differs from the declared sample')
  const publicInfo = asn.tbsCertificate.subjectPublicKeyInfo
  const signatureOid =
    algorithm === 'ML-DSA-65' ? '2.16.840.1.101.3.4.3.18' : '1.2.840.113549.1.1.11'
  const keyOid = algorithm === 'ML-DSA-65' ? signatureOid : '1.2.840.113549.1.1.1'
  if (
    asn.signatureAlgorithm.algorithm !== signatureOid ||
    asn.tbsCertificate.signature.algorithm !== signatureOid ||
    publicInfo.algorithm.algorithm !== keyOid
  )
    throw new Error('Certificate algorithm differs from the declared sample')
  if (algorithm === 'ML-DSA-65') {
    if (
      asn.signatureAlgorithm.parameters !== undefined ||
      asn.tbsCertificate.signature.parameters !== undefined ||
      publicInfo.algorithm.parameters !== undefined ||
      publicInfo.subjectPublicKey.byteLength !== 1952 ||
      asn.signatureValue.byteLength !== 3309
    )
      throw new Error('Certificate does not carry the declared ML-DSA-65 representation')
  } else {
    const key = fromBER(publicInfo.subjectPublicKey).result
    const modulus = key instanceof Sequence ? key.valueBlock.value.at(0) : undefined
    if (!(modulus instanceof Integer)) throw new Error('Invalid RSA public key')
    const bytes = Array.from(modulus.valueBlock.valueHexView)
    while (bytes.at(0) === 0) bytes.shift()
    const first = bytes.at(0)
    if (
      !first ||
      (bytes.length - 1) * 8 + Math.floor(Math.log2(first)) + 1 !== 2048 ||
      asn.signatureValue.byteLength !== 256
    )
      throw new Error('Certificate does not carry the declared RSA-2048 representation')
  }
  return {
    role,
    pem,
    der: der.slice(),
    subject: cert.subject,
    issuer: cert.issuer,
    serial: cert.serialNumber,
  }
}

/** Uses existing browser OpenSSL commands only. Keys stay inside this sample operation and
 * are never returned to callers, displayed, downloaded or added to the workshop artifact store. */
export async function generateMeasuredChains(
  engine: SampleChainEngine = openSSLService,
  isCurrent: () => boolean = () => true
): Promise<readonly MeasuredChain[]> {
  const prefix = `sample-chain-${crypto.randomUUID().replaceAll('-', '')}`
  const files = new Map<string, Uint8Array>()
  const owned = new Set<string>()
  const current = () => {
    if (!isCurrent()) throw new Error('Sample generation canceled')
  }
  const run = async (command: string, output?: string): Promise<OpenSSLCommandResult> => {
    current()
    if (output) owned.add(output)
    const result = await engine.execute(
      command,
      Array.from(files, ([name, data]) => ({ name, data }))
    )
    current()
    if (result.error) throw new Error(result.error + '\n' + result.stderr)
    if (output) {
      const file = result.files.find((entry) => entry.name === output)
      if (!file?.data.length)
        throw new Error('OpenSSL did not produce the expected sample artifact')
      files.set(output, file.data.slice())
    }
    return result
  }
  const results: MeasuredChain[] = []
  try {
    for (const algorithm of ['ML-DSA-65', 'RSA-2048'] as const) {
      const stem = `${prefix}-${algorithm === 'ML-DSA-65' ? 'pq' : 'rsa'}`
      const cfg = `${stem}.cnf`
      owned.add(cfg)
      files.set(cfg, new TextEncoder().encode(config))
      const certificates: PublicChainCertificate[] = []
      for (const role of ROLES) {
        current()
        const key = `${stem}-${role}.key`,
          pem = `${stem}-${role}.pem`,
          der = `${stem}-${role}.der`
        const keyArgs =
          algorithm === 'ML-DSA-65'
            ? '-algorithm ML-DSA-65'
            : '-algorithm RSA -pkeyopt rsa_keygen_bits:2048'
        await run(`openssl genpkey ${keyArgs} -out ${key}`, key)
        const issuer = role === 'leaf' ? 'intermediate' : 'root'
        const caArgs =
          role === 'root' ? '' : `-CA ${stem}-${issuer}.pem -CAkey ${stem}-${issuer}.key`
        const digest = algorithm === 'RSA-2048' ? '-sha256' : ''
        await run(
          `openssl req -new -x509 -key ${key} ${caArgs} ${digest} -subj /CN=${roleName(role)} -set_serial ${serialNumber(role)} -not_before 20260101000000Z -not_after 20270101000000Z -config ${cfg} -extensions ${role} -out ${pem}`,
          pem
        )
        await run(`openssl x509 -in ${pem} -outform DER -out ${der}`, der)
        const pemData = files.get(pem),
          derData = files.get(der)
        if (!pemData || !derData) throw new Error('Sample certificate artifacts missing')
        certificates.push(
          inspectMeasuredCertificate(derData, new TextDecoder().decode(pemData), algorithm, role)
        )
      }
      const leafName = `${stem}-leaf.pem`
      const check = await run(
        `openssl verify -attime ${Date.parse(CHAIN_SAMPLE.checkTime) / 1000} -check_ss_sig -verify_hostname ${CHAIN_SAMPLE.hostname} -purpose sslserver -no-CApath -no-CAstore -CAfile ${stem}-root.pem -untrusted ${stem}-intermediate.pem ${leafName}`
      )
      if (!check.stdout.split('\n').some((line) => line.trim() === `${leafName}: OK`))
        throw new Error('OpenSSL did not confirm the declared sample chain')
      const leaf = certificates.find((cert) => cert.role === 'leaf'),
        intermediate = certificates.find((cert) => cert.role === 'intermediate')
      if (!leaf || !intermediate) throw new Error('Transmitted sample pair missing')
      current()
      results.push({
        algorithm,
        certificates,
        ...encodeSampleCertificateMessage(leaf.der, intermediate.der),
        verification: `OpenSSL sample chain/hostname check passed at ${CHAIN_SAMPLE.checkTime}`,
      })
    }
    current()
    return results
  } finally {
    // Only task-created, uniquely named files; never existing user/token material.
    await Promise.all(Array.from(owned, (name) => engine.deleteFile(name).catch(() => {})))
    files.clear()
  }
}
