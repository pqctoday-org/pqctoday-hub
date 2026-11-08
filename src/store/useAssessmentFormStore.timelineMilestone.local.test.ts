// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { useAssessmentFormStore } from './useAssessmentFormStore'
import { UnifiedStorageService } from '@/services/storage/UnifiedStorageService'
import { computeAssessment } from '@/hooks/assessment/orchestrator'

const pair = { id: 'Sample migration deadline', authority: 'Sample Authority', year: 2035 }
const form = () => useAssessmentFormStore.getState()

function answerRequiredQuestions() {
  useAssessmentFormStore.setState({
    industry: 'Finance & Banking',
    country: 'Sampleland',
    dataSensitivity: ['high'],
    migrationStatus: 'planning',
  })
}

beforeEach(() => {
  localStorage.clear()
  form().reset()
})

describe('distant external milestone in the assessment store', () => {
  it('keeps the summary value and also carries the pair for a distant external deadline', () => {
    answerRequiredQuestions()
    form().setTimelinePressure('internal-deadline', pair)
    expect(form().timelinePressure).toBe('internal-deadline')
    expect(form().timelineMilestone).toEqual(pair)
    const input = form().getInput()
    expect(input?.timelinePressure).toBe('internal-deadline')
    expect(input?.timelineMilestone).toEqual(pair)
  })

  it('leaves the score unchanged: scoring reads only the summary value', () => {
    answerRequiredQuestions()
    form().setTimelinePressure('internal-deadline')
    const withoutPair = computeAssessment(form().getInput()!)
    form().setTimelinePressure('internal-deadline', pair)
    const withPair = computeAssessment(form().getInput()!)
    expect(withPair.riskScore).toBe(withoutPair.riskScore)
    expect(withPair.assessmentProfile?.timelinePressure).toBe('internal-deadline')
    expect(withPair.assessmentProfile?.timelineMilestone).toEqual(pair)
    expect(withoutPair.assessmentProfile?.timelineMilestone).toBeUndefined()
  })

  it('has no pair for own target, no deadline, an unknown answer, or a call that passes none', () => {
    answerRequiredQuestions()
    form().setTimelinePressure('internal-deadline', pair)
    form().setTimelinePressure('no-deadline', pair)
    expect(form().timelineMilestone).toBeNull()
    form().setTimelinePressure('internal-deadline', pair)
    form().setTimelinePressure('internal-deadline')
    expect(form().timelineMilestone).toBeNull()
    form().setTimelinePressure('within-2-3y', pair)
    form().setTimelineUnknown(true)
    expect(form().timelineMilestone).toBeNull()
    expect(form().getInput()?.timelineMilestone).toBeUndefined()
  })

  it('drops a pair of the wrong shape instead of storing it', () => {
    form().setTimelinePressure('internal-deadline', { id: 5, authority: [] } as never)
    expect(form().timelinePressure).toBe('internal-deadline')
    expect(form().timelineMilestone).toBeNull()
  })

  it('forgets the pair when the country changes, because it came from that country’s list', () => {
    answerRequiredQuestions()
    form().setTimelinePressure('internal-deadline', pair)
    form().setCountry('Sampleland')
    expect(form().timelineMilestone).toEqual(pair)
    form().setCountry('Otherland')
    expect(form().timelineMilestone).toBeNull()
  })

  it('is cleared by reset and by switching to the quick track', () => {
    form().setAssessmentMode('comprehensive')
    form().setTimelinePressure('internal-deadline', pair)
    form().setAssessmentMode('quick')
    expect(form().timelineMilestone).toBeNull()
    form().setTimelinePressure('internal-deadline', pair)
    form().reset()
    expect(form().timelineMilestone).toBeNull()
  })
})

describe('saved state', () => {
  it('writes the pair to storage and reads it back', async () => {
    form().setTimelinePressure('internal-deadline', pair)
    const raw = localStorage.getItem('pqc-assessment-form')!
    const saved = JSON.parse(raw)
    expect(saved.state.timelineMilestone).toEqual(pair)
    expect(saved.version).toBe(3)
    useAssessmentFormStore.setState({ timelineMilestone: null })
    localStorage.setItem('pqc-assessment-form', raw)
    await useAssessmentFormStore.persist.rehydrate()
    expect(form().timelineMilestone).toEqual(pair)
  })

  it('keeps an old saved state valid: no pair, everything else as it was', async () => {
    localStorage.setItem(
      'pqc-assessment-form',
      JSON.stringify({
        version: 2,
        state: {
          industry: 'Finance & Banking',
          currentStep: 3,
          timelinePressure: 'internal-deadline',
          timelineUnknown: false,
        },
      })
    )
    await useAssessmentFormStore.persist.rehydrate()
    expect(form().industry).toBe('Finance & Banking')
    expect(form().currentStep).toBe(3)
    expect(form().timelinePressure).toBe('internal-deadline')
    expect(form().timelineMilestone).toBeNull()
  })

  it('migrates a saved pair of the wrong shape to none', async () => {
    const migrate = useAssessmentFormStore.persist.getOptions().migrate!
    const old = migrate({ industry: 'x', timelineMilestone: { id: 1 } }, 2) as Record<
      string,
      unknown
    >
    expect(old.timelineMilestone).toBeNull()
    const good = migrate({ industry: 'x', timelineMilestone: pair }, 2) as Record<string, unknown>
    expect(good.timelineMilestone).toEqual(pair)
  })

  it('round-trips through a backup snapshot and accepts an older snapshot without the field', () => {
    answerRequiredQuestions()
    form().setTimelinePressure('internal-deadline', pair)
    const snapshot = UnifiedStorageService.exportSnapshot()
    expect(snapshot.stores.assessment?.timelineMilestone).toEqual(pair)

    form().reset()
    UnifiedStorageService.restoreSnapshot(snapshot)
    expect(form().timelineMilestone).toEqual(pair)
    expect(form().timelinePressure).toBe('internal-deadline')

    const older = JSON.parse(JSON.stringify(snapshot))
    delete older.stores.assessment.timelineMilestone
    form().reset()
    expect(() => UnifiedStorageService.restoreSnapshot(older)).not.toThrow()
    expect(form().timelinePressure).toBe('internal-deadline')
    expect(form().timelineMilestone).toBeNull()

    const tampered = JSON.parse(JSON.stringify(snapshot))
    tampered.stores.assessment.timelineMilestone = { id: ['x'], authority: 3 }
    expect(() => UnifiedStorageService.restoreSnapshot(tampered)).not.toThrow()
    expect(form().timelineMilestone).toBeNull()
  })
})
