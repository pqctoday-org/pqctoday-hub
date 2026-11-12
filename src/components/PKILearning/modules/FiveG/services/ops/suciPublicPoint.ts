// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { fromBER, ObjectIdentifier, OctetString, Sequence } from 'asn1js'
import { AsnConvert } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { p256 } from '@noble/curves/nist.js'

/** Existing Profile B forms: raw point, CKA_EC_POINT OCTET STRING or SPKI. */
export function normalizeProfileBPoint(hex: string): {
  uncompressedHex: string
  compressedHex: string
} {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex))
    throw new Error('Profile B requires complete hexadecimal public-key bytes.')
  const bytes = new Uint8Array(hex.match(/../g)!.map((pair) => parseInt(pair, 16)))
  let point: Uint8Array
  if (bytes.length === 65) {
    point = bytes
  } else if (bytes.length === 67) {
    const decoded = fromBER(bytes.buffer)
    if (
      decoded.offset !== bytes.length ||
      !(decoded.result instanceof OctetString) ||
      decoded.result.idBlock.isConstructed
    )
      throw new Error('Profile B CKA_EC_POINT must be one complete DER OCTET STRING.')
    point = new Uint8Array(decoded.result.valueBlock.valueHexView)
    const canonical = new Uint8Array(
      new OctetString({ valueHex: point.slice().buffer }).toBER(false)
    )
    if (canonical.length !== bytes.length || !canonical.every((value, i) => value === bytes.at(i)))
      throw new Error('Profile B CKA_EC_POINT must use canonical DER wrapping.')
  } else if (bytes.length === 91) {
    const decoded = fromBER(bytes.buffer)
    if (decoded.offset !== bytes.length || !(decoded.result instanceof Sequence))
      throw new Error('Profile B requires a complete P-256 SPKI.')
    const spki = AsnConvert.parse(bytes, SubjectPublicKeyInfo)
    if (spki.algorithm.algorithm !== '1.2.840.10045.2.1' || !spki.algorithm.parameters)
      throw new Error('Profile B SPKI must identify an EC public key and P-256 curve.')
    const parameters = fromBER(spki.algorithm.parameters)
    if (
      parameters.offset !== spki.algorithm.parameters.byteLength ||
      !(parameters.result instanceof ObjectIdentifier) ||
      parameters.result.valueBlock.toString() !== '1.2.840.10045.3.1.7'
    )
      throw new Error('Profile B SPKI must identify the P-256 curve.')
    const canonical = new Uint8Array(AsnConvert.serialize(spki))
    if (canonical.length !== bytes.length || !canonical.every((value, i) => value === bytes.at(i)))
      throw new Error('Profile B SPKI must be complete DER with an unmodified public point.')
    point = new Uint8Array(spki.subjectPublicKey)
  } else {
    throw new Error(
      'Profile B accepts a 65-byte point, its 67-byte DER OCTET STRING or a 91-byte P-256 SPKI.'
    )
  }
  if (point.length !== 65 || point[0] !== 4)
    throw new Error('Profile B requires an uncompressed P-256 public point.')
  try {
    p256.Point.fromBytes(point).assertValidity()
  } catch {
    throw new Error('Profile B public point is not a valid P-256 curve point.')
  }
  // Both accepted forms end in the same verified raw point; preserve source hex case.
  const uncompressedHex = hex.slice(-130)
  const compressedHex = (point[64] % 2 === 0 ? '02' : '03') + uncompressedHex.slice(2, 66)
  return { uncompressedHex, compressedHex }
}
