// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { decodeLmsPublicKey, encodeLmsPublicKey } from './lmsPublicKey'
const key = Uint8Array.of(
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  6,
  0,
  0,
  0,
  4,
  ...Array.from({ length: 48 }, (_, i) => i + 1)
)
const der = (pem: string) =>
  Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) =>
    c.charCodeAt(0)
  )
function make(payload: Uint8Array, oid = '1.2.840.113549.1.9.16.3.17', parameters?: ArrayBuffer) {
  return new Uint8Array(
    AsnConvert.serialize(
      new SubjectPublicKeyInfo({
        algorithm: new AlgorithmIdentifier({ algorithm: oid, parameters }),
        subjectPublicKey: AsnConvert.serialize(new OctetString(payload)),
      })
    )
  )
}
describe('Existing selected HSS profile public wrapper boundary', () => {
  it('independently checks complete RFC8708 DER bytes and strips only unused capacity', () => {
    const capacity = Uint8Array.of(...key, 0x11, 0x22, 0x33, 0x44)
    const encoded = der(encodeLmsPublicKey(capacity))
    // Independent fixed DER layout: SEQUENCE80, AlgorithmIdentifier13 with only
    // OID1.2.840.113549.1.9.16.3.17; BIT STRING63, unused0, OCTET STRING60.
    expect(Array.from(encoded.slice(0, 22))).toEqual([
      0x30, 80, 0x30, 13, 0x06, 11, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 9, 16, 3, 17, 0x03, 63,
      0, 0x04, 60,
    ])
    expect(encoded.length).toBe(82)
    expect(encoded.slice(22)).toEqual(key)
    expect(decodeLmsPublicKey(encoded)).toEqual(key)
    expect(encodeLmsPublicKey(key)).toBe(encodeLmsPublicKey(capacity))
  })
  it('retains the old internal wrapper bytes without relabelling them standard', () => {
    const raw = Uint8Array.of(...key, 1, 2, 3, 4)
    const legacy = new SubjectPublicKeyInfo({
      algorithm: new AlgorithmIdentifier({ algorithm: '2.16.840.1.101.3.7.2.1' }),
      subjectPublicKey: raw.buffer,
    })
    expect(decodeLmsPublicKey(new Uint8Array(AsnConvert.serialize(legacy)))).toEqual(raw)
  })
  it('rejects unsupported OIDs and nonabsent parameters', () => {
    expect(() => decodeLmsPublicKey(make(key, '1.2.3'))).toThrow()
    expect(() => decodeLmsPublicKey(make(key, undefined, Uint8Array.of(5, 0).buffer))).toThrow()
  })
  it('rejects trailing DER, missing OCTET wrapper, truncation and capacity in canonical payload', () => {
    const good = der(encodeLmsPublicKey(key))
    expect(() => decodeLmsPublicKey(Uint8Array.of(...good, 0))).toThrow()
    expect(() => decodeLmsPublicKey(good.slice(0, -1))).toThrow()
    expect(() => decodeLmsPublicKey(make(Uint8Array.of(...key, 0, 0, 0, 0)))).toThrow()
    const bare = new SubjectPublicKeyInfo({
      algorithm: new AlgorithmIdentifier({ algorithm: '1.2.840.113549.1.9.16.3.17' }),
      subjectPublicKey: key.buffer,
    })
    expect(() => decodeLmsPublicKey(new Uint8Array(AsnConvert.serialize(bare)))).toThrow()
  })
  it.each([0, 1, 4, 8])('rejects incomplete payload length %s', (length) => {
    expect(() => encodeLmsPublicKey(key.slice(0, length))).toThrow()
  })
  it.each([0, 4, 10])('rejects unsupported selected LMS type %s', (type) => {
    const bad = key.slice()
    bad[7] = type
    expect(() => decodeLmsPublicKey(make(bad))).toThrow()
  })
})
