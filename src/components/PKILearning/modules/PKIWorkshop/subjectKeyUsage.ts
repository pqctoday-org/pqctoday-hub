// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { Pkcs10CertificateRequest, PublicKey } from '@peculiar/x509'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import type { X509Attribute } from '../../common/types'

// Expose the existing parser's SPKI without converting PQC keys to WebCrypto.
// CSR signatureAlgorithm and saved display metadata do not define subject usage.
class SubjectRequest extends Pkcs10CertificateRequest {
  get subjectInfo(): SubjectPublicKeyInfo {
    return this.asn.certificationRequestInfo.subjectPKInfo
  }
}

export class SubjectKeyUsageError extends Error {}

const SIGNING = ['digitalSignature', 'nonRepudiation']
const AGREEMENT = ['keyAgreement', 'encipherOnly', 'decipherOnly']
const EC_OIDS = ['1.2.840.10045.2.1', '1.3.132.1.12', '1.3.132.1.13']
const ML_DSA = new Map([
  ['2.16.840.1.101.3.4.3.17', ['ML-DSA-44', 1312]],
  ['2.16.840.1.101.3.4.3.18', ['ML-DSA-65', 1952]],
  ['2.16.840.1.101.3.4.3.19', ['ML-DSA-87', 2592]],
] as const)
const SLH_NAMES = [
  'SHA2-128s',
  'SHA2-128f',
  'SHA2-192s',
  'SHA2-192f',
  'SHA2-256s',
  'SHA2-256f',
  'SHAKE-128s',
  'SHAKE-128f',
  'SHAKE-192s',
  'SHAKE-192f',
  'SHAKE-256s',
  'SHAKE-256f',
]

export function isKeyUsageAttribute(attribute: X509Attribute): boolean {
  return [attribute.id, attribute.oid, attribute.label].some(
    (value) => value === '2.5.29.15' || value.toLowerCase() === 'keyusage'
  )
}

export function resolveSubjectKeyUsage(csrPem: string, attributes: X509Attribute[]) {
  let spki: SubjectPublicKeyInfo
  try {
    spki = new SubjectRequest(csrPem).subjectInfo
  } catch {
    throw new SubjectKeyUsageError(
      'Cannot inspect the CSR subject public key. Select a valid PEM CSR.'
    )
  }
  const oid = spki.algorithm.algorithm
  const parameters = spki.algorithm.parameters
  let label: string
  let allowed: string[]
  if (oid === '1.2.840.113549.1.1.1') {
    // RFC 3279 rsaEncryption: absent or ASN.1 NULL parameters only.
    if (parameters && !isNull(parameters)) unsupported('RSA parameters are not supported')
    try {
      new PublicKey(spki)
    } catch {
      unsupported('Cannot decode the RSA subject key')
    }
    label = 'RSA'
    allowed = [...SIGNING, 'keyEncipherment', 'dataEncipherment']
  } else if (EC_OIDS.includes(oid)) {
    try {
      // Reuse the library's named-curve decoder, retaining the original OID's role.
      const key = new PublicKey(
        new SubjectPublicKeyInfo({
          ...spki,
          algorithm: new AlgorithmIdentifier({ ...spki.algorithm, algorithm: EC_OIDS[0] }),
        })
      )
      const curve = (key.algorithm as EcKeyAlgorithm).namedCurve
      if (!['P-256', 'P-384', 'P-521'].includes(curve)) unsupported('Unsupported EC named curve')
      label = `${oid === EC_OIDS[0] ? 'EC' : oid === EC_OIDS[1] ? 'ECDH' : 'ECMQV'} (${curve})`
    } catch {
      unsupported('Cannot resolve the EC named-curve parameters; use a supported named-curve CSR')
    }
    allowed = oid === EC_OIDS[0] ? [...SIGNING, ...AGREEMENT] : AGREEMENT
  } else if (oid === '1.3.101.112' || oid === '1.3.101.113') {
    if (parameters !== undefined) unsupported('EdDSA subject parameters must be absent')
    const size = oid === '1.3.101.112' ? 32 : 57
    if (spki.subjectPublicKey.byteLength !== size) unsupported('Unexpected EdDSA public-key length')
    label = size === 32 ? 'Ed25519' : 'Ed448'
    allowed = SIGNING
  } else {
    const mlDsa = [...ML_DSA].find(([key]) => key === oid)?.[1]
    const slhIndex = SLH_NAMES.findIndex((_, index) => oid === `2.16.840.1.101.3.4.3.${20 + index}`)
    if (!mlDsa && slhIndex < 0)
      unsupported(`Unsupported CSR subject algorithm ${oid}; no certificate issued`)
    if (parameters !== undefined) unsupported('ML-DSA / SLH-DSA subject parameters must be absent')
    const size = mlDsa ? mlDsa[1] : [32, 32, 48, 48, 64, 64][slhIndex % 6]
    if (spki.subjectPublicKey.byteLength !== size)
      unsupported('Unexpected PQC subject public-key length')
    label = mlDsa ? mlDsa[0] : `SLH-DSA-${SLH_NAMES[slhIndex]}`
    allowed = SIGNING
  }

  const usages = attributes.filter((a) => a.enabled && isKeyUsageAttribute(a))
  if (usages.length > 1) unsupported('Multiple keyUsage fields: keep one explicit extension')
  if (usages.some((a) => a.elementType !== 'Extension'))
    unsupported('keyUsage must be an Extension')
  const value = usages[0]?.value ?? 'digitalSignature'
  const tokens = value.split(',').map((token) => token.trim())
  const bits = tokens.filter((token) => token !== 'critical')
  if (
    !bits.length ||
    new Set(tokens).size !== tokens.length ||
    tokens.includes('') ||
    (tokens.includes('critical') && tokens[0] !== 'critical')
  ) {
    unsupported('Use a nonempty keyUsage list, optionally prefixed with critical')
  }
  const incompatible = bits.filter((bit) => !allowed.includes(bit))
  if (incompatible.length)
    unsupported(
      `${label!} subject key is incompatible with keyUsage ${incompatible.join(', ')} in this end-entity exercise. Edit the selected profile usage; it will not be changed automatically.`
    )
  if (
    bits.some((bit) => bit === 'encipherOnly' || bit === 'decipherOnly') &&
    !bits.includes('keyAgreement')
  ) {
    unsupported('encipherOnly / decipherOnly require keyAgreement')
  }
  if (bits.includes('encipherOnly') && bits.includes('decipherOnly'))
    unsupported('Choose at most one of encipherOnly or decipherOnly')
  const purpose = bits.includes('keyEncipherment')
    ? 'Explicit RSA key-transport usage; legacy TLS RSA key exchange is not used in TLS 1.3.'
    : bits.includes('dataEncipherment')
      ? 'Explicit RSA data-encryption usage; not a TLS signing-capability claim.'
      : bits.includes('keyAgreement')
        ? 'Explicit EC key-agreement usage; this does not establish a TLS signing capability.'
        : 'Subject signing usage; the default example authenticates with signatures.'
  return { oid, label: label!, value, explicit: usages.length === 1, purpose }
}

function unsupported(message: string): never {
  throw new SubjectKeyUsageError(message)
}
function isNull(parameters: ArrayBuffer): boolean {
  const bytes = new Uint8Array(parameters)
  return bytes.length === 2 && bytes[0] === 5 && bytes[1] === 0
}
