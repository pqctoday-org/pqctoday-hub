// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { verifyFacts } from './factVerification'

describe('verifyFacts', () => {
  // ── FIPS attribution ──────────────────────────────────────────────────

  it('passes when FIPS 203 is correctly attributed to ML-KEM', () => {
    const result = verifyFacts('FIPS 203 standardizes ML-KEM for key encapsulation.')
    expect(result).toEqual([])
  })

  it('passes when FIPS 204 is correctly attributed to ML-DSA', () => {
    const result = verifyFacts('FIPS 204 defines ML-DSA, the primary PQC signature algorithm.')
    expect(result).toEqual([])
  })

  it('passes when FIPS 205 is correctly attributed to SLH-DSA', () => {
    const result = verifyFacts('SLH-DSA is standardized in FIPS 205.')
    expect(result).toEqual([])
  })

  it('detects FIPS 203 misattributed to ML-DSA', () => {
    const result = verifyFacts('FIPS 203 standardizes ML-DSA for digital signatures.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('FIPS 203 is ML-KEM')
  })

  it('detects FIPS 204 misattributed to ML-KEM', () => {
    const result = verifyFacts('FIPS 204 is ML-KEM, used for key exchange.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('FIPS 204 is ML-DSA')
  })

  it('detects FIPS 205 misattributed to FN-DSA', () => {
    const result = verifyFacts('FIPS 205 defines FN-DSA signatures.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('FIPS 205 is SLH-DSA')
  })

  it('normalizes legacy algorithm names (Kyber → ML-KEM)', () => {
    const result = verifyFacts('FIPS 203 standardizes Kyber for key encapsulation.')
    expect(result).toEqual([])
  })

  it('normalizes Dilithium → ML-DSA for FIPS 204', () => {
    const result = verifyFacts('FIPS 204 defines Dilithium signatures.')
    expect(result).toEqual([])
  })

  // ── Security levels ──────────────────────────────────────────────────

  it('passes for correct ML-KEM-768 Level 3', () => {
    const result = verifyFacts('ML-KEM-768 provides NIST security level 3 protection.')
    expect(result).toEqual([])
  })

  it('passes for correct ML-DSA-87 Level 5', () => {
    const result = verifyFacts('ML-DSA-87 achieves Level 5 security.')
    expect(result).toEqual([])
  })

  it('detects wrong security level for ML-KEM-768', () => {
    const result = verifyFacts('ML-KEM-768 provides Level 5 security.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('ML-KEM-768 is NIST Level 3')
  })

  it('detects wrong security level for ML-KEM-512', () => {
    const result = verifyFacts('ML-KEM-512 provides Level 3 security.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('ML-KEM-512 is NIST Level 1')
  })

  it('detects wrong security level for ML-DSA-44', () => {
    const result = verifyFacts('ML-DSA-44 achieves Level 5 security.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('ML-DSA-44 is NIST Level 2')
  })

  // ── Publication dates ────────────────────────────────────────────────

  it('passes for correct FIPS 203 finalization date', () => {
    const result = verifyFacts('FIPS 203 was finalized in August 2024.')
    expect(result).toEqual([])
  })

  it('detects wrong publication date for FIPS 203', () => {
    const result = verifyFacts('FIPS 203 was published in January 2025.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('August 2024')
  })

  it('detects wrong publication date for FIPS 204', () => {
    const result = verifyFacts('FIPS 204 was finalized in March 2025.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('August 2024')
  })

  // ── Non-PQC standard misattribution ──────────────────────────────────

  it('passes when RFC 8446 (TLS 1.3) is discussed without PQC claims', () => {
    const result = verifyFacts('RFC 8446 defines TLS 1.3, the current transport security protocol.')
    expect(result).toEqual([])
  })

  it('detects claim that RFC 8446 supports ML-KEM', () => {
    const result = verifyFacts('RFC 8446 supports ML-KEM for hybrid key exchange.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('does NOT include PQC algorithms')
  })

  it('detects claim that TLS 1.2 (RFC 5246) includes ML-DSA', () => {
    const result = verifyFacts('RFC 5246 includes ML-DSA signature support.')
    expect(result.length).toBe(1)
    expect(result[0].expected).toContain('does NOT include PQC algorithms')
  })

  // ── Clean output ─────────────────────────────────────────────────────

  it('returns empty array for text with no factual claims', () => {
    const result = verifyFacts('Post-quantum cryptography is important for long-term security.')
    expect(result).toEqual([])
  })

  it('returns empty array for text with all correct facts', () => {
    const text = `FIPS 203 standardizes ML-KEM. FIPS 204 defines ML-DSA.
ML-KEM-768 provides Level 3 security. ML-DSA-87 achieves Level 5.
These standards were finalized in August 2024.`
    const result = verifyFacts(text)
    expect(result).toEqual([])
  })

  it('catches multiple violations in a single response', () => {
    const text = `FIPS 203 defines ML-DSA. ML-KEM-512 provides Level 5 security.
FIPS 204 was published in January 2025.`
    const result = verifyFacts(text)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })
})
