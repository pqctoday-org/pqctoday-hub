// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The LMS parameter-set list holds the sizes of the objects the engine returns, so a single-tree
 * set's key and signature both carry the 4-byte HSS framing on top of the RFC 8554 layouts
 * (signatureSizes.ts). The two fields used to differ in framing (signature framed, key bare), which
 * made the XMSS-versus-LMS comparison and the keygen demo disagree by 4 bytes on the key.
 */
import { describe, it, expect } from 'vitest'
import { HSS_FRAMING_BYTES, LMS_PARAMETER_SETS, XMSS_PARAMETER_SETS } from './statefulSigsConstants'
import { lmsPublicKeyBytes, lmsSignatureBytes } from './signatureSizes'

// RFC 8554 Section 4.1 (n = 32) and SP 800-208 Table 3 (n = 24): LM-OTS chain count p by W
const P: Record<number, Record<number, number>> = {
  32: { 1: 265, 2: 133, 4: 67, 8: 34 },
  24: { 1: 200, 2: 101, 4: 51, 8: 26 },
}

describe('LMS parameter sets', () => {
  const single = LMS_PARAMETER_SETS.filter((s) => s.variant !== 'multi-tree')
  const m = (name: string) => (name.includes('_M24_') ? 24 : 32)

  it('has single-tree sets to check', () => {
    expect(single.length).toBeGreaterThan(20)
  })

  it('gives the key and the signature the same HSS framing over the RFC 8554 layouts', () => {
    for (const s of single) {
      const hashBytes = m(s.name)
      const p = P[hashBytes][s.winternitzParam]
      expect(s.signatureSize, `${s.name} signature`).toBe(
        lmsSignatureBytes(hashBytes, p, hashBytes, s.treeHeight) + HSS_FRAMING_BYTES
      )
      expect(s.publicKeySize, `${s.name} public key`).toBe(
        lmsPublicKeyBytes(hashBytes) + HSS_FRAMING_BYTES
      )
    }
  })

  it('shows hash length and collision bound, not a NIST category that SP 800-208 does not assign', () => {
    for (const s of [...LMS_PARAMETER_SETS, ...XMSS_PARAMETER_SETS]) {
      expect(s.securityLevel, s.name).not.toMatch(/NIST Level|reduced margin/)
      expect(s.securityLevel, s.name).toMatch(
        /^n = (24|32) \(generic collision bound 2\^(96|128)\)$/
      )
    }
  })
})
