// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateFollowUps } from './generateFollowUps'

describe('generateFollowUps — entity detection', () => {
  it('extracts algorithm names (ML-KEM)', () => {
    const result = generateFollowUps('ML-KEM-768 is a lattice-based algorithm.')
    expect(result[0]).toContain('ML-KEM')
    expect(result[0]).toContain('performance characteristics')
  })

  it('extracts ML-DSA algorithm names', () => {
    const result = generateFollowUps('ML-DSA-65 is used for digital signatures.')
    expect(result[0]).toContain('ML-DSA')
  })

  it('extracts SLH-DSA algorithm names', () => {
    const result = generateFollowUps('SLH-DSA-128f is a hash-based signature scheme.')
    expect(result[0]).toContain('SLH-DSA')
  })

  it('extracts FIPS/CNSA standards', () => {
    const result = generateFollowUps('FIPS 203 defines the ML-KEM standard.')
    expect(result.some((q) => q.includes('FIPS 203'))).toBe(true)
  })

  it('extracts product/vendor names', () => {
    const result = generateFollowUps('OpenSSL supports ML-KEM and ML-DSA.')
    // Should have algo follow-up first, then potentially product
    expect(result.some((q) => q.includes('OpenSSL') || q.includes('ML-KEM'))).toBe(true)
  })

  it('extracts learning module topics', () => {
    const result = generateFollowUps('TLS 1.3 handshake now supports hybrid key exchange.')
    expect(result.some((q) => q.includes('TLS 1.3') || q.includes('hybrid key exchange'))).toBe(
      true
    )
  })

  it('deduplicates — same entity type does not produce duplicate follow-ups', () => {
    const result = generateFollowUps(
      'ML-KEM-768 and ML-KEM-1024 are both lattice-based algorithms.'
    )
    const algoFollowUps = result.filter((q) => q.includes('performance characteristics'))
    expect(algoFollowUps.length).toBeLessThanOrEqual(1)
  })
})

describe('generateFollowUps — workshop tab', () => {
  it('includes workshop suggestion when tab is "workshop"', () => {
    const result = generateFollowUps('Some generic content.', 'workshop')
    expect(result.some((q) => q.includes('workshop'))).toBe(true)
  })

  it('omits workshop suggestion when tab is "learn"', () => {
    const result = generateFollowUps('Some generic content without entities.', 'learn')
    expect(result.every((q) => !q.includes('workshop'))).toBe(true)
  })
})

describe('generateFollowUps — persona fallbacks', () => {
  it('executive persona: business impact fallbacks', () => {
    const result = generateFollowUps(
      'Some content with no recognizable entities.',
      undefined,
      'executive'
    )
    expect(result.some((q) => q.includes('business impact'))).toBe(true)
    expect(result.some((q) => q.includes('migration roadmap'))).toBe(true)
  })

  it('developer persona: implementation fallbacks', () => {
    const result = generateFollowUps(
      'Some content with no recognizable entities.',
      undefined,
      'developer'
    )
    expect(result.some((q) => q.includes('implementation example'))).toBe(true)
    expect(result.some((q) => q.includes('libraries support'))).toBe(true)
  })

  it('architect persona: architecture fallbacks', () => {
    const result = generateFollowUps(
      'Some content with no recognizable entities.',
      undefined,
      'architect'
    )
    expect(result.some((q) => q.includes('security architecture'))).toBe(true)
    expect(result.some((q) => q.includes('integration considerations'))).toBe(true)
  })

  it('researcher persona: research fallbacks', () => {
    const result = generateFollowUps(
      'Some content with no recognizable entities.',
      undefined,
      'researcher'
    )
    expect(result.some((q) => q.includes('research developments'))).toBe(true)
    expect(result.some((q) => q.includes('alternative approaches'))).toBe(true)
  })

  it('null/undefined persona: generic fallbacks', () => {
    const result = generateFollowUps('Some content with no recognizable entities.', undefined, null)
    expect(result.some((q) => q.includes('Tell me more'))).toBe(true)
    expect(result.some((q) => q.includes('PQC migration'))).toBe(true)
  })

  it('always returns at most 3 follow-ups', () => {
    const result = generateFollowUps(
      'ML-KEM-768 is defined by FIPS 203 and supported by OpenSSL and TLS 1.3.',
      'workshop',
      'executive'
    )
    expect(result.length).toBeLessThanOrEqual(3)
  })
})

describe('generateFollowUps — edge cases', () => {
  it('empty content returns persona-based fallbacks', () => {
    const result = generateFollowUps('', undefined, 'developer')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((q) => q.includes('implementation'))).toBe(true)
  })
  describe('standards are asked about according to what kind of document they are', () => {
    const ask = (text: string) => generateFollowUps(text).join(' | ')

    it('asks about CAVP algorithm validation for an algorithm standard, not a certificate', () => {
      const q = ask('FIPS 203 defines the ML-KEM standard.')
      expect(q).toMatch(/CAVP algorithm validation for FIPS 203/)
      expect(q).not.toMatch(/have FIPS 203 certification/i)
    })

    it('asks about a CMVP module certificate for FIPS 140-3', () => {
      expect(ask('Modules are validated under FIPS 140-3.')).toMatch(
        /CMVP module certificate under FIPS 140-3/
      )
    })

    it('asks whether CNSA 2.0, an SP 800 document or ANSSI applies, instead of asking who is certified to it', () => {
      for (const text of [
        'CNSA 2.0 sets the NSA algorithm suite.',
        'SP 800-227 describes key encapsulation recommendations.',
        'ANSSI publishes guidance on hybrid use.',
      ]) {
        const q = ask(text)
        expect(q).not.toMatch(/Which products have .* certification/i)
        expect(q).toMatch(/apply to/i)
      }
    })

    it('never asks for a universal certification issued for every named standard or authority', () => {
      for (const std of [
        'FIPS 203',
        'FIPS 204',
        'FIPS 205',
        'FIPS 140-2',
        'CNSA 2.0',
        'SP 800-208',
        'NIST IR 8547',
        'ETSI',
        'ANSSI',
      ]) {
        const q = ask(`${std} is mentioned in this answer.`)
        expect(q).not.toMatch(/Which products have .* certification\?/i)
      }
    })
  })
})
