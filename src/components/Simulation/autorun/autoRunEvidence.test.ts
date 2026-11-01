// SPDX-License-Identifier: AGPL-3.0-only
/**
 * W0.5 regression — a watched demonstration is not the learner's own work.
 *
 * `completeStepGenuine` wrote GLOBAL Learn completion (`useModuleStore
 * .updateModuleProgress(id, { status: 'completed' })`) and filed example
 * ExecutiveDocuments indistinguishable from documents the learner authored. An
 * isolated probe completed `pqc-grc` with zero recorded time, no completed
 * steps and empty quiz scores.
 *
 * The invariant: an automated walkthrough records DEMONSTRATION evidence inside
 * the run, and leaves the learner's shared curriculum and real documents alone.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { completeStepGenuine } from './simAutoRun'
import { SIM_TREES, flattenTree, isGatingStep } from '@/simulation'
import type { TreeStep } from '@/simulation'

const learnStep = (): TreeStep => {
  for (const tree of Object.values(SIM_TREES)) {
    if (!tree) continue
    const s = flattenTree(tree).find((x) => isGatingStep(x) && x.kind === 'learn' && x.moduleId)
    if (s) return s
  }
  throw new Error('no gating learn step in any tree')
}

const artifactStep = (): TreeStep => {
  for (const tree of Object.values(SIM_TREES)) {
    if (!tree) continue
    const s = flattenTree(tree).find(
      (x) => isGatingStep(x) && x.kind === 'activity' && x.artifactType
    )
    if (s) return s
  }
  throw new Error('no gating activity step in any tree')
}

describe('autorun evidence provenance (W0.5 regression)', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
    useSimulationStore.getState().reset()
  })

  it('does not mark a shared Learn module complete', () => {
    const step = learnStep()
    completeStepGenuine(step, 'financial')

    const status = useModuleStore.getState().modules[step.moduleId!]?.status
    expect(status).not.toBe('completed')
  })

  it('records the demonstration inside the run instead', () => {
    const step = learnStep()
    completeStepGenuine(step, 'financial')

    const evidence = useSimulationStore.getState().evidence ?? []
    const rec = evidence.find((e) => e.resourceId === step.moduleId)
    expect(rec, 'no run-scoped evidence record was written').toBeDefined()
    expect(rec!.origin).toBe('narrated-example')
  })

  it('labels a generated example document as a demonstration', () => {
    const step = artifactStep()
    completeStepGenuine(step, 'financial')

    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    const doc = docs.find((d) => d.type === step.artifactType)
    if (doc) {
      // If an example document is filed at all, it must carry visible provenance.
      expect(doc.title + ' ' + (doc.moduleId ?? '')).toMatch(/demo|example|sim-autorun/i)
    }
  })

  it('revisits an applicable document without regenerating it', () => {
    const step = artifactStep()
    completeStepGenuine(step, 'financial', { phase: 'p0' })
    const before = useModuleStore.getState().artifacts.executiveDocuments
    const save = vi.spyOn(useModuleStore.getState(), 'addExecutiveDocument')
    try {
      expect(
        completeStepGenuine(step, 'financial', { phase: 'foundations', reuseArtifact: true })
      ).toBe(true)
      expect(save).not.toHaveBeenCalled()
      expect(useModuleStore.getState().artifacts.executiveDocuments).toEqual(before)
    } finally {
      save.mockRestore()
    }
  })

  it('never overwrites a document the learner authored', () => {
    const step = artifactStep()
    useModuleStore.getState().addExecutiveDocument({
      id: 'my-own-doc',
      moduleId: 'hand-authored',
      type: step.artifactType!,
      title: 'My real charter',
      data: 'authored by the learner',
      createdAt: Date.now(),
    })

    completeStepGenuine(step, 'financial')

    const mine = (useModuleStore.getState().artifacts.executiveDocuments ?? []).find(
      (d) => d.id === 'my-own-doc'
    )
    expect(mine).toBeDefined()
    expect(mine!.data).toBe('authored by the learner')
  })
})
