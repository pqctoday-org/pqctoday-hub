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
import { SIM_TREES } from '@/simulation'
import { topBandLevel } from '@/simulation/maturityScale'
import { PHASE_ORDER, LIFECYCLE_PHASES } from '@/data/frameworkPhases'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import {
  autoRunQueue,
  completeStepGenuine,
  driveAllPhases,
  gatingStepsForPhase,
  levelOfPhase,
  liveCompletionContext,
} from './simAutoRun'

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

  it('queue is level-major (a maturity climb): each level pass is contiguous', () => {
    const q = autoRunQueue()
    expect(q.length).toBeGreaterThan(0)
    // every item carries its band level; the queue runs all L1, then all L2, ... (non-decreasing).
    let last = 0
    for (const item of q) {
      expect(
        item.level,
        'queue levels must be non-decreasing (level-major)'
      ).toBeGreaterThanOrEqual(last)
      last = item.level
    }
    expect(last).toBeGreaterThanOrEqual(2)
  })

  it('climbs maturity per-phase-monotonically; all phases reach their top band only by the last pass', () => {
    // NOTE: the climb is monotonic PER PHASE (a phase's level never decreases as more steps
    // complete), but it is NOT strictly capped at the pass number — some phases (e.g. p4,
    // verify-close) reach a higher band early because that band's gating steps are satisfied
    // by SHARED artifact types / refs completed in earlier passes. That is genuine maturity,
    // not a bug; the auto-run paces the *displayed* climb by pass and caps the per-phase ring
    // at the current pass (see useSimAutoRunPlayer). What MUST hold: no regression, and the
    // program only reaches full maturity (every phase at its own top band) at the final pass.
    const q = autoRunQueue()
    const maxLevel = Math.max(...q.map((i) => i.level))
    const prev: Record<string, number> = {}
    let allAtTopBandBeforeLastPass = false
    for (let pass = 1; pass <= maxLevel; pass++) {
      for (const item of q.filter((i) => i.level === pass)) completeStepGenuine(item.step)
      for (const phase of LIFECYCLE_PHASES) {
        const lvl = levelOfPhase(phase)
        expect(lvl, `phase ${phase} regressed at pass ${pass}`).toBeGreaterThanOrEqual(
          prev[phase] ?? 0
        )
        prev[phase] = lvl
      }
      if (pass < maxLevel) {
        const everyTop = LIFECYCLE_PHASES.every(
          (p) => levelOfPhase(p) >= topBandLevel(SIM_TREES[p], 4)
        )
        if (everyTop) allAtTopBandBeforeLastPass = true
      }
    }
    expect(allAtTopBandBeforeLastPass, 'full maturity reached before the last pass').toBe(false)
    for (const phase of LIFECYCLE_PHASES) {
      expect(levelOfPhase(phase), `phase ${phase} not cleared`).toBeGreaterThanOrEqual(
        PHASE_WIN_LEVEL
      )
    }
  })

  it('has non-empty demo content for every activity type the trees use', () => {
    // Drives each representative step through the REAL dispatch path
    // (completeStepGenuine -> docFor -> REAL_DOC_GENERATORS or demoDocFor),
    // not demoDocFor() directly — otherwise the 7 artifact types now backed
    // by REAL_DOC_GENERATORS (their hand-authored demoDocs.ts entries were
    // removed) would only ever exercise demoDocFor's generic placeholder
    // fallback and this test would pass without ever calling buildMarkdown().
    const typeToStep = new Map<ExecutiveDocumentType, Parameters<typeof completeStepGenuine>[0]>()
    for (const phase of PHASE_ORDER) {
      for (const step of gatingStepsForPhase(phase)) {
        if (step.kind === 'activity' && step.artifactType && !typeToStep.has(step.artifactType)) {
          typeToStep.set(step.artifactType, step)
        }
      }
    }
    expect(typeToStep.size).toBeGreaterThan(0)
    for (const step of typeToStep.values()) completeStepGenuine(step)

    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    for (const type of typeToStep.keys()) {
      const doc = docs.find((d) => d.type === type)
      expect(doc, `no document recorded for ${type}`).toBeDefined()
      expect(doc?.title.length, `empty demo title for ${type}`).toBeGreaterThan(0)
      expect(doc?.data.length, `empty demo body for ${type}`).toBeGreaterThan(0)
    }
  })
})
