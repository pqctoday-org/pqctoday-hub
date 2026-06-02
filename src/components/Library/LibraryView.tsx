// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  libraryData,
  libraryMetadata,
  libraryError,
  LIBRARY_CATEGORIES,
} from '../../data/libraryData'
import type { LibraryItem } from '../../data/libraryData'
import { LibraryTreeTable } from './LibraryTreeTable'
import { LibraryDetailPopover } from './LibraryDetailPopover'
import { ActivityFeed } from './ActivityFeed'
import { CategorySidebar } from './CategorySidebar'
import { DocumentCardGrid } from './DocumentCardGrid'
import { ViewToggle } from './ViewToggle'
import type { ViewMode } from './ViewToggle'
import { SortControl } from './SortControl'
import type { SortOption } from './SortControl'
import { FilterDropdown } from '../common/FilterDropdown'
import { PersonaDefaultsBanner } from '../common/PersonaDefaultsBanner'
import { usePersonaDefaults } from '@/hooks/usePersonaDefaults'
import { Search, FileSearch, BookOpen, SlidersHorizontal, X, BookmarkCheck } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'
import { ContentUpdatesFeed } from '@/components/ui/ContentUpdatesFeed'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LIBRARY_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import debounce from 'lodash/debounce'
import { useAchievementStore } from '@/store/useAchievementStore'
import { LIBRARY_CURIOUS_PICKS } from '@/data/libraryCuriousPicks'
import { LIBRARY_EXECUTIVE_PICKS } from '@/data/libraryExecutivePicks'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import { PersonaPicksPanel } from './PersonaPicksPanel'
import type { PersonaId } from '@/data/learningPersonas'
import { logLibrarySearch, logEvent, personaLabel } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useBookmarkStore } from '../../store/useBookmarkStore'
import { maturityByRefId } from '../../data/maturityGovernanceData'
import { PERSONA_LIBRARY_CATEGORIES } from '../../data/personaConfig'
import {
  LIFECYCLE_FILTER_OPTIONS,
  type DocumentStatusBucket,
} from '../../utils/documentStatusBucket'
import { ErrorAlert } from '../ui/error-alert'
import { EmptyState } from '../ui/empty-state'
import { Button } from '@/components/ui/button'
import { GeoFilter, useGeoFilter, matchesGeoFilter } from '../common/GeoFilter'
import { SectorFilter, useSectorFilter, matchesSectorFilter } from '../common/SectorFilter'
import {
  TrustTierFilter,
  useTrustTierFilter,
  matchesTrustTierFilter,
} from '../common/TrustTierFilter'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { SemanticSearchHint } from '@/components/common/SemanticSearchHint'

// Persona-aware default sort. Explicit `?sort=` always wins; this only seeds
// the initial value when the URL is silent.
const DEFAULT_SORT_BY_PERSONA: Record<PersonaId, SortOption> = {
  executive: 'newest',
  developer: 'referenceId',
  architect: 'urgency',
  researcher: 'mostCited',
  ops: 'urgency',
  curious: 'newest',
}

function defaultSortForPersona(persona: PersonaId | null | undefined): SortOption {
  if (!persona) return 'newest'
  return DEFAULT_SORT_BY_PERSONA[persona] ?? 'newest' // eslint-disable-line security/detect-object-injection
}

const URGENCY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

// Maps raw CSV authorsOrOrganization values → canonical standardization body names.
// Only entries present in this map appear as dropdown options (allowlist).
// Sub-groups and working groups roll up to their parent body.
const ORG_CANONICAL_MAP: Record<string, string> = {
  // IETF — all working groups and individual submissions
  'IETF LAMPS': 'IETF',
  'IETF CFRG': 'IETF',
  'IETF TLS WG': 'IETF',
  'IETF IPSECME WG': 'IETF',
  'IETF IPSECME': 'IETF',
  'IETF PQUIP': 'IETF',
  'IETF UTA': 'IETF',
  'IETF OpenPGP WG': 'IETF',
  'IETF COSE WG': 'IETF',
  'IETF Individual Submission': 'IETF',
  // NIST — core body and programs
  NIST: 'NIST',
  'NIST CMVP': 'NIST',
  'NIST NCCoE': 'NIST',
  'NIST/HQC Team': 'NIST',
  // ETSI
  ETSI: 'ETSI',
  'ETSI QSC': 'ETSI',
  // 3GPP
  '3GPP': '3GPP',
  '3GPP SA3': '3GPP',
  // ENISA
  ENISA: 'ENISA',
  'ECCG/ENISA': 'ENISA',
  // NSA / CISA (kept separate — distinct agencies)
  NSA: 'NSA',
  'CISA/NSA': 'CISA/NSA',
  // Open source / industry bodies
  'Open Quantum Safe': 'Open Quantum Safe',
  'Linux Foundation PQCA': 'Open Quantum Safe',
  // Direct mappings — standalone bodies
  'ANSSI France': 'ANSSI France',
  'ASD Australia': 'ASD Australia',
  'BSI Germany': 'BSI Germany',
  'CA/Browser Forum': 'CA/Browser Forum',
  'CACR China': 'CACR China',
  'CCCS Canada': 'CCCS Canada',
  'CCSA China': 'CCSA China',
  'CRYPTREC Japan': 'CRYPTREC Japan',
  'Cloud Security Alliance': 'Cloud Security Alliance',
  'European Commission': 'European Commission',
  GSMA: 'GSMA',
  IEEE: 'IEEE',
  'ICCS China': 'ICCS China',
  'IMDA Singapore': 'IMDA Singapore',
  'ISO/IEC JTC 1/SC 27': 'ISO/IEC JTC 1/SC 27',
  'ITU-T SG17': 'ITU-T SG17',
  KISA: 'KISA',
  'OSCCA China': 'OSCCA China',
  'SAC China': 'SAC China',
  'Trusted Computing Group': 'Trusted Computing Group',
  'UK NCSC': 'UK NCSC',
  'White House': 'White House',
  // ASD / ACSC Australia — multiple CSV authorship forms roll up to 'ASD Australia'
  ASD: 'ASD Australia',
  'Australian Signals Directorate': 'ASD Australia',
  ACSC: 'ASD Australia',
  'Australian Cyber Security Centre': 'ASD Australia',
  'Australian Cyber Security Centre (ACSC)': 'ASD Australia',
  // Excluded (not in map): 'Browser vendors', 'CAs', 'Ministry of Science and ICT',
  // 'NIS Korea', 'NIS Korea', 'Samsung System LSI', 'Thales'
}

/** Find a library item by referenceId, searching top-level and nested children */
function findByRef(
  items: LibraryItem[],
  refId: string,
  visited = new Set<string>()
): LibraryItem | null {
  for (const item of items) {
    if (visited.has(item.referenceId)) continue
    visited.add(item.referenceId)
    if (item.referenceId === refId) return item
    if (item.children) {
      const found = findByRef(item.children, refId, visited)
      if (found) return found
    }
  }
  return null
}

export const LibraryView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedPersona } = usePersonaStore()
  const { libraryBookmarks, showOnlyLibraryBookmarks, setShowOnlyLibraryBookmarks } =
    useBookmarkStore()
  // Sidebar selection — defaults to 'All' so the persona-preferred filter
  // (below) does the narrowing.  Explicit ?cat= still wins.
  const [activeCategory, setActiveCategory] = useState<string>(
    () => searchParams.get('cat') ?? 'All'
  )
  const [activeOrg, setActiveOrg] = useState<string>(() => searchParams.get('org') ?? 'All')
  // Region / Industry single-select state was dropped in the P04 audit drawer
  // consolidation (PR 3) — see the migration shim further down that converts
  // legacy `?region=`/`?ind=` URLs into the multi-select `geo[]`/`sector[]`
  // arrays. The corresponding state vars + URL writes are intentionally gone.
  const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '')
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (searchParams.get('view') as ViewMode | null) ?? 'cards'
  )
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    // Explicit ?sort= always wins.
    const fromUrl = searchParams.get('sort') as SortOption | null
    if (fromUrl) return fromUrl
    // Otherwise pick a persona-aware default.
    return defaultSortForPersona(selectedPersona)
  })
  const [cswp39Only, setCswp39Only] = useState<boolean>(() => searchParams.get('cswp39') === '1')
  const [certRelevantOnly, setCertRelevantOnly] = useState<boolean>(
    () => searchParams.get('cert') === '1'
  )
  const [lifecycleBucket, setLifecycleBucket] = useState<string>(
    () => searchParams.get('lifecycle') ?? 'All'
  )
  const geoFilter = useGeoFilter()
  const sectorFilter = useSectorFilter()
  const tierFilter = useTrustTierFilter()
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false)
  // P04 audit, PR 4 — Curious minimum-viable mode.  When persona=curious and
  // the user hasn't expanded the page, only the header + picks panel + a
  // single "Browse the full library" CTA render above the fold.  Shareable
  // via `?expand=1`.
  const [browseFullLibrary, setBrowseFullLibrary] = useState<boolean>(
    () => searchParams.get('expand') === '1'
  )
  // Personas with a tight default drawer (3 axes: Organization, Country/Region,
  // Doc Status).  Sector + Trust Tier sit behind an "Advanced" expander.
  // Researcher and architect see all 5 expanded — they explicitly want depth.
  const drawerIsTrimmed = selectedPersona === 'executive' || selectedPersona === 'curious'

  // True when the full library shell (sidebar, activity feed, controls,
  // results grid) should render.  For non-curious personas this is always
  // true; curious users must click "Browse the full library" first.
  const showFullPage = selectedPersona !== 'curious' || browseFullLibrary

  // Persist `?expand=1` so the curious-mode override is shareable.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (browseFullLibrary) next.set('expand', '1')
        else next.delete('expand')
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browseFullLibrary])
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(
    () => searchParams.get('doc') ?? null
  )
  const prevDocHighlightRef = useRef<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(() => {
    const ref = searchParams.get('ref')
    return ref ? findByRef(libraryData, ref) : null
  })

  // Region / Industry single-select → multi-select migration shim
  // (P04 audit, PR 3 — one-release window). Chatbot deep links and bookmarked
  // URLs from before the consolidation use `?region=X` / `?ind=X` against the
  // single-select dropdowns. The drawer now only exposes the multi-select
  // GeoFilter (`geo[]`) and SectorFilter (`sector[]`). At mount, migrate any
  // legacy single-select value into the multi-select array and drop the old
  // param so the URL converges on the new shape.
  useEffect(() => {
    const legacyRegion = searchParams.get('region')
    const legacyInd = searchParams.get('ind')
    if (!legacyRegion && !legacyInd) return
    if (import.meta.env.DEV) {
      console.warn(
        '[Library] Migrating legacy single-select filter URL params (region/ind) ' +
          'into multi-select equivalents (geo[]/sector[]). Update any bookmarks/links.'
      )
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (legacyRegion && legacyRegion !== 'All' && next.getAll('geo').length === 0) {
          next.append('geo', legacyRegion)
        }
        if (legacyInd && legacyInd !== 'All' && next.getAll('sector').length === 0) {
          next.append('sector', legacyInd)
        }
        next.delete('region')
        next.delete('ind')
        return next
      },
      { replace: true }
    )
    // Only runs once at mount; no dependency drift expected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ?doc=<refId> — scroll-to-card + 3 s highlight, then clear
  useEffect(() => {
    const docId = searchParams.get('doc')
    if (!docId || docId === prevDocHighlightRef.current) return
    prevDocHighlightRef.current = docId
    const found = findByRef(libraryData, docId)
    if (found) {
      // Ensure the card is visible by setting its primary category
      const cat = found.categories[0]
      if (cat) setActiveCategory(cat)
      setHighlightedDocId(docId)
      setTimeout(() => {
        setHighlightedDocId(null)
        setSearchParams(
          (p) => {
            p.delete('doc')
            return p
          },
          { replace: true }
        )
      }, 3000)
    }
  }, [searchParams, setSearchParams])

  // Sync all filter params on same-route navigations (e.g. chatbot deep links, back/forward).
  // Functional setters prevent infinite loops: React bails out when the returned value equals
  // current state, so the setSearchParams → searchParams → useEffect cycle terminates.
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      const found = findByRef(libraryData, ref)
      if (found) setSelectedItem(found)
      return // ?ref= takes priority — don't touch filter state
    }

    const nextCat = searchParams.get('cat') ?? 'All'
    const nextOrg = searchParams.get('org') ?? 'All'
    const nextQ = searchParams.get('q') ?? ''
    const nextView = (searchParams.get('view') as ViewMode | null) ?? 'cards'
    const nextSort =
      (searchParams.get('sort') as SortOption | null) ?? defaultSortForPersona(selectedPersona)

    setActiveCategory((prev) => (prev !== nextCat ? nextCat : prev))
    setActiveOrg((prev) => (prev !== nextOrg ? nextOrg : prev))
    setFilterText((prev) => (prev !== nextQ ? nextQ : prev))
    setInputValue((prev) => (prev !== nextQ ? nextQ : prev))
    setViewMode((prev) => (prev !== nextView ? nextView : prev))
    setSortBy((prev) => (prev !== nextSort ? nextSort : prev))
    setCswp39Only((prev) => {
      const next = searchParams.get('cswp39') === '1'
      return prev !== next ? next : prev
    })
    setCertRelevantOnly((prev) => {
      const next = searchParams.get('cert') === '1'
      return prev !== next ? next : prev
    })
    setLifecycleBucket((prev) => {
      const next = searchParams.get('lifecycle') ?? 'All'
      return prev !== next ? next : prev
    })
  }, [searchParams, selectedPersona])

  /** Write all current filter state back to the URL. Call with overrides for the value that
   *  just changed so the URL reflects it immediately without waiting for a state flush.
   *  Uses replace:true to avoid polluting browser history on rapid filter changes.
   *  Functional setSearchParams form preserves any existing ?ref= param naturally. */
  const syncFiltersToUrl = useCallback(
    (overrides: {
      cat?: string
      org?: string
      q?: string
      view?: ViewMode
      sort?: SortOption
      cswp39?: boolean
      cert?: boolean
      lifecycle?: string
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const cat = overrides.cat ?? activeCategory
          const org = overrides.org ?? activeOrg
          const q = overrides.q ?? filterText
          const view = overrides.view ?? viewMode
          const sort = overrides.sort ?? sortBy
          const cswp39Flag = overrides.cswp39 ?? cswp39Only
          const certFlag = overrides.cert ?? certRelevantOnly
          const lifecycle = overrides.lifecycle ?? lifecycleBucket

          if (cat !== 'All') next.set('cat', cat)
          else next.delete('cat')
          if (org !== 'All') next.set('org', org)
          else next.delete('org')
          if (q) next.set('q', q)
          else next.delete('q')
          if (view !== 'cards') next.set('view', view)
          else next.delete('view')
          // Only persist `sort` to the URL when it differs from the current
          // persona's default — keeps URLs clean while still letting an
          // explicit override survive a copy/paste.
          if (sort !== defaultSortForPersona(selectedPersona)) next.set('sort', sort)
          else next.delete('sort')
          if (cswp39Flag) next.set('cswp39', '1')
          else next.delete('cswp39')
          if (certFlag) next.set('cert', '1')
          else next.delete('cert')
          if (lifecycle !== 'All') next.set('lifecycle', lifecycle)
          else next.delete('lifecycle')
          return next
        },
        { replace: true }
      )
    },
    [
      activeCategory,
      activeOrg,
      filterText,
      viewMode,
      sortBy,
      cswp39Only,
      certRelevantOnly,
      lifecycleBucket,
      setSearchParams,
      selectedPersona,
    ]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetFilter = useCallback(
    debounce((value: string) => {
      setFilterText(value)
      syncFiltersToUrl({ q: value })
      if (value) logLibrarySearch(value)
    }, 200),
    [syncFiltersToUrl]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    debouncedSetFilter(e.target.value)
  }

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category)
    syncFiltersToUrl({ cat: category })
    logEvent('Library', 'Filter Category', category)
  }

  // Count of library docs that carry at least one extracted CSWP 39 requirement.
  // maturityByRefId is built once at module load, so this resolves once per render.
  const cswp39EnrichedCount = useMemo(
    () => libraryData.filter((item) => maturityByRefId.has(item.referenceId)).length,
    []
  )

  // Cert-relevant allowlist — LIBRARY_OPS_PICKS referenceIds.  Used by the
  // primary-row "Cert-relevant" chip (P04 audit, PR 3.e) to narrow the corpus
  // to the curated cert-anchored set without forcing the ops persona.
  const certRelevantIdSet = useMemo<Set<string>>(
    () => new Set(LIBRARY_OPS_PICKS.map((p) => p.referenceId)),
    []
  )

  const orgs = useMemo(() => {
    const o = new Set<string>()
    libraryData.forEach((item) => {
      if (item.authorsOrOrganization) {
        item.authorsOrOrganization.split(';').forEach((s) => {
          const canonical = ORG_CANONICAL_MAP[s.trim()]
          if (canonical) o.add(canonical)
        })
      }
    })
    return ['All', ...Array.from(o).sort()]
  }, [])

  // Lifecycle bucket options with item counts for the filter dropdown
  const lifecycleOptions = useMemo(() => {
    const counts = new Map<string, number>()
    libraryData.forEach((item) => {
      const b = item.documentStatusBucket
      counts.set(b, (counts.get(b) ?? 0) + 1)
    })
    return LIFECYCLE_FILTER_OPTIONS.map((opt) => ({
      id: opt.id,
      label:
        opt.id === 'All'
          ? `All (${libraryData.length})`
          : `${opt.label} (${counts.get(opt.id as DocumentStatusBucket) ?? 0})`,
    }))
  }, [])

  // Items with New or Updated status for the activity feed
  const activityItems = useMemo(() => {
    return libraryData
      .filter((item) => item.status === 'New' || item.status === 'Updated')
      .sort((a, b) => new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime())
  }, [])

  // Category info for the sidebar
  const categoryInfo = useMemo(() => {
    return LIBRARY_CATEGORIES.map((name) => {
      const items = libraryData.filter((item) => item.categories.includes(name))
      return {
        name,
        count: items.length,
        hasUpdates: items.some((item) => item.status === 'New' || item.status === 'Updated'),
      }
    })
  }, [])

  const totalHasUpdates = activityItems.length > 0

  // Persona-preferred set — used as a default multi-category filter when
  // the user has not picked an explicit category. Researcher's empty array
  // short-circuits to "no narrowing". `usePersonaDefaults()` owns the
  // ?prefs=off URL state and the persona-change reset that previously
  // lived inline here. See `@/hooks/usePersonaDefaults`.
  const personaDefaults = usePersonaDefaults()
  const personaPreferredCategories = useMemo<string[]>(() => {
    if (personaDefaults.prefsOff) return []
    if (!selectedPersona) return []
    return PERSONA_LIBRARY_CATEGORIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
  }, [selectedPersona, personaDefaults.prefsOff])

  const personaPreferredActive = personaPreferredCategories.length > 0 && activeCategory === 'All'

  // Phase 3 — semantic search supplement. The hook returns ranked
  // referenceIds when the embedding runtime is ready. The lexical
  // filter below remains the floor; matching referenceIds are
  // unioned in so paraphrase/synonym queries surface relevant docs
  // (e.g. "long-term confidentiality" → HNDL records).
  const semantic = useSemanticSearch('library', filterText, { limit: 30 })
  const semanticIdSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  // Filtered items (shared between card and table views)
  const filteredItems = useMemo(() => {
    return libraryData.filter((item) => {
      // Category filter
      if (activeCategory !== 'All') {
        if (!item.categories.includes(activeCategory)) return false
      } else if (personaPreferredActive && !filterText) {
        // Persona-default narrowing: keep items whose categories intersect
        // the persona's preferred set when the user has not picked one.
        // Suspended when a search query is active so the user can find any
        // document regardless of their persona's preferred categories.
        const hit = item.categories?.some((c) => personaPreferredCategories.includes(c))
        if (!hit) return false
      }

      // Organization filter — match against canonical names
      if (activeOrg !== 'All') {
        const itemCanonicalOrgs = item.authorsOrOrganization
          ? item.authorsOrOrganization
              .split(';')
              .map((s) => ORG_CANONICAL_MAP[s.trim()])
              .filter(Boolean)
          : []
        if (!itemCanonicalOrgs.includes(activeOrg)) return false
      }

      // Region + Industry single-select filters were removed in the PR 3
      // drawer-consolidation pass (P04 audit). Use the multi-select
      // GeoFilter (`geo[]`) and SectorFilter (`sector[]`) instead — both
      // are evaluated below. Legacy `?region=X` / `?ind=X` URLs are
      // migrated into those arrays by the shim at mount.

      // Geo filter (multi-select, URL param: geo[])
      if (geoFilter.length > 0) {
        const regionValues = item.regionScope
          ? item.regionScope
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
        if (!matchesGeoFilter(geoFilter, regionValues)) return false
      }

      // Sector filter (multi-select, URL param: sector[])
      if (sectorFilter.length > 0) {
        const industries = item.applicableIndustries ?? []
        if (!matchesSectorFilter(sectorFilter, industries)) return false
      }

      // Trust tier filter (multi-select, URL param: tier)
      if (!matchesTrustTierFilter(tierFilter, 'library', item.referenceId)) return false

      // My bookmarks filter
      if (showOnlyLibraryBookmarks && !libraryBookmarks.includes(item.referenceId)) return false

      // CSWP 39 enriched-only filter
      if (cswp39Only && !maturityByRefId.has(item.referenceId)) return false

      // Cert-relevant allowlist filter (P04 audit, PR 3.e)
      if (certRelevantOnly && !certRelevantIdSet.has(item.referenceId)) return false

      // Lifecycle status bucket filter
      if (lifecycleBucket !== 'All' && item.documentStatusBucket !== lifecycleBucket) return false

      // Search filter — lexical floor + semantic supplement.
      if (!filterText) return true
      const searchLower = filterText.toLowerCase()
      const lexicalMatch =
        item.documentTitle.toLowerCase().includes(searchLower) ||
        item.referenceId.toLowerCase().includes(searchLower) ||
        item.shortDescription?.toLowerCase().includes(searchLower) ||
        item.categories?.some((cat) => cat.toLowerCase().includes(searchLower))
      if (lexicalMatch) return true
      // Semantic union — only kicks in when the embedding runtime is
      // ready and produced ranked hits for this query.
      if (semanticIdSet && semanticIdSet.has(item.referenceId.toLowerCase())) {
        return true
      }
      return false
    })
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
    personaPreferredActive,
    personaPreferredCategories,
  ])

  // Persona-narrow counterfactual: the set of items that would be visible
  // if the persona-preferred category narrow were lifted, with every other
  // filter applied. Powers the "X newly added documents hidden by your
  // role" banner — without this, freshly added entries that fall outside
  // the persona's preferred categories vanish silently.
  const filteredItemsNoPersonaNarrow = useMemo(() => {
    if (!personaPreferredActive) return filteredItems
    return libraryData.filter((item) => {
      if (activeCategory !== 'All' && !item.categories.includes(activeCategory)) return false
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
        const industries = item.applicableIndustries ?? []
        if (!matchesSectorFilter(sectorFilter, industries)) return false
      }
      if (!matchesTrustTierFilter(tierFilter, 'library', item.referenceId)) return false
      if (showOnlyLibraryBookmarks && !libraryBookmarks.includes(item.referenceId)) return false
      if (cswp39Only && !maturityByRefId.has(item.referenceId)) return false
      if (certRelevantOnly && !certRelevantIdSet.has(item.referenceId)) return false
      if (lifecycleBucket !== 'All' && item.documentStatusBucket !== lifecycleBucket) return false
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
    })
  }, [
    personaPreferredActive,
    filteredItems,
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
  ])

  // Count of newly added (loader-diff status='New') items that the persona
  // narrow is currently hiding. Feeds the warning-style banner variant.
  const newHiddenByPersonaCount = useMemo(() => {
    if (!personaPreferredActive) return 0
    const visibleIds = new Set(filteredItems.map((i) => i.referenceId))
    return filteredItemsNoPersonaNarrow.filter(
      (i) => i.status === 'New' && !visibleIds.has(i.referenceId)
    ).length
  }, [personaPreferredActive, filteredItems, filteredItemsNoPersonaNarrow])

  // Persona-preferred categories for secondary sort boost
  const preferredCategories = useMemo(() => {
    if (!selectedPersona) return []
    return PERSONA_LIBRARY_CATEGORIES[selectedPersona] ?? [] // eslint-disable-line security/detect-object-injection
  }, [selectedPersona])

  // Sorted items for card view — persona-preferred categories float to top
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
        items.sort((a, b) => {
          const aOrder = URGENCY_ORDER[a.migrationUrgency] ?? 99
          const bOrder = URGENCY_ORDER[b.migrationUrgency] ?? 99
          return aOrder - bOrder
        })
        break
      case 'mostCited':
        // Researcher default — highest `citationCount` first.
        // Fallback to `lastUpdateDate` when counts tie (including 0/0 — the
        // case where the corpus has not yet been enriched with citations).
        items.sort((a, b) => {
          const aCount = a.citationCount ?? 0
          const bCount = b.citationCount ?? 0
          if (bCount !== aCount) return bCount - aCount
          return new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
        })
        break
    }

    // Secondary: float persona-preferred categories to top (stable sort)
    if (preferredCategories.length > 0) {
      items.sort((a, b) => {
        const aMatch = a.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        const bMatch = b.categories?.some((c) => preferredCategories.includes(c)) ? 0 : 1
        return aMatch - bMatch
      })
    }

    return items
  }, [filteredItems, sortBy, preferredCategories])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(sortedItems, LIBRARY_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-library'))
  }, [sortedItems])

  // Grouped data for table view (preserves tree structure)
  const groupedData = useMemo(() => {
    const groups = new Map<string, LibraryItem[]>(LIBRARY_CATEGORIES.map((cat) => [cat, []]))

    filteredItems.forEach((item) => {
      const itemCategories = item.categories?.length > 0 ? item.categories : ['Migration Guidance']
      itemCategories.forEach((category) => {
        if (groups.has(category)) {
          groups.get(category)!.push(item)
        } else {
          groups.get('Migration Guidance')!.push(item)
        }
      })
    })

    // Build root nodes per category
    const categoryRoots = new Map<string, LibraryItem[]>()
    Array.from(groups.keys()).forEach((key) => {
      const itemsInGroup = groups.get(key)!
      const roots = itemsInGroup.filter((item) => {
        const isChildOfSomeoneInGroup = itemsInGroup.some((potentialParent) =>
          potentialParent.children?.some((child) => child.referenceId === item.referenceId)
        )
        return !isChildOfSomeoneInGroup
      })
      categoryRoots.set(key, roots)
    })

    return categoryRoots
  }, [filteredItems])

  const openDetail = (item: LibraryItem) => {
    setSelectedItem(item)
    // P04-P1-01: persona-attributed library item open
    logEvent('Library', 'Item Open', personaLabel(item.referenceId))
    // CC-15: drive the first-standard-read achievement for curious users.
    useAchievementStore.getState().recordSectionVisit('curious:library-read')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('ref', item.referenceId)
        return next
      },
      { replace: true }
    )
  }

  if (libraryError) {
    return <ErrorAlert message={libraryError} />
  }

  // Table content: render by category sections or single category
  const renderTableView = () => {
    const sections = activeCategory === 'All' ? [...LIBRARY_CATEGORIES] : [activeCategory]

    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section} className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              {section}
            </h3>
            {(groupedData.get(section)?.length ?? 0) > 0 ? (
              <LibraryTreeTable
                data={groupedData.get(section)!}
                defaultSort={{ key: 'lastUpdateDate', direction: 'desc' }}
                defaultExpandAll={false}
              />
            ) : (
              <EmptyState
                icon={<FileSearch size={32} />}
                title="No documents found"
                description={
                  filterText.trim() && semantic.loading
                    ? 'Semantic search is still loading — results may refine in a moment.'
                    : filterText.trim() && semantic.mode === 'semantic'
                      ? 'No direct or semantically related documents found. Try different keywords or relax filters.'
                      : 'Try adjusting your search or filter criteria.'
                }
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        pageId="library"
        title="PQC Library"
        description="Explore the latest Post-Quantum Cryptography standards, drafts, and related documents."
        dataSource={
          libraryMetadata
            ? `${libraryMetadata.filename} • Updated: ${libraryMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Library"
        shareTitle="PQC Library — NIST, IETF, ETSI & More"
        shareText="Explore post-quantum cryptography standards, drafts, and key documents from NIST, IETF, ETSI, and other organizations."
        onExport={handleExportCsv}
      />

      {/* Persona picks panel (P04 audit, PR 2). Renders a curated list of
          high-signal documents above the main library grid for personas with
          a defined "picks" set: curious / executive / ops. Other personas
          (developer / architect / researcher) see no panel. */}
      {selectedPersona === 'curious' && (
        <PersonaPicksPanel
          personaId="curious"
          title="Start here"
          subtitle="3 canonical PQC docs picked for first-time readers"
          picks={LIBRARY_CURIOUS_PICKS}
          resolveItem={(refId) => libraryData.find((d) => d.referenceId === refId)}
          onOpen={openDetail}
        />
      )}
      {selectedPersona === 'executive' && (
        <PersonaPicksPanel
          personaId="executive"
          title="Boardroom set"
          subtitle="Regulator-level PQC documents for executive decision-making"
          picks={LIBRARY_EXECUTIVE_PICKS}
          resolveItem={(refId) => libraryData.find((d) => d.referenceId === refId)}
          onOpen={openDetail}
        />
      )}
      {selectedPersona === 'ops' && (
        <PersonaPicksPanel
          personaId="ops"
          title="Cert-relevant set"
          subtitle="FIPS / CMVP-anchored documents for certification work"
          picks={LIBRARY_OPS_PICKS}
          resolveItem={(refId) => libraryData.find((d) => d.referenceId === refId)}
          onOpen={openDetail}
        />
      )}

      {/* Curious minimum-viable mode (P04 audit, PR 4) — hide the full shell
          (activity feed, category sidebar, controls bar, results grid) behind
          a single "Browse the full library" CTA so curious users see only
          header + picks + this button above the fold. */}
      {selectedPersona === 'curious' && !browseFullLibrary && (
        <div className="flex flex-col items-start gap-2">
          <Button
            variant="gradient"
            onClick={() => {
              setBrowseFullLibrary(true)
              logEvent('Library', 'Curious Browse Full', 'open')
            }}
            className="text-sm"
          >
            Browse the full library
          </Button>
          <p className="text-xs text-muted-foreground">
            All {libraryData.length} documents, filters, and the activity feed.
          </p>
        </div>
      )}

      {/* Zone 1: Activity Feed */}
      {showFullPage && (
        <ActivityFeed
          items={activityItems}
          onSelect={openDetail}
          datasetUpdated={libraryMetadata?.lastUpdate}
        />
      )}

      {showFullPage && (
        <ContentUpdatesFeed domain="library" limit={5} title="Recent Library Revisions" />
      )}

      {/* Category pills (desktop) */}
      {showFullPage && (
        <CategorySidebar
          categories={categoryInfo}
          active={activeCategory}
          onSelect={handleCategorySelect}
          totalCount={libraryData.length}
          totalHasUpdates={totalHasUpdates}
          personaPreferredActive={personaPreferredActive}
        />
      )}

      {/* Controls Bar */}
      {showFullPage && (
        <div className="bg-card border border-border rounded-lg shadow-sm p-3 space-y-3">
          {/* Top Row: Search + Essential Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full text-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                id="library-search"
                placeholder="Search standards and drafts..."
                aria-label="Search PQC standards library"
                value={inputValue}
                onChange={handleSearchChange}
                className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border transition-all font-medium ${
                showFilters ||
                activeCategory !== 'All' ||
                activeOrg !== 'All' ||
                lifecycleBucket !== 'All'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
              }`}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {/* Show badge if filters are active */}
              {(activeCategory !== 'All' || activeOrg !== 'All' || lifecycleBucket !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>

            {libraryBookmarks.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setShowOnlyLibraryBookmarks(!showOnlyLibraryBookmarks)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors font-medium whitespace-nowrap min-h-[44px] ${
                  showOnlyLibraryBookmarks
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
                aria-pressed={showOnlyLibraryBookmarks}
              >
                <BookmarkCheck size={14} />
                My ({libraryBookmarks.length})
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => {
                const next = !cswp39Only
                setCswp39Only(next)
                syncFiltersToUrl({ cswp39: next })
                logEvent('Library', 'Filter CSWP39', next ? 'on' : 'off')
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors font-medium whitespace-nowrap min-h-[44px] ${
                cswp39Only
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
              aria-pressed={cswp39Only}
              title="Show only documents with extracted CSWP 39 governance requirements"
            >
              CSWP 39 ({cswp39EnrichedCount})
            </Button>

            {/* Cert-relevant chip (P04 audit, PR 3.e) — filters to the curated
              LIBRARY_OPS_PICKS allowlist (FIPS 203/204/205, SP 800-208, etc.) */}
            <Button
              variant="ghost"
              onClick={() => {
                const next = !certRelevantOnly
                setCertRelevantOnly(next)
                syncFiltersToUrl({ cert: next })
                logEvent('Library', 'Filter CertRelevant', next ? 'on' : 'off')
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors font-medium whitespace-nowrap min-h-[44px] ${
                certRelevantOnly
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
              aria-pressed={certRelevantOnly}
              title="Show only the curated cert-relevant document set (FIPS / CMVP anchors)"
            >
              Cert-relevant ({certRelevantIdSet.size})
            </Button>

            {/* Lifecycle pill row (P04 audit, PR 3.e) — one-click access to the
              Final / Draft / Expired / Withdrawn buckets without opening the
              drawer.  Bound to the existing `lifecycleBucket` state, so the
              drawer dropdown and these pills stay in sync.
              Implements the WAI-ARIA radiogroup keyboard pattern: arrow keys
              move focus + activate the next/previous pill (with roving
              tabindex so Tab cycles through the row as one stop). */}
            {(() => {
              const LIFECYCLE_PILLS = [
                { id: 'Published', label: 'Final' },
                { id: 'Draft', label: 'Draft' },
                { id: 'Expired', label: 'Expired' },
                { id: 'Superseded', label: 'Withdrawn' },
              ] as const
              const activeIdx = LIFECYCLE_PILLS.findIndex((p) => p.id === lifecycleBucket)
              // Roving-tabindex anchor: the active pill, or the first if none active.
              const tabbableIdx = activeIdx >= 0 ? activeIdx : 0
              return (
                <div
                  className="flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Lifecycle"
                  // Radiogroup itself isn't tab-reachable — focus lives on the
                  // individual radios (roving tabindex above). tabIndex={-1}
                  // keeps it programmatically focusable, satisfying the
                  // jsx-a11y interactive-supports-focus rule without breaking
                  // the WAI-ARIA radio pattern.
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                    const focused = document.activeElement as HTMLElement | null
                    const buttons = Array.from(
                      e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role=radio]')
                    )
                    const i = buttons.findIndex((b) => b === focused)
                    if (i < 0) return
                    e.preventDefault()
                    const delta = e.key === 'ArrowRight' ? 1 : -1
                    const nextI = (i + delta + buttons.length) % buttons.length
                    buttons[nextI]?.focus()
                    buttons[nextI]?.click()
                  }}
                >
                  {LIFECYCLE_PILLS.map((opt, idx) => {
                    const active = lifecycleBucket === opt.id
                    return (
                      <Button
                        key={opt.id}
                        variant="ghost"
                        role="radio"
                        aria-checked={active}
                        tabIndex={idx === tabbableIdx ? 0 : -1}
                        onClick={() => {
                          const next = active ? 'All' : opt.id
                          setLifecycleBucket(next)
                          syncFiltersToUrl({ lifecycle: next })
                          logEvent('Library', 'Filter Lifecycle', next)
                        }}
                        className={`inline-flex items-center text-xs px-2.5 py-1.5 rounded-md border transition-colors font-medium whitespace-nowrap min-h-[36px] ${
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                        }`}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              )
            })()}

            {viewMode === 'cards' && (
              <div className="hidden sm:block">
                <SortControl
                  value={sortBy}
                  onChange={(s) => {
                    setSortBy(s)
                    syncFiltersToUrl({ sort: s })
                  }}
                />
              </div>
            )}

            <div className="hidden md:block">
              <ViewToggle
                mode={viewMode}
                onChange={(mode) => {
                  setViewMode(mode)
                  syncFiltersToUrl({ view: mode })
                }}
              />
            </div>
          </div>

          {/* Expandable Advanced Filters */}
          {showFilters && (
            <div className="pt-3 border-t border-border flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex-1 min-w-[160px]">
                <span className="text-xs font-medium text-muted-foreground mb-1 block">
                  Organization
                </span>
                <FilterDropdown
                  items={orgs}
                  selectedId={activeOrg}
                  onSelect={(org) => {
                    setActiveOrg(org)
                    syncFiltersToUrl({ org })
                    logEvent('Library', 'Filter Org', org)
                  }}
                  defaultLabel="Organization"
                  noContainer
                  opaque
                  className="mb-0 w-full"
                />
              </div>

              <div className="flex-1 min-w-[160px]">
                <span className="text-xs font-medium text-muted-foreground mb-1 block">
                  Doc Status
                </span>
                <FilterDropdown
                  items={lifecycleOptions}
                  selectedId={lifecycleBucket}
                  onSelect={(bucket) => {
                    setLifecycleBucket(bucket)
                    syncFiltersToUrl({ lifecycle: bucket })
                    logEvent('Library', 'Filter Lifecycle', bucket)
                  }}
                  defaultLabel="Doc Status"
                  noContainer
                  opaque
                  className="mb-0 w-full"
                />
              </div>

              <div className="flex-1 min-w-[160px]">
                <span className="text-xs font-medium text-muted-foreground mb-1 block">
                  Country / Region
                </span>
                <GeoFilter options={[]} className="w-full" />
              </div>

              {(!drawerIsTrimmed || showAdvancedDrawer) && (
                <div
                  id="library-advanced-drawer"
                  className="contents"
                  role={drawerIsTrimmed ? 'region' : undefined}
                  aria-label={drawerIsTrimmed ? 'Advanced filters' : undefined}
                >
                  <div className="flex-1 min-w-[160px]">
                    <span className="text-xs font-medium text-muted-foreground mb-1 block">
                      Sector
                    </span>
                    <SectorFilter className="w-full" />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <span className="text-xs font-medium text-muted-foreground mb-1 block">
                      Trust tier
                    </span>
                    <TrustTierFilter className="w-full" />
                  </div>
                </div>
              )}

              {drawerIsTrimmed && (
                <div className="w-full flex justify-start">
                  <Button
                    variant="link"
                    onClick={() => setShowAdvancedDrawer((v) => !v)}
                    className="text-xs h-auto p-0"
                    aria-expanded={showAdvancedDrawer}
                    aria-controls="library-advanced-drawer"
                  >
                    {showAdvancedDrawer ? 'Hide advanced' : 'Advanced (Sector, Trust tier)'}
                  </Button>
                </div>
              )}

              {/* Sort Dropdown for Mobile (Inside filters drawer) */}
              {viewMode === 'cards' && (
                <div className="flex-1 min-w-[160px] sm:hidden">
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">
                    Sort By
                  </span>
                  <div className="w-full">
                    <SortControl
                      value={sortBy}
                      onChange={(s) => {
                        setSortBy(s)
                        syncFiltersToUrl({ sort: s })
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Filter Chips */}
      {showFullPage && (activeOrg !== 'All' || filterText !== '') && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {filterText && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-foreground border border-border">
              <span className="text-muted-foreground">Search:</span> {filterText}
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterText('')
                  setInputValue('')
                  syncFiltersToUrl({ q: '' })
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </span>
          )}
          {activeOrg !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-foreground border border-border">
              <span className="text-muted-foreground">Org:</span> {activeOrg}
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveOrg('All')
                  syncFiltersToUrl({ org: 'All' })
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear organization filter"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </span>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setActiveOrg('All')
              setFilterText('')
              setInputValue('')
              syncFiltersToUrl({ org: 'All', q: '' })
            }}
            className="text-muted-foreground hover:text-foreground underline decoration-muted-foreground/30 hover:decoration-muted-foreground transition-all ml-1"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results count */}
      {showFullPage && (
        <div className="space-y-1" role="status" aria-live="polite">
          {personaPreferredActive ? (
            <PersonaDefaultsBanner
              matchedCount={filteredItems.length}
              totalCount={filteredItemsNoPersonaNarrow.length}
              noun="document"
              personaName={selectedPersona ?? undefined}
              newHiddenCount={newHiddenByPersonaCount}
              onReset={() => {
                personaDefaults.resetToFullSet()
                logEvent('Library', 'Persona Prefs Off', personaLabel())
              }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} document{filteredItems.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && ` in ${activeCategory}`}
            </p>
          )}
          <SemanticSearchHint
            mode={semantic.mode}
            loading={semantic.loading}
            query={filterText}
            semanticHitCount={semantic.hits.length}
            noun="related documents"
          />
        </div>
      )}

      {/* Content area */}
      {showFullPage &&
        (viewMode === 'cards' ? (
          <DocumentCardGrid
            items={sortedItems}
            onViewDetails={openDetail}
            highlightedRefId={highlightedDocId}
          />
        ) : (
          <>
            <div className="hidden md:block">{renderTableView()}</div>
            <div className="md:hidden">
              <DocumentCardGrid
                items={sortedItems}
                onViewDetails={openDetail}
                showHierarchicalAccordion
                highlightedRefId={highlightedDocId}
              />
            </div>
          </>
        ))}

      {/* Detail Popover */}
      <LibraryDetailPopover
        isOpen={!!selectedItem}
        onClose={() => {
          setSelectedItem(null)
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.delete('ref')
              return next
            },
            { replace: true }
          )
        }}
        item={selectedItem}
      />
    </div>
  )
}
