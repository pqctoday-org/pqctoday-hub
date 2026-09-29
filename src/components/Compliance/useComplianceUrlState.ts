// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import debounce from 'lodash/debounce'
import { useEmbedRunContext } from '@/components/shared/embedRunContext'
import { complianceBlocsForRegion, complianceRegionForCountry } from '@/data/jurisdictionsData'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'
import { defaultTabForPersona } from './obligations/roleLens'
import type { RegionBloc, DeadlinePhase } from '@/data/complianceData'
import type { FrameworkSortOption } from './ComplianceLandscape'
import type { SortColumn, SortDirection } from './ComplianceTable'
import type { RecordScope } from './recordSemantics'
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
export function defaultTabFor(
  certParam: string | undefined,
  persona: PersonaId | null,
  evref?: string,
  implied?: MobileSection | null
): MobileSection {
  // A cert deep link is a request for one record and outranks any default.
  if (certParam) return 'records'
  // Same for `?evref=` — a CSWP.39 cross-walk reference. The Assistant is
  // taught the bare form (no `?tab=`), which used to land on Rules & Standards.
  if (evref) return 'cswp39'
  // A tab-scoped item param (`?reqfw=`, `?prod=`, the CSWP.39 sub-view params)
  // names its own tab — see impliedTabFor().
  if (implied) return implied
  // Otherwise the register — it answers "which rules bind me, and why" directly,
  // where every other tab asks the visitor to filter a 197-row catalogue until
  // relevance falls out. The role lens moves an ops reader to the calendar,
  // which is the same question asked in date order.
  return defaultTabForPersona(persona)
}

/** The CSWP.39 explorer's own URL params (ADDED 2026-09-29, deep-link PR 2). */
export const CSWP39_PARAM_KEYS = ['cswpview', 'step', 'mtier', 'dossier'] as const
export type Cswp39ParamKey = (typeof CSWP39_PARAM_KEYS)[number]
export type Cswp39Params = Partial<Record<Cswp39ParamKey, string | null>>

/**
 * The tab a tab-scoped item param belongs to, for links that carry the item
 * but no `?tab=` (ADDED 2026-09-29): `?reqfw=` → Requirements, `?prod=` →
 * Products, `?cswpview=` / `?step=` / `?mtier=` / `?dossier=` → CSWP.39.
 */
export function impliedTabFor(params: URLSearchParams): MobileSection | null {
  if (params.get('reqfw')) return 'requirements'
  if (params.get('prod')) return 'products'
  if (CSWP39_PARAM_KEYS.some((k) => params.get(k))) return 'cswp39'
  return null
}

/**
 * Tab names from earlier page models that old links still carry. They used to
 * fall through `stableTabFor()` to the Landscape tab on screen while
 * `syncFiltersToUrl` treated them as a Records-branch tab, so the next filter
 * change wrote Records params onto a Landscape view.
 */
const LEGACY_TAB_ALIASES = new Map<string, MobileSection>([
  ['landscape', 'standards'],
  ['frameworks', 'standards'],
])

/** `?tab=` as a real tab — legacy aliases mapped, unknown values → null. */
export function normalizeTab(raw: string | null): MobileSection | null {
  if (!raw) return null
  return LEGACY_TAB_ALIASES.get(raw) ?? parseTabFromHash(raw)
}

const LANDSCAPE_SORTS: readonly FrameworkSortOption[] = ['name', 'deadline', 'finish']
function parseLandscapeSort(raw: string | null): FrameworkSortOption {
  return LANDSCAPE_SORTS.includes(raw as FrameworkSortOption)
    ? (raw as FrameworkSortOption)
    : 'deadline'
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
  const setSearchParams: typeof realSetSearchParams = useMemo(
    () =>
      simEmbed
        ? (nextInit) =>
            setEmbedSearchParamsState((prev) => {
              const next = new URLSearchParams(
                typeof nextInit === 'function'
                  ? (nextInit(prev) as URLSearchParams)
                  : (nextInit as URLSearchParams)
              )
              return next.toString() === prev.toString() ? prev : next
            })
        : realSetSearchParams,
    [simEmbed, realSetSearchParams]
  )
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
    const tab = normalizeTab(searchParams.get('tab'))
    if (tab) return tab
    const hashTab = typeof window !== 'undefined' ? parseTabFromHash(window.location.hash) : null
    if (hashTab) return hashTab
    // Supersedes two earlier defaults: the developer persona's jump to Product
    // Records, and the industry/region hint that picked a Landscape pillar.
    // Both were compensating for the register not existing.
    return defaultTabFor(certParam, selectedPersona, evref, impliedTabFor(searchParams))
  })
  // Which filter family the URL's shared legacy names (`q`, `sort`) belong to
  // on this first render — see the `lq` / `lsort` note below.
  const initialOnLandscape = isLandscapeTab(activeTab) || activeTab === 'foryou'

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

  // `?framework=<id>` — the open framework drawer. Derived from the URL on
  // every render (CHANGED 2026-09-28): it used to be read once in a useState
  // initializer and never written, so a second framework link while already on
  // /compliance did nothing, closing the drawer left the param behind, and
  // opening one from the page never produced a shareable URL.
  const frameworkParam = searchParams.get('framework')
  /** Open a framework's drawer — a new history entry, like any resource open. */
  const openFrameworkParam = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('framework', id)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )
  /** Close the drawer (or dismiss a not-found notice) — replaces, never pushes. */
  const clearFrameworkParam = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('framework')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  // The 3 s scroll-and-ring on the Landscape card follows each NEW framework
  // param (set-state-during-render: the React-recommended way to react to a
  // changed external value without an extra effect pass).
  const [highlightFrameworkId, setHighlightFrameworkId] = useState<string | null>(frameworkParam)
  const [lastFrameworkParam, setLastFrameworkParam] = useState(frameworkParam)
  if (frameworkParam !== lastFrameworkParam) {
    setLastFrameworkParam(frameworkParam)
    if (frameworkParam) setHighlightFrameworkId(frameworkParam)
  }
  useEffect(() => {
    if (!highlightFrameworkId) return
    const timer = setTimeout(() => setHighlightFrameworkId(null), 3000)
    return () => clearTimeout(timer)
  }, [highlightFrameworkId])

  // ── Tab-scoped item params (ADDED 2026-09-29, deep-link PR 2) ───────────
  // `?reqfw=` (Requirements framework), `?prod=` (expanded Products row) and
  // the CSWP.39 sub-view params. Derived from the URL on every render, like
  // `?framework=`, so a second link on the same mounted route is honoured.
  // `syncFiltersToUrl` drops each one when the tab it belongs to is left.
  const reqfwParam = searchParams.get('reqfw')
  const prodParam = searchParams.get('prod')
  const cswpView = searchParams.get('cswpview')
  const cswpStep = searchParams.get('step')
  const cswpTier = searchParams.get('mtier')
  const cswpDossier = searchParams.get('dossier')
  const cswp39Params: Cswp39Params = useMemo(
    () => ({ cswpview: cswpView, step: cswpStep, mtier: cswpTier, dossier: cswpDossier }),
    [cswpView, cswpStep, cswpTier, cswpDossier]
  )
  /**
   * Write tab-scoped params together with the tab they belong to (so a link
   * copied afterwards is self-describing). `null` deletes. Opening a resource
   * pushes; selection / view changes and closes replace.
   */
  const setTabParams = useCallback(
    (tab: MobileSection, patch: Record<string, string | null>, replace: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', tab)
          for (const [key, value] of Object.entries(patch)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace }
      )
    },
    [setSearchParams]
  )
  const setReqfwParam = useCallback(
    (id: string | null) => setTabParams('requirements', { reqfw: id }, true),
    [setTabParams]
  )
  const openProdParam = useCallback(
    (id: string) => setTabParams('products', { prod: id }, false),
    [setTabParams]
  )
  const clearProdParam = useCallback(
    () => setTabParams('products', { prod: null }, true),
    [setTabParams]
  )
  const setCswp39Params = useCallback(
    (patch: Cswp39Params, { push = false }: { push?: boolean } = {}) =>
      setTabParams('cswp39', patch as Record<string, string | null>, !push),
    [setTabParams]
  )

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
  // The persona/sim region is a DEFAULT scope, possibly several blocs (see
  // complianceBlocsForRegion). It narrows the landscape only while the reader
  // has not picked a region themselves and has not dismissed it, and it is
  // never written to the URL — a shared link must not carry the sharer's
  // persona scope.
  const [regionScopeDismissed, setRegionScopeDismissed] = useState(false)
  const personaRegionBlocs = useMemo(
    () => complianceBlocsForRegion(selectedRegion) as RegionBloc[],
    [selectedRegion]
  )
  const lsRegionScope: RegionBloc[] =
    lsRegionOverride !== null || regionScopeDismissed ? [] : personaRegionBlocs
  const dismissRegionScope = useCallback(() => setRegionScopeDismissed(true), [])
  const lsIndustry = lsIndustryOverride ?? scopeIndustry
  const lsRegion: RegionBloc | 'All' = lsRegionOverride ?? 'All'
  const setLsIndustry = setLsIndustryOverride
  const setLsRegion = setLsRegionOverride as (r: RegionBloc | 'All') => void
  const [lsCountry, setLsCountry] = useState<string>(() => searchParams.get('country') ?? 'All')
  const [lsDeadline, setLsDeadline] = useState<'All' | DeadlinePhase>(
    () => (searchParams.get('phase') as DeadlinePhase | null) ?? 'All'
  )
  // `?lq=` / `?lsort=` (CHANGED 2026-09-29): Landscape used to share `q` and
  // `sort` with Product Records, so a Records sort column (`sort=vendor`)
  // became an invalid Landscape sort on the next tab switch and vice versa.
  // The old shared names are still READ, but only when the link opens on a
  // Landscape / For You tab — that is what old links meant by them.
  const [lsSearch, setLsSearch] = useState(
    () => searchParams.get('lq') ?? (initialOnLandscape ? searchParams.get('q') : null) ?? ''
  )
  const [lsSearchInput, setLsSearchInput] = useState(
    () => searchParams.get('lq') ?? (initialOnLandscape ? searchParams.get('q') : null) ?? ''
  )
  const [lsSort, setLsSort] = useState<FrameworkSortOption>(() =>
    parseLandscapeSort(
      searchParams.get('lsort') ?? (initialOnLandscape ? searchParams.get('sort') : null)
    )
  )
  const [lsView, setLsView] = useState<ViewMode>(
    () => (searchParams.get('view') as ViewMode | null) ?? 'cards'
  )

  // ── Records filter state ───────────────────────────────────────────────

  const [rtab, setRtab] = useState(() => searchParams.get('rtab') ?? 'all')
  const [recSearch, setRecSearch] = useState(() =>
    initialOnLandscape ? '' : (searchParams.get('q') ?? '')
  )
  const [recSearchInput, setRecSearchInput] = useState(() =>
    initialOnLandscape ? '' : (searchParams.get('q') ?? '')
  )
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
    () => ((initialOnLandscape ? null : searchParams.get('sort')) as SortColumn | null) ?? 'date'
  )
  const [recSortDir, setRecSortDir] = useState<SortDirection>(
    () => (searchParams.get('dir') as SortDirection | null) ?? 'desc'
  )
  // `?page=` is dead (CHANGED 2026-09-29): the records table is virtualised
  // and ignores `currentPage`. The value is kept in memory for the table's
  // prop, but never read from or written to the URL; old links' `page` is
  // dropped by the next URL write.
  const [recPage, setRecPage] = useState(1)
  const [recCertId, setRecCertId] = useState<string | undefined>(
    () => searchParams.get('cert') ?? undefined
  )
  // `?rstatus=all` includes historical / archived / revoked records; the
  // default (param absent) shows current records only (Active + Validated).
  const [recScope, setRecScope] = useState<RecordScope>(() =>
    searchParams.get('rstatus') === 'all' ? 'all' : 'current'
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
      lq?: string
      lsort?: string
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
      cert?: string
      rstatus?: RecordScope
    }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const tab = overrides.tab ?? activeTab

          // Always written (CHANGED 2026-09-28). 'standards' used to be
          // deleted as "the default", but the default is defaultTabFor()
          // (Rules & Standards / Progress), so the URL→state effect below
          // bounced every Landscape / Standardize-pillar selection — and every
          // change to its filters — back off the tab. Old links without `tab`
          // still resolve through defaultTabFor().
          next.set('tab', tab)

          // Item params scoped to one tab go when that tab is left — the
          // component that read them unmounts and its state resets.
          if (tab !== 'requirements') next.delete('reqfw')
          if (tab !== 'products') next.delete('prod')
          if (tab !== 'cswp39') for (const key of CSWP39_PARAM_KEYS) next.delete(key)

          for (const key of [
            'org',
            'ind',
            // Inbound-only aliases of `ind` / `country` (CHANGED 2026-09-29).
            // They were never deleted, and the readers prefer `industry` over
            // `ind`, so one inbound `?industry=` overrode every later pick.
            'industry',
            'sector',
            'geo',
            'region',
            'country',
            'phase',
            'q',
            'sort',
            'lq',
            'lsort',
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
            'rstatus',
          ]) {
            next.delete(key)
          }

          if (isLandscapeTab(tab) || tab === 'foryou') {
            const org = overrides.org ?? lsOrg
            const ind = overrides.ind ?? lsIndustry
            const region = overrides.region ?? lsRegion
            const country = overrides.country ?? lsCountry
            const phase = overrides.phase ?? lsDeadline
            const q = overrides.lq ?? lsSearch
            const sort = overrides.lsort ?? lsSort
            const view = overrides.view ?? lsView

            if (org !== 'All') next.set('org', org)
            if (ind !== 'All') next.set('ind', ind)
            if (region !== 'All') next.set('region', region)
            if (country !== 'All') next.set('country', country)
            if (phase !== 'All') next.set('phase', phase)
            if (q) next.set('lq', q)
            if (sort !== 'deadline') next.set('lsort', sort)
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
            const cert = overrides.cert ?? recCertId
            const rstatus = overrides.rstatus ?? recScope

            if (rt !== 'all') next.set('rtab', rt)
            if (q) next.set('q', q)
            if (pqc.length > 0) next.set('pqc', pqc.join(','))
            if (cat.length > 0) next.set('cat', cat.join(','))
            if (src.length > 0) next.set('src', src.join(','))
            if (vendor.length > 0) next.set('vendor', vendor.join(','))
            if (mcat.length > 0) next.set('mcat', mcat.join(','))
            if (sort !== 'date') next.set('sort', sort)
            if (dir !== 'desc') next.set('dir', dir)
            if (cert) next.set('cert', cert)
            if (rstatus === 'all') next.set('rstatus', 'all')
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
      recCertId,
      recScope,
      setSearchParams,
    ]
  )

  // ── URL → state sync (back/forward navigation) ─────────────────────────

  useEffect(() => {
    const tab =
      normalizeTab(searchParams.get('tab')) ??
      defaultTabFor(certParam, selectedPersona, evref, impliedTabFor(searchParams))
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
      // `lq` / `lsort`, falling back to the old shared names on this branch.
      const nextQ = searchParams.get('lq') ?? searchParams.get('q') ?? ''
      const nextSort = parseLandscapeSort(searchParams.get('lsort') ?? searchParams.get('sort'))
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
      const nextCert = searchParams.get('cert') ?? undefined
      setRecCertId((prev) => (prev !== nextCert ? nextCert : prev))
      const nextScope: RecordScope = searchParams.get('rstatus') === 'all' ? 'all' : 'current'
      setRecScope((prev) => (prev !== nextScope ? nextScope : prev))
    }
    // `certParam` is derived from `searchParams` in the same render, so it can
    // never be stale here — it is listed to keep exhaustive-deps quiet rather
    // than to change when this runs.
  }, [searchParams, selectedIndustries, certParam, evref, selectedPersona])

  // ── Debounced search callbacks ─────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLsSearch = useCallback(
    debounce((value: string) => {
      setLsSearch(value)
      syncFiltersToUrl({ lq: value })
    }, 200),
    [syncFiltersToUrl]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRecSearch = useCallback(
    debounce((value: string) => {
      setRecSearch(value)
      setRecPage(1)
      syncFiltersToUrl({ rq: value })
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
      syncFiltersToUrl({ lsort: sort })
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
      syncFiltersToUrl({ pqc: filters })
    },
    [syncFiltersToUrl]
  )

  const handleRecCatChange = useCallback(
    (filters: string[]) => {
      setRecCat(filters)
      setRecPage(1)
      syncFiltersToUrl({ cat: filters })
    },
    [syncFiltersToUrl]
  )

  const handleRecSrcChange = useCallback(
    (filters: string[]) => {
      setRecSrc(filters)
      setRecPage(1)
      syncFiltersToUrl({ src: filters })
    },
    [syncFiltersToUrl]
  )

  const handleRecVendorChange = useCallback(
    (filters: string[]) => {
      setRecVendor(filters)
      setRecPage(1)
      syncFiltersToUrl({ vendor: filters })
    },
    [syncFiltersToUrl]
  )

  const handleRecMcatChange = useCallback(
    (filters: string[]) => {
      setRecMcat(filters)
      setRecPage(1)
      syncFiltersToUrl({ mcat: filters })
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

  const handleRecPageChange = useCallback((page: number) => setRecPage(page), [])

  const handleRecScopeChange = useCallback(
    (scope: RecordScope) => {
      setRecScope(scope)
      setRecPage(1)
      syncFiltersToUrl({ rstatus: scope })
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
    /** `?framework=` as it is in the URL right now (null when absent). */
    frameworkParam,
    openFrameworkParam,
    clearFrameworkParam,
    /** `?req=` — requires_pqc values to keep, or [] for "no narrowing". */
    reqFilter,
    // Tab-scoped item params (deep-link PR 2)
    reqfwParam,
    setReqfwParam,
    prodParam,
    openProdParam,
    clearProdParam,
    cswp39Params,
    setCswp39Params,
    // Landscape filter state
    lsOrg,
    lsIndustry,
    lsRegion,
    /** Persona-default region blocs (empty once the reader picks or dismisses). */
    lsRegionScope,
    dismissRegionScope,
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
    recScope,
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
    handleRecScopeChange,
  }
}
