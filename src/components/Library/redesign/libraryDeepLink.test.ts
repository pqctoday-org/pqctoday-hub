// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { libraryData } from '@/data/libraryData'
import { PERSONA_LIBRARY_CATEGORIES } from '@/data/personaConfig'
import { resolveLibraryDeepLink, libraryWideningFor } from './libraryDeepLink'

// Real data: PKCS11-V32-OASIS is a deprecated CSD row whose superseded_by is
// PKCS11-V32-OS-OASIS (the Algorithms protocol matrix still links the old id).
describe('resolveLibraryDeepLink', () => {
  it('resolves a live ref to itself', () => {
    const res = resolveLibraryDeepLink('FIPS 203')
    expect(res?.item.referenceId).toBe('FIPS 203')
    expect(res?.supersededRef).toBeUndefined()
  })

  it('forwards a retired ref to the document that superseded it', () => {
    const res = resolveLibraryDeepLink('PKCS11-V32-OASIS')
    expect(res?.item.referenceId).toBe('PKCS11-V32-OS-OASIS')
    expect(res?.supersededRef).toBe('PKCS11-V32-OASIS')
  })

  it('returns null for an unknown ref', () => {
    expect(resolveLibraryDeepLink('NO-SUCH-DOC-XYZ')).toBeNull()
  })
})

const item = libraryData.find((i) => i.referenceId === 'FIPS 203')!
const base = {
  activePurpose: 'all' as const,
  activeCategory: 'All',
  selectedPersona: null,
  prefsOff: false,
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
  certRelevantIdSet: new Set<string>(),
  lifecycleBucket: 'All',
  semanticIdSet: null,
  newOnly: false,
}

describe('libraryWideningFor', () => {
  it('returns null when nothing hides the item', () => {
    expect(libraryWideningFor(item, base)).toBeNull()
  })

  it('drops only the filters that exclude the item, keeping the ones it passes', () => {
    const otherCat = ['Protocols', 'KEM', 'Digital Signature'].find(
      (c) => !item.categories.includes(c)
    )!
    const w = libraryWideningFor(item, {
      ...base,
      activeCategory: otherCat,
      activeOrg: 'NIST', // FIPS 203 is a NIST document — kept
      filterText: 'zzzz-no-match',
      showOnlyLibraryBookmarks: true,
    })
    expect(w).not.toBeNull()
    expect(w!.drop.sort()).toEqual(['cat', 'q', 'qv'])
    expect(w!.prefsOff).toBe(false)
  })

  it('turns role narrowing off when the persona focus areas hide the item', () => {
    const persona = (
      Object.keys(PERSONA_LIBRARY_CATEGORIES) as (keyof typeof PERSONA_LIBRARY_CATEGORIES)[]
    ).find((p) => (PERSONA_LIBRARY_CATEGORIES[p] ?? []).length > 0)!
    const preferred = PERSONA_LIBRARY_CATEGORIES[persona] ?? []
    const hidden = libraryData.find((i) => !i.categories.some((c) => preferred.includes(c)))!
    const w = libraryWideningFor(hidden, { ...base, selectedPersona: persona })
    expect(w).toEqual({ drop: [], prefsOff: true })
    // prefs=off already set → nothing to widen
    expect(
      libraryWideningFor(hidden, { ...base, selectedPersona: persona, prefsOff: true })
    ).toBeNull()
  })
})
