// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { libraryData } from '@/data/libraryData'
import {
  matchesLibraryFilters,
  normalizeSearchText,
  type LibraryFilterState,
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
