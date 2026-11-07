// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { useModuleStore } from '@/store/useModuleStore'
import { resetRunLearningWork } from './resetRunLearningWork'
import type { ExecutiveDocument } from '@/services/storage/types'

const doc = (id: string, moduleId: string, simulationRunId?: string): ExecutiveDocument => ({
  id,
  moduleId,
  simulationRunId,
  type: 'risk-register',
  title: id,
  data: 'Sample',
  createdAt: 1,
})

beforeEach(() => {
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

describe('Simulation reset ownership', () => {
  it('removes only explicitly run-owned examples and preserves matching-type learner work', () => {
    useModuleStore.getState().updateModuleProgress('pqc-101', { status: 'completed' })
    const modules = useModuleStore.getState().modules
    const docs = [
      doc('own', 'sim-autorun', 'run-7'),
      doc('other-run', 'sim-autorun', 'run-8'),
      doc('legacy', 'sim-autorun'),
      doc('learner', 'risk-management'),
    ]
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: docs } }))
    resetRunLearningWork(7)
    expect(useModuleStore.getState().artifacts.executiveDocuments?.map((d) => d.id)).toEqual([
      'other-run',
      'legacy',
      'learner',
    ])
    expect(useModuleStore.getState().modules).toEqual(modules)
    resetRunLearningWork(7)
    expect(useModuleStore.getState().artifacts.executiveDocuments).toHaveLength(3)
  })
})
