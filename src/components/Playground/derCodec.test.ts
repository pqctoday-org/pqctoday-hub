// SPDX-License-Identifier: GPL-3.0-only
/**
 * Known-answer tests for the shared DER codec. These pin the exact byte output
 * so the encoders extracted from VpnSimulationPanel / AttestationPanel (which
 * feed real X.509 cert + SPKI encodings) cannot drift.
 */
import { describe, it, expect } from 'vitest'
import {
  derCat,
  derLen,
  derTLV,
  derInteger,
  derSeq,
  derOid,
  derBitString,
  encodeRsaPublicKeyDER,
} from './derCodec'

const u8 = (...b: number[]) => new Uint8Array(b)
const arr = (a: Uint8Array) => Array.from(a)

describe('derCat', () => {
  it('concatenates in order', () => {
    expect(arr(derCat(u8(1, 2), u8(3), u8(4, 5)))).toEqual([1, 2, 3, 4, 5])
  })
  it('handles the empty case', () => {
    expect(arr(derCat())).toEqual([])
  })
})

describe('derLen — definite length, minimal octets', () => {
  it.each([
    [0x00, [0x00]],
    [0x7f, [0x7f]],
    [0x80, [0x81, 0x80]],
    [0xff, [0x81, 0xff]],
    [0x100, [0x82, 0x01, 0x00]],
    [0xffff, [0x82, 0xff, 0xff]],
    [0x10000, [0x83, 0x01, 0x00, 0x00]],
  ] as const)('len(%i)', (n, expected) => {
    expect(arr(derLen(n))).toEqual(expected)
  })
})

describe('derTLV', () => {
  it('wraps tag + length + content', () => {
    expect(arr(derTLV(0x04, u8(0xaa, 0xbb)))).toEqual([0x04, 0x02, 0xaa, 0xbb])
  })
  it('uses long-form length for content ≥ 128 bytes', () => {
    const content = new Uint8Array(200).fill(0x41)
    const out = derTLV(0x04, content)
    expect([out[0], out[1], out[2]]).toEqual([0x04, 0x81, 200])
    expect(out.length).toBe(3 + 200)
  })
})

describe('derInteger — positive-padding rule', () => {
  it('does not pad when the high bit is clear', () => {
    expect(arr(derInteger(u8(0x7f)))).toEqual([0x02, 0x01, 0x7f])
  })
  it('pads a leading 0x00 when the high bit is set', () => {
    expect(arr(derInteger(u8(0x80)))).toEqual([0x02, 0x02, 0x00, 0x80])
  })
})

describe('derSeq / derOid / derBitString', () => {
  it('derSeq wraps content in SEQUENCE (0x30)', () => {
    expect(arr(derSeq(u8(0x01, 0x02)))).toEqual([0x30, 0x02, 0x01, 0x02])
  })
  it('derOid wraps an OID body (0x06)', () => {
    expect(arr(derOid(u8(0x2a, 0x86, 0x48)))).toEqual([0x06, 0x03, 0x2a, 0x86, 0x48])
  })
  it('derBitString prepends the 0-unused-bits octet (0x03)', () => {
    expect(arr(derBitString(u8(0xff, 0x00)))).toEqual([0x03, 0x03, 0x00, 0xff, 0x00])
  })
})

describe('encodeRsaPublicKeyDER', () => {
  it('encodes SEQUENCE { INTEGER modulus, INTEGER exponent }', () => {
    // modulus 0x010001 (high bit clear → no pad), exponent 0x03
    expect(arr(encodeRsaPublicKeyDER(u8(0x01, 0x00, 0x01), u8(0x03)))).toEqual([
      0x30, 0x08, 0x02, 0x03, 0x01, 0x00, 0x01, 0x02, 0x01, 0x03,
    ])
  })
  it('pads the modulus when its high bit is set', () => {
    // modulus 0x80 → INTEGER 00 80; exponent 0x010001
    expect(arr(encodeRsaPublicKeyDER(u8(0x80), u8(0x01, 0x00, 0x01)))).toEqual([
      0x30, 0x09, 0x02, 0x02, 0x00, 0x80, 0x02, 0x03, 0x01, 0x00, 0x01,
    ])
  })
})
