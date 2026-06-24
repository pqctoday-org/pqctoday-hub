// SPDX-License-Identifier: GPL-3.0-only
/**
 * useLibraryPipeline — the shared filter + sort pipeline for the Library page.
 *
 * Lifted verbatim from the live LibraryView so the redesign has GUARANTEED
 * behavior parity (same category/org/geo/sector/tier/bookmark/cswp39/cert/
 * lifecycle/search filtering, the persona-narrow counterfactual + hidden-docs
 * counter, and the persona-preferred secondary sort). The redesign view owns
 * the URL/store state and passes it in; this hook owns the derivation only.
 */
import { useMemo } from 'react'
import { libraryData, LIBRARY_CATEGORIES, type LibraryItem } from '@/data/libraryData'
import { maturityByRefId } from '@/data/maturityGovernanceData'
import { PERSONA_LIBRARY_CATEGORIES } from '@/data/personaConfig'
import { matchesGeoFilter } from '@/components/common/GeoFilter'
import { matchesSectorFilter } from '@/components/common/SectorFilter'
import { matchesTrustTierFilter } from '@/components/common/TrustTierFilter'
import { matchesAlgorithmFamilyFilter } from '@/components/common/AlgorithmFamilyFilter'
import type { TrustTier } from '@/data/trustScore'
import type { SortOption } from '@/components/Library/SortControl'
import type { PersonaId } from '@/data/learningPersonas'
import type { DocumentStatusBucket } from '@/utils/documentStatusBucket'

const URGENCY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

/** Canonical organization map — keep in sync with LibraryView's ORG_CANONICAL_MAP. */
export const ORG_CANONICAL_MAP: Record<string, string> = {
  'IETF LAMPS': 'IETF',
  'IETF CFRG': 'IETF',
  'IETF TLS': 'IETF',
  'IETF IPSECME': 'IETF',
  IETF: 'IETF',
  NIST: 'NIST',
  'NIST NCCoE': 'NIST',
  NSA: 'NSA',
  CISA: 'CISA',
  ANSSI: 'ANSSI',
  BSI: 'BSI',
  'UK NCSC': 'UK NCSC',
  ETSI: 'ETSI',
  ISO: 'ISO',
  'ISO/IEC': 'ISO',
  'European Commission': 'European Commission',
  'ASD Australia': 'ASD Australia',
  'Cloudflare Research': 'Cloudflare Research',
  'Open Quantum Safe': 'Open Quantum Safe',
}

export interface LibraryPipelineInput {
  activeCategory: string // 'All' or a LIBRARY_CATEGORIES value
  activeOrg: string // 'All' or a canonical org
  filterText: string
  geoFilter: string[]
  sectorFilter: string[]
  tierFilter: TrustTier[]
  algoFamilyFilter: string[]
  showOnlyLibraryBookmarks: boolean
  libraryBookmarks: string[]
  cswp39Only: boolean
  certRelevantOnly: boolean
  certRelevantIdSet: Set<string>
  lifecycleBucket: string // 'All' or a DocumentStatusBucket
  sortBy: SortOption
  selectedPersona: PersonaId | null
  prefsOff: boolean
  /** Set of referenceIds (lowercased) from the semantic-search union, or null. */
  semanticIdSet: Set<string> | null
}

export interface LibraryPipelineResult {
  activityItems: LibraryItem[]
  categoryInfo: { name: string; count: number; hasUpdates: boolean }[]
  filteredItems: LibraryItem[]
  sortedItems: LibraryItem[]
  newHiddenByPersonaCount: number
  totalCount: number
  personaPreferredCategories: string[]
  personaPreferredActive: boolean
}

export function useLibraryPipeline(input: LibraryPipelineInput): LibraryPipelineResult {
  const {
    activeCategory,
    activeOrg,
    filterText,
    geoFilter,
    sectorFilter,
    tierFilter,
    algoFamilyFilter,
    showOnlyLibraryBookmarks,
    libraryBookmarks,
    cswp39Only,
    certRelevantOnly,
    certRelevantIdSet,
    lifecycleBucket,
    sortBy,
    selectedPersona,
    prefsOff,
    semanticIdSet,
  } = input

  const activityItems = useMemo(
    () =>
      libraryData
        .filter((item) => item.status === 'New' || item.status === 'Updated')
        .sort(
          (a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        ),
    []
  )

  const categoryInfo = useMemo(
    () =>
      LIBRARY_CATEGORIES.map((name) => {
        const items = libraryData.filter((item) => item.categories.includes(name))
        return {
          name,
          count: items.length,
          hasUpdates: items.some((item) => item.status === 'New' || item.status === 'Updated'),
        }
      }),
    []
  )

  const personaPreferredCategories = useMemo<string[]>(() => {
    if (prefsOff) return []
    if (!selectedPersona) return []
    return PERSONA_LIBRARY_CATEGORIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
  }, [selectedPersona, prefsOff])

  const personaPreferredActive = personaPreferredCategories.length > 0 && activeCategory === 'All'

  const matchesAllButNarrow = (item: LibraryItem): boolean => {
    if (activeOrg !== 'All') {
      const itemCanonicalOrgs = item.authorsOrOrganization
        ? item.authorsOrOrganization
            .split(';')
            .map((s) => ORG_CANONICAL_MAP[s.trim()])
            .filter(Boolean)
        : []
      if (!itemCanonicalOrgs.includes(activeOrg)) return false
    }
    if (geoFilter.length > 0) {
      const regionValues = item.regionScope
        ? item.regionScope
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      if (!matchesGeoFilter(geoFilter, regionValues)) return false
    }
    if (sectorFilter.length > 0) {
      if (!matchesSectorFilter(sectorFilter, item.applicableIndustries ?? [])) return false
    }
    if (!matchesTrustTierFilter(tierFilter, 'library', item.referenceId)) return false
    if (algoFamilyFilter.length > 0) {
      const famValues = item.algorithmFamily
        ? item.algorithmFamily
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      if (!matchesAlgorithmFamilyFilter(algoFamilyFilter, famValues)) return false
    }
    if (showOnlyLibraryBookmarks && !libraryBookmarks.includes(item.referenceId)) return false
    if (cswp39Only && !maturityByRefId.has(item.referenceId)) return false
    if (certRelevantOnly && !certRelevantIdSet.has(item.referenceId)) return false
    if (
      lifecycleBucket !== 'All' &&
      item.documentStatusBucket !== (lifecycleBucket as DocumentStatusBucket)
    )
      return false
    if (!filterText) return true
    const searchLower = filterText.toLowerCase()
    const lexicalMatch =
      item.documentTitle.toLowerCase().includes(searchLower) ||
      item.referenceId.toLowerCase().includes(searchLower) ||
      item.shortDescription?.toLowerCase().includes(searchLower) ||
      item.categories?.some((cat) => cat.toLowerCase().includes(searchLower))
    if (lexicalMatch) return true
    if (semanticIdSet && semanticIdSet.has(item.referenceId.toLowerCase())) return true
    return false
  }

  const filteredItems = useMemo(() => {
    return libraryData.filter((item) => {
      if (activeCategory !== 'All') {
        if (!item.categories.includes(activeCategory)) return false
      } else if (personaPreferredActive && !filterText) {
        const hit = item.categories?.some((c) => personaPreferredCategories.includes(c))
        if (!hit) return false
      }
      return matchesAllButNarrow(item)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCategory,
    activeOrg,
    geoFilter,
    sectorFilter,
    filterText,
    semanticIdSet,
    showOnlyLibraryBookmarks,
    libraryBookmarks,
    cswp39Only,
    certRelevantOnly,
    certRelevantIdSet,
    lifecycleBucket,
    tierFilter,
    algoFamilyFilter,
    personaPreferredActive,
    personaPreferredCategories,
  ])

  const newHiddenByPersonaCount = useMemo(() => {
    if (!personaPreferredActive) return 0
    const visibleIds = new Set(filteredItems.map((i) => i.referenceId))
    const noNarrow = libraryData.filter((item) => {
      if (activeCategory !== 'All' && !item.categories.includes(activeCategory)) return false
      return matchesAllButNarrow(item)
    })
    return noNarrow.filter((i) => i.status === 'New' && !visibleIds.has(i.referenceId)).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaPreferredActive, filteredItems, activeCategory])

  const preferredCategories = useMemo(() => {
    if (!selectedPersona) return []
    return PERSONA_LIBRARY_CATEGORIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
  }, [selectedPersona])

  const sortedItems = useMemo(() => {
    const items = [...filteredItems]
    switch (sortBy) {
      case 'newest':
        items.sort(
          (a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        )
        break
      case 'name':
        items.sort((a, b) => a.documentTitle.localeCompare(b.documentTitle))
        break
      case 'referenceId':
        items.sort((a, b) =>
          a.referenceId.localeCompare(b.referenceId, undefined, { numeric: true })
        )
        break
      case 'urgency':
        items.sort(
          (a, b) =>
            (URGENCY_ORDER[a.migrationUrgency] ?? 99) - (URGENCY_ORDER[b.migrationUrgency] ?? 99)
        )
        break
      case 'mostCited':
        items.sort((a, b) => {
          const aCount = a.citationCount ?? 0
          const bCount = b.citationCount ?? 0
          if (bCount !== aCount) return bCount - aCount
          return new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        })
        break
    }
    if (preferredCategories.length > 0) {
      items.sort((a, b) => {
        const aMatch = a.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        const bMatch = b.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        return aMatch - bMatch
      })
    }
    return items
  }, [filteredItems, sortBy, preferredCategories])

  return {
    activityItems,
    categoryInfo,
    filteredItems,
    sortedItems,
    newHiddenByPersonaCount,
    totalCount: libraryData.length,
    personaPreferredCategories,
    personaPreferredActive,
  }
}
