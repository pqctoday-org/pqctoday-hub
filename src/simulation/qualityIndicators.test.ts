// SPDX-License-Identifier: GPL-3.0-only
/**
 * W7.5 — the indicators say what KIND of run happened. They are not a
 * competence measure and the tests pin the distinctions that make that true.
 */
import { describe, it, expect } from 'vitest'
import { runQualityIndicators, completionTypeOf, indicatorsLabel } from './qualityIndicators'
import type { SimEvidenceRecord } from './evidence'

const ev = (origin: SimEvidenceRecord['origin'], i: number): SimEvidenceRecord => ({
  id: `e${i}`,
  runId: 'run-1',
  phase: 'p0',
  resourceId: `r${i}`,
  kind: 'learn',
  origin,
  status: 'viewed',
  fingerprint: 'mid/US/financial',
  createdAt: i,
})

describe('completion type (W7.5)', () => {
  it('distinguishes a worked run from a watched one', () => {
    expect(completionTypeOf(1)).toBe('practised')
    expect(completionTypeOf(0.5)).toBe('mixed')
    expect(completionTypeOf(0)).toBe('demonstrated')
  })

  it('an empty run is EMPTY, not "watched everything"', () => {
    // A run with no evidence has no ratio. Reporting 0 would say the learner
    // watched it all, which is a different — and false — statement.
    expect(completionTypeOf(null)).toBe('empty')
    const i = runQualityIndicators({ evidence: [], returnPathFailures: 0, startedPhaseSteps: [] })
    expect(i.learnerShare).toBeNull()
    expect(i.completionType).toBe('empty')
  })
})

describe('run indicators', () => {
  it('separates the learner’s own work from demonstrations', () => {
    const i = runQualityIndicators({
      evidence: [ev('learner', 1), ev('narrated-example', 2), ev('ai-delegated', 3)],
      returnPathFailures: 2,
      startedPhaseSteps: [],
    })
    expect(i.evidenceTotal).toBe(3)
    expect(i.demonstratedCount).toBe(2)
    expect(i.learnerShare).toBeCloseTo(1 / 3)
    expect(i.completionType).toBe('demonstrated')
    expect(i.returnPathFailures).toBe(2)
  })

  it('counts unresolved work only in phases the learner actually started', () => {
    // An untouched phase is not a loose end — counting it would report a
    // beginner as carrying a huge backlog, which says nothing about the product.
    const i = runQualityIndicators({
      evidence: [ev('learner', 1)],
      returnPathFailures: 0,
      startedPhaseSteps: [
        [10, 4], // started, 6 left
        [5, 5], // finished
      ],
    })
    expect(i.unresolvedInStartedPhases).toBe(6)
  })

  it('emits a label of counts and categories only — nothing identifying', () => {
    const label = indicatorsLabel(
      runQualityIndicators({
        evidence: [ev('learner', 1)],
        returnPathFailures: 1,
        startedPhaseSteps: [[3, 1]],
      })
    )
    expect(label).toBe('type=practised|own=100|ev=1|demo=0|rpf=1|unres=2')
    // no ids, no resource names, no free text
    expect(label).not.toMatch(/run-1|r1|financial/)
  })
})
