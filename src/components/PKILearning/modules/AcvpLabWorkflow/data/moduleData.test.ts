// SPDX-License-Identifier: AGPL-3.0-only
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
  ACVP_VS_MODULE_BOUNDARY_SCOPE,
  CLAIM_LADDER,
  EVIDENCE_SCENARIOS,
  HUB_REACHABLE_MAX_RUNG,
  NOT_TEST_EVIDENCE,
  PRODUCTION_CERTIFICATE_CROSSCHECK_CHECKLIST,
  SAMPLE_EXPORT_NON_EQUIVALENCE_RULE,
} from './evidenceLevels'
import { CONCEPT_CHECKS } from './conceptChecks'
import { REVIEW_STATUS } from './reviewStatus'
import { content } from '../content'
import manifest from '../manifest'
import curiousSummary from '../curious-summary.md?raw'
import ragSummary from '../rag-summary.md?raw'

const all = Object.values(SOURCES) as ModuleSource[]

describe('acvp-lab-workflow sources', () => {
  it('every Library-backed source resolves to a Library row', () => {
    const missing = all.filter((s) => s.libraryRefId && !hasStandard(s.libraryRefId))
    expect(missing.map((s) => s.libraryRefId)).toEqual([])
  })

  it('every source has an https URL', () => {
    for (const s of all) expect(s.url, s.id).toMatch(/^https:\/\//)
  })

  it('records the current published protocol draft and immutable example snapshot', () => {
    expect(SOURCES.acvpSpec.revision).toBe(
      'draft-ietf-acvp-spec-01, 30 October 2026 (Internet-Draft; current published edition). Reproducible protocol examples remain pinned to usnistgov/ACVP @ d13c633.'
    )
    expect(content.narratives.acvpSpecRevision).toBe(SOURCES.acvpSpec.revision)
    expect(SOURCES.acvpMlDsaCurrent.revision).toContain('published 2026-10-30')
    expect(SOURCES.acvpMlDsaCurrent.revision).toContain('not a final standard')
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
    // Every cited source now has its Library row (acvpMlKem linked 22 Oct 2026).
    expect(LIBRARY_ADDITIONS_NEEDED).toEqual([])
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

describe('acvp-lab-workflow review status', () => {
  it('shows the owner sign-off of 1 November 2026 and is not marked as a draft (owner decisions, 22 Oct to 1 Nov 2026)', () => {
    expect(REVIEW_STATUS.state).toBe('owner-signed-off')
    expect(REVIEW_STATUS.label).toBe(
      'Reviewed and signed off by the PQC Today owner on 1 November 2026'
    )
    expect(REVIEW_STATUS.label).not.toMatch(/draft/i)
    expect(manifest.workInProgress).toBeUndefined()
    expect(manifest.description).not.toMatch(/draft/i)
  })
})

describe('acvp-lab-workflow ACVP vs module boundary & certificate cross-check gate', () => {
  it('establishes ACVP KAT vector mathematical conformance vs FIPS 140-3 / CC module boundary validation', () => {
    expect(ACVP_VS_MODULE_BOUNDARY_SCOPE.acvpKatScope).toContain('IUT')
    expect(ACVP_VS_MODULE_BOUNDARY_SCOPE.moduleBoundaryScope).toContain('SP 800-90B')
    expect(ACVP_VS_MODULE_BOUNDARY_SCOPE.moduleBoundaryScope).toContain('SSP zeroization')
    expect(curiousSummary).toContain('IUT')
    expect(curiousSummary).toContain('SP 800-90B')
    expect(ragSummary).toContain('IUT')
    expect(ragSummary).toContain('SP 800-90B')
  })

  it('includes the five suggested certificate checks and rejects sample Hub exports as certification evidence', () => {
    expect(PRODUCTION_CERTIFICATE_CROSSCHECK_CHECKLIST).toEqual([
      'Certificate or module number and status (active, historical or revoked)',
      'Exact module or product name and version',
      'Tested operational environment or evaluated configuration (CMVP Security Policy; CC certification report)',
      'CAVP algorithm certificate numbers for the algorithms you rely on',
      'CC/EUCC: Security Target and claimed assurance level',
    ])
    for (const summary of [curiousSummary, ragSummary]) {
      expect(summary).toContain('Hub practice guidance, not a certification-scheme requirement')
      expect(summary).toContain('Security Target')
      expect(summary).not.toContain('side-channel protections')
    }
    expect(SAMPLE_EXPORT_NON_EQUIVALENCE_RULE).toContain('never certification evidence')
  })
})
