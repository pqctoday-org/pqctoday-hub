// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Owner decision 2026-11-14 (COMP-2, "B"): program closure must not clear on
 * the evidence dossier alone (the framework's own "Declared done" failure); it
 * also needs 80% of migratable connections decided, the bar Phase 5 L4 uses.
 * The pilots level stays document-backed, and closure stays outside the 32
 * numbered cells, so the outcome-backed count (15 of 32) does not change.
 */
import { describe, it, expect } from 'vitest'
import { SIM_TREES } from '@/simulation'
import { isStepComplete, type StepCompletionContext } from '@/components/Simulation/embedContract'
import { coverageSummary, EXTENSION_COVERAGE, coverageFor } from './frameworkCoverage'

const vc2 = () => {
  const band = SIM_TREES['verify-close']!.levels.find((l) => l.level === 2)!
  return band.activities.flatMap((a) => a.steps)
}

const ctx = (coverage: number): StepCompletionContext => ({
  isModuleComplete: () => true,
  hasArtifact: () => true,
  isRefVisited: () => true,
  isWorkshopComplete: () => true,
  isCatalogStepDone: () => true,
  isScenarioComplete: () => true,
  edgeDecisionCount: () => 0,
  edgeDecisionCapacity: () => 0,
  recurrenceCount: () => 99,
  metricValue: (id) => (id === 'migration-coverage-pct' ? coverage : null),
})

describe('program closure needs the estate migrated, not just a dossier', () => {
  it('closure level 2 carries an 80% connection-coverage measure', () => {
    const gate = vc2().find((s) => s.kind === 'measure')
    expect(gate).toMatchObject({ metricId: 'migration-coverage-pct', minValue: 80 })
  })

  it('with every document filed, closure level 2 still fails below 80% coverage', () => {
    const allDone = (coverage: number) => vc2().every((s) => isStepComplete(s, ctx(coverage)))
    expect(allDone(79)).toBe(false)
    expect(allDone(80)).toBe(true)
  })

  it('leaves the pilots level and the board count as they were', () => {
    expect(coverageFor('p5', 2)?.status).toBe('proxy')
    expect(EXTENSION_COVERAGE.find((e) => e.phase === 'verify-close')?.status).toBe('proxy')
    expect(coverageSummary()).toMatchObject({
      requiredWithP0: 32,
      outcomeBacked: 15,
      proxyBacked: 17,
    })
  })
})
