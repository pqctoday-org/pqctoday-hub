// SPDX-License-Identifier: AGPL-3.0-only
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'

const HSS_OID = '1.2.840.113549.1.9.16.3.17'
const LEGACY_INTERNAL_OID = '2.16.840.1.101.3.7.2.1'
const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((value, i) => value === b.at(i))

function selectedPublicPayload(bytes: Uint8Array): Uint8Array {
  // Existing UI exposes one HSS level and the SHA-256/m32 LMS/LMOTS types.
  // The service returns a 64-byte capacity buffer; RFC8554's key is 60 bytes.
  if (bytes.length !== 60 && bytes.length !== 64) throw new Error('Invalid HSS public key length')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (
    view.getUint32(0) !== 1 ||
    view.getUint32(4) < 5 ||
    view.getUint32(4) > 9 ||
    view.getUint32(8) < 1 ||
    view.getUint32(8) > 4
  ) {
    throw new Error('Unsupported LMS sample public key parameters')
  }
  return bytes.slice(0, 60)
}

export function encodeLmsPublicKey(bytes: Uint8Array): string {
  const payload = selectedPublicPayload(bytes)
  // RFC8708: absent algorithm parameters and DER OCTET STRING key type
  // inside the SPKI BIT STRING. Capacity padding is never exported.
  const spki = new SubjectPublicKeyInfo({
    algorithm: new AlgorithmIdentifier({ algorithm: HSS_OID }),
    subjectPublicKey: AsnConvert.serialize(new OctetString(payload)),
  })
  const der = new Uint8Array(AsnConvert.serialize(spki))
  const base64 = btoa(String.fromCharCode(...der))
  return `-----BEGIN PUBLIC KEY-----\n${(base64.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PUBLIC KEY-----`
}

export function decodeLmsPublicKey(der: Uint8Array): Uint8Array {
  const spki = AsnConvert.parse(Uint8Array.from(der).buffer, SubjectPublicKeyInfo)
  if (!equal(new Uint8Array(AsnConvert.serialize(spki)), der)) {
    throw new Error('Invalid public key DER encoding or trailing data')
  }
  if (spki.algorithm.algorithm === LEGACY_INTERNAL_OID) {
    // Compatibility with the Hub's earlier internal wrapper, not a claim
    // that its OID/raw BIT STRING encoding is RFC8708 SPKI.
    return new Uint8Array(spki.subjectPublicKey)
  }
  if (spki.algorithm.algorithm !== HSS_OID || spki.algorithm.parameters !== undefined) {
    throw new Error('Unsupported LMS public key algorithm or parameters')
  }
  const octets = AsnConvert.parse(spki.subjectPublicKey, OctetString)
  if (!equal(new Uint8Array(AsnConvert.serialize(octets)), new Uint8Array(spki.subjectPublicKey))) {
    throw new Error('Invalid HSS public key OCTET STRING')
  }
  const payload = new Uint8Array(octets.buffer)
  if (payload.length !== 60) throw new Error('Invalid HSS public key payload length')
  return selectedPublicPayload(payload)
}
