// SPDX-License-Identifier: GPL-3.0-only
//
// Guards for the sector-key industry join (vendor-risk remediation,
// 2026-08-27). The defect this replaces: raw substring joins between the
// Assess vocabulary and the threats CSV matched ZERO threats for most
// industries ('Finance & Banking' vs 'Financial Services / Banking'),
// silently emptying the supply-chain matrix's Impact axis, and Cross-Industry
// threats matched nobody at all.
import { describe, it, expect } from 'vitest'
import { matchesIndustry, sectorKeysFor, isCrossIndustry } from './industryMatch'
import { threatsData } from './threatsData'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'

describe('industryMatch — sector-key join', () => {
  it('every Assess industry (except the Other baseline) matches at least one threat', () => {
    for (const industry of AVAILABLE_INDUSTRIES.filter((i) => i !== 'Other')) {
      const matched = threatsData.filter((t) => matchesIndustry(t.industry, industry))
      expect(matched.length, `industry "${industry}" matches no threats`).toBeGreaterThan(0)
    }
  })

  it("joins 'Finance & Banking' to 'Financial Services / Banking' via sector 52", () => {
    expect(matchesIndustry('Financial Services / Banking', 'Finance & Banking')).toBe(true)
    expect(sectorKeysFor('Finance & Banking')).toContain('52')
    expect(sectorKeysFor('Financial Services / Banking')).toContain('52')
  })

  it('does not join unrelated sectors', () => {
    expect(matchesIndustry('Healthcare / Pharmaceutical', 'Finance & Banking')).toBe(false)
  })

  it('Cross-Industry rows match every industry', () => {
    expect(isCrossIndustry('Cross-Industry')).toBe(true)
    expect(isCrossIndustry('Cross-Industry / HSM')).toBe(true)
    for (const industry of AVAILABLE_INDUSTRIES) {
      expect(matchesIndustry('Cross-Industry', industry)).toBe(true)
    }
  })

  it('falls back to the legacy substring test for unknown spellings', () => {
    expect(matchesIndustry('Underwater Basket Weaving Sector', 'Basket Weaving')).toBe(true)
    expect(matchesIndustry('Underwater Basket Weaving Sector', 'Quilting')).toBe(false)
  })

  it('returns null sector keys for empty or unknown tokens', () => {
    expect(sectorKeysFor('')).toBeNull()
    expect(sectorKeysFor('Not A Real Industry')).toBeNull()
  })
})
