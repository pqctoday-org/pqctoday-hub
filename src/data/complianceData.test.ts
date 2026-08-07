import { describe, it, expect } from 'vitest'
import {
  complianceFrameworks,
  allComplianceFrameworks,
  complianceDB,
  conceptIdForFramework,
} from './complianceData'
import { COMPLIANCE_CURIOUS_PREFACES } from './complianceCuriousPrefaces'
import { maturityByRefId, maturityRequirements } from './maturityGovernanceData'

describe('complianceData', () => {
  it('loads without error', () => {
    expect(complianceFrameworks.length).toBeGreaterThan(0)
  })

  // 2026-07-16 (compliance-maintenance audit): 46/167 active rows had no
  // concept_registry entry at all, so conceptIdForFramework returned
  // undefined and they could never participate in cross-table "equivalent
  // form" xwalk matching (pillarModel.ts's equivalentMatchLabels). Fixed to
  // 167/167 (100%): 41 rows got a new compliance-table registry entry; the
  // other 5 (FIPS-203/204/205, NSM-10, OMB-M-23-02) were already registered
  // under `library` — those got a `compliance:<id>` alias added instead of a
  // duplicate row, same cross-table pattern already used by ISO-19790. A
  // floor below the current 100%, not an exact-match assertion, so a future
  // new row doesn't fail this test just for arriving unregistered — it
  // should trend up, not down.
  it('at least 95% of active compliance rows have a concept_registry entry', () => {
    const withConceptId = complianceFrameworks.filter((f) => conceptIdForFramework(f))
    const pct = withConceptId.length / complianceFrameworks.length
    expect(pct).toBeGreaterThanOrEqual(0.95)
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

  it('resolves duplicate-label rows deterministically, order-independent', () => {
    // ANSSI and CRYPTREC each appear as a compliance_framework row AND a
    // standardization_body row. The mechanism under test: a row that REQUIRES
    // PQC wins over one that does not, so a real obligation is never silently
    // shadowed by CSV import order. That mechanism is unchanged.
    //
    // CHANGED 2026-07-31 (WP-2.2 remediation): ANSSI-BODY's requires_pqc was
    // 'yes' before this pass — one of 20 organization rows (standards/
    // certification bodies) wrongly claiming a PQC mandate, which is exactly
    // the defect class R6 in validators.py exists to catch. Its own cited
    // page states ANSSI "vise la mise en place d'obligations PQC... a partir
    // de 2027" — a real, dated, but not-yet-in-force, narrowly-scoped
    // obligation — so it is now 'expected', not 'yes'. The sibling
    // compliance_framework row (id=ANSSI) was already 'guidance', unchanged
    // by this pass and never flagged. With neither surviving ANSSI row making
    // an unconditional 'yes' claim, the honestly-merged answer is false — the
    // data got MORE accurate, and this pin needed to move with it.
    //
    // CRYPTREC is the control case proving the dedup mechanism itself still
    // works: its compliance_framework row (id=CRYPTREC, untouched by WP-2.2)
    // independently states requires_pqc=yes, so it still wins the merge.
    expect(complianceDB['ANSSI'].requiresPQC).toBe(false)
    expect(complianceDB['CRYPTREC'].requiresPQC).toBe(true)
  })

  it('has no unexpected duplicate labels in active rows', () => {
    // Known intentional duplicates: body rows + framework rows share a label.
    // Any NEW duplicate needs to be added here with an explanation, not silently swallowed.
    const KNOWN_DUPLICATES = new Set(['ANSSI', 'CRYPTREC'])
    const active = allComplianceFrameworks.filter(
      (f) => f.status !== 'deprecated' && f.status !== 'obsolete'
    )
    const seen = new Map<string, string>()
    const unexpected: string[] = []
    for (const fw of active) {
      if (seen.has(fw.label) && !KNOWN_DUPLICATES.has(fw.label)) {
        unexpected.push(`"${fw.label}" (${seen.get(fw.label)} and ${fw.id})`)
      }
      if (!seen.has(fw.label)) seen.set(fw.label, fw.id)
    }
    expect(unexpected).toEqual([])
  })
})

describe('complianceCuriousPrefaces', () => {
  it('every preface key matches an active CSV row id', () => {
    // Dead keys are unreachable — getComplianceCuriousPreface() returns undefined
    // and the component falls through to a generic fallback with no error.
    // This test catches typos and CSV renames before they ship.
    //
    // EXCEPTION: 'SOX' has no CSV row yet — tracked as a content backlog item.
    // Remove from KNOWN_DEAD once a SOX row is added to the compliance CSV.
    const KNOWN_DEAD = new Set(['SOX'])
    const ids = new Set(complianceFrameworks.map((f) => f.id))
    const dead: string[] = []
    for (const key of Object.keys(COMPLIANCE_CURIOUS_PREFACES)) {
      if (!ids.has(key) && !KNOWN_DEAD.has(key)) {
        dead.push(key)
      }
    }
    expect(dead).toEqual([])
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

// 2026-08-07: the v4.27.0 archival sweep (1a18b2830) moved
// pqc_maturity_governance_requirements_05152026.csv into src/data/archive/,
// following the repo-wide "latest dated file wins, archive the older ones"
// convention. maturityGovernanceData is the ONE source that merges every dated
// file instead of picking the newest, so that move didn't retire stale rows — it
// disconnected 1,332 requirements across 188 documents. The loader's glob didn't
// descend into archive/, so the corpus collapsed to 1 document / 50 requirements
// with no build error and no failing test, and every CSWP.39 surface silently
// degraded for 12 days.
//
// These are the guards that would have caught it on the day. Floors, not exact
// counts, so ordinary enrichment growth doesn't churn them — they should trend
// up, never down.
describe('CSWP.39 maturity corpus', () => {
  it('loads the full multi-document corpus, not just one file', () => {
    // Broken state scored 1 and 50 here. Real state (2026-08-07): 189 / 1382.
    expect(maturityByRefId.size).toBeGreaterThan(100)
    expect(maturityRequirements.length).toBeGreaterThan(1000)
  })

  it('keeps compliance rows joined to their extracted requirements', () => {
    // The invariant that actually matters: this fails the moment the corpus
    // disconnects, whatever the file layout or glob pattern happens to be.
    // Drives the "Open CSWP.39 crosswalk" button and the tile req-count badge.
    const joined = complianceFrameworks.filter((fw) =>
      fw.libraryRefs.some((ref) => maturityByRefId.has(ref))
    )
    // Broken state scored 8. Real state (2026-08-07): 118 of 202 active rows.
    expect(joined.length).toBeGreaterThan(100)
  })
})
