// SPDX-License-Identifier: GPL-3.0-only
//
// CKA_EC_POINT is a DER OCTET STRING around the SEC 1 point. A P-521
// uncompressed point is 133 bytes, which needs the long-form length (0x81 0x85);
// hsm_importECPublicKey used to write the length as the single byte 0x85
// ("5 length octets follow"), so the C++ engine parsed a garbage point and the
// NIST ACVP ECDSA P-521 sigVer sample (useAcvpSuite §33) failed on C++ only
// (the Rust engine reads the raw CKA_VALUE copy instead). The real-engine proof
// is katRunner.engines.local.test.ts; this pins the encoding itself.
import { describe, it, expect } from 'vitest'
import { derOctetString } from './helpers'

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex')

describe('derOctetString (X.690 §8.1.3 definite length)', () => {
  it('uses the short form below 128 bytes (P-256: 65-byte point)', () => {
    const out = derOctetString(new Uint8Array(65).fill(0xab))
    expect(hex(out.slice(0, 2))).toBe('0441')
    expect(out.length).toBe(67)
  })

  it('uses the long form 0x81 nn for 128..255 bytes (P-521: 133-byte point)', () => {
    const point = new Uint8Array(133).fill(0xcd)
    const out = derOctetString(point)
    expect(hex(out.slice(0, 3))).toBe('048185')
    expect(out.length).toBe(136)
    expect(hex(out.slice(3))).toBe(hex(point))
  })

  it('uses 0x82 nn nn at 256 bytes and above', () => {
    expect(hex(derOctetString(new Uint8Array(300)).slice(0, 4))).toBe('0482012c')
  })

  it('boundary: 127 is short form, 128 is long form', () => {
    expect(hex(derOctetString(new Uint8Array(127)).slice(0, 2))).toBe('047f')
    expect(hex(derOctetString(new Uint8Array(128)).slice(0, 3))).toBe('048180')
  })
})
