import { describe, it, expect } from 'vitest'
import { complianceFrameworks } from './complianceData'

describe('complianceData', () => {
  it('loads without error', () => {
    expect(complianceFrameworks.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of complianceFrameworks) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of complianceFrameworks) {
      expect(item.id).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = complianceFrameworks.map((item) => item.id)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  const byId = (id: string) => complianceFrameworks.find((f) => f.id === id)

  it('treats an in-force phased range as active, not a distant deadline', () => {
    // CNSA 2.0 "2025-2033" / ANSSI "2025-2030" straddle the current year and are in
    // force now — the parser must not bucket them by the far endpoint (mid/long).
    expect(byId('CNSA-2')?.deadlinePhase).toBe('active')
    expect(byId('ANSSI')?.deadlinePhase).toBe('active')
  })

  it('classifies anticipated/advisory frameworks correctly', () => {
    // OSFI B-13 signals forthcoming (not current) PQC requirements.
    expect(byId('OSFI-B13-PQC')?.pqcRequirement).toBe('expected')
    // CISA's PQC Initiative is advisory guidance, not a partial mandate.
    expect(byId('cisa-pqc-initiative')?.pqcRequirement).toBe('guidance')
  })
})
