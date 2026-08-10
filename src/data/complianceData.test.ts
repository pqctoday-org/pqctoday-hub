import { describe, it, expect } from 'vitest'
import {
  complianceFrameworks,
  allComplianceFrameworks,
  complianceDB,
  conceptIdForFramework,
  mergeFrameworksByLabel,
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
    // The mechanism: when two rows share a label, the one that REQUIRES PQC wins,
    // whichever order they arrive in — so a real obligation is never silently
    // shadowed by CSV import order.
    //
    // Driven by a FIXTURE, not by live rows. This assertion used to pin whichever
    // real framework happened to claim requires_pqc=yes, and that pin has had to
    // move twice as the data got more accurate: ANSSI on 2026-07-31, then CRYPTREC
    // on 2026-08-09 (its cited standard still lists RSA/ECDSA and the binding body
    // is the Cybersecurity Strategic HQ, so 'guidance' is the honest value).
    //
    // After the second move, NO active duplicate-label pair claims 'yes' — the two
    // that exist are ANSSI/ANSSI-BODY and CRYPTREC/CRYPTREC-BODY, all now
    // guidance/expected. A live-data version of this test would therefore assert
    // only that both merge to false, which is equally true if the merge is broken.
    // The fixture keeps the test about the code; the live values are pinned below
    // as data, where they belong.
    const weak = { label: 'DUP', requiresPQC: false, deadline: 'none', notes: 'weak' }
    const strong = { label: 'DUP', requiresPQC: true, deadline: '2030', notes: 'strong' }

    expect(mergeFrameworksByLabel([weak, strong])['DUP'].requiresPQC).toBe(true)
    expect(mergeFrameworksByLabel([strong, weak])['DUP'].requiresPQC).toBe(true)
    // and the winning row's own deadline/notes travel with it, not the loser's
    expect(mergeFrameworksByLabel([strong, weak])['DUP'].notes).toBe('strong')

    // Same requiresPQC on both: last one wins, matching the prior last-wins behaviour.
    const a = { label: 'SAME', requiresPQC: false, deadline: 'x', notes: 'first' }
    const b = { label: 'SAME', requiresPQC: false, deadline: 'y', notes: 'second' }
    expect(mergeFrameworksByLabel([a, b])['SAME'].notes).toBe('second')
  })

  it('pins the current merged values for the two real duplicate-label pairs', () => {
    // Data pins, deliberately separate from the mechanism test above so that a
    // legitimate data correction cannot quietly hollow out the mechanism check.
    // Both pairs are guidance/expected as of 2026-08-09, so both merge to false.
    expect(complianceDB['ANSSI'].requiresPQC).toBe(false)
    expect(complianceDB['CRYPTREC'].requiresPQC).toBe(false)
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
