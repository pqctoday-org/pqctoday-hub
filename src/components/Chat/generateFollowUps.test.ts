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
})
