// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Finishing the wizard computes this run's result at once, and each completion is its own
 * point in the progress history (an edit adds one; reopening or regenerating unchanged does not).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAssessmentFormStore } from './useAssessmentFormStore'
import { useAssessmentResultStore } from './useAssessmentResultStore'
import { useAssessmentStore } from './useAssessmentStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { twoTrackFromAssess } from '@/simulation/assessBridge'

const form = () => useAssessmentFormStore.getState()

function answerRequired() {
  useAssessmentFormStore.setState({
    industry: 'Finance & Banking',
    country: 'United States',
    dataSensitivity: ['high'],
    migrationStatus: 'planning',
  })
}

beforeEach(() => {
  localStorage.clear()
  useAssessmentStore.getState().reset()
  useAssessmentResultStore.setState({ assessmentHistory: [], previousRiskScore: null })
})

describe('completing the wizard computes this run (confirmation screen, trend)', () => {
  function completeWith(sensitivity: string[]) {
    answerRequired()
    useAssessmentFormStore.setState({
      dataSensitivity: sensitivity,
      assessmentMode: 'comprehensive',
      cryptoAgility: 'hardcoded',
      timelinePressure: 'within-2-3y',
    })
    form().toggleCryptoCategory('Key Exchange')
    useAssessmentStore.getState().markComplete()
  }

  it('first run: lastResult exists as soon as the wizard is complete', () => {
    expect(useAssessmentResultStore.getState().lastResult).toBeNull()
    completeWith(['high'])
    const state = useAssessmentResultStore.getState()
    expect(form().assessmentStatus).toBe('complete')
    expect(state.lastResult?.riskScore).toBe(computeAssessment(form().getInput()!).riskScore)
    // the confirmation screen derives its two-track block from this result
    expect(twoTrackFromAssess(state.lastResult!)).toBeTruthy()
    expect(state.sourceInputKey).toBe(JSON.stringify(form().getInput()))
  })

  it('repeat run: lastResult is the new run, previousRiskScore the old one', () => {
    completeWith(['low'])
    const first = useAssessmentResultStore.getState().lastResult!.riskScore
    useAssessmentFormStore.setState({ dataSensitivity: ['critical'] })
    useAssessmentStore.getState().markComplete()
    const state = useAssessmentResultStore.getState()
    expect(state.lastResult!.riskScore).not.toBe(first)
    expect(state.previousRiskScore).toBe(first)
  })

  it('an answer edit records a new history point; reopening or recompleting unchanged does not', () => {
    vi.useFakeTimers()
    try {
      const push = (res: ReturnType<typeof computeAssessment>) => {
        const s = useAssessmentResultStore.getState()
        s.pushSnapshot({
          completedAt: s.completedAt!,
          riskScore: res.riskScore,
          categoryScores: res.categoryScores!,
          riskLevel: res.riskLevel,
          industry: 'Finance & Banking',
          preBoostScore: res.preBoostScore,
        })
      }
      const history = () => useAssessmentResultStore.getState().assessmentHistory
      vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'))
      completeWith(['low'])
      push(useAssessmentResultStore.getState().lastResult!)
      expect(history()).toHaveLength(1)

      // the report is opened again: same completion, nothing added
      push(useAssessmentResultStore.getState().lastResult!)
      expect(history()).toHaveLength(1)

      // generated again a day later with nothing changed: a new completion time, the same point
      vi.setSystemTime(new Date('2026-05-02T10:00:00.000Z'))
      useAssessmentStore.getState().markComplete()
      push(useAssessmentResultStore.getState().lastResult!)
      expect(history()).toHaveLength(1)

      // a genuine edit: a second point
      vi.setSystemTime(new Date('2026-05-03T10:00:00.000Z'))
      useAssessmentFormStore.setState({ dataSensitivity: ['critical'] })
      useAssessmentStore.getState().markComplete()
      push(useAssessmentResultStore.getState().lastResult!)
      expect(history()).toHaveLength(2)
      expect(history()[1].riskScore).not.toBe(history()[0].riskScore)
    } finally {
      vi.useRealTimers()
    }
  })
})
