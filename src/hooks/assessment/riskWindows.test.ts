// SPDX-License-Identifier: GPL-3.0-only
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

  it('effective is always the earlier of CRQC and the mandate horizon', () => {
    for (const country of Object.keys(COUNTRY_PLANNING_HORIZON)) {
      const h = getThreatHorizon(country)
      const mandate = COUNTRY_PLANNING_HORIZON[country]
      expect(h.effective).toBe(Math.min(h.crqc, mandate))
      // regulatory is surfaced only when it binds strictly earlier than CRQC
      if (mandate < h.crqc) {
        expect(h.regulatory).toBe(mandate)
      } else {
        expect(h.regulatory).toBeUndefined()
      }
    }
  })

  it('never labels a mandate at/after the CRQC estimate as the regulatory driver', () => {
    const h = getThreatHorizon(undefined)
    expect(h.regulatory).toBeUndefined()
    expect(h.effective).toBe(h.crqc)
  })
})
