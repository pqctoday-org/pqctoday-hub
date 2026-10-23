// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ANCHOR_SCENARIO, inSentence } from './anchorScenario'

describe('inSentence', () => {
  it('keeps an acronym that opens the label', () => {
    expect(inSentence('US federal agency')).toBe('US federal agency')
    expect(inSentence('EU qualified trust service provider')).toBe(
      'EU qualified trust service provider'
    )
    expect(inSentence('ML-KEM first')).toBe('ML-KEM first')
  })

  it('lower-cases only the first letter of an ordinary opening word', () => {
    expect(inSentence('Payment processor')).toBe('payment processor')
    expect(inSentence('Smart-card / secure-element manufacturer')).toBe(
      'smart-card / secure-element manufacturer'
    )
    expect(inSentence('Adding ML-KEM and ML-DSA, with optional hybrid')).toBe(
      'adding ML-KEM and ML-DSA, with optional hybrid'
    )
  })

  it('never turns an acronym inside the anchor strings into lower case', () => {
    expect(inSentence(ANCHOR_SCENARIO.description)).toContain('(HSM)')
    expect(inSentence(ANCHOR_SCENARIO.description)).toContain('cloud HSM service')
    expect(ANCHOR_SCENARIO.customers.map((c) => inSentence(c.label)).join(', ')).toBe(
      'US federal agency, EU qualified trust service provider, smart-card / secure-element manufacturer, payment processor'
    )
  })
})
