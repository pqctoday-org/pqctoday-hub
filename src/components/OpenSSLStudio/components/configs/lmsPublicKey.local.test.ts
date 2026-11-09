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
const hex = (text: string) => Uint8Array.from(text.match(/../g) ?? [], (pair) => parseInt(pair, 16))
const der = (pem: string) =>
  Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) =>
    c.charCodeAt(0)
  )
// SubjectPublicKeyInfo of the HSS certificate in RFC 9802 Appendix A, taken from
// that document's own DER: SEQUENCE 78, AlgorithmIdentifier 13 with only the HSS
// OID, BIT STRING 61 = unused-bits byte 0 + the raw 60-byte hss_public_key
// (one level, LMS type 5, LMOTS type 4). This is an independent oracle: it was
// not produced by this code.
const RFC9802_APPENDIX_A_SPKI = hex(
  '304e300d060b2a864886f70d0109100311033d00' + // header through BIT STRING unused bits
    '000000010000000500000004' + // L = 1, LMS type 5, LMOTS type 4
    'c096128bea383078ebf6fb43d77f9f9e' + // I
    '8139e27cb9344e6e5319f0ee68758583d32be97b14469e4ec5e35a180b30e513' // K
)
const RFC9802_APPENDIX_A_KEY = RFC9802_APPENDIX_A_SPKI.slice(20)
function make(payload: Uint8Array, oid = '1.2.840.113549.1.9.16.3.17', parameters?: ArrayBuffer) {
  return new Uint8Array(
    AsnConvert.serialize(
      new SubjectPublicKeyInfo({
        algorithm: new AlgorithmIdentifier({ algorithm: oid, parameters }),
        subjectPublicKey: payload.slice().buffer,
      })
    )
  )
}
describe('Existing selected HSS profile public wrapper boundary', () => {
  it('writes the RFC 9802 form: raw 60-byte key in the BIT STRING, no OCTET STRING, no capacity padding', () => {
    const capacity = Uint8Array.of(...key, 0x11, 0x22, 0x33, 0x44)
    const encoded = der(encodeLmsPublicKey(capacity))
    // Independent fixed DER layout: SEQUENCE 78, AlgorithmIdentifier 13 with only
    // OID 1.2.840.113549.1.9.16.3.17; BIT STRING 61, unused bits 0, then the key.
    expect(Array.from(encoded.slice(0, 20))).toEqual([
      0x30, 78, 0x30, 13, 0x06, 11, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 9, 16, 3, 17, 0x03, 61,
      0,
    ])
    expect(encoded.length).toBe(80)
    expect(encoded.slice(20)).toEqual(key)
    expect(decodeLmsPublicKey(encoded)).toEqual(key)
    expect(encodeLmsPublicKey(key)).toBe(encodeLmsPublicKey(capacity))
  })
  it('reads the RFC 9802 Appendix A HSS public key and writes the identical SPKI back', () => {
    expect(RFC9802_APPENDIX_A_SPKI.length).toBe(80)
    expect(RFC9802_APPENDIX_A_KEY.length).toBe(60)
    expect(decodeLmsPublicKey(RFC9802_APPENDIX_A_SPKI)).toEqual(RFC9802_APPENDIX_A_KEY)
    expect(der(encodeLmsPublicKey(RFC9802_APPENDIX_A_KEY))).toEqual(RFC9802_APPENDIX_A_SPKI)
  })
  it('still reads the superseded RFC 8708 wrapped form on import, but never writes it', () => {
    const wrapped = new SubjectPublicKeyInfo({
      algorithm: new AlgorithmIdentifier({ algorithm: '1.2.840.113549.1.9.16.3.17' }),
      subjectPublicKey: AsnConvert.serialize(new OctetString(key)),
    })
    const wrappedDer = new Uint8Array(AsnConvert.serialize(wrapped))
    // 03 3F 00 04 3C <60>: the extra OCTET STRING that RFC 9708 section 1.4 removed.
    expect(Array.from(wrappedDer.slice(17, 22))).toEqual([0x03, 63, 0, 0x04, 60])
    expect(decodeLmsPublicKey(wrappedDer)).toEqual(key)
    expect(der(encodeLmsPublicKey(key))).not.toEqual(wrappedDer)
    expect(der(encodeLmsPublicKey(key)).length).toBe(80)
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
  it('rejects trailing DER, truncation, wrong lengths, nonzero unused bits and capacity in the payload', () => {
    const good = der(encodeLmsPublicKey(key))
    expect(() => decodeLmsPublicKey(Uint8Array.of(...good, 0))).toThrow()
    expect(() => decodeLmsPublicKey(good.slice(0, -1))).toThrow()
    expect(() => decodeLmsPublicKey(make(Uint8Array.of(...key, 0, 0, 0, 0)))).toThrow()
    expect(() => decodeLmsPublicKey(make(key.slice(0, 59)))).toThrow()
    expect(() => decodeLmsPublicKey(make(Uint8Array.of(...key, 0)))).toThrow()
    const unused = good.slice()
    unused[19] = 1
    expect(() => decodeLmsPublicKey(unused)).toThrow()
    const badWrap = new SubjectPublicKeyInfo({
      algorithm: new AlgorithmIdentifier({ algorithm: '1.2.840.113549.1.9.16.3.17' }),
      subjectPublicKey: Uint8Array.of(0x04, 59, ...key.slice(0, 59), 0).buffer,
    })
    expect(() => decodeLmsPublicKey(new Uint8Array(AsnConvert.serialize(badWrap)))).toThrow()
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
