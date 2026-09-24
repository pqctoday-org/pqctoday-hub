// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  canonicalThreatIndustry,
  criticalityLevelsPresent,
  criticalityRank,
  isPublishedThreatStatus,
  isRetiredThreatStatus,
} from './threatRowRules'

describe('threat row status rules', () => {
  it('publishes active (and legacy blank-status) rows', () => {
    expect(isPublishedThreatStatus('active')).toBe(true)
    expect(isPublishedThreatStatus('')).toBe(true)
    expect(isPublishedThreatStatus(undefined)).toBe(true)
  })

  it('hides draft, deprecated and obsolete rows, whatever the case or padding', () => {
    for (const s of ['draft', ' Draft ', 'deprecated', 'DEPRECATED', 'obsolete']) {
      expect(isPublishedThreatStatus(s)).toBe(false)
    }
  })

  it('treats only deprecated/obsolete as retired — a draft was never published', () => {
    expect(isRetiredThreatStatus('deprecated')).toBe(true)
    expect(isRetiredThreatStatus('obsolete')).toBe(true)
    expect(isRetiredThreatStatus('draft')).toBe(false)
    expect(isRetiredThreatStatus('active')).toBe(false)
  })

  it('merges the two critical-infrastructure wordings into the page label', () => {
    expect(canonicalThreatIndustry('Critical Infrastructure')).toBe(
      'Critical Infrastructure / Energy'
    )
    expect(canonicalThreatIndustry('Energy / Critical Infrastructure')).toBe(
      'Critical Infrastructure / Energy'
    )
    expect(canonicalThreatIndustry('Insurance')).toBe('Insurance')
  })
})

describe('criticality rules', () => {
  it('ranks Unrated below Low', () => {
    expect(criticalityRank('Unrated')).toBeLessThan(criticalityRank('Low'))
    expect(criticalityRank('Critical')).toBeGreaterThan(criticalityRank('High'))
  })

  it('lists only the levels present, in severity order', () => {
    expect(
      criticalityLevelsPresent([
        { criticality: 'Low' },
        { criticality: 'Unrated' },
        { criticality: 'Critical' },
      ])
    ).toEqual(['Critical', 'Low', 'Unrated'])
  })
})
