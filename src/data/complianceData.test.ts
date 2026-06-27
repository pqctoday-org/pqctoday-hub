import { describe, it, expect } from 'vitest'
import { complianceFrameworks, complianceDB } from './complianceData'

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

  it('resolves duplicate-label rows (ANSSI, CRYPTREC) to requiresPQC=true, order-independent', () => {
    // ANSSI and CRYPTREC each appear as a compliance_framework row AND a
    // standardization_body row. The PQC-requiring variant must win deterministically,
    // so the assessment scoring is never silently shadowed by CSV import order.
    expect(complianceDB['ANSSI'].requiresPQC).toBe(true)
    expect(complianceDB['CRYPTREC'].requiresPQC).toBe(true)
  })

  it('cswp39Tags use only valid Crypto Posture Management pillars', () => {
    // Despite the `cswp39:` prefix these tags are the CPM pillars
    // (cpmMaturityModel.ts `PillarId`), NOT CSWP.39 zones/steps. This guard
    // catches typos or stray values that would render as broken chips.
    const PILLARS = new Set(['inventory', 'governance', 'lifecycle', 'observability', 'assurance'])
    const offenders: string[] = []
    for (const item of complianceFrameworks) {
      for (const tag of item.cswp39Tags ?? []) {
        const pillar = tag.replace('cswp39:', '')
        if (!PILLARS.has(pillar)) offenders.push(`${item.id}: ${tag}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
