// SPDX-License-Identifier: GPL-3.0-only
/**
 * The guidance block is also a set of filter shortcuts. A category string that
 * no longer exists in the data would render a confident recommendation that
 * lands the reader on an empty grid — worse than the undifferentiated list it
 * replaced.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  FLAG_CODE_MAP,
  LEADERS_REGION_COUNTRIES,
  PERSONA_LEADER_GUIDANCE,
} from './leadersConstants'
import { filterLeadersByParams } from './leaderDeepLink'
import { leadersData } from '@/data/leadersData'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

describe('PERSONA_LEADER_GUIDANCE — B+ remediation 4.1', () => {
  const liveCategories = new Set(leadersData.map((l) => l.category))

  it('covers every persona', () => {
    for (const id of Object.keys(PERSONAS) as PersonaId[]) {
      expect(PERSONA_LEADER_GUIDANCE[id]?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('only recommends categories that exist and are non-empty in the live data', () => {
    for (const [persona, guidance] of Object.entries(PERSONA_LEADER_GUIDANCE)) {
      for (const g of guidance) {
        expect(liveCategories.has(g.category), `${persona}: category "${g.category}"`).toBe(true)
        const count = leadersData.filter((l) => l.category === g.category).length
        expect(count, `${persona}: category "${g.category}" is empty`).toBeGreaterThan(0)
      }
    }
  })

  it('says something specific — a reason, not a restatement of the category', () => {
    for (const guidance of Object.values(PERSONA_LEADER_GUIDANCE)) {
      for (const g of guidance) {
        expect(g.why.length).toBeGreaterThan(40)
        expect(g.why.toLowerCase()).not.toBe(g.category.toLowerCase())
      }
    }
  })
})

/**
 * `?region=` keeps a leader only when the leader's country is in the region's
 * list. The data spells some countries two ways ("USA" and "United States", "UK"
 * and "United Kingdom"), and the lists had only the short spelling, so 95 of 402
 * leaders (24%) — NIST's Dustin Moody and Lily Chen among them — dropped out of
 * every regional view. Leaders with no country at all cannot be placed.
 */
describe('leaders ?region= placement', () => {
  const withCountry = leadersData.filter((l) => l.country.trim() !== '')
  const regions = Object.keys(LEADERS_REGION_COUNTRIES)

  it('puts every country that appears in the data in a region', () => {
    const listed = new Set(Object.values(LEADERS_REGION_COUNTRIES).flat())
    const unplaced = [...new Set(withCountry.map((l) => l.country))].filter((c) => !listed.has(c))
    expect(unplaced).toEqual([])
  })

  it('does not put a country in two regions', () => {
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const [region, countries] of Object.entries(LEADERS_REGION_COUNTRIES)) {
      for (const country of countries) {
        const earlier = seen.get(country)
        if (earlier) clashes.push(`${country}: ${earlier} and ${region}`)
        else seen.set(country, region)
      }
    }
    expect(clashes).toEqual([])
  })

  it('shows every leader that has a country in exactly one region', () => {
    const counts = regions.map(
      (region) => filterLeadersByParams(leadersData, new URLSearchParams({ region })).length
    )
    expect(counts.reduce((a, b) => a + b, 0)).toBe(withCountry.length)
  })

  it('shows the leaders whose country is spelled in full', () => {
    const americas = filterLeadersByParams(leadersData, new URLSearchParams({ region: 'americas' }))
    const eu = filterLeadersByParams(leadersData, new URLSearchParams({ region: 'eu' }))
    expect(americas.some((l) => l.country === 'United States')).toBe(true)
    expect(eu.some((l) => l.country === 'United Kingdom')).toBe(true)
    // NIST's own people are filed under "United States".
    const nist = americas.filter(
      (l) => l.country === 'United States' && l.organizations.includes('NIST')
    )
    expect(nist.map((l) => l.name)).toContain('Dr. Dustin Moody')
  })
})

describe('leaders country flags', () => {
  it('points every mapped flag at a flag file that exists', () => {
    const missing = [...new Set(Object.values(FLAG_CODE_MAP))].filter(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo files
      (code) => !existsSync(join(process.cwd(), 'public', 'flags', `${code}.svg`))
    )
    expect(missing).toEqual([])
  })

  it('gives the spelled-out country names the same flag as the short ones', () => {
    expect(FLAG_CODE_MAP['United States']).toBe(FLAG_CODE_MAP.USA)
    expect(FLAG_CODE_MAP['United Kingdom']).toBe(FLAG_CODE_MAP.UK)
  })
})
