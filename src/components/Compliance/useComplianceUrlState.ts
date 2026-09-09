// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import debounce from 'lodash/debounce'
import { useEmbedRunContext } from '@/components/shared/embedRunContext'
import { complianceRegionForCountry } from '@/data/jurisdictionsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { defaultTabForPersona } from './obligations/roleLens'
import type { RegionBloc, DeadlinePhase } from '@/data/complianceData'
import type { FrameworkSortOption } from './ComplianceLandscape'
import type { SortColumn, SortDirection } from './ComplianceTable'
import type { ViewMode } from '@/components/Library/ViewToggle'

// ── Section type ────────────────────────────────────────────────────────

// 'technical' is a legacy value from the pre-redesign 5-tab model — no
// current UI control ever sets it (confirmed 2026-07-16, compliance-
// maintenance audit Phase 4.4), but it stays in the union and in
// isLandscapeTab/parseTabFromHash below so an old shared `?tab=technical`
// link still resolves to the Landscape tab instead of 404ing/defaulting
// oddly. Removing it would be a silent breaking change to whatever old
// links are already out in the wild.
export type MobileSection =
  | 'obligations'
  | 'requirements'
  | 'progress'
  | 'products'
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

/**
 * The tab to show when the URL names none.
 *
 * Used by BOTH the initial state and the URL→state sync effect. They disagreed
 * until 2026-08-10: the initializer honoured `?cert=` by opening Product
 * Records, and the sync effect — which runs on mount, not just on back/forward
 * — immediately overwrote it with a hardcoded `'standards'`. A `?cert=` deep
 * link therefore landed on Landscape with the requested record nowhere on
 * screen. The simulation trees rely on those links (simTree.p6/p7), and
 * `deepLinks.test.ts` only asserts the route resolves, not what it renders,
 * so nothing caught it.
 */
function defaultTabFor(certParam: string | undefined, persona: PersonaId | null): MobileSection {
  // A cert deep link is a request for one record and outranks any default.
  if (certParam) return 'records'
  // Otherwise the register — it answers "which rules bind me, and why" directly,
  // where every other tab asks the visitor to filter a 197-row catalogue until
  // relevance falls out. The role lens moves an ops reader to the calendar,
  // which is the same question asked in date order.
  return defaultTabForPersona(persona)
}

function parseTabFromHash(hash: string): MobileSection | null {
  const clean = hash.replace(/^#/, '').trim() as MobileSection
  if (
    clean === 'obligations' ||
    clean === 'requirements' ||
    clean === 'progress' ||
    clean === 'products' ||
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

export function useComplianceUrlState(simEmbed = false, initialTab?: string, initialCert?: string) {
  // When embedded in the sim, the compliance view must NOT read/write the page URL
  // (it would corrupt /simulation's route) and can't nest its own <Router>. So the
  // whole filter/tab URL state is backed by local state here, kept API-compatible
  // with useSearchParams. (Same pattern as MigrateView / LibraryView.)
  // `initialTab` seeds the starting tab so a sim step can open e.g. the "For You"
  // (scenario-scoped) tab instead of the default landscape view. `initialCert`
  // does the same for a specific cert record (WP5.5) — without it, the standalone
  // route's `?cert=` deep-link (which reads `realSearchParams` directly) has no
  // embed-mode equivalent, so a sim step's cert focus was silently dropped.
  const [realSearchParams, realSetSearchParams] = useSearchParams()
  const [embedSearchParams, setEmbedSearchParamsState] = useState(() => {
    const p = new URLSearchParams()
    if (initialTab) p.set('tab', initialTab)
    if (initialCert) p.set('cert', initialCert)
    return p
  })
  const searchParams = simEmbed ? embedSearchParams : realSearchParams
  const setSearchParams: typeof realSetSearchParams = simEmbed
    ? (nextInit) =>
        setEmbedSearchParamsState((prev) => {
          const next = new URLSearchParams(
            typeof nextInit === 'function'
              ? (nextInit(prev) as URLSearchParams)
              : (nextInit as URLSearchParams)
          )
          return next.toString() === prev.toString() ? prev : next
        })
    : realSetSearchParams
  const {
    selectedIndustries: personaIndustries,
    selectedPersona,
    selectedRegion: personaRegion,
  } = usePersonaStore()
  // W6.3 — when this view is embedded inside a simulation run, the run's own
  // scenario is the applicable scope, not whatever the visitor last picked for
  // themselves. Falls back to the persona store on the standalone route, so
  // /compliance is completely unaffected. Read-only: the run context is never
  // written back into the persona store (see embedRunContext.tsx for why).
  const runCtx = useEmbedRunContext()
  const selectedIndustries = runCtx?.sector ? [runCtx.sector] : personaIndustries
  const selectedRegion = runCtx?.country
    ? (complianceRegionForCountry(runCtx.country) ?? personaRegion)
    : personaRegion

  const certParam = searchParams.get('cert') ?? undefined
  const evref = searchParams.get('evref') ?? undefined

  // The industry/region compliance hint used to pick the opening tab. The
  // register replaced that job (see the default below), so the computation is
  // gone from here. The old hint data (`INDUSTRY_COMPLIANCE_HINT` /
  // `REGION_COMPLIANCE_HINT` in the now-deleted compliancePersonaHints.ts)
  // had no remaining consumers anywhere — removed 2026-09-01.

  // ── Tab state ──────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<MobileSection>(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    if (tab) return tab
    const hashTab = typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : null
    if (hashTab) return hashTab
    // Supersedes two earlier defaults: the developer persona's jump to Product
    // Records, and the industry/region hint that picked a Landscape pillar.
    // Both were compensating for the register not existing.
    return defaultTabFor(certParam, selectedPersona)
  })

  /**
   * `?req=yes,expected,partial` — narrow the register to instruments that
   * actually say something about post-quantum (ADDED 2026-08-13).
   *
   * The Industry Landscape tile shows a PQC-relevant COUNT and links here.
   * Without this param the tile promised "12 PQC-relevant mandates" and the
   * register opened on all 197 — the number and its destination disagreed.
   *
   * `?pqc=` could NOT be reused: despite the name it is an ALGORITHM
   * multi-select on the Product Records tab (`recPqc` → ComplianceTable's
   * `pqcFilters`, compared against algorithm names), not a `requires_pqc`
   * filter on the framework register.
   *
   * Read-only and mount-scoped by design: no on-page control sets it, so it
   * never needs writing back, and leaving it out of `syncFiltersToUrl` means a
   * reader who then filters by hand keeps the incoming narrowing.
   */
  // Keyed on the raw string, not the searchParams object: the router hands back
  // a new instance on every navigation, which would rebuild this array — and
  // every memo downstream of it — on unrelated param changes.
  const rawReq = searchParams.get('req')
  const reqFilter = useMemo(
    () =>
      rawReq
        ? rawReq
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [rawReq]
  )

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
  // CHANGED 2026-07-31 (WP-1.1): no longer pre-resolved through resolveToNaics.
  //
  // That call collapsed an incoming value to a SINGLE NAICS code before the
  // filter ever saw it, which is what made `?ind=Finance%20%26%20Banking`
  // return nothing: it became '52', and the filter then exact-matched '52'
  // against the `industries` column, where the 12 rows carrying that literal
  // label did not have it. The raw value is now kept and resolved — to a set,
  // matching ANY — inside the filter itself.
  //
  // CHANGED 2026-08-11: sector and region now FOLLOW the top bar.
  //
  // Both were `useState` initializers reading the store once at mount, so the
  // page snapshotted the scope on first render and never heard about it again:
  // switching persona in the top bar changed the chip and nothing else. Region
  // was worse — it never read the store at all, so the page printed "Global"
  // beside a top bar reading "Americas".
  //
  // They are derived values now, not state. Precedence, in one place:
  //
  //     explicit URL param  >  in-session override  >  top bar  >  'All'
  //
  // The override slots hold `null` until the reader changes something on this
  // page, which is what lets the top bar keep driving until it shouldn't.
  const [lsIndustryOverride, setLsIndustryOverride] = useState<string | null>(
    () => searchParams.get('industry') ?? searchParams.get('ind')
  )
  const [lsRegionOverride, setLsRegionOverride] = useState<RegionBloc | 'All' | null>(
    () => searchParams.get('region') as RegionBloc | null
  )
  // Store holds 0 or 1 entries (PersonaSwitchModal writes `[id]` or `[]`); the
  // multi-value label in the top-bar chip is a persona DEFAULT for display, not
  // an assertion the reader made, so it must not become a sector here.
  const scopeIndustry = selectedIndustries[0] ?? 'All'
  const scopeRegion: RegionBloc | 'All' =
    selectedRegion && selectedRegion !== 'global' ? (selectedRegion as RegionBloc) : 'All'
  const lsIndustry = lsIndustryOverride ?? scopeIndustry
  const lsRegion = lsRegionOverride ?? scopeRegion
  const setLsIndustry = setLsIndustryOverride
  const setLsRegion = setLsRegionOverride as (r: RegionBloc | 'All') => void
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
            // Cross-tab pre-selection: honor an explicit rtab override even
            // on landscape destinations so persona-hint sub-facets
            // (Finance → ?rtab=fips) survive the jump from Certification
            // Schemes to Records.
            if (overrides.rtab && overrides.rtab !== 'all') next.set('rtab', overrides.rtab)
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
    const tab =
      (searchParams.get('tab') as MobileSection | null) ?? defaultTabFor(certParam, selectedPersona)
    setActiveTab((prev) => (prev !== tab ? tab : prev))

    if (isLandscapeTab(tab) || tab === 'foryou') {
      const nextOrg = searchParams.get('org') ?? 'All'
      // See the note on lsIndustry above — raw value, resolved in the filter.
      // On back/forward these set the OVERRIDE, and a URL that no longer
      // carries the param clears it back to null so the top bar resumes
      // control. Defaulting to 'All' here would pin the page to "no sector"
      // the first time the reader navigated back, which is the same
      // stuck-scope bug in a different costume.
      const nextInd = searchParams.get('industry') ?? searchParams.get('ind')
      const nextRegion = searchParams.get('region') as RegionBloc | null
      const nextCountry = searchParams.get('country') ?? 'All'
      const nextPhase = (searchParams.get('phase') as DeadlinePhase | null) ?? 'All'
      const nextQ = searchParams.get('q') ?? ''
      const nextSort = (searchParams.get('sort') as FrameworkSortOption) ?? 'deadline'
      const nextView = (searchParams.get('view') as ViewMode) ?? 'cards'

      setLsOrg((prev) => (prev !== nextOrg ? nextOrg : prev))
      setLsIndustryOverride((prev) => (prev !== nextInd ? nextInd : prev))
      setLsRegionOverride((prev) => (prev !== nextRegion ? nextRegion : prev))
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
    // `certParam` is derived from `searchParams` in the same render, so it can
    // never be stale here — it is listed to keep exhaustive-deps quiet rather
    // than to change when this runs.
  }, [searchParams, selectedIndustries, certParam, selectedPersona])

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
    highlightFrameworkId,
    /** `?req=` — requires_pqc values to keep, or [] for "no narrowing". */
    reqFilter,
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
