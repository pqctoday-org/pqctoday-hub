// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Interactive play must file the evidence a recurrence criterion and the world
 * check read. Before useLearnerEvidenceRecorder, a learner who saved a Board
 * Pitch in Q1 and again in Q2 still had recurrenceCount('board-deck') === 0,
 * because only the narrated auto-run ever wrote artifact evidence.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import {
  distinctRunQuarters,
  documentApplicability,
  runFingerprint,
  isLearnerWork,
} from '@/simulation/evidence'
import { isStepComplete, type StepCompletionContext } from '../embedContract'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  useLearnerEvidenceRecorder,
  changedDocuments,
  addedItems,
  newlyDecidedEdges,
} from './useLearnerEvidenceRecorder'

const doc = (over: Partial<ExecutiveDocument> = {}): ExecutiveDocument => ({
  id: 'board-pitch-1',
  moduleId: 'exec-module',
  type: 'board-deck',
  title: 'Board pitch',
  data: '# v1',
  createdAt: 1,
  ...over,
})

const nextQuarter = () => {
  const s = useSimulationStore.getState()
  const q = s.q === 4 ? 1 : s.q + 1
  const year = s.q === 4 ? s.year + 1 : s.year
  act(() => s.applyQuarter({ crqcShift: s.crqcShift, year, q, newEvents: [] }))
}

const ctx = (): StepCompletionContext => ({
  isModuleComplete: () => false,
  hasArtifact: () => false,
  isRefVisited: () => false,
  isWorkshopComplete: () => false,
  isCatalogStepDone: () => false,
  isScenarioComplete: () => false,
  edgeDecisionCount: () => 0,
  edgeDecisionCapacity: () => 0,
  recurrenceCount: (t) => distinctRunQuarters(useSimulationStore.getState().evidence, t).length,
  metricValue: () => null,
})

describe('useLearnerEvidenceRecorder', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
    useSimulationStore.getState().reset()
  })

  it('a document saved in two quarters completes a one-quarter recurrence step', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    const step = {
      kind: 'recurrence' as const,
      label: 'Report to the board again',
      to: '/business/tools/board-pitch',
      recurrenceOf: 'board-deck' as const,
      recurrenceQuarters: 1,
    }

    act(() => useModuleStore.getState().addExecutiveDocument(doc()))
    expect(isStepComplete(step, ctx())).toBe(false)

    nextQuarter()
    act(() => useModuleStore.getState().addExecutiveDocument(doc({ data: '# v2', createdAt: 2 })))

    const ev = useSimulationStore.getState().evidence
    expect(distinctRunQuarters(ev, 'board-deck')).toHaveLength(2)
    expect(ev.every((r) => isLearnerWork(r.origin))).toBe(true)
    expect(isStepComplete(step, ctx())).toBe(true)
  })

  it('saving twice in the SAME quarter counts as one period', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() => useModuleStore.getState().addExecutiveDocument(doc()))
    act(() => useModuleStore.getState().addExecutiveDocument(doc({ data: '# v2', createdAt: 2 })))
    expect(distinctRunQuarters(useSimulationStore.getState().evidence, 'board-deck')).toHaveLength(
      1
    )
  })

  it('ties the document to the run’s world, so a different scenario no longer matches', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() => useModuleStore.getState().addExecutiveDocument(doc()))
    const sim = useSimulationStore.getState()
    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    const here = runFingerprint(sim.size, sim.country, sim.sector)
    const elsewhere = runFingerprint(sim.size, sim.country === 'US' ? 'DE' : 'US', sim.sector)
    const check = (fingerprint: string) =>
      documentApplicability({ type: 'board-deck', docs, records: sim.evidence, fingerprint })
    expect(check(here).matchesWorld).toBe(true)
    expect(check(elsewhere).matchesWorld).toBe(false)
  })

  it('records nothing while the auto-run is driving', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => true))
    act(() => useModuleStore.getState().addExecutiveDocument(doc()))
    act(() => useSimulationStore.getState().markRefVisited('migrate'))
    expect(useSimulationStore.getState().evidence).toHaveLength(0)
  })

  it('skips the auto-run’s own documents and files the phone brief as a worked example', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() =>
      useModuleStore
        .getState()
        .addExecutiveDocument(doc({ id: 'sim-autorun-board-deck', moduleId: 'sim-autorun' }))
    )
    expect(useSimulationStore.getState().evidence).toHaveLength(0)
    act(() =>
      useModuleStore
        .getState()
        .addExecutiveDocument(
          doc({ id: 'sim-mobile-brief-board-deck', moduleId: 'sim-mobile-brief' })
        )
    )
    const [rec] = useSimulationStore.getState().evidence
    expect(rec?.origin).toBe('narrated-example')
  })

  it('records the learner’s visits and decisions', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() => useSimulationStore.getState().markRefVisited('migrate'))
    act(() => useSimulationStore.getState().markWorkshopVisited('ws-1'))
    act(() => useSimulationStore.getState().setEdgeDecision('a->b', 'hybrid'))
    act(() => useSimulationStore.getState().setEdgeDecision('c->d', 'pure'))
    const kinds = useSimulationStore
      .getState()
      .evidence.map((r) => `${r.kind}:${r.resourceId}:${r.origin}`)
    expect(kinds).toEqual([
      'reference:migrate:learner',
      'workshop:ws-1:learner',
      'architecture:edge-decisions:learner',
    ])
  })
})

describe('change detection', () => {
  it('a new or re-saved document is a change; an approval edit is not', () => {
    const a = doc()
    expect(changedDocuments([], [a])).toEqual([a])
    expect(changedDocuments([a], [{ ...a, data: '# v2' }])).toHaveLength(1)
    expect(changedDocuments([a], [{ ...a, approvalStatus: 'approved' }])).toHaveLength(0)
  })

  it('reports only newly added items and newly decided edges', () => {
    expect(addedItems(['a'], ['a', 'b'])).toEqual(['b'])
    expect(newlyDecidedEdges({ x: 'hybrid' }, { x: 'pure', y: 'hybrid' })).toEqual(['y'])
  })
})

describe('re-saving an unchanged result through a tool', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
    useSimulationStore.getState().reset()
  })

  it('still counts as operating the activity in the new quarter', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() => useModuleStore.getState().addExecutiveDocument(doc({ inputs: { a: 1 } })))
    nextQuarter()
    // The shared tool save path updates in place with the same data but fresh inputs.
    act(() =>
      useModuleStore
        .getState()
        .updateExecutiveDocument('board-pitch-1', { data: '# v1', inputs: { a: 1 } })
    )
    expect(distinctRunQuarters(useSimulationStore.getState().evidence, 'board-deck')).toHaveLength(
      2
    )
  })

  it('an approval change in a later quarter does not', () => {
    renderHook(() => useLearnerEvidenceRecorder(() => false))
    act(() => useModuleStore.getState().addExecutiveDocument(doc()))
    nextQuarter()
    act(() =>
      useModuleStore
        .getState()
        .updateExecutiveDocument('board-pitch-1', { approvalStatus: 'approved' })
    )
    expect(distinctRunQuarters(useSimulationStore.getState().evidence, 'board-deck')).toHaveLength(
      1
    )
  })
})
