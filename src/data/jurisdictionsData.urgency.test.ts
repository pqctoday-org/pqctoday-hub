// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ALL_JURISDICTION_ENTRIES } from './jurisdictionsData'
import { COUNTRY_REGULATORY_URGENCY } from '../hooks/assessmentData'

describe('regulatory urgency (jurisdictions regulatory_urgency column)', () => {
  it('scores 28 countries between 0 and 12 and names the instruments behind each score', () => {
    const scored = ALL_JURISDICTION_ENTRIES.filter((j) => j.regulatoryUrgency !== undefined)
    expect(scored).toHaveLength(28)
    for (const j of scored) {
      expect(j.regulatoryUrgency, j.name).toBeGreaterThanOrEqual(0)
      expect(j.regulatoryUrgency, j.name).toBeLessThanOrEqual(12)
      expect(j.regulatoryUrgencyBasis, j.name).toBeTruthy()
    }
  })

  it('feeds the assessment by country name', () => {
    expect(COUNTRY_REGULATORY_URGENCY['United States']).toBe(12)
    expect(COUNTRY_REGULATORY_URGENCY['Czech Republic']).toBe(6)
    expect(COUNTRY_REGULATORY_URGENCY['Mexico']).toBeUndefined()
  })
})
