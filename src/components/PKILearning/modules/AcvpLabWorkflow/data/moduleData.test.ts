// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data integrity for the acvp-lab-workflow module: every citation resolves,
 * every Library citation is a real Library row, the classification exercise
 * only uses the Hub's own evidence taxonomy, and every concept check is
 * well-formed and cited.
 */
import { describe, it, expect } from 'vitest'
import { hasStandard } from '@/data/standardsRegistry'
import { EVIDENCE_CLASS_IDS, isEvidenceClassId } from '@/data/validation/evidenceClasses'
import { SOURCES, LIBRARY_ADDITIONS_NEEDED, type ModuleSource } from './sources'
import {
  CLAIM_LADDER,
  EVIDENCE_SCENARIOS,
  HUB_REACHABLE_MAX_RUNG,
  NOT_TEST_EVIDENCE,
} from './evidenceLevels'
import { CONCEPT_CHECKS } from './conceptChecks'
import { REVIEW_STATUS } from './reviewStatus'
import { content } from '../content'
import manifest from '../manifest'

const all = Object.values(SOURCES) as ModuleSource[]

describe('acvp-lab-workflow sources', () => {
  it('every Library-backed source resolves to a Library row', () => {
    const missing = all.filter((s) => s.libraryRefId && !hasStandard(s.libraryRefId))
    expect(missing.map((s) => s.libraryRefId)).toEqual([])
  })

  it('every source has an https URL', () => {
    for (const s of all) expect(s.url, s.id).toMatch(/^https:\/\//)
  })

  it('usnistgov sources are pinned to a full commit, never a branch', () => {
    for (const s of all.filter((x) => x.url.includes('github.com/usnistgov/'))) {
      expect(s.url, s.id).toMatch(/\/(blob|tree)\/[0-9a-f]{40}\//)
    }
  })

  it('lists exactly the non-Library, non-policy sources as Library additions needed', () => {
    expect([...LIBRARY_ADDITIONS_NEEDED].sort()).toEqual(
      all
        .filter((s) => !s.libraryRefId && !s.hubPolicy)
        .map((s) => s.id)
        .sort()
    )
    expect(LIBRARY_ADDITIONS_NEEDED.length).toBeGreaterThan(0)
  })

  it('content.ts declares every Library-backed source as a module standard', () => {
    const declared = new Set(content.standards.map((s) => s.id))
    const cited = all.filter((s) => s.libraryRefId).map((s) => s.libraryRefId as string)
    expect(cited.filter((id) => !declared.has(id))).toEqual([])
  })
})

describe('acvp-lab-workflow evidence exercise', () => {
  it('the claim ladder has the nine plan §2.3 rungs', () => {
    expect(CLAIM_LADDER).toHaveLength(9)
    expect(HUB_REACHABLE_MAX_RUNG).toBe(7)
  })

  it('every scenario answer is a Hub evidence class or the explicit not-evidence marker', () => {
    for (const s of EVIDENCE_SCENARIOS) {
      expect(isEvidenceClassId(s.answer) || s.answer === NOT_TEST_EVIDENCE, s.id).toBe(true)
      if (s.rung !== null) {
        expect(s.rung, s.id).toBeGreaterThanOrEqual(1)
        expect(s.rung, s.id).toBeLessThanOrEqual(CLAIM_LADDER.length)
      }
    }
  })

  it('exercises all eight evidence classes at least once, plus a not-evidence trap', () => {
    const used = new Set(EVIDENCE_SCENARIOS.map((s) => s.answer))
    for (const id of EVIDENCE_CLASS_IDS) expect(used.has(id), id).toBe(true)
    expect(used.has(NOT_TEST_EVIDENCE)).toBe(true)
  })

  it('scenario ids are unique', () => {
    const ids = EVIDENCE_SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('acvp-lab-workflow concept checks', () => {
  it('are well-formed: unique ids, a valid correct index, and at least one citation', () => {
    const ids = CONCEPT_CHECKS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of CONCEPT_CHECKS) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3)
      expect(q.correct, q.id).toBeGreaterThanOrEqual(0)
      expect(q.correct, q.id).toBeLessThan(q.options.length)
      expect(q.cites.length, q.id).toBeGreaterThan(0)
      for (const c of q.cites) expect(c.s in SOURCES, `${q.id} cites ${c.s}`).toBe(true)
    }
  })
})

describe('acvp-lab-workflow draft status', () => {
  it('stays marked as a draft until a practitioner review is recorded', () => {
    // Flip all three together when the review lands (see reviewStatus.ts).
    expect(REVIEW_STATUS.state).toBe('draft-awaiting-practitioner-review')
    expect(manifest.workInProgress).toBe(true)
    expect(content.lastReviewed).toBeUndefined()
  })
})
