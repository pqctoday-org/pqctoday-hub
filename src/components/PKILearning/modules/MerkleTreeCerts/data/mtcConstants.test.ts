// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  ALGORITHM_SIZES,
  computeProofBytes,
  describeSizeChange,
  getSizeBreakdown,
  mtcChainSize,
  mtcLandmarkChainSize,
  MTC_LANDMARK_PROOF_BYTES,
  MTC_LANDMARK_SUBTREE_CERTS,
  MTC_STANDALONE_PROOF_BYTES,
  MTC_STANDALONE_SUBTREE_CERTS,
  traditionalChainSize,
} from './mtcConstants'

const algo = (shortName: string) => {
  const a = ALGORITHM_SIZES.find((x) => x.shortName === shortName)
  if (!a) throw new Error(`unknown algorithm ${shortName}`)
  return a
}

describe('MTC handshake size model', () => {
  it('uses the draft §6.5 proof sizes and the subtrees they come from', () => {
    expect(computeProofBytes(MTC_STANDALONE_SUBTREE_CERTS)).toBe(MTC_STANDALONE_PROOF_BYTES)
    expect(computeProofBytes(MTC_LANDMARK_SUBTREE_CERTS)).toBe(MTC_LANDMARK_PROOF_BYTES)
    expect(MTC_STANDALONE_PROOF_BYTES).toBe(384)
    expect(MTC_LANDMARK_PROOF_BYTES).toBe(736)
  })

  it('counts the traditional chain as the lesson states it: 2 keys + 3 signatures', () => {
    // The module introduction says 9,884 B for ML-DSA-44, "SCTs and cert metadata not counted".
    const b = getSizeBreakdown(algo('ML-DSA-44'))
    const keysAndSignatures = b.traditional
      .filter((c) => /public key|signature/.test(c.component))
      .reduce((sum, c) => sum + c.bytes, 0)
    expect(keysAndSignatures).toBe(2 * 1312 + 3 * 2420)
    expect(keysAndSignatures).toBe(9884)
    // The root is in the client's trust store, so none of its bytes are sent.
    expect(b.traditional.some((c) => /root/i.test(c.component.replace('by root', '')))).toBe(false)
  })

  it('totals for ML-DSA-44', () => {
    const b = getSizeBreakdown(algo('ML-DSA-44'))
    expect(b.traditionalTotal).toBe(9884 + 238 + 400)
    expect(b.mtcTotal).toBe(1312 + 2420 + 2420 + 384 + 200)
    expect(b.mtcLandmarkTotal).toBe(1312 + 2420 + 736 + 200)
    expect(b.reductionPercent).toBe(36)
    expect(b.landmarkReductionPercent).toBe(56)
  })

  it('both MTC modes still send the server key and the CertificateVerify signature', () => {
    for (const a of ALGORITHM_SIZES) {
      const b = getSizeBreakdown(a)
      for (const part of [b.mtc, b.mtcLandmark]) {
        expect(part.find((c) => c.component === 'Server public key')?.bytes).toBe(a.publicKeyBytes)
        expect(part.find((c) => c.component === 'CertificateVerify signature')?.bytes).toBe(
          a.signatureBytes
        )
      }
      // A landmark certificate carries no cosignature; a standalone one carries at least one.
      expect(b.mtcLandmark.some((c) => /cosignature/i.test(c.component))).toBe(false)
      expect(b.mtc.some((c) => /cosignature/i.test(c.component))).toBe(true)
    }
  })

  it('the helper functions agree with the breakdown', () => {
    for (const a of ALGORITHM_SIZES) {
      const b = getSizeBreakdown(a)
      expect(traditionalChainSize(a)).toBe(b.traditionalTotal)
      expect(mtcChainSize(a)).toBe(b.mtcTotal)
      expect(mtcLandmarkChainSize(a)).toBe(b.mtcLandmarkTotal)
    }
  })

  it('a landmark proof is larger than the whole ECDSA chain it replaces', () => {
    const b = getSizeBreakdown(algo('ECDSA'))
    expect(b.mtcLandmarkTotal).toBeGreaterThan(b.traditionalTotal)
    expect(b.landmarkReductionPercent).toBeLessThan(0)
    expect(describeSizeChange(b.landmarkReductionPercent)).toEqual({
      text: '11% larger',
      smaller: false,
    })
  })

  it('post-quantum algorithms save less than the earlier 60% / 92% claims', () => {
    for (const a of ALGORITHM_SIZES.filter((x) => x.category !== 'classical')) {
      const b = getSizeBreakdown(a)
      expect(b.reductionPercent).toBeLessThan(45)
      expect(b.landmarkReductionPercent).toBeLessThan(70)
    }
  })
})
