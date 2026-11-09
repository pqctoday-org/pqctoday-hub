// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ANSSI_TIMELINE, BSI_TIMELINE } from './regulatoryTimelines'

describe('ANSSI and BSI hybrid stance constants', () => {
  it('scopes the ANSSI mandate to its regulated perimeter', () => {
    expect(ANSSI_TIMELINE.hybridMandatoryInRegulatedScope).toBe(true)
    expect(ANSSI_TIMELINE.hybridRecommendedOutsideRegulatedScope).toBe(true)
    expect(ANSSI_TIMELINE).not.toHaveProperty('hybridMandatory')
  })

  it('keeps BSI as a recommendation', () => {
    expect(BSI_TIMELINE.hybridRecommended).toBe(true)
    expect(BSI_TIMELINE).not.toHaveProperty('hybridMandatory')
  })
})
