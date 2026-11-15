// SPDX-License-Identifier: AGPL-3.0-only
/**
 * /leaders remediation (4.208): country spelling, Timeline links, forwarding of
 * superseded ids, catalogue product names and licences, sorting and industry
 * matching — checked against the shipped data, not fixtures, so a data change
 * that breaks one of them fails here.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import Papa from 'papaparse'
import { leadersData, deprecatedLeaderSuccessors, type Leader } from '@/data/leadersData'
import { canonicalLeaderCountry } from '@/data/leaderCountry'
import { timelineData, resolveCountryParam } from '@/data/timelineData'
import {
  FLAG_CODE_MAP,
  LEADER_CATALOG_PRODUCTS,
  catalogProductsHeading,
  isOpenSourceCatalogProduct,
  leaderAssistantQuestion,
  leaderMatchesCategory,
  leaderTimelineCountry,
  productLabelFromId,
} from './leadersConstants'
import { filterLeadersByParams, planLeaderDeepLink, resolveLeaderParam } from './leaderDeepLink'
import {
  INDUSTRY_LEADER_KEYWORDS,
  compareLeaderCountries,
  compareLeaderNames,
  leaderMatchesIndustries,
} from './leadersSort'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'

const leaderCountries = [...new Set(leadersData.map((l) => l.country))]

describe('country spelling', () => {
  it('reads one spelling per country', () => {
    for (const c of ['USA', 'UK']) expect(leaderCountries).not.toContain(c)
    expect(leaderCountries.some((c) => c.split('/').includes('USA'))).toBe(false)
    expect(leaderCountries).toContain('United States')
    expect(leaderCountries).toContain('United Kingdom')
  })

  it('maps short forms part by part and leaves others alone', () => {
    expect(canonicalLeaderCountry('USA')).toBe('United States')
    expect(canonicalLeaderCountry('UK')).toBe('United Kingdom')
    expect(canonicalLeaderCountry('Netherlands/USA')).toBe('Netherlands/United States')
    expect(canonicalLeaderCountry('France')).toBe('France')
    expect(canonicalLeaderCountry('All')).toBe('All')
    expect(canonicalLeaderCountry('')).toBe('')
  })

  it('keeps old ?country=USA links working', () => {
    const viaOld = filterLeadersByParams(leadersData, new URLSearchParams('country=USA'))
    const viaNew = filterLeadersByParams(leadersData, new URLSearchParams('country=United States'))
    expect(viaOld.length).toBeGreaterThan(100)
    expect(viaOld).toEqual(viaNew)
    const us = viaNew[0]
    const plan = planLeaderDeepLink(
      leadersData,
      new URLSearchParams(`leader=${us.leaderId}&country=USA`)
    )
    expect(plan?.kind === 'found' && plan.widened).toEqual([])
  })

  it('has a flag for every country a leader row uses', () => {
    for (const c of leaderCountries.filter(Boolean)) {
      expect(FLAG_CODE_MAP[c], c).toBeTruthy()
    }
    expect(FLAG_CODE_MAP.Austria).toBe('at')
  })
})

describe('Events from <country> links', () => {
  const known = timelineData.map((d) => d.countryName)

  it('every link opens a Timeline country that exists', () => {
    for (const c of leaderCountries) {
      const t = leaderTimelineCountry(c)
      if (t === null) continue
      expect(known, `${c} → ${t}`).toContain(t)
      expect(resolveCountryParam(t, known).wasUnknown).toBe(false)
    }
  })

  it('no link for a country the Timeline has no events for, and none missed', () => {
    const wrong = leaderCountries.filter((c) => {
      const hasEvents = c.split('/').some((p) => known.includes(p.trim()))
      return (leaderTimelineCountry(c) !== null) !== hasEvents
    })
    expect(wrong).toEqual([])
    expect(leaderTimelineCountry('Ireland')).toBeNull()
    expect(leaderTimelineCountry('')).toBeNull()
    expect(leaderTimelineCountry('Belgium/United States')).toBe('United States')
  })
})

describe('superseded leader ids forward to the active profile', () => {
  const expected: Record<string, string> = {
    klaussner: 'Jan Klaußner',
    'matej-habovstiak': 'Martin Habovštiak',
    'd-joseph-et-al': 'David Joseph',
    'h-kim-et-al': 'Hyunji Kim',
    'j-j-pont-et-al': 'Jamie J. Pont',
    'k-fukuda-et-al': 'Kigen Fukuda',
    'm-a-aardal-et-al': 'Marius A. Aardal',
    'p-webster-et-al': 'Paul Webster',
    'r-stutz-et-al': 'Rainer Stütz',
    'schroeder-et-al': 'Robin Leander Schröder',
  }

  it.each(Object.entries(expected))('%s → %s', (id, name) => {
    const match = resolveLeaderParam(leadersData, id, deprecatedLeaderSuccessors)
    expect(match?.leader.name).toBe(name)
    expect(match?.forwardedFrom).toBeTruthy()
  })

  it('a row superseded by a retired row does not forward', () => {
    expect(deprecatedLeaderSuccessors.has('d-b-c-costa')).toBe(false)
  })
})

describe('catalogue products', () => {
  const catalogFile = join(process.cwd(), 'src/data/pqc_product_catalog_11132026_r3.csv')
  const catalog = new Map(
    Papa.parse<Record<string, string>>(readFileSync(catalogFile, 'utf8'), {
      header: true,
      skipEmptyLines: true,
    }).data.map((r) => [r.product_id, r])
  )

  it('lists every product a leader row cites, with the catalogue name and licence', () => {
    const cited = new Set(leadersData.flatMap((l) => l.migrateCatalogRefs ?? []))
    for (const id of cited) {
      const entry = LEADER_CATALOG_PRODUCTS[id]
      expect(entry, `${id} missing from LEADER_CATALOG_PRODUCTS`).toBeTruthy()
      const row = catalog.get(id)
      expect(row, `${id} not in the catalogue`).toBeTruthy()
      expect(entry.name, id).toBe(row!.software_name)
      expect(entry.openSource, id).toBe(row!.license_type === 'Open Source')
    }
  })

  it('names products the way the catalogue does', () => {
    expect(productLabelFromId('openssl')).toBe('OpenSSL')
    expect(productLabelFromId('go-stdlib-crypto-mlkem')).toBe('Go stdlib crypto/mlkem')
  })

  it('does not call a commercial product an open-source project', () => {
    expect(isOpenSourceCatalogProduct('Qinsight-Atlas-Cryptographic-Discovery-P')).toBe(false)
    expect(catalogProductsHeading(['Qinsight-Atlas-Cryptographic-Discovery-P'])).toBe(
      'Catalog Product'
    )
    expect(catalogProductsHeading(['openssl', 'botan'])).toBe('Open Source Projects (2)')
    const speciale = leadersData.find((l) => l.name === 'Daniel Speciale')!
    expect(leaderMatchesCategory(speciale, 'Open Source Maintainer')).toBe(false)
  })
})

describe('sorting', () => {
  it('ignores honorifics in name order', () => {
    const names = ['Dr. Dustin Moody', 'Alice Example', 'Prof. Dr. Tanja Lange', 'Bob Example']
    expect([...names].sort(compareLeaderNames)).toEqual([
      'Alice Example',
      'Bob Example',
      'Dr. Dustin Moody',
      'Prof. Dr. Tanja Lange',
    ])
  })

  it('puts blank countries last in both directions', () => {
    const cs = ['', 'France', 'Australia', '']
    expect([...cs].sort((a, b) => compareLeaderCountries(a, b, 1))).toEqual([
      'Australia',
      'France',
      '',
      '',
    ])
    expect([...cs].sort((a, b) => compareLeaderCountries(a, b, -1))).toEqual([
      'France',
      'Australia',
      '',
      '',
    ])
  })
})

describe('industry relevance', () => {
  it('has keywords for every industry the role settings offer', () => {
    for (const ind of AVAILABLE_INDUSTRIES) {
      expect(Object.keys(INDUSTRY_LEADER_KEYWORDS), ind).toContain(ind)
    }
  })

  it('"Other" marks nobody, and "Institute of Technology" is not the Technology industry', () => {
    expect(leadersData.filter((l) => leaderMatchesIndustries(l, ['Other']))).toEqual([])
    const fake = {
      bio: 'Professor at the Georgia Institute of Technology.',
      organizations: ['National Institute of Standards and Technology'],
      title: '',
    } as Leader
    expect(leaderMatchesIndustries(fake, ['Technology'])).toBe(false)
  })

  it('finds telecom profiles by whole words only', () => {
    const fake = {
      bio: 'Leads 5G security work at GSMA.',
      organizations: [],
      title: '',
    } as unknown as Leader
    expect(leaderMatchesIndustries(fake, ['Telecommunications'])).toBe(true)
    const notWord = { bio: 'Works on 50G links', organizations: [], title: '' } as unknown as Leader
    expect(leaderMatchesIndustries(notWord, ['Telecommunications'])).toBe(false)
  })
})

describe('assistant question', () => {
  it('reads cleanly when a row has no role or organization', () => {
    const base = { name: 'X', bio: '', title: '', organizations: [] } as unknown as Leader
    expect(leaderAssistantQuestion(base)).toBe("What is X's role in post-quantum cryptography?")
    expect(leaderAssistantQuestion({ ...base, title: 'Inventor' })).toContain('They are Inventor.')
    expect(leaderAssistantQuestion({ ...base, organizations: ['ACME'] })).toContain(
      'They work with ACME.'
    )
    for (const l of leadersData)
      expect(leaderAssistantQuestion(l)).not.toMatch(/They are {2}|They are \.| at \./)
  })
})
