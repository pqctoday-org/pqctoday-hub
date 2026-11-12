// SPDX-License-Identifier: AGPL-3.0-only
import { AsnParser, AsnSerializer } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { base64 } from '@scure/base'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import type { CertLeaf } from './merkleTree'

const PROFILES = [
  { name: 'ML-DSA-44', openssl: 'ML-DSA-44', oid: '2.16.840.1.101.3.4.3.17', size: 1312 },
  { name: 'ML-DSA-65', openssl: 'ML-DSA-65', oid: '2.16.840.1.101.3.4.3.18', size: 1952 },
  { name: 'ML-DSA-87', openssl: 'ML-DSA-87', oid: '2.16.840.1.101.3.4.3.19', size: 2592 },
  { name: 'SLH-DSA-128s', openssl: 'SLH-DSA-SHA2-128s', oid: '2.16.840.1.101.3.4.3.20', size: 32 },
] as const

/** Exact DER public SPKI only. Parsing does not verify possession or certificate trust. */
export async function subjectKeyDigest(cert: CertLeaf): Promise<string> {
  const profile = PROFILES.find((p) => p.name === cert.algorithm)
  if (!profile || cert.publicKeySize !== profile.size)
    throw new Error('Unsupported subject-key profile or size')
  if (!cert.publicKeySpki)
    throw new Error('Subject public SPKI is missing; rebuild with actual sample keys')
  const der = base64.decode(cert.publicKeySpki)
  if (!der.length || der.length > 16384 || base64.encode(der) !== cert.publicKeySpki)
    throw new Error('Malformed subject public SPKI encoding')
  const parsed = AsnParser.parse(der, SubjectPublicKeyInfo)
  if (
    parsed.algorithm.algorithm !== profile.oid ||
    parsed.algorithm.parameters !== undefined ||
    parsed.subjectPublicKey.byteLength !== profile.size
  )
    throw new Error('Subject public SPKI does not match the selected algorithm and size')
  const canonical = new Uint8Array(AsnSerializer.serialize(parsed))
  if (canonical.length !== der.length || canonical.some((b, i) => b !== der[i]))
    throw new Error('Subject public SPKI must be complete canonical DER')
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(der).buffer))
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Generate only the selected subject key; private files never enter leaf/proof state. */
export async function generateSubjectKey(input: CertLeaf): Promise<CertLeaf> {
  const cert = { ...input }
  const profile = PROFILES.find((p) => p.name === cert.algorithm)
  if (!profile || cert.publicKeySize !== profile.size)
    throw new Error('Unsupported subject-key profile or size')
  const prefix = `mtc_subject_${crypto.randomUUID()}`
  const priv = `${prefix}.pem`,
    pub = `${prefix}.der`
  try {
    const generated = await openSSLService.execute(
      `openssl genpkey -algorithm ${profile.openssl} -out ${priv}`
    )
    if (generated.error) throw new Error(generated.error)
    const privateFile = generated.files.find((f) => f.name === priv)
    if (!privateFile?.data.length)
      throw new Error('Subject key generation returned no private key file')
    const exported = await openSSLService.execute(
      `openssl pkey -in ${priv} -pubout -outform DER -out ${pub}`,
      [privateFile]
    )
    if (exported.error) throw new Error(exported.error)
    const publicFile = exported.files.find((f) => f.name === pub)
    if (!publicFile?.data.length) throw new Error('Subject key export returned no public SPKI')
    const result: CertLeaf = {
      ...cert,
      publicKeySpki: base64.encode(publicFile.data),
      publicKeyDigest: undefined,
    }
    result.publicKeyDigest = await subjectKeyDigest(result)
    return result
  } finally {
    await Promise.all([openSSLService.deleteFile(priv), openSSLService.deleteFile(pub)])
  }
}

/** Existing public keys survive rebuilds; partial/invalid bindings are never silently replaced. */
export async function bindSubjectKeys(certs: CertLeaf[]): Promise<CertLeaf[]> {
  const result: CertLeaf[] = []
  for (const cert of certs.map((c) => ({ ...c }))) {
    if (cert.publicKeySpki || cert.publicKeyDigest) {
      const digest = await subjectKeyDigest(cert)
      if (digest !== cert.publicKeyDigest) throw new Error('Subject-key digest mismatch')
      result.push({ ...cert })
    } else result.push(await generateSubjectKey(cert))
  }
  return result
}
