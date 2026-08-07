// SPDX-License-Identifier: GPL-3.0-only
/**
 * Grounds isFipsValidated()/isNistPick() against real values pulled from the
 * live data files, not invented strings. Regression guard for the bug where
 * "FIPS-validated" resolved to `status === 'Certified'` (which also matches
 * non-FIPS regional standards) and "NIST picks" resolved to `family ===
 * 'Lattice'` (which excludes SLH-DSA, a Hash-based FIPS 205 standard) — see
 * AIMer/HAETAE showing up under "FIPS-validated" on /algorithms 2026-08-07.
 */
import { describe, it, expect } from 'vitest'
import { isFipsValidated, isNistPick } from './useAlgorithmExplorer'

describe('isFipsValidated', () => {
  it('accepts real, finalized FIPS designations', () => {
    for (const v of ['FIPS 203', 'FIPS 204', 'FIPS 205', 'FIPS 197', 'FIPS 198-1', 'FIPS 180-4']) {
      expect(isFipsValidated(v), v).toBe(true)
    }
  })

  it('rejects the exact non-FIPS values real "Certified"-tier rows carry', () => {
    // AIMer/HAETAE/SMAUG-T/NTRU+ (KpqC winners) and Classic-McEliece (BSI) —
    // all tiered 'regional' in algorithmStatusTier.ts precisely because
    // they're "not FIPS-Certified". A "FIPS-validated" filter must not match them.
    for (const v of [
      'KpqC Round 2',
      'KR-PQC Round 1 (KPQC)',
      'BSI TR-02102-1',
      'BSI TR-02102-1 v2026-01',
      'ANSSI-PG-083 v3.00',
      'ISO 18033-2 Amd2',
      'ETSI TS 104 015',
      'NIST SP 800-208',
      'FIPS 206 (in development)',
      'Candidate',
      'Round 2',
      'Round 4',
      'To Be Checked',
      '',
    ]) {
      expect(isFipsValidated(v), v).toBe(false)
    }
  })
})

describe('isNistPick', () => {
  it('accepts exactly ML-KEM/ML-DSA/SLH-DSA — the three FIPS 203/204/205 standards', () => {
    for (const v of ['FIPS 203', 'FIPS 204', 'FIPS 205']) {
      expect(isNistPick(v), v).toBe(true)
    }
  })

  it('rejects other true-FIPS classical standards (AES, SHA — not PQC picks)', () => {
    for (const v of ['FIPS 197', 'FIPS 198-1', 'FIPS 180-4', 'FIPS 202']) {
      expect(isNistPick(v), v).toBe(false)
    }
  })

  it('rejects FIPS 206 while still in development', () => {
    expect(isNistPick('FIPS 206 (in development)')).toBe(false)
  })

  it('rejects regional/candidate standards', () => {
    for (const v of ['KpqC Round 2', 'BSI TR-02102-1', 'Candidate', 'Round 2']) {
      expect(isNistPick(v), v).toBe(false)
    }
  })
})
