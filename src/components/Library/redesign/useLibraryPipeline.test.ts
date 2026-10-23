// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { libraryData } from '@/data/libraryData'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import {
  MATCH_RANK,
  libraryMatchRank,
  matchesLibraryFilters,
  normalizeSearchText,
  useLibraryPipeline,
  type LibraryFilterState,
  type LibraryPipelineInput,
} from './useLibraryPipeline'

describe('normalizeSearchText', () => {
  it('makes "PKCS #11", "PKCS-11", "PKCS#11", and "PKCS11" equivalent', () => {
    const query = normalizeSearchText('pkcs11')
    expect(normalizeSearchText('pkcs #11 cryptographic token interface profiles')).toContain(query)
    expect(normalizeSearchText('pkcs-11-cryptographic-token-interface-profiles')).toContain(query)
    expect(normalizeSearchText('pkcs#11 conformance profiles')).toContain(query)
  })

  it('is a pure separator strip, not a no-op on unrelated text', () => {
    expect(normalizeSearchText('nist sp 800-171')).toBe('nistsp800171')
    expect(normalizeSearchText('rfc 9151')).toBe('rfc9151')
  })

  it('leaves an already-normalized string unchanged', () => {
    expect(normalizeSearchText('pkcs11')).toBe('pkcs11')
  })
})

describe('matchesLibraryFilters — search box matches all words', () => {
  const baseFilters: LibraryFilterState = {
    activeOrg: 'All',
    filterText: '',
    geoFilter: [],
    sectorFilter: [],
    tierFilter: [],
    algoFamilyFilter: [],
    showOnlyLibraryBookmarks: false,
    libraryBookmarks: [],
    cswp39Only: false,
    certRelevantOnly: false,
    certRelevantIdSet: new Set(),
    lifecycleBucket: 'All',
    semanticIdSet: null,
  }
  const sp80082 = libraryData.find((d) => d.referenceId.startsWith('NIST SP 800-82'))
  const hits = (filterText: string) =>
    matchesLibraryFilters(sp80082!, { ...baseFilters, filterText })

  it('has the NIST SP 800-82 OT guide in the shipped catalog', () => {
    expect(sp80082).toBeDefined()
    expect(sp80082!.documentTitle).toMatch(/Operational Technology \(OT\) Security/)
  })

  it('finds it with a natural multi-word query that is not a contiguous phrase', () => {
    // title has "operational technology", description has "Purdue model"
    expect(hits('operational technology purdue')).toBe(true)
    expect(hits('purdue model for OT')).toBe(true)
    expect(hits('Purdue model for operational technology')).toBe(true)
  })

  it('still matches the single word and exact-phrase queries it matched before', () => {
    expect(hits('purdue')).toBe(true)
    expect(hits('purdue model')).toBe(true)
    expect(hits('Guide to Operational Technology')).toBe(true)
    expect(hits('800-82')).toBe(true)
  })

  it('still rejects when one required word is absent', () => {
    expect(hits('purdue zzzznotaword')).toBe(false)
  })

  it('treats an empty or stopword-only query as no filtering', () => {
    expect(hits('')).toBe(true)
    expect(hits('for the')).toBe(true)
  })

  it('keeps the separator-insensitive fallback for identifiers like PKCS11', () => {
    const pkcs = libraryData.find((d) => /pkcs\s*#?-?\s*11/i.test(d.documentTitle))
    expect(pkcs).toBeDefined()
    expect(matchesLibraryFilters(pkcs!, { ...baseFilters, filterText: 'pkcs11' })).toBe(true)
  })

  it('still applies the other filters on top of the search', () => {
    expect(
      matchesLibraryFilters(sp80082!, {
        ...baseFilters,
        filterText: 'purdue model for OT',
        showOnlyLibraryBookmarks: true,
      })
    ).toBe(false)
  })
})

const pipelineBase: LibraryPipelineInput = {
  activePurpose: 'all',
  activeCategory: 'All',
  activeOrg: 'All',
  filterText: '',
  geoFilter: [],
  sectorFilter: [],
  tierFilter: [],
  algoFamilyFilter: [],
  showOnlyLibraryBookmarks: false,
  libraryBookmarks: [],
  cswp39Only: false,
  certRelevantOnly: false,
  certRelevantIdSet: new Set(),
  lifecycleBucket: 'All',
  sortBy: 'published',
  sortExplicit: false,
  selectedPersona: null,
  prefsOff: false,
  semanticIdSet: null,
}

const sortedIds = (input: Partial<LibraryPipelineInput>) =>
  renderHook(() =>
    useLibraryPipeline({ ...pipelineBase, ...input })
  ).result.current.sortedItems.map((i) => i.referenceId)

describe('libraryMatchRank', () => {
  const byId = (id: string) => libraryData.find((d) => d.referenceId === id)!

  it('ranks the standard itself as an exact match for its number', () => {
    expect(libraryMatchRank(byId('FIPS-140-3-STANDARD'), 'FIPS 140-3')).toBe(MATCH_RANK.exact)
    expect(libraryMatchRank(byId('NIST-SP-800-90B'), 'SP 800-90B')).toBe(MATCH_RANK.exact)
    expect(libraryMatchRank(byId('FIPS 203'), 'fips 203')).toBe(MATCH_RANK.exact)
  })

  it('ranks a title that merely mentions the query below titles that lead with it', () => {
    const cert = libraryMatchRank(byId('NIST-CMVP-Cert-5450'), 'FIPS 140-3')
    const manual = libraryMatchRank(byId('CMVP-MGMT-MANUAL'), 'FIPS 140-3')
    const guidance = libraryMatchRank(byId('NIST-FIPS140-3-IG-PQC'), 'FIPS 140-3')
    expect(manual).toBe(MATCH_RANK.prefix)
    expect(guidance).toBe(MATCH_RANK.inHeadlineOrId)
    expect(cert).toBe(MATCH_RANK.inTitle)
    expect(manual).toBeLessThan(guidance)
    expect(guidance).toBeLessThan(cert)
  })

  it('treats "PKCS #11", "PKCS-11" and "PKCS11" alike', () => {
    const pkcs = libraryData.find((d) => /pkcs\s*#?-?\s*11/i.test(d.documentTitle))!
    const ranks = ['pkcs11', 'PKCS #11', 'pkcs-11'].map((q) => libraryMatchRank(pkcs, q))
    expect(new Set(ranks).size).toBe(1)
    expect(ranks[0]).toBeLessThanOrEqual(MATCH_RANK.inTitle)
  })

  it('is neutral (0) for an empty or stopword-only query', () => {
    expect(libraryMatchRank(byId('FIPS 203'), '')).toBe(0)
    expect(libraryMatchRank(byId('FIPS 203'), 'for the')).toBe(0)
  })

  it('puts a record that matched only by words spread across its metadata after phrase matches', () => {
    const doc = byId('FIPS 203')
    expect(libraryMatchRank(doc, 'zzzznotaword')).toBe(MATCH_RANK.semanticOnly)
  })
})

describe('useLibraryPipeline — Best match ordering', () => {
  it('lists the FIPS 140-3 standard first for "FIPS 140-3", not 13th', () => {
    const ids = sortedIds({ filterText: 'FIPS 140-3', sortBy: 'relevance' })
    expect(ids[0]).toBe('FIPS-140-3-STANDARD')
    // The pre-fix publication-date order, for contrast.
    const byDate = sortedIds({ filterText: 'FIPS 140-3', sortBy: 'published' })
    expect(byDate.indexOf('FIPS-140-3-STANDARD')).toBeGreaterThan(3)
  })

  it('lists SP 800-90B before the entropy certificates that cite it', () => {
    const ids = sortedIds({ filterText: 'SP 800-90B', sortBy: 'relevance' })
    expect(ids[0]).toBe('NIST-SP-800-90B')
  })

  it('keeps publication date as the tie-breaker inside a match tier', () => {
    const query = 'FIPS 140-3'
    const items = renderHook(() =>
      useLibraryPipeline({ ...pipelineBase, filterText: query, sortBy: 'relevance' })
    ).result.current.sortedItems
    for (let i = 1; i < items.length; i++) {
      const prev = libraryMatchRank(items[i - 1], query)
      const cur = libraryMatchRank(items[i], query)
      expect(prev).toBeLessThanOrEqual(cur)
      if (prev === cur) {
        const pub = (d: (typeof items)[number]) => Date.parse(d.initialPublicationDate) || 0
        expect(pub(items[i - 1])).toBeGreaterThanOrEqual(pub(items[i]))
      }
    }
  })

  it('without a query, "relevance" is the plain publication-date order', () => {
    expect(sortedIds({ sortBy: 'relevance' })).toEqual(sortedIds({ sortBy: 'published' }))
  })

  it('an explicit publication-date sort still orders a search by date', () => {
    const ids = sortedIds({ filterText: 'FIPS 140-3', sortBy: 'published', sortExplicit: true })
    const rel = sortedIds({ filterText: 'FIPS 140-3', sortBy: 'relevance' })
    expect(ids).not.toEqual(rel)
    expect([...ids].sort()).toEqual([...rel].sort())
  })
})

describe('useLibraryPipeline — Certification starter set and role narrowing', () => {
  const picks = new Set(LIBRARY_OPS_PICKS.map((p) => p.referenceId))
  const starter = {
    certRelevantOnly: true,
    certRelevantIdSet: picks,
    selectedPersona: 'cert-engineer' as const,
  }

  it('shows every starter document to the certification role (not 2 of 7)', () => {
    const { result } = renderHook(() => useLibraryPipeline({ ...pipelineBase, ...starter }))
    expect(new Set(result.current.sortedItems.map((i) => i.referenceId))).toEqual(picks)
    expect(result.current.personaPreferredActive).toBe(false)
    expect(result.current.newHiddenByPersonaCount).toBe(0)
  })

  it('still narrows the ordinary list for that role', () => {
    const { result } = renderHook(() =>
      useLibraryPipeline({ ...pipelineBase, selectedPersona: 'cert-engineer' })
    )
    expect(result.current.personaPreferredActive).toBe(true)
    expect(result.current.sortedItems.length).toBeLessThan(libraryData.length)
  })
})
