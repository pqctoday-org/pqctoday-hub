// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { counterClaims, getCounterClaims, hasCounterClaim } from './counterClaimsData'
import { complianceFrameworks } from './complianceData'

describe('counterClaimsData', () => {
  it('loads at least one row from the seeded CSV', () => {
    expect(counterClaims.length).toBeGreaterThan(0)
  })

  it('seeded NSA-vs-ANSSI hybrid disagreement is queryable on the CNSA-2 framework row', () => {
    // record_id is the compliance framework's id. It was 'CNSA-2.0' until
    // 2026-10-03, which matches no framework row (the CNSA 2.0 row is 'CNSA-2').
    expect(hasCounterClaim('compliance', 'CNSA-2')).toBe(true)
    expect(hasCounterClaim('compliance', 'CNSA-2.0')).toBe(false)
    const claims = getCounterClaims('compliance', 'CNSA-2')
    expect(claims.length).toBeGreaterThan(0)
    expect(claims[0].competingSourceId).toBe('anssi-pqc-roadmap')
    expect(claims[0].disagreementSummary.toLowerCase()).toContain('hybrid')
  })

  it("every 'compliance' record_id names a live compliance framework", () => {
    // A claim on an id no framework carries is invisible wherever the UI or
    // the search index looks it up by framework id.
    const ids = new Set(complianceFrameworks.map((f) => f.id))
    const orphans = counterClaims
      .filter((c) => c.recordType === 'compliance' && !ids.has(c.recordId))
      .map((c) => `${c.claimId} → ${c.recordId}`)
    expect(orphans).toEqual([])
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
