// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getBeltTierLabel, PERSONA_BELT_TIER_LABELS } from './personaConfig'

describe('getBeltTierLabel', () => {
  it('returns null when no persona is selected', () => {
    expect(getBeltTierLabel(null, 'White Belt')).toBeNull()
  })

  it('returns null for personas without tier overrides', () => {
    expect(getBeltTierLabel('developer', 'White Belt')).toBeNull()
    expect(getBeltTierLabel('architect', 'Black Belt')).toBeNull()
    expect(getBeltTierLabel('researcher', 'Green Belt')).toBeNull()
    expect(getBeltTierLabel('ops', 'Brown Belt')).toBeNull()
  })

  it('maps executive belts to "Briefed → Aligned → Sponsoring → Board-Ready"', () => {
    expect(getBeltTierLabel('executive', 'White Belt')).toBe('Briefed')
    expect(getBeltTierLabel('executive', 'Yellow Belt')).toBe('Briefed')
    expect(getBeltTierLabel('executive', 'Orange Belt')).toBe('Aligned')
    expect(getBeltTierLabel('executive', 'Green Belt')).toBe('Aligned')
    expect(getBeltTierLabel('executive', 'Blue Belt')).toBe('Sponsoring')
    expect(getBeltTierLabel('executive', 'Brown Belt')).toBe('Sponsoring')
    expect(getBeltTierLabel('executive', 'Black Belt')).toBe('Board-Ready')
  })

  it('maps curious belts to "Aware → Informed → Confident → Quantum-Native"', () => {
    expect(getBeltTierLabel('curious', 'White Belt')).toBe('Aware')
    expect(getBeltTierLabel('curious', 'Yellow Belt')).toBe('Aware')
    expect(getBeltTierLabel('curious', 'Orange Belt')).toBe('Informed')
    expect(getBeltTierLabel('curious', 'Green Belt')).toBe('Informed')
    expect(getBeltTierLabel('curious', 'Blue Belt')).toBe('Confident')
    expect(getBeltTierLabel('curious', 'Brown Belt')).toBe('Confident')
    expect(getBeltTierLabel('curious', 'Black Belt')).toBe('Quantum-Native')
  })

  it('returns null for unknown belt names', () => {
    expect(getBeltTierLabel('executive', 'Pink Belt')).toBeNull()
    expect(getBeltTierLabel('curious', '')).toBeNull()
  })

  it('exposes only executive + curious tier overrides', () => {
    expect(Object.keys(PERSONA_BELT_TIER_LABELS).sort()).toEqual(['curious', 'executive'])
  })
})
