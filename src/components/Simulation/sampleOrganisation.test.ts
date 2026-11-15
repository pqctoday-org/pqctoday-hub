// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import {
  loadSampleOrganisation,
  unloadSampleOrganisation,
  SAMPLE_ORG_KEY,
} from './sampleOrganisation'

describe('sample organisation', () => {
  beforeEach(() => useAssessmentResultStore.getState().reset())

  it('can be put away again, so the sample does not stay on as the assessment', () => {
    loadSampleOrganisation()
    expect(useAssessmentResultStore.getState().sourceInputKey).toBe(SAMPLE_ORG_KEY)
    expect(unloadSampleOrganisation()).toBe(true)
    const s = useAssessmentResultStore.getState()
    expect(s.lastResult).toBeNull()
    expect(s.sourceInputKey).toBeNull()
  })

  it('never clears an assessment the learner ran', () => {
    loadSampleOrganisation()
    const sample = useAssessmentResultStore.getState().lastResult!
    useAssessmentResultStore.setState({ sourceInputKey: '{"industry":"Retail"}' })
    expect(unloadSampleOrganisation()).toBe(false)
    expect(useAssessmentResultStore.getState().lastResult).toBe(sample)
  })
})
