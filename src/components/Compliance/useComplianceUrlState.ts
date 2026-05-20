// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import debounce from 'lodash/debounce'
import { usePersonaStore } from '@/store/usePersonaStore'
import { resolveToNaics } from '@/components/common/SectorFilter'
import { INDUSTRY_COMPLIANCE_HINT, REGION_COMPLIANCE_HINT } from '@/data/compliancePersonaHints'
import type { RegionBloc, DeadlinePhase } from '@/data/complianceData'
import type { FrameworkSortOption } from './ComplianceLandscape'
import type { SortColumn, SortDirection } from './ComplianceTable'
import type { ViewMode } from '@/components/Library/ViewToggle'
import type { LandscapeType } from './LandscapeTypeFacet'

// ── Section type ────────────────────────────────────────────────────────

export type MobileSection =
  | 'foryou'
  | 'standards'
  | 'technical'
  | 'certification'
  | 'compliance'
  | 'records'
  | 'cswp39'

// ── Helpers ─────────────────────────────────────────────────────────────

export function isLandscapeTab(tab: MobileSection): boolean {
  return (
    tab === 'standards' || tab === 'technical' || tab === 'certification' || tab === 'compliance'
  )
}

function parseTabFromHash(hash: string): MobileSection | null {
  const clean = hash.replace(/^#/, '').trim() as MobileSection
  if (
    clean === 'foryou' ||
    clean === 'standards' ||
    clean === 'technical' ||
    clean === 'certification' ||
    clean === 'compliance' ||
    clean === 'records' ||
    clean === 'cswp39'
  ) {
    return clean
  }
  return null
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useComplianceUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedIndustries, selectedRegion, selectedPersona } = usePersonaStore()

  const certParam = searchParams.get('cert') ?? undefined
  const evref = searchParams.get('evref') ?? undefined

  // Resolve the persona-based hint once so it can influence the default tab
  const primaryIndustry = selectedIndustries[0] ?? null

  const complianceHint = primaryIndustry
    ? INDUSTRY_COMPLIANCE_HINT[primaryIndustry]
    : selectedRegion
      ? // eslint-disable-next-line security/detect-object-injection
        REGION_COMPLIANCE_HINT[selectedRegion]
      : undefined

  // ── Tab state ──────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<MobileSection>(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    if (tab) return tab
    const hashTab = typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : null
    if (hashTab) return hashTab
    if (!certParam && !complianceHint && selectedPersona === 'developer') return 'records'
    return (certParam ? 'records' : (complianceHint?.section ?? 'standards')) as MobileSection
  })

  const [landscapeType, setLandscapeType] = useState<LandscapeType>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'standards') return 'bodies'
    if (tab === 'technical') return 'standards'
    if (tab === 'certification') return 'certifications'
    if (tab === 'compliance') return 'regulations'
    return 'regulations'
  })

  const [highlightFrameworkId, setHighlightFrameworkId] = useState<string | null>(
    () => searchParams.get('framework') ?? null
  )
  useEffect(() => {
    if (!highlightFrameworkId) return
    const timer = setTimeout(() => setHighlightFrameworkId(null), 3000)
    return () => clearTimeout(timer)
  }, [highlightFrameworkId])

  // ── Landscape filter state ─────────────────────────────────────────────

  const [lsOrg, setLsOrg] = useState(() => searchParams.get('org') ?? 'All')
  const [lsIndustry, setLsIndustry] = useState(() =>
    resolveToNaics(
      searchParams.get('industry') ??
        searchParams.get('ind') ??
        (selectedIndustries.length === 1 ? selectedIndustries[0] : 'All')
    )
  )
  const [lsRegion, setLsRegion] = useState<RegionBloc | 'All'>(
    () => (searchParams.get('region') as RegionBloc | null) ?? 'All'
  )
  const [lsCountry, setLsCountry] = useState<string>(() => searchParams.get('country') ?? 'All')
  const [lsDeadline, setLsDeadline] = useState<'All' | DeadlinePhase>(
    () => (searchParams.get('phase') as DeadlinePhase | null) ?? 'All'
  )
  const [lsSearch, setLsSearch] = useState(() => searchParams.get('q') ?? '')
  const [lsSearchInput, setLsSearchInput] = useState(() => searchParams.get('q') ?? '')
  const [lsSort, setLsSort] = useState<FrameworkSortOption>(
    () => (searchParams.get('sort') as FrameworkSortOption | null) ?? 'deadline'
  )
  const [lsView, setLsView] = useState<ViewMode>(
    () => (searchParams.get('view') as ViewMode | null) ?? 'cards'
  )

  // ── Records filter state ───────────────────────────────────────────────

  const [rtab, setRtab] = useState(() => searchParams.get('rtab') ?? 'all')
  const [recSearch, setRecSearch] = useState(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    return tab === 'records' ? (searchParams.get('q') ?? '') : ''
  })
  const [recSearchInput, setRecSearchInput] = useState(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    return tab === 'records' ? (searchParams.get('q') ?? '') : ''
  })
  const [recPqc, setRecPqc] = useState<string[]>(
    () => searchParams.get('pqc')?.split(',').filter(Boolean) ?? []
  )
  const [recCat, setRecCat] = useState<string[]>(
    () => searchParams.get('cat')?.split(',').filter(Boolean) ?? []
  )
  const [recSrc, setRecSrc] = useState<string[]>(
    () => searchParams.get('src')?.split(',').filter(Boolean) ?? []
  )
  const [recVendor, setRecVendor] = useState<string[]>(
    () => searchParams.get('vendor')?.split(',').filter(Boolean) ?? []
  )
  const [recMcat, setRecMcat] = useState<string[]>(
    () => searchParams.get('mcat')?.split(',').filter(Boolean) ?? []
  )
  const [recSortCol, setRecSortCol] = useState<SortColumn>(
    () => (searchParams.get('sort') as SortColumn | null) ?? 'date'
  )
  const [recSortDir, setRecSortDir] = useState<SortDirection>(
    () => (searchParams.get('dir') as SortDirection | null) ?? 'desc'
  )
  const [recPage, setRecPage] = useState(() => parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const [recCertId, setRecCertId] = useState<string | undefined>(
    () => searchParams.get('cert') ?? undefined
  )

  // ── syncFiltersToUrl ──────────────────────────────────────────────────

  const syncFiltersToUrl = useCallback(
    (overrides: {
      tab?: MobileSection
      org?: string
      ind?: string
      region?: RegionBloc | 'All'
      country?: string
      phase?: 'All' | DeadlinePhase
      q?: string
      sort?: string
      view?: ViewMode
      rtab?: string
      rq?: string
      pqc?: string[]
      cat?: string[]
      src?: string[]
      vendor?: string[]
      mcat?: string[]
      rsort?: string
      dir?: SortDirection
      page?: number
      cert?: string
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const tab = overrides.tab ?? activeTab

          if (tab !== 'standards') next.set('tab', tab)
          else next.delete('tab')

          for (const key of [
            'org',
            'ind',
            'region',
            'country',
            'phase',
            'q',
            'sort',
            'view',
            'rtab',
            'pqc',
            'cat',
            'src',
            'vendor',
            'mcat',
            'dir',
            'page',
            'cert',
          ]) {
            next.delete(key)
          }

          if (isLandscapeTab(tab) || tab === 'foryou') {
            const org = overrides.org ?? lsOrg
            const ind = overrides.ind ?? lsIndustry
            const region = overrides.region ?? lsRegion
            const country = overrides.country ?? lsCountry
            const phase = overrides.phase ?? lsDeadline
            const q = overrides.q ?? lsSearch
            const sort = overrides.sort ?? lsSort
            const view = overrides.view ?? lsView

            if (org !== 'All') next.set('org', org)
            if (ind !== 'All') next.set('ind', ind)
            if (region !== 'All') next.set('region', region)
            if (country !== 'All') next.set('country', country)
            if (phase !== 'All') next.set('phase', phase)
            if (q) next.set('q', q)
            if (sort !== 'deadline') next.set('sort', sort)
            if (view !== 'cards') next.set('view', view)
          } else {
            const rt = overrides.rtab ?? rtab
            const q = overrides.rq ?? recSearch
            const pqc = overrides.pqc ?? recPqc
            const cat = overrides.cat ?? recCat
            const src = overrides.src ?? recSrc
            const vendor = overrides.vendor ?? recVendor
            const mcat = overrides.mcat ?? recMcat
            const sort = overrides.rsort ?? recSortCol
            const dir = overrides.dir ?? recSortDir
            const page = overrides.page ?? recPage
            const cert = overrides.cert ?? recCertId

            if (rt !== 'all') next.set('rtab', rt)
            if (q) next.set('q', q)
            if (pqc.length > 0) next.set('pqc', pqc.join(','))
            if (cat.length > 0) next.set('cat', cat.join(','))
            if (src.length > 0) next.set('src', src.join(','))
            if (vendor.length > 0) next.set('vendor', vendor.join(','))
            if (mcat.length > 0) next.set('mcat', mcat.join(','))
            if (sort !== 'date') next.set('sort', sort)
            if (dir !== 'desc') next.set('dir', dir)
            if (page > 1) next.set('page', String(page))
            if (cert) next.set('cert', cert)
          }

          return next
        },
        { replace: true }
      )
    },
    [
      activeTab,
      lsOrg,
      lsIndustry,
      lsRegion,
      lsCountry,
      lsDeadline,
      lsSearch,
      lsSort,
      lsView,
      rtab,
      recSearch,
      recPqc,
      recCat,
      recSrc,
      recVendor,
      recMcat,
      recSortCol,
      recSortDir,
      recPage,
      recCertId,
      setSearchParams,
    ]
  )

  // ── URL → state sync (back/forward navigation) ─────────────────────────

  useEffect(() => {
    const tab = (searchParams.get('tab') as MobileSection | null) ?? 'standards'
    setActiveTab((prev) => (prev !== tab ? tab : prev))

    if (isLandscapeTab(tab) || tab === 'foryou') {
      const nextOrg = searchParams.get('org') ?? 'All'
      const nextInd = resolveToNaics(
        searchParams.get('ind') ?? (selectedIndustries.length === 1 ? selectedIndustries[0] : 'All')
      )
      const nextRegion = (searchParams.get('region') as RegionBloc | null) ?? 'All'
      const nextCountry = searchParams.get('country') ?? 'All'
      const nextPhase = (searchParams.get('phase') as DeadlinePhase | null) ?? 'All'
      const nextQ = searchParams.get('q') ?? ''
      const nextSort = (searchParams.get('sort') as FrameworkSortOption) ?? 'deadline'
      const nextView = (searchParams.get('view') as ViewMode) ?? 'cards'

      setLsOrg((prev) => (prev !== nextOrg ? nextOrg : prev))
      setLsIndustry((prev) => (prev !== nextInd ? nextInd : prev))
      setLsRegion((prev) => (prev !== nextRegion ? nextRegion : prev))
      setLsCountry((prev) => (prev !== nextCountry ? nextCountry : prev))
      setLsDeadline((prev) => (prev !== nextPhase ? nextPhase : prev))
      setLsSearch((prev) => (prev !== nextQ ? nextQ : prev))
      setLsSearchInput((prev) => (prev !== nextQ ? nextQ : prev))
      setLsSort((prev) => (prev !== nextSort ? nextSort : prev))
      setLsView((prev) => (prev !== nextView ? nextView : prev))
    } else {
      const nextRtab = searchParams.get('rtab') ?? 'all'
      const nextQ = searchParams.get('q') ?? ''
      const nextPqc = searchParams.get('pqc')?.split(',').filter(Boolean) ?? []
      const nextCat = searchParams.get('cat')?.split(',').filter(Boolean) ?? []
      const nextSrc = searchParams.get('src')?.split(',').filter(Boolean) ?? []
      const nextVendor = searchParams.get('vendor')?.split(',').filter(Boolean) ?? []
      const nextMcat = searchParams.get('mcat')?.split(',').filter(Boolean) ?? []
      const nextSort = (searchParams.get('sort') as SortColumn) ?? 'date'
      const nextDir = (searchParams.get('dir') as SortDirection) ?? 'desc'
      const nextPage = parseInt(searchParams.get('page') ?? '1', 10) || 1

      setRtab((prev) => (prev !== nextRtab ? nextRtab : prev))
      setRecSearch((prev) => (prev !== nextQ ? nextQ : prev))
      setRecSearchInput((prev) => (prev !== nextQ ? nextQ : prev))
      setRecPqc((prev) => (JSON.stringify(prev) !== JSON.stringify(nextPqc) ? nextPqc : prev))
      setRecCat((prev) => (JSON.stringify(prev) !== JSON.stringify(nextCat) ? nextCat : prev))
      setRecSrc((prev) => (JSON.stringify(prev) !== JSON.stringify(nextSrc) ? nextSrc : prev))
      setRecVendor((prev) =>
        JSON.stringify(prev) !== JSON.stringify(nextVendor) ? nextVendor : prev
      )
      setRecMcat((prev) => (JSON.stringify(prev) !== JSON.stringify(nextMcat) ? nextMcat : prev))
      setRecSortCol((prev) => (prev !== nextSort ? nextSort : prev))
      setRecSortDir((prev) => (prev !== nextDir ? nextDir : prev))
      setRecPage((prev) => (prev !== nextPage ? nextPage : prev))
      const nextCert = searchParams.get('cert') ?? undefined
      setRecCertId((prev) => (prev !== nextCert ? nextCert : prev))
    }
  }, [searchParams, selectedIndustries])

  // ── Debounced search callbacks ─────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLsSearch = useCallback(
    debounce((value: string) => {
      setLsSearch(value)
      syncFiltersToUrl({ q: value })
    }, 200),
    [syncFiltersToUrl]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRecSearch = useCallback(
    debounce((value: string) => {
      setRecSearch(value)
      setRecPage(1)
      syncFiltersToUrl({ rq: value, page: 1 })
    }, 200),
    [syncFiltersToUrl]
  )

  // ── Landscape handlers ────────────────────────────────────────────────

  const handleLsOrgChange = useCallback(
    (org: string) => {
      setLsOrg(org)
      syncFiltersToUrl({ org })
    },
    [syncFiltersToUrl]
  )

  const handleLsIndustryChange = useCallback(
    (ind: string) => {
      setLsIndustry(ind)
      syncFiltersToUrl({ ind })
    },
    [syncFiltersToUrl]
  )

  const handleLsRegionChange = useCallback(
    (region: RegionBloc | 'All') => {
      setLsRegion(region)
      syncFiltersToUrl({ region })
    },
    [syncFiltersToUrl]
  )

  const handleLsCountryChange = useCallback(
    (country: string) => {
      setLsCountry(country)
      syncFiltersToUrl({ country })
    },
    [syncFiltersToUrl]
  )

  const handleLsDeadlineChange = useCallback(
    (phase: 'All' | DeadlinePhase) => {
      setLsDeadline(phase)
      syncFiltersToUrl({ phase })
    },
    [syncFiltersToUrl]
  )

  const handleLsSearchChange = useCallback(
    (text: string) => {
      setLsSearchInput(text)
      debouncedLsSearch(text)
    },
    [debouncedLsSearch]
  )

  const handleLsSortChange = useCallback(
    (sort: FrameworkSortOption) => {
      setLsSort(sort)
      syncFiltersToUrl({ sort })
    },
    [syncFiltersToUrl]
  )

  const handleLsViewChange = useCallback(
    (mode: ViewMode) => {
      setLsView(mode)
      syncFiltersToUrl({ view: mode })
    },
    [syncFiltersToUrl]
  )

  // ── Records handlers ──────────────────────────────────────────────────

  const handleRtabChange = useCallback(
    (value: string) => {
      setRtab(value)
      syncFiltersToUrl({ rtab: value })
    },
    [syncFiltersToUrl]
  )

  const handleRecSearchChange = useCallback(
    (text: string) => {
      setRecSearchInput(text)
      debouncedRecSearch(text)
    },
    [debouncedRecSearch]
  )

  const handleRecPqcChange = useCallback(
    (filters: string[]) => {
      setRecPqc(filters)
      setRecPage(1)
      syncFiltersToUrl({ pqc: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecCatChange = useCallback(
    (filters: string[]) => {
      setRecCat(filters)
      setRecPage(1)
      syncFiltersToUrl({ cat: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecSrcChange = useCallback(
    (filters: string[]) => {
      setRecSrc(filters)
      setRecPage(1)
      syncFiltersToUrl({ src: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecVendorChange = useCallback(
    (filters: string[]) => {
      setRecVendor(filters)
      setRecPage(1)
      syncFiltersToUrl({ vendor: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecMcatChange = useCallback(
    (filters: string[]) => {
      setRecMcat(filters)
      setRecPage(1)
      syncFiltersToUrl({ mcat: filters, page: 1 })
    },
    [syncFiltersToUrl]
  )

  const handleRecSortColChange = useCallback(
    (col: SortColumn) => {
      setRecSortCol(col)
      syncFiltersToUrl({ rsort: col })
    },
    [syncFiltersToUrl]
  )

  const handleRecSortDirChange = useCallback(
    (dir: SortDirection) => {
      setRecSortDir(dir)
      syncFiltersToUrl({ dir })
    },
    [syncFiltersToUrl]
  )

  const handleRecPageChange = useCallback(
    (page: number) => {
      setRecPage(page)
      syncFiltersToUrl({ page })
    },
    [syncFiltersToUrl]
  )

  return {
    // Raw URL access (needed for evref / cert mutations in ComplianceView)
    searchParams,
    setSearchParams,
    certParam,
    evref,
    // Tab state
    activeTab,
    setActiveTab,
    landscapeType,
    setLandscapeType,
    highlightFrameworkId,
    // Landscape filter state
    lsOrg,
    lsIndustry,
    lsRegion,
    lsCountry,
    lsDeadline,
    lsSearch,
    setLsSearch,
    lsSearchInput,
    setLsSearchInput,
    lsSort,
    lsView,
    // Records filter state
    rtab,
    recSearch,
    recSearchInput,
    recPqc,
    recCat,
    recSrc,
    recVendor,
    recMcat,
    recSortCol,
    recSortDir,
    recPage,
    recCertId,
    // URL writer
    syncFiltersToUrl,
    // Landscape handlers
    handleLsOrgChange,
    handleLsIndustryChange,
    handleLsRegionChange,
    handleLsCountryChange,
    handleLsDeadlineChange,
    handleLsSearchChange,
    handleLsSortChange,
    handleLsViewChange,
    // Records handlers
    handleRtabChange,
    handleRecSearchChange,
    handleRecPqcChange,
    handleRecCatChange,
    handleRecSrcChange,
    handleRecVendorChange,
    handleRecMcatChange,
    handleRecSortColChange,
    handleRecSortDirChange,
    handleRecPageChange,
  }
}
