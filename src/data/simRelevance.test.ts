// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { relevantToScenario } from './simRelevance'

describe('simRelevance', () => {
  it('hides industry verticals that do not match the scenario sector', () => {
    // healthcare scenario, executive seat
    expect(relevantToScenario('healthcare-pqc', 'healthcare', 'executive')).toBe(true)
    expect(relevantToScenario('emv-payment-pqc', 'healthcare', 'executive')).toBe(false)
    expect(relevantToScenario('5g-security', 'healthcare', 'executive')).toBe(false)
    expect(relevantToScenario('digital-assets', 'healthcare', 'executive')).toBe(false)
    // those verticals show for their own sector
    expect(relevantToScenario('5g-security', 'telecom', 'executive')).toBe(true)
    expect(relevantToScenario('emv-payment-pqc', 'financial', 'executive')).toBe(true)
  })

  it('shows persona-specific modules only for the matching seat', () => {
    expect(relevantToScenario('exec-quantum-impact', 'healthcare', 'executive')).toBe(true)
    expect(relevantToScenario('dev-quantum-impact', 'healthcare', 'executive')).toBe(false)
    expect(relevantToScenario('dev-quantum-impact', 'healthcare', 'developer')).toBe(true)
  })

  it('keeps cross-industry / cross-persona resources for any scenario', () => {
    expect(relevantToScenario('pqc-business-case', 'healthcare', 'executive')).toBe(true)
    expect(relevantToScenario('hsm-pqc', 'healthcare', 'executive')).toBe(true)
    expect(relevantToScenario('roi-calculator', 'retail', 'ops')).toBe(true)
  })
})
