// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  getBeltTierLabel,
  PERSONA_BELT_TIER_LABELS,
  getComplianceTabOrder,
  getComplianceOverflowTabs,
  PERSONA_COMPLIANCE_TABS,
} from './personaConfig'

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

describe('getComplianceTabOrder / getComplianceOverflowTabs', () => {
  it('returns the default 3-tab primary set when no persona is selected', () => {
    expect(getComplianceTabOrder(null)).toEqual(['foryou', 'landscape', 'records'])
  })

  it('puts foryou first for every persona', () => {
    for (const tabs of Object.values(PERSONA_COMPLIANCE_TABS)) {
      expect(tabs[0]).toBe('foryou')
    }
  })

  it('caps non-researcher personas at 3 primary tabs', () => {
    expect(getComplianceTabOrder('executive')).toHaveLength(3)
    expect(getComplianceTabOrder('architect')).toHaveLength(3)
    expect(getComplianceTabOrder('developer')).toHaveLength(3)
    expect(getComplianceTabOrder('ops')).toHaveLength(3)
    expect(getComplianceTabOrder('curious')).toHaveLength(3)
  })

  it('keeps all 6 tabs primary for researcher', () => {
    expect(getComplianceTabOrder('researcher')).toHaveLength(6)
    expect(getComplianceOverflowTabs('researcher')).toEqual([])
  })

  it('overflow + primary cover every tab exactly once', () => {
    for (const persona of ['executive', 'architect', 'developer', 'ops', 'curious'] as const) {
      const primary = getComplianceTabOrder(persona)
      const overflow = getComplianceOverflowTabs(persona)
      const all = [...primary, ...overflow].sort()
      expect(all).toEqual([
        'certification',
        'cswp39',
        'foryou',
        'landscape',
        'records',
        'standards',
      ])
    }
  })
})
