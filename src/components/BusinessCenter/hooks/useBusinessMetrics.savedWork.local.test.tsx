// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useBusinessMetrics } from './useBusinessMetrics'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'

function resetSampleWork() {
  useAssessmentStore.getState().reset()
  useAssessmentStore.setState({ industry: '', country: '', complianceRequirements: [] })
  useModuleStore.setState(useModuleStore.getInitialState(), true)
  useComplianceSelectionStore.setState(useComplianceSelectionStore.getInitialState(), true)
  useMigrateSelectionStore.setState(useMigrateSelectionStore.getInitialState(), true)
  useMigrationWorkflowStore.setState(useMigrationWorkflowStore.getInitialState(), true)
}

beforeEach(resetSampleWork)
afterEach(() => {
  cleanup()
  resetSampleWork()
})

describe('Command Center saved work without an assessment', () => {
  it('keeps welcome guidance for a genuinely empty workspace', () => {
    const { result } = renderHook(() => useBusinessMetrics())
    expect(result.current.assessmentStatus).toBe('not-started')
    expect(result.current.isFullyEmpty).toBe(true)
  })

  it('does not hide a standalone saved sample document behind welcome guidance', () => {
    const sample = {
      id: 'standalone-sample',
      moduleId: 'pqc-governance',
      type: 'raci-matrix' as const,
      title: 'Sample ownership plan',
      data: 'Fictional saved work',
      createdAt: Date.UTC(2026, 0, 1),
    }
    useModuleStore.setState((state) => ({
      artifacts: { ...state.artifacts, executiveDocuments: [sample] },
    }))
    const { result } = renderHook(() => useBusinessMetrics())
    expect(result.current.assessmentStatus).toBe('not-started')
    expect(result.current.isFullyEmpty).toBe(false)
    expect(Object.values(result.current.artifactsByPillar).flat()).toContainEqual(sample)
    expect(useModuleStore.getState().artifacts.executiveDocuments).toEqual([sample])
  })

  it.each(['in-progress', 'completed'] as const)(
    'shows separately saved GRC learning when its status is %s',
    (status) => {
      useModuleStore.setState((state) => ({
        modules: {
          ...state.modules,
          'data-asset-sensitivity': {
            status,
            completedSteps: ['sample-step'],
            lastVisited: 1,
            timeSpent: 1,
            quizScores: {},
          },
        },
      }))
      const { result } = renderHook(() => useBusinessMetrics())
      expect(result.current.assessmentStatus).toBe('not-started')
      expect(result.current.isFullyEmpty).toBe(false)
      expect(result.current.grcModuleProgress).toContainEqual(
        expect.objectContaining({ id: 'data-asset-sensitivity', status })
      )
      expect(useModuleStore.getState().modules['data-asset-sensitivity'].status).toBe(status)
    }
  )
})
