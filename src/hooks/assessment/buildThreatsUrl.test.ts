// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildThreatsUrl } from './generators'
import { INDUSTRY_TO_THREATS_MAP } from '@/data/personaConfig'

const industryParam = (url: string) => new URL(url, 'https://x.test').searchParams.get('industry')

describe('buildThreatsUrl', () => {
  it('links to the unfiltered page without an industry', () => {
    expect(buildThreatsUrl()).toBe('/threats')
    expect(buildThreatsUrl('')).toBe('/threats')
  })

  it('maps an assessment industry to its Threats-page labels', () => {
    expect(industryParam(buildThreatsUrl('Healthcare'))).toBe('Healthcare / Pharmaceutical')
    expect(industryParam(buildThreatsUrl('Aerospace'))).toBe('Aerospace / Aviation / Space')
    expect(industryParam(buildThreatsUrl('Energy & Utilities'))).toBe(
      'Critical Infrastructure / OT,Water / Wastewater'
    )
  })

  it('maps every assessment industry through INDUSTRY_TO_THREATS_MAP', () => {
    for (const [industry, labels] of Object.entries(INDUSTRY_TO_THREATS_MAP)) {
      const url = buildThreatsUrl(industry)
      if (labels.length === 0) expect(url, industry).toBe('/threats')
      else expect(industryParam(url), industry).toBe(labels.join(','))
    }
  })

  it('passes an existing Threats label through unchanged', () => {
    expect(industryParam(buildThreatsUrl('Payment Card Industry'))).toBe('Payment Card Industry')
  })
})
