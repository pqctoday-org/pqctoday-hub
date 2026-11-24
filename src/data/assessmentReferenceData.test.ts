// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { INDUSTRY_TO_THREATS_MAP } from './assessmentReferenceData'
import { threatsData } from './threatsData'

describe('site sector to threat industries (pqcassessment industry rows)', () => {
  const sectors = Object.keys(INDUSTRY_TO_THREATS_MAP)

  it('lists the site sectors in the order the Threats page names them', () => {
    expect(sectors).toEqual([
      'Finance & Banking',
      'Government & Defense',
      'Healthcare',
      'Telecommunications',
      'Technology',
      'Energy & Utilities',
      'Automotive',
      'Aerospace',
      'Retail & E-Commerce',
      'Education',
      'Manufacturing',
      'Cross-cutting & Other',
      'Other',
    ])
  })

  it('gives every sector but Other at least one threat industry, and never a blank label', () => {
    for (const sector of sectors) {
      const labels = INDUSTRY_TO_THREATS_MAP[sector]
      if (sector === 'Other') expect(labels).toEqual([])
      else expect(labels.length, sector).toBeGreaterThan(0)
      for (const label of labels) expect(label.trim(), sector).not.toBe('')
    }
  })

  it('keeps the first label of a sector as its own Threats label', () => {
    expect(INDUSTRY_TO_THREATS_MAP['Finance & Banking'][0]).toBe('Finance & Banking')
    expect(INDUSTRY_TO_THREATS_MAP['Government & Defense'][0]).toBe('Government & Defense')
  })

  it('names Threats industries that exist, apart from labels still awaiting a published threat', () => {
    const published = new Set(threatsData.map((t) => t.industry))
    const awaiting = new Set(
      sectors.flatMap((s) => INDUSTRY_TO_THREATS_MAP[s]).filter((label) => !published.has(label))
    )
    // The Threats page already tolerates these (it filters a sector's labels to the published ones).
    expect([...awaiting].sort()).toEqual([
      'Aerospace / Aviation / Space',
      'Rail / Transit',
      'Retail & E-Commerce',
      'Supply Chain / Logistics',
      'Water / Wastewater',
    ])
  })
})
