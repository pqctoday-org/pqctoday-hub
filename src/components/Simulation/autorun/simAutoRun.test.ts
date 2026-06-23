// SPDX-License-Identifier: GPL-3.0-only
/**
 * Validation walk — the auto-run director IS the end-to-end sim check. Driving
 * every gating step to genuine completion must (a) complete each step by the sim's
 * own `isStepComplete` predicate, (b) carry p0 past its gate, and (c) take all 9
 * lifecycle phases to the win level so the run completes — without ever touching a
 * non-gating sandbox-lab step. If a tree references a resource the genuine drive
 * action can't complete, this walk fails on it.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { isStepComplete } from '../embedContract'
import { PHASE_ORDER, LIFECYCLE_PHASES } from '@/data/frameworkPhases'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import {
  completeStepGenuine,
  driveAllPhases,
  gatingStepsForPhase,
  levelOfPhase,
  liveCompletionContext,
} from './simAutoRun'
import { demoDocFor } from './demoDocs'

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

describe('simAutoRun director', () => {
  it('drives p0 to clear its gate (G0) with every gating step genuinely complete', () => {
    const steps = gatingStepsForPhase('p0')
    expect(steps.length).toBeGreaterThan(0)

    for (const step of steps) completeStepGenuine(step)

    const ctx = liveCompletionContext()
    for (const step of steps) {
      expect(isStepComplete(step, ctx), `p0 step not complete: ${step.label}`).toBe(true)
    }
    expect(levelOfPhase('p0', ctx)).toBeGreaterThanOrEqual(PHASE_WIN_LEVEL)
  })

  it('drives the whole sim to a completed run (all lifecycle phases reach the win level)', () => {
    const report = driveAllPhases()

    expect(report.runComplete).toBe(true)
    for (const phase of LIFECYCLE_PHASES) {
      const result = report.phases.find((p) => p.phase === phase)
      expect(result, `missing phase ${phase}`).toBeDefined()
      expect(result!.cleared, `phase ${phase} not cleared (level ${result!.level})`).toBe(true)
      expect(result!.completed, `phase ${phase} has incomplete gating steps`).toBe(result!.gating)
    }
  })

  it('completes the run WITHOUT touching any non-gating sandbox-lab (scenario) step', () => {
    driveAllPhases()
    // Scenario steps are non-gating and require a live sandbox — never driven.
    expect(useSimulationStore.getState().visitedScenarios).toHaveLength(0)
  })

  it('has non-empty demo content for every activity type the trees use', () => {
    const types = new Set<ExecutiveDocumentType>()
    for (const phase of PHASE_ORDER) {
      for (const step of gatingStepsForPhase(phase)) {
        if (step.kind === 'activity' && step.artifactType) types.add(step.artifactType)
      }
    }
    expect(types.size).toBeGreaterThan(0)
    for (const type of types) {
      const doc = demoDocFor(type)
      expect(doc.title.length, `empty demo title for ${type}`).toBeGreaterThan(0)
      expect(doc.data.length, `empty demo body for ${type}`).toBeGreaterThan(0)
    }
  })
})
