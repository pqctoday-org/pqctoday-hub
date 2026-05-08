// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { counterClaims, getCounterClaims, hasCounterClaim } from './counterClaimsData'

describe('counterClaimsData', () => {
  it('loads at least one row from the seeded CSV', () => {
    expect(counterClaims.length).toBeGreaterThan(0)
  })

  it('seeded NSA-vs-ANSSI hybrid disagreement is queryable on the CNSA-2.0 record', () => {
    expect(hasCounterClaim('compliance', 'CNSA-2.0')).toBe(true)
    const claims = getCounterClaims('compliance', 'CNSA-2.0')
    expect(claims.length).toBeGreaterThan(0)
    expect(claims[0].competingSourceId).toBe('anssi-pqc-roadmap')
    expect(claims[0].disagreementSummary.toLowerCase()).toContain('hybrid')
  })

  it('returns [] for unknown record', () => {
    expect(getCounterClaims('compliance', 'does-not-exist')).toEqual([])
    expect(hasCounterClaim('compliance', 'does-not-exist')).toBe(false)
  })

  it('loaded rows carry claim_id, verified_by, and verified_date', () => {
    for (const c of counterClaims) {
      expect(c.claimId).toMatch(/^cc-/)
      expect(c.verifiedBy).toBeTruthy()
      expect(c.verifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
