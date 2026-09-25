// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatsData } from './threatsData'
import { INDUSTRY_TO_THREATS_MAP } from './personaConfig'
import { ASSESS_TO_THREATS_INDUSTRY } from '@/components/Report/ReportThreatsAppendix'
import {
  canonicalThreatIndustry,
  THREAT_INDUSTRY_ALIASES,
  threatIndustrySlug,
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

  it('maps every old industry label to the Threats page label (ruling R3)', () => {
    for (const old of [
      'Critical Infrastructure',
      'Energy / Critical Infrastructure',
      'Critical Infrastructure / Energy',
    ]) {
      expect(canonicalThreatIndustry(old)).toBe('Critical Infrastructure / OT')
    }
    // HSM stays its own sector (R3's HSM move reverted on user review).
    expect(canonicalThreatIndustry('Hardware Security Modules')).toBe('Hardware Security Modules')
    expect(canonicalThreatIndustry('Aerospace / Aviation')).toBe('Aerospace / Aviation / Space')
    expect(canonicalThreatIndustry('Insurance')).toBe('Insurance')
  })

  it('slugs a label the way the page’s section anchors do', () => {
    expect(threatIndustrySlug('Critical Infrastructure / OT')).toBe('critical-infrastructure-ot')
    expect(threatIndustrySlug('Aerospace / Aviation / Space')).toBe('aerospace-aviation-space')
    expect(threatIndustrySlug('Internet of Things (IoT)')).toBe('internet-of-things-iot')
  })
})

describe('the Threats page industry vocabulary against the live CSV', () => {
  const live = new Set(threatsData.map((t) => t.industry))

  it('no live row carries an old (aliased) label', () => {
    for (const old of Object.keys(THREAT_INDUSTRY_ALIASES)) expect(live.has(old)).toBe(false)
  })

  it('every alias target, persona map and report map value is a live Threats label', () => {
    const targets = [
      ...Object.values(THREAT_INDUSTRY_ALIASES),
      ...Object.values(INDUSTRY_TO_THREATS_MAP).flat(),
      ...Object.values(ASSESS_TO_THREATS_INDUSTRY).flat(),
    ]
    for (const label of targets) expect(live, `"${label}"`).toContain(label)
  })

  it('HSM-001 and HSM-002 sit under their own Hardware Security Modules sector', () => {
    for (const id of ['HSM-001', 'HSM-002']) {
      expect(threatsData.find((t) => t.threatId === id)?.industry).toBe('Hardware Security Modules')
    }
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
