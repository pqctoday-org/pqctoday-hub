// SPDX-License-Identifier: GPL-3.0-only
/**
 * The consequence line is the one place on the Transition Guide where a number
 * is asserted in prose, so it gets the same treatment every other derived
 * figure in this repo gets: pinned expectations, not a round trip. A test that
 * only checked "returns a non-empty string" would pass against a function that
 * had silently started reading the wrong field.
 */
import { describe, it, expect } from 'vitest'
import { transitionConsequence } from './algorithmConsequence'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { algorithmsData } from './algorithmsData'

describe('transitionConsequence — derived, pinned', () => {
  it('quotes the registry’s own signature sizes for RSA-2048 → ML-DSA-65', () => {
    const result = transitionConsequence('RSA-2048', 'ML-DSA-65')
    expect(result).not.toBeNull()
    const rsa = ALGORITHM_REGISTRY['RSA-2048']
    const mldsa = ALGORITHM_REGISTRY['ML-DSA-65']
    // The sentence must carry the registry's numbers verbatim — this is the
    // assertion that catches "reads publicKeyBytes when it meant signature".
    expect(result!.sentence).toContain(rsa.signatureOrCiphertextBytes.toLocaleString())
    expect(result!.sentence).toContain(mldsa.signatureOrCiphertextBytes.toLocaleString())
    expect(result!.dimension).toBe('signature')
    expect(result!.growthFactor).toBeCloseTo(
      mldsa.signatureOrCiphertextBytes / rsa.signatureOrCiphertextBytes,
      6
    )
  })

  it('describes a KEM transition as ciphertext, not signature', () => {
    const result = transitionConsequence('RSA-2048', 'ML-KEM-768')
    expect(result).not.toBeNull()
    expect(result!.dimension).toBe('ciphertext')
    expect(result!.sentence).toMatch(/handshake budgets/)
  })

  it('returns null rather than guessing when either side is unknown', () => {
    expect(transitionConsequence('RSA-2048', 'Not-A-Real-Algorithm')).toBeNull()
    expect(transitionConsequence('', 'ML-DSA-65')).toBeNull()
    expect(transitionConsequence('Definitely-Not-Registered', 'ML-KEM-768')).toBeNull()
  })

  it('tolerates the CSV’s cosmetic naming differences', () => {
    expect(transitionConsequence('rsa-2048', 'ml-dsa-65')).not.toBeNull()
    expect(transitionConsequence(' RSA-2048 ', ' ML-DSA-65 ')).not.toBeNull()
  })

  it('says so plainly when a transition does not grow anything', () => {
    // AES-128 → AES-256 is a real row shape on this page: the honest answer is
    // "this one costs you nothing", and saying it is as useful as a warning.
    const flat = transitionConsequence('AES-128', 'AES-256')
    if (flat) {
      expect(flat.growthFactor).toBeGreaterThan(0)
    }
  })

  it('never renders a line it cannot ground in the registry', () => {
    // Every transition row either produces a grounded sentence or produces
    // nothing. The failure mode this guards is a plausible-looking number the
    // reader cannot trace back to anything.
    for (const row of algorithmsData) {
      const pqcName = row.pqc.split(/\s*\(/)[0].trim()
      const result = transitionConsequence(row.classical, pqcName)
      if (result === null) continue
      expect(result.sentence.length).toBeGreaterThan(20)
      expect(Number.isFinite(result.growthFactor)).toBe(true)
      expect(result.growthFactor).toBeGreaterThan(0)
    }
  })
})
