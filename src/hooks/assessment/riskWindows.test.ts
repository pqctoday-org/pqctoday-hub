// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getThreatHorizon } from './riskWindows'
import { ESTIMATED_QUANTUM_THREAT_YEAR, COUNTRY_PLANNING_HORIZON } from '../assessmentData'

describe('getThreatHorizon — separates CRQC estimate from regulatory mandate', () => {
  it('unknown country: no regulatory driver, effective = CRQC estimate', () => {
    const h = getThreatHorizon('Atlantis')
    expect(h.crqc).toBe(ESTIMATED_QUANTUM_THREAT_YEAR)
    expect(h.regulatory).toBeUndefined()
    expect(h.effective).toBe(ESTIMATED_QUANTUM_THREAT_YEAR)
  })

  it('keeps the CRQC clock independent and surfaces jurisdiction milestones separately', () => {
    for (const country of Object.keys(COUNTRY_PLANNING_HORIZON)) {
      const h = getThreatHorizon(country)
      const mandate = COUNTRY_PLANNING_HORIZON[country]
      expect(h.effective).toBe(h.crqc)
      expect(h.regulatory).toBe(mandate)
    }
  })

  it('has no jurisdiction milestone when no country horizon is selected', () => {
    const h = getThreatHorizon(undefined)
    expect(h.regulatory).toBeUndefined()
    expect(h.effective).toBe(h.crqc)
  })

  it('never relabels an earlier jurisdiction milestone as CRQC arrival', () => {
    const h = getThreatHorizon('France')
    expect(h.regulatory).toBe(COUNTRY_PLANNING_HORIZON.France)
    expect(h.effective).toBe(ESTIMATED_QUANTUM_THREAT_YEAR)
    expect(h.crqc).toBe(ESTIMATED_QUANTUM_THREAT_YEAR)
  })
})
