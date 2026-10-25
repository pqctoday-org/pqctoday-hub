// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { STEP_EXERCISES } from './stepExercises'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

describe('STEP_EXERCISES (round 9, wave 2)', () => {
  it('every key is a real module workshop step', () => {
    for (const key of Object.keys(STEP_EXERCISES)) {
      const [moduleId, stepId] = key.split('/')
      const m = MANIFEST_BY_ID[moduleId]
      expect(m, key).toBeDefined()
      expect(
        m!.workshopSteps?.some((s) => s.id === stepId),
        key
      ).toBe(true)
    }
  })
  it('every exercise has two to four options, one correct, and a reason that names the concept', () => {
    for (const [key, ex] of Object.entries(STEP_EXERCISES)) {
      expect(ex.options.length, key).toBeGreaterThanOrEqual(2)
      expect(ex.options.length, key).toBeLessThanOrEqual(4)
      expect(ex.answer, key).toBeGreaterThanOrEqual(0)
      expect(ex.answer, key).toBeLessThan(ex.options.length)
      expect(new Set(ex.options).size, key).toBe(ex.options.length)
      expect(ex.prompt, key).toMatch(/\?$/)
      expect(ex.why.length, key).toBeGreaterThanOrEqual(60)
      expect(ex.why.toLowerCase(), key).not.toMatch(/^correct[.!]/)
    }
  })
})

describe('STEP_EXERCISES: SLH-DSA answers follow FIPS 205', () => {
  const correct = (key: string) => {
    const ex = STEP_EXERCISES[key]
    return {
      ex,
      text: ex.options[ex.answer],
      all: `${ex.prompt} ${ex.options.join(' ')} ${ex.why}`,
    }
  }

  it('the stateless answer names the few-time FORS keys, not a fresh one-time key per signature', () => {
    // FIPS 205 Section 3: "a very large set of FORS key pairs ... pseudorandomly select a FORS key";
    // Section 8: the security of a FORS key "degrades gradually as the number of signatures increases"
    const { text, all } = correct('stateful-signatures/slh-dsa-live')
    expect(text).toContain('FORS')
    expect(text).toContain('keeps no counter')
    expect(text).toContain('loses security only gradually')
    expect(all).not.toMatch(/ephemeral|drawn from the private key seed|backed up/)
    expect(all).toContain('2^64')
  })

  it('the pre-hash answer says other approved functions are allowed, with at least 8n bits', () => {
    // FIPS 205 Section 10.2.2: "hash_slh_sign may be used with other hash functions or XOFs";
    // Section 10.2: "at least 8n bits of classical security strength against both collision
    // and second preimage attacks"
    const { ex, text, all } = correct('slh-dsa/context-deterministic')
    expect(ex.prompt).toContain('(OID not listed in FIPS 205)')
    expect(text).toContain('allows other approved hash functions or XOFs')
    expect(text).toContain('8n bits')
    expect(all).not.toMatch(/Non-FIPS 205|four functions|internal hash families|SHAKE-128/)
    expect(ex.why).toContain('category 1')
  })
})
