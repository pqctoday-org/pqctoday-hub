// SPDX-License-Identifier: AGPL-3.0-only
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'

// id-alg-hss-lms-hashsig (RFC 8708, carried unchanged into RFC 9708 and RFC 9802).
const HSS_OID = '1.2.840.113549.1.9.16.3.17'
// The Hub's earlier internal wrapper, kept only so older saved keys still load.
const LEGACY_INTERNAL_OID = '2.16.840.1.101.3.7.2.1'
const HSS_PUBLIC_KEY_LENGTH = 60
const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((value, i) => value === b.at(i))

function selectedPublicPayload(bytes: Uint8Array): Uint8Array {
  // Existing UI exposes one HSS level and the SHA-256/m32 LMS/LMOTS types.
  // The service returns a 64-byte capacity buffer; RFC8554's key is 60 bytes.
  if (bytes.length !== HSS_PUBLIC_KEY_LENGTH && bytes.length !== 64) {
    throw new Error('Invalid HSS public key length')
  }
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
  return bytes.slice(0, HSS_PUBLIC_KEY_LENGTH)
}

export function encodeLmsPublicKey(bytes: Uint8Array): string {
  const payload = selectedPublicPayload(bytes)
  // RFC 9802 section 5 (and RFC 9708 sections 1.4 and 4, which obsolete the
  // RFC 8708 wrapping): inside a SubjectPublicKeyInfo the BIT STRING holds the
  // RFC 8554 hss_public_key bytes directly, with no OCTET STRING around them,
  // and the algorithm parameters are absent. Capacity padding is never exported.
  const keyBits = new ArrayBuffer(HSS_PUBLIC_KEY_LENGTH)
  new Uint8Array(keyBits).set(payload)
  const spki = new SubjectPublicKeyInfo({
    algorithm: new AlgorithmIdentifier({ algorithm: HSS_OID }),
    subjectPublicKey: keyBits,
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
    // that its OID/raw BIT STRING encoding is a standard SPKI.
    return new Uint8Array(spki.subjectPublicKey)
  }
  if (spki.algorithm.algorithm !== HSS_OID || spki.algorithm.parameters !== undefined) {
    throw new Error('Unsupported LMS public key algorithm or parameters')
  }
  const bits = new Uint8Array(spki.subjectPublicKey)
  if (bits.length === HSS_PUBLIC_KEY_LENGTH) return selectedPublicPayload(bits)
  // Import only: tools that follow the superseded RFC 8708 convention put a DER
  // OCTET STRING around the 60 bytes inside the BIT STRING. A raw key starts
  // with the zero high byte of its level count, never 0x04, so the two forms
  // cannot be confused. This encoder never writes the wrapped form.
  if (bits.length === HSS_PUBLIC_KEY_LENGTH + 2 && bits[0] === 0x04) {
    const octets = AsnConvert.parse(bits.slice().buffer, OctetString)
    if (!equal(new Uint8Array(AsnConvert.serialize(octets)), bits)) {
      throw new Error('Invalid HSS public key OCTET STRING')
    }
    return selectedPublicPayload(new Uint8Array(octets.buffer))
  }
  throw new Error('Invalid HSS public key payload length')
}
