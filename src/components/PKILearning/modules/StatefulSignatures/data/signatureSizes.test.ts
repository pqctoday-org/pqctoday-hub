// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The sizes in the comparison tables come from the byte layouts in RFC 8554 and
 * RFC 8391, so each formula is checked here against lengths that are fixed by
 * published data: the NIST ACVP LMS sigVer vectors (SHA-256/192, whose parameter
 * sets are the ones the tables print), RFC 8554 Appendix F (SHA-256/256), and
 * the XMSS size table in RFC 8391.
 */
import { describe, it, expect } from 'vitest'
import acvpLms from './lmsAcvpSigVerSample.json'
import { RFC8554_TEST_CASES } from '@/utils/katRunner'
import {
  COMPARED_LMS,
  COMPARED_XMSS,
  COMPARED_SIZES,
  bytesLabel,
  hssSignatureBytes,
  lmsPublicKeyBytes,
  lmsSignatureBytes,
  xmssPublicKeyBytes,
  xmssSignatureBytes,
} from './signatureSizes'
import { LMS_PARAMETER_SETS } from './statefulSigsConstants'

// SP 800-208 Table 3: LMOTS_SHA256_N24_W1..W8 have p = 200, 101, 51, 26
const P_N24: Record<string, number> = {
  LMOTS_SHA256_N24_W1: 200,
  LMOTS_SHA256_N24_W2: 101,
  LMOTS_SHA256_N24_W4: 51,
  LMOTS_SHA256_N24_W8: 26,
}

describe('LMS sizes from the RFC 8554 layout', () => {
  it('give a 56-byte public key for m = 32 and 48 bytes for m = 24', () => {
    expect(lmsPublicKeyBytes(32)).toBe(56)
    expect(lmsPublicKeyBytes(24)).toBe(48)
  })

  it('match the length of every NIST ACVP LMS sigVer public key and valid signature (SHA-256/192)', () => {
    let checked = 0
    for (const g of acvpLms.testGroups) {
      expect(g.publicKey.length / 2, `${g.folder} tg${g.tgId} public key`).toBe(
        lmsPublicKeyBytes(24)
      )
      const h = Number(/_H(\d+)$/.exec(g.lmsMode)![1])
      const expected = lmsSignatureBytes(24, P_N24[g.lmOtsMode], 24, h)
      for (const t of g.tests) {
        // every case in the sample keeps the full length; only the content is altered
        expect(t.signature.length / 2, `${g.folder} tg${g.tgId}/tc${t.tcId}`).toBe(expected)
        checked += 1
      }
    }
    expect(checked).toBe(16)
  })

  it('match the RFC 8554 Appendix F lengths (m = n = 32): LMS keys of 56 B inside a 60-byte HSS key', () => {
    const tc1 = RFC8554_TEST_CASES[1]()
    const tc2 = RFC8554_TEST_CASES[2]()
    // an HSS public key is u32str(L) || the top LMS public key
    expect(tc1.pub_key_hex.length / 2).toBe(4 + lmsPublicKeyBytes(32))
    expect(tc2.pub_key_hex.length / 2).toBe(4 + lmsPublicKeyBytes(32))
    // Test Case 1: H5/W8 at both levels (p = 34): 4 + sig + pk + sig
    const h5w8 = lmsSignatureBytes(32, 34, 32, 5)
    expect(h5w8).toBe(1292)
    expect(tc1.signature_hex.length / 2).toBe(4 + h5w8 + lmsPublicKeyBytes(32) + h5w8)
    // Test Case 2: H10/W4 (p = 67) above H5/W8
    const h10w4 = lmsSignatureBytes(32, 67, 32, 10)
    expect(h10w4).toBe(2508)
    expect(tc2.signature_hex.length / 2).toBe(4 + h10w4 + lmsPublicKeyBytes(32) + h5w8)
  })
})

describe('XMSS sizes from the RFC 8391 layout', () => {
  it('give the 2,500-byte XMSS-SHA2_10_256 signature RFC 8391 lists (n = 32, len = 67, h = 10)', () => {
    expect(xmssSignatureBytes(32, 67, 10)).toBe(2500)
    expect(xmssPublicKeyBytes(32)).toBe(68)
  })
})

describe('the compared parameter sets', () => {
  it('are the SHA-256/192 sets of SP 800-208, with the table values derived from the layouts', () => {
    expect(COMPARED_LMS.name).toBe('LMS_SHA256_M24_H10 / LMOTS_SHA256_N24_W4')
    expect(COMPARED_LMS.p).toBe(P_N24.LMOTS_SHA256_N24_W4)
    expect(COMPARED_XMSS.name).toBe('XMSS-SHA2_10_192')
    expect(COMPARED_SIZES.lms).toEqual({ publicKey: 48, signature: 1500 })
    expect(COMPARED_SIZES.xmss).toEqual({ publicKey: 52, signature: 1492 })
  })

  it('print FIPS 205 and FIPS 204 sizes unchanged', () => {
    expect(COMPARED_SIZES.slhdsa192s).toEqual({ publicKey: 48, signature: 16224 })
    expect(COMPARED_SIZES.slhdsa192f).toEqual({ publicKey: 48, signature: 35664 })
    expect(COMPARED_SIZES.mldsa65).toEqual({ publicKey: 1952, signature: 3309 })
    expect(COMPARED_SIZES.mldsa87).toEqual({ publicKey: 2592, signature: 4627 })
    expect(bytesLabel(16224)).toBe('16,224 B')
  })
})

describe('HSS signature size from the RFC 8554 Section 6.2 layout', () => {
  // SP 800-208 Tables 3 and 4: LM-OTS chain count p by Winternitz parameter W, for n = 32 and n = 24
  const P_BY_N = new Map<number, Map<number, number>>([
    [
      32,
      new Map([
        [1, 265],
        [2, 133],
        [4, 67],
        [8, 34],
      ]),
    ],
    [
      24,
      new Map([
        [1, 200],
        [2, 101],
        [4, 51],
        [8, 26],
      ]),
    ],
  ])

  it('counts the 4-byte level count once: one level is 4 bytes more than the LMS signature', () => {
    const lms = lmsSignatureBytes(32, 34, 32, 5)
    expect(hssSignatureBytes([lms], 32)).toBe(lms + 4)
    // two levels: 4 + sig + the next level's public key + sig
    expect(hssSignatureBytes([lms, lms], 32)).toBe(4 + lms + lmsPublicKeyBytes(32) + lms)
  })

  it('matches the RFC 8554 Appendix F signature lengths (two levels)', () => {
    const h5w8 = lmsSignatureBytes(32, 34, 32, 5)
    const h10w4 = lmsSignatureBytes(32, 67, 32, 10)
    expect(hssSignatureBytes([h5w8, h5w8], 32)).toBe(
      RFC8554_TEST_CASES[1]().signature_hex.length / 2
    )
    expect(hssSignatureBytes([h10w4, h5w8], 32)).toBe(
      RFC8554_TEST_CASES[2]().signature_hex.length / 2
    )
  })

  it('matches the signature length the engine returns for every one- and two-level set', () => {
    let checked = 0
    for (const s of LMS_PARAMETER_SETS) {
      const n = s.securityLevel.startsWith('n = 24') ? 24 : 32
      const p = P_BY_N.get(n)!.get(s.winternitzParam)!
      const levels = s.levelHeights.map((h) => lmsSignatureBytes(n, p, n, h))
      expect(hssSignatureBytes(levels, n), s.name).toBe(s.signatureSize)
      checked += 1
    }
    expect(checked).toBeGreaterThan(20)
    expect(LMS_PARAMETER_SETS.some((s) => s.levelHeights.length === 2)).toBe(true)
  })
})
