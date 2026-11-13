// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import reference from '@/data/kat/lms_hss_rfc8554.json'
import { decodeHssSignature, lmsType, lmotsType } from './hssSignatureDecode'
const one = new Uint8Array(readFileSync('public/lms-sample/lms-signature.bin'))
const two = Uint8Array.from(Buffer.from(reference.test_cases[0].signature_hex, 'hex'))
const replaceU32 = (bytes: Uint8Array, offset: number, value: number) => {
  const b = bytes.slice()
  new DataView(b.buffer).setUint32(offset, value, false)
  return b
}
describe('RFC8554 HSS structural signature decoding', () => {
  it('pins genuine one-level returned bytes and independent field boundaries', () => {
    expect(createHash('sha256').update(one).digest('hex')).toBe(
      '9bd230c8e368b54230cede56f2102cc06fb7724704bca01a8bd54a051d36d09d'
    )
    const d = decodeHssSignature(one),
      s = d.messageSignature
    expect([d.nspk, d.levels, d.totalBytes]).toEqual([0, 1, 1456])
    expect(d.prefix).toEqual({ offset: 0, length: 4, hex: '00000000' })
    expect([s.q, s.qField.offset, s.qField.hex]).toEqual([0, 4, '00000000'])
    expect([s.lmots.type.id, s.lmots.type.n, s.lmots.type.p]).toEqual([4, 32, 34])
    expect(s.lmots.typeField).toEqual({ offset: 8, length: 4, hex: '00000004' })
    expect([s.lmots.C.offset, s.lmots.C.length, s.lmots.C.hex]).toEqual([
      12,
      32,
      'ffbf4ba7994d9aaa0b04555004c00930729e0f9a6a854998a3e588f5fd3b36c2',
    ])
    expect([s.lmots.payload.offset, s.lmots.payload.length]).toEqual([44, 1088])
    expect([s.lmots.bytes.offset, s.lmots.bytes.length]).toEqual([8, 1124])
    expect(s.lmots.y.map((f) => f.offset)).toEqual(
      Array.from({ length: 34 }, (_, i) => 44 + 32 * i)
    )
    expect([s.lms.id, s.typeField.offset, s.typeField.hex]).toEqual([6, 1132, '00000006'])
    expect([s.authPathBytes.offset, s.authPathBytes.length, s.authPath.length]).toEqual([
      1136, 320, 10,
    ])
    expect(s.authPath.map((f) => f.offset)).toEqual([
      1136, 1168, 1200, 1232, 1264, 1296, 1328, 1360, 1392, 1424,
    ])
    expect(d.signedPublicKeys).toHaveLength(0)
  })
  it('decodes genuine AppendixF two-level signature, including signed childpublickey', () => {
    expect(createHash('sha256').update(two).digest('hex')).toBe(
      '6453d60821e0b87d6b006f6e099c2b38ef8e68e8add18898224af88c21732fe5'
    )
    const d = decodeHssSignature(two),
      parent = d.signedPublicKeys[0],
      child = parent.publicKey,
      s = d.messageSignature
    expect([d.nspk, d.levels, d.totalBytes]).toEqual([1, 2, 2644])
    expect(d.prefix.hex).toBe('00000001')
    expect([
      parent.signature.q,
      parent.signature.bytes.offset,
      parent.signature.bytes.length,
    ]).toEqual([5, 4, 1292])
    expect([parent.signature.authPathBytes.offset, parent.signature.authPathBytes.length]).toEqual([
      1136, 160,
    ])
    expect([child.bytes.offset, child.bytes.length, child.lms.id, child.lmots.id]).toEqual([
      1296, 56, 5, 4,
    ])
    expect([
      child.lmsTypeField.offset,
      child.lmotsTypeField.offset,
      child.I.offset,
      child.I.length,
      child.root.offset,
      child.root.length,
    ]).toEqual([1296, 1300, 1304, 16, 1320, 32])
    expect(child.I.hex).toBe('d2f14ff6346af964569f7d6cb880a1b6')
    expect([
      s.q,
      s.bytes.offset,
      s.bytes.length,
      s.lmots.typeField.offset,
      s.lmots.C.offset,
      s.lmots.payload.offset,
      s.typeField.offset,
      s.authPathBytes.offset,
      s.authPathBytes.length,
    ]).toEqual([10, 1352, 1292, 1356, 1360, 1392, 2480, 2484, 160])
  })
  it.each([one, two])('rejects every truncated prefix and any trailingbytes (%i)', (bytes) => {
    for (let length = 0; length < bytes.length; length++)
      expect(() => decodeHssSignature(bytes.subarray(0, length))).toThrow()
    expect(() => decodeHssSignature(new Uint8Array([...bytes, 0]))).toThrow('Trailing')
  })
  it.each([
    [0, 8, 'Nspk'],
    [8, 0, 'LMOTS'],
    [8, 17, 'LMOTS'],
    [1132, 4, 'LMS'],
    [1132, 25, 'LMS'],
    [4, 1024, 'q'],
  ])('refuses invalidu32 at %i', (offset, value, message) => {
    expect(() => decodeHssSignature(replaceU32(one, offset, value))).toThrow(String(message))
  })
  it('checks both child-publickey typecodes and subsequent signature consistency', () => {
    expect(() => decodeHssSignature(replaceU32(two, 1296, 25))).toThrow('Unknown LMS')
    expect(() => decodeHssSignature(replaceU32(two, 1300, 17))).toThrow('Unknown LMOTS')
    expect(() => decodeHssSignature(replaceU32(two, 1300, 3))).toThrow('typecodes differ')
  })
  it('does not mutate bytes or confuse a viewbyteoffset; changed ybytes alone are not verification', () => {
    const buffer = new Uint8Array(one.length + 10)
    buffer.set(one, 7)
    expect(decodeHssSignature(buffer.subarray(7, 7 + one.length)).prefix.hex).toBe('00000000')
    const altered = one.slice()
    altered[44] ^= 1
    expect(decodeHssSignature(altered).messageSignature.lmots.y[0].hex).not.toBe(
      decodeHssSignature(one).messageSignature.lmots.y[0].hex
    )
    expect(createHash('sha256').update(one).digest('hex')).toBe(
      '9bd230c8e368b54230cede56f2102cc06fb7724704bca01a8bd54a051d36d09d'
    )
  })
})
// Independent pinned IANA/RFC9858 tables. Synthetic zero-filled structures test layout only.
const groups = [
  { lms: 5, ots: 1, m: 32, p: [265, 133, 67, 34], hash: 'SHA256' },
  { lms: 10, ots: 5, m: 24, p: [200, 101, 51, 26], hash: 'SHA256' },
  { lms: 15, ots: 9, m: 32, p: [265, 133, 67, 34], hash: 'SHAKE' },
  { lms: 20, ots: 13, m: 24, p: [200, 101, 51, 26], hash: 'SHAKE' },
]
function synthetic(lms: number, ots: number, m: number, h: number, p: number) {
  const b = new Uint8Array(16 + m * (p + 1) + m * h),
    v = new DataView(b.buffer)
  v.setUint32(8, ots, false)
  v.setUint32(12 + m * (p + 1), lms, false)
  return b
}
describe('Registered RFC8554/RFC9858 type and length coverage', () => {
  for (const group of groups)
    for (const [hi, h] of [5, 10, 15, 20, 25].entries())
      for (const [wi, w] of [1, 2, 4, 8].entries()) {
        it(`${group.hash} n${group.m} H${h} W${w}`, () => {
          const lms = group.lms + hi,
            ots = group.ots + wi,
            p = group.p.at(wi)!,
            d = decodeHssSignature(synthetic(lms, ots, group.m, h, p)),
            s = d.messageSignature
          expect(lmotsType(ots)).toMatchObject({
            id: ots,
            n: group.m,
            w,
            p,
            name: `LMOTS_${group.hash}_N${group.m}_W${w}`,
          })
          expect(lmsType(lms)).toMatchObject({
            id: lms,
            m: group.m,
            h,
            name: `LMS_${group.hash}_M${group.m}_H${h}`,
          })
          expect(s.lmots.C.length).toBe(group.m)
          expect(s.lmots.payload.length).toBe(p * group.m)
          expect(s.authPath).toHaveLength(h)
          expect(s.authPathBytes.length).toBe(h * group.m)
          expect(d.totalBytes).toBe(16 + group.m * (p + 1 + h))
        })
      }
})

it('decodes a structurally complete SHAKE/n24 child independently of its SHA256/n32 parent', () => {
  // Synthetic structure only, not a signed cryptographic test vector.
  const key = new Uint8Array(48),
    v = new DataView(key.buffer)
  v.setUint32(0, 21, false)
  v.setUint32(4, 16, false)
  const bottom = synthetic(21, 16, 24, 10, 26).subarray(4)
  const bytes = new Uint8Array([0, 0, 0, 1, ...two.subarray(4, 1296), ...key, ...bottom])
  const d = decodeHssSignature(bytes),
    child = d.signedPublicKeys[0].publicKey
  expect([
    d.totalBytes,
    child.bytes.offset,
    child.bytes.length,
    child.root.offset,
    child.root.length,
  ]).toEqual([2244, 1296, 48, 1320, 24])
  expect([
    d.messageSignature.bytes.offset,
    d.messageSignature.lmots.C.length,
    d.messageSignature.authPathBytes.offset,
    d.messageSignature.authPathBytes.length,
  ]).toEqual([1344, 24, 2004, 240])
  expect(d.messageSignature.lmots.y).toHaveLength(26)
})
