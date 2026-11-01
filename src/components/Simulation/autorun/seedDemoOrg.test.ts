// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { seedDemoOrg } from './seedDemoOrg'
import { loadSampleOrganisation, SAMPLE_ORG_KEY } from '../sampleOrganisation'

beforeEach(() => {
  useAssessmentFormStore.getState().reset()
  useAssessmentResultStore.getState().reset()
})

describe('simulation sample assessment', () => {
  it('keeps the sample marker and questionnaire unchanged across repeated starts', () => {
    const before = useAssessmentFormStore.getState()
    loadSampleOrganisation()
    const sample = useAssessmentResultStore.getState().lastResult
    seedDemoOrg()
    seedDemoOrg()
    expect(useAssessmentResultStore.getState().sourceInputKey).toBe(SAMPLE_ORG_KEY)
    expect(useAssessmentResultStore.getState().lastResult).toBe(sample)
    expect(useAssessmentFormStore.getState()).toEqual(before)
  })

  it('retains unfinished answers when a direct play link needs a sample', () => {
    useAssessmentFormStore.getState().setIndustry('Healthcare')
    useAssessmentFormStore.getState().toggleCrypto('RSA-2048')
    const before = useAssessmentFormStore.getState()
    seedDemoOrg()
    expect(useAssessmentFormStore.getState()).toEqual(before)
    expect(useAssessmentResultStore.getState().sourceInputKey).toBe(SAMPLE_ORG_KEY)
  })

  it('preserves a learner-entered assessment instead of replacing it with the sample', () => {
    loadSampleOrganisation()
    useAssessmentResultStore.setState({ sourceInputKey: 'learner-input' })
    const before = useAssessmentResultStore.getState()
    seedDemoOrg()
    expect(useAssessmentResultStore.getState()).toEqual(before)
  })
})
