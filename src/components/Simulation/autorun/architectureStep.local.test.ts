// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-04 — architecture step completion math + the auto-run's genuine edge
 * decisions. Focused coverage beyond the generic per-kind fixture in
 * embedContract.test.ts: the capped-min edge case (a fixed threshold can
 * never exceed the run's actual migratable-edge capacity) and jurisdiction-
 * aware choice in the auto-run driver.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { isStepComplete, type StepCompletionContext } from '../embedContract'
import { completeStepGenuine, liveCompletionContext } from './simAutoRun'
import { ARCHITECTURES, edgeState } from '@/data/simArchitecture'
import { JURISDICTION_RULES } from '@/data/jurisdiction'
import type { TreeStep } from '@/simulation'

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

const step = (minDecisions: number): TreeStep =>
  ({ kind: 'architecture', label: 'test', to: '/simulation', minDecisions }) as TreeStep

describe('architecture step — completion math', () => {
  it('is incomplete below the threshold and complete at/above it', () => {
    const ctx: StepCompletionContext = {
      ...liveCompletionContext(),
      edgeDecisionCapacity: () => 10,
    }
    expect(isStepComplete(step(3), { ...ctx, edgeDecisionCount: () => 2 })).toBe(false)
    expect(isStepComplete(step(3), { ...ctx, edgeDecisionCount: () => 3 })).toBe(true)
    expect(isStepComplete(step(3), { ...ctx, edgeDecisionCount: () => 5 })).toBe(true)
  })

  it('caps the threshold at the run capacity — a fixed minDecisions can never strand a small run', () => {
    const ctx: StepCompletionContext = {
      ...liveCompletionContext(),
      edgeDecisionCapacity: () => 2, // e.g. a small architecture with only 2 migratable edges
    }
    // minDecisions=4 but capacity=2 — reaching the full capacity must count as complete.
    expect(isStepComplete(step(4), { ...ctx, edgeDecisionCount: () => 1 })).toBe(false)
    expect(isStepComplete(step(4), { ...ctx, edgeDecisionCount: () => 2 })).toBe(true)
  })

  it('a step with no minDecisions is never complete', () => {
    const s = { kind: 'architecture', label: 'x', to: '/simulation' } as TreeStep
    expect(isStepComplete(s, liveCompletionContext())).toBe(false)
  })
})

describe('architecture step — auto-run driver (completeStepGenuine)', () => {
  it('decides real edges up to the threshold via the real store action', () => {
    useSimulationStore.getState().setSize('small')
    const before = Object.keys(useSimulationStore.getState().edgeDecisions).length
    expect(before).toBe(0)

    const acted = completeStepGenuine(step(2))
    expect(acted).toBe(true)
    expect(Object.keys(useSimulationStore.getState().edgeDecisions).length).toBe(2)
  })

  it('never decides more edges than the run capacity, even if asked for more', () => {
    useSimulationStore.getState().setSize('small')
    const arch = ARCHITECTURES.small
    const capacity = arch.edges.filter(
      (e) => e.vulnerable && edgeState(arch, e) === 'migratable'
    ).length

    completeStepGenuine(step(999))
    expect(Object.keys(useSimulationStore.getState().edgeDecisions).length).toBe(capacity)
  })

  it('does not re-decide edges already decided by an earlier step in the same run', () => {
    useSimulationStore.getState().setSize('small')
    completeStepGenuine(step(2))
    const afterFirst = { ...useSimulationStore.getState().edgeDecisions }

    completeStepGenuine(step(3))
    const afterSecond = useSimulationStore.getState().edgeDecisions
    // Every decision from the first pass survives unchanged into the second.
    for (const [key, choice] of Object.entries(afterFirst)) {
      expect(afterSecond[key]).toBe(choice)
    }
    expect(Object.keys(afterSecond).length).toBe(3)
  })

  it('picks the jurisdiction-required choice, never a choice that fails compliance', () => {
    const requiredHybrid = Object.entries(JURISDICTION_RULES).find(
      ([, r]) => r.hybrid === 'required'
    )
    if (!requiredHybrid) return // no such jurisdiction in the current data — nothing to assert
    const [country] = requiredHybrid
    useSimulationStore.getState().setSize('small')
    useSimulationStore.getState().setCountry(country)
    completeStepGenuine(step(1))
    const decided = Object.values(useSimulationStore.getState().edgeDecisions)
    expect(decided.every((c) => c === 'hybrid')).toBe(true)
  })

  it('returns false and decides nothing when minDecisions is missing', () => {
    useSimulationStore.getState().setSize('small')
    const s = { kind: 'architecture', label: 'x', to: '/simulation' } as TreeStep
    const acted = completeStepGenuine(s)
    expect(acted).toBe(false)
    expect(Object.keys(useSimulationStore.getState().edgeDecisions).length).toBe(0)
  })
})
