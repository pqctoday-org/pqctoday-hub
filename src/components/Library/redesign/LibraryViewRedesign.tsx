// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryViewRedesign — the rebuilt /library page (handoff: design_handoff_library_redesign).
 *
 * Composition: PageHeader → Recently-changed strip → Start here →
 * two-pane (facet rail + results) → detail drawer. Filtering/sorting is delegated
 * to useLibraryPipeline (lifted verbatim from the live LibraryView for parity).
 * Persona is read (not written) from usePersonaStore — the shared top-bar role
 * switcher is the app's single global persona/role control (design program
 * cross-cutting rule); this page no longer renders its own persona picker
 * (LibraryRoleLens removed — see IMPLEMENTATION-PLAN-LIBRARY-2026-08-01.md §4/§6).
 * Bookmarks live in useBookmarkStore, the rest of the filter/sort/view/ref state
 * in the URL (?cat/org/q/sort/view/lifecycle/cswp39/qv/ref/prefs plus the
 * geo[]/sector[]/tier params the shared filters own).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { BookOpen, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { Button } from '@/components/ui/button'
import {
  libraryData,
  libraryMetadata,
  libraryCorpusHealth,
  findLibraryItemByRef,
  type LibraryItem,
  type LibraryPurpose,
} from '@/data/libraryData'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { GeoFilter, useGeoFilter, type GeoOption } from '@/components/common/GeoFilter'
import { SectorFilter, useSectorFilter, industryLabel } from '@/components/common/SectorFilter'
import { useTrustTierFilter } from '@/components/common/TrustTierFilter'
import {
  AlgorithmFamilyFilter,
  useAlgorithmFamilyFilter,
} from '@/components/common/AlgorithmFamilyFilter'
import { LibraryTreeTable } from '@/components/Library/LibraryTreeTable'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LIBRARY_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import type { SortOption } from '@/components/Library/SortControl'
import type { ViewMode } from '@/components/Library/ViewToggle'
import { libraryDefaultSortForPersona } from '@/data/libraryPersonaConfig'
import { useLibraryPipeline, ORG_CANONICAL_MAP, ORG_OTHER } from './useLibraryPipeline'
import { LibraryControlDeck } from './LibraryControlDeck'
import { LibraryFacetRail, type LibraryQuickView } from './LibraryFacetRail'
import { LibraryPurposeDoors, type LibraryPurposeSelection } from './LibraryPurposeDoors'
import { LibraryRecentlyChanged } from './LibraryRecentlyChanged'
import { LibraryStartHere } from './LibraryStartHere'
import { LibraryDocumentCard } from './LibraryDocumentCard'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileLibraryView } from '@/components/Mobile/screens/MobileLibraryView'

const FILTER_PARAMS = [
  'purpose',
  'cat',
  'org',
  'q',
  'lifecycle',
  'cswp39',
  'qv',
  'prefs',
  'geo',
  'sector',
  'tier',
  'algo',
]

const PURPOSE_LABELS: Record<LibraryPurpose, string> = {
  education: 'Learn',
  reference: 'Reference',
  planning: 'Plan migration',
}

const QUICK_VIEW_LABELS = new Map<string, string>([
  ['new', 'New & updated'],
  ['cert', 'Cert-relevant'],
  ['bookmarked', 'Bookmarked'],
])

// ISO-ish region_scope codes → friendly labels for the Geography facet + chips.
// EU / Global / Five-Eyes are surfaced by GeoFilter's built-in overlay options,
// so they're intentionally skipped in the per-country list (GEO_SKIP below).
const REGION_LABELS = new Map<string, string>([
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['AU', 'Australia'],
  ['CA', 'Canada'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['CN', 'China'],
  ['SG', 'Singapore'],
  ['IN', 'India'],
  ['HK', 'Hong Kong'],
  ['NL', 'Netherlands'],
  ['AE', 'United Arab Emirates'],
  ['SA', 'Saudi Arabia'],
  ['IL', 'Israel'],
  ['SE', 'Sweden'],
  ['NO', 'Norway'],
  ['CZ', 'Czechia'],
  ['MY', 'Malaysia'],
  ['ZA', 'South Africa'],
  ['KE', 'Kenya'],
  ['NZ', 'New Zealand'],
  ['G7', 'G7'],
  ['NATO', 'NATO'],
])

const GEO_OVERLAY_LABELS = new Map<string, string>([
  ['PQC-REGION-GLOBAL', 'Global'],
  ['PQC-REGION-FIVEEYES', 'Five Eyes'],
  ['PQC-REGION-EU', 'European Union'],
])

// region_scope tokens already covered by GeoFilter overlays, or too noisy to surface.
const GEO_SKIP = new Set([
  'PQC-REGION-GLOBAL',
  'PQC-REGION-FIVEEYES',
  'PQC-REGION-EU',
  'EU',
  'Global',
  'UK',
])

function geoChipLabel(code: string): string {
  return GEO_OVERLAY_LABELS.get(code) ?? REGION_LABELS.get(code) ?? code
}

export function LibraryViewRedesign({
  simEmbed = false,
  simEmbedQuery,
}: { simEmbed?: boolean; simEmbedQuery?: string } = {}) {
  // Mobile UX layer (Phase 7). `!simEmbed` matters here specifically —
  // LibraryEmbed.tsx renders this same component inside the simulation at
  // whatever viewport the player is on, and O-3 (IMPLEMENTATION-PLAN.md)
  // keeps /simulation entirely outside the mobile shell (its own separate
  // phone handling). Same guard as ThreatsDashboard.tsx.
  const isMobileShell = useIsMobileShell() && !simEmbed
  // When embedded in the sim, the library must NOT read/write the page URL (it
  // would corrupt /simulation's route) and can't nest its own <Router>. So its
  // filter URL state is backed by local state, kept API-compatible with
  // useSearchParams. (Same pattern as the legacy LibraryView / MigrateView.)
  // `simEmbedQuery` seeds the initial search so a sim step opens the library scoped
  // to its topic (e.g. CycloneDX) instead of the full list.
  const [realParams, realSetParams] = useSearchParams()
  const [embedParams, setEmbedParamsState] = useState(() => {
    const p = new URLSearchParams()
    if (simEmbedQuery) p.set('q', simEmbedQuery)
    return p
  })
  const params = simEmbed ? embedParams : realParams
  const setParams: typeof realSetParams = simEmbed
    ? (nextInit) =>
        setEmbedParamsState((prev) => {
          const next = new URLSearchParams(
            typeof nextInit === 'function'
              ? (nextInit(prev) as URLSearchParams)
              : (nextInit as URLSearchParams)
          )
          // keep object identity when unchanged so params-keyed effects don't loop
          return next.toString() === prev.toString() ? prev : next
        })
    : realSetParams
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const toggleLibraryBookmark = useBookmarkStore((s) => s.toggleLibraryBookmark)

  // Pass the (embed-aware) param source so geo/sector/tier/algo filters read from
  // the sim's local state in embed mode instead of the parent page URL (W8).
  const geoFilter = useGeoFilter(params)
  const sectorFilter = useSectorFilter(params)
  const tierFilter = useTrustTierFilter(params)
  const algoFamilyFilter = useAlgorithmFamilyFilter(params)

  // ── URL-derived state ──────────────────────────────────────────────────────
  const activePurpose = (params.get('purpose') as LibraryPurposeSelection | null) ?? 'all'
  const activeCategory = params.get('cat') ?? 'All'
  const activeOrg = params.get('org') ?? 'All'
  const filterText = params.get('q') ?? ''
  const lifecycleBucket = params.get('lifecycle') ?? 'All'
  const cswp39Only = params.get('cswp39') === '1'
  const quickView = (params.get('qv') as LibraryQuickView | null) ?? 'all'
  const prefsOff = params.get('prefs') === 'off'
  const view = (params.get('view') as ViewMode | null) ?? 'cards'
  const sortExplicit = params.get('sort') !== null
  const sortBy: SortOption =
    (params.get('sort') as SortOption | null) ?? libraryDefaultSortForPersona(selectedPersona)
  const detailRef = params.get('ref')

  const setParam = useCallback(
    (key: string, value: string | null, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params)
      if (value == null || value === '' || value === 'All' || value === 'all') next.delete(key)
      else next.set(key, value)
      setParams(next, { replace: opts?.replace })
    },
    [params, setParams]
  )

  // ── Mobile: facet rail open state + table-view URL guard ───────────────────
  const [filtersOpen, setFiltersOpen] = useState(() =>
    [
      'q',
      'purpose',
      'cat',
      'org',
      'lifecycle',
      'cswp39',
      'qv',
      'geo',
      'sector',
      'tier',
      'algo',
    ].some((k) => {
      const v = params.get(k)
      return Boolean(v) && v !== 'all' && v !== 'All'
    })
  )
  useEffect(() => {
    if (window.innerWidth < 768 && view === 'table') {
      setParam('view', 'cards')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Quick-view → pipeline flag mapping ─────────────────────────────────────
  const certRelevantOnly = quickView === 'cert'
  const showOnlyLibraryBookmarks = quickView === 'bookmarked'
  const newOnly = quickView === 'new'
  const certRelevantIdSet = useMemo(() => new Set(LIBRARY_OPS_PICKS.map((p) => p.referenceId)), [])

  // ── Semantic search supplement ─────────────────────────────────────────────
  const semantic = useSemanticSearch('library', filterText, { limit: 30 })
  const semanticIdSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  // ── Pipeline ───────────────────────────────────────────────────────────────
  const pipeline = useLibraryPipeline({
    activePurpose,
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
    sortExplicit,
    selectedPersona,
    prefsOff,
    semanticIdSet,
  })

  const displayedItems = useMemo(() => {
    if (!newOnly) return pipeline.sortedItems
    return pipeline.sortedItems.filter((i) => i.status === 'New' || i.status === 'Updated')
  }, [pipeline.sortedItems, newOnly])

  // Door counts: global per-purpose totals from the pipeline, plus the full-catalog
  // count for the "Everything" door.
  const purposeCounts = useMemo<Record<LibraryPurposeSelection, number>>(() => {
    const out: Record<LibraryPurposeSelection, number> = {
      all: libraryData.length,
      education: 0,
      reference: 0,
      planning: 0,
    }
    for (const p of pipeline.purposeInfo) out[p.id] = p.count
    return out
  }, [pipeline.purposeInfo])

  // ── Org dropdown options (canonical) ───────────────────────────────────────
  const orgs = useMemo(() => {
    const set = new Set<string>()
    let hasUnmapped = false
    for (const item of libraryData) {
      if (!item.authorsOrOrganization) continue
      let mapped = false
      for (const raw of item.authorsOrOrganization.split(';')) {
        const canon = ORG_CANONICAL_MAP[raw.trim()]
        if (canon) {
          set.add(canon)
          mapped = true
        }
      }
      if (!mapped) hasUnmapped = true
    }
    const sorted = Array.from(set).sort()
    // Append "Other" last so docs by unmapped publishers stay reachable.
    if (hasUnmapped) sorted.push(ORG_OTHER)
    return sorted
  }, [])

  // ── Geography dropdown options (derived from data, deduped vs overlays) ──────
  const geoOptions = useMemo<GeoOption[]>(() => {
    const seen = new Set<string>()
    const out: GeoOption[] = []
    for (const item of libraryData) {
      if (!item.regionScope) continue
      for (const raw of item.regionScope.split(';')) {
        const code = raw.trim()
        if (!code || GEO_SKIP.has(code) || code.includes(':')) continue
        if (seen.has(code)) continue
        seen.add(code)
        out.push({ code, label: REGION_LABELS.get(code) ?? code })
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  const detailItem: LibraryItem | null = useMemo(
    () => (detailRef ? (findLibraryItemByRef(detailRef) ?? null) : null),
    [detailRef]
  )

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(displayedItems, LIBRARY_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-library'))
  }, [displayedItems])

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(params)
    for (const p of FILTER_PARAMS) {
      next.delete(p)
      next.delete(p.replace('[]', '')) // tolerate either encoding
    }
    setParams(next, { replace: true })
  }, [params, setParams])

  const openDetail = useCallback((ref: string) => setParam('ref', ref), [setParam])
  const closeDetail = useCallback(() => setParam('ref', null), [setParam])

  // Clear a single value of a repeated-key (multi-select) filter param.
  const clearMulti = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      const remaining = next.getAll(key).filter((v) => v !== value)
      next.delete(key)
      for (const v of remaining) next.append(key, v)
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  const showNarrowBanner = pipeline.personaPreferredActive && pipeline.newHiddenByPersonaCount > 0

  // Every active filter as a removable chip (drives the chip row + empty-state reset).
  const activeFilterChips: { id: string; label: string; onClear: () => void }[] = []
  if (filterText)
    activeFilterChips.push({
      id: 'q',
      label: `“${filterText}”`,
      onClear: () => setParam('q', null),
    })
  if (activePurpose !== 'all')
    activeFilterChips.push({
      id: 'purpose',
      // eslint-disable-next-line security/detect-object-injection
      label: PURPOSE_LABELS[activePurpose],
      onClear: () => setParam('purpose', null),
    })
  if (activeCategory !== 'All')
    activeFilterChips.push({
      id: 'cat',
      label: activeCategory,
      onClear: () => setParam('cat', null),
    })
  if (activeOrg !== 'All')
    activeFilterChips.push({ id: 'org', label: activeOrg, onClear: () => setParam('org', null) })
  if (lifecycleBucket !== 'All')
    activeFilterChips.push({
      id: 'lifecycle',
      label: lifecycleBucket,
      onClear: () => setParam('lifecycle', null),
    })
  if (quickView !== 'all')
    activeFilterChips.push({
      id: 'qv',
      label: QUICK_VIEW_LABELS.get(quickView) ?? quickView,
      onClear: () => setParam('qv', null),
    })
  if (cswp39Only)
    activeFilterChips.push({
      id: 'cswp39',
      label: 'Authoritative sources',
      onClear: () => setParam('cswp39', null),
    })
  for (const code of geoFilter)
    activeFilterChips.push({
      id: `geo:${code}`,
      label: geoChipLabel(code),
      onClear: () => clearMulti('geo', code),
    })
  for (const code of sectorFilter)
    activeFilterChips.push({
      id: `sector:${code}`,
      label: industryLabel(code),
      onClear: () => clearMulti('sector', code),
    })
  for (const tier of tierFilter)
    activeFilterChips.push({
      id: `tier:${tier}`,
      label: `Trust: ${tier}`,
      onClear: () => clearMulti('tier', tier),
    })
  for (const fam of algoFamilyFilter)
    activeFilterChips.push({
      id: `algo:${fam}`,
      label: fam,
      onClear: () => clearMulti('algo', fam),
    })

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/export/endorse/flag render there now, not as
  // a row on the page itself. Mirrors TimelineView.tsx's pattern. Gated on
  // `!simEmbed`, same as the PageHeader render below.
  useEffect(() => {
    if (simEmbed) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'PQC Library',
      dataSource: libraryMetadata
        ? `${libraryMetadata.filename} • Updated: ${libraryMetadata.lastUpdate.toLocaleDateString()}`
        : undefined,
      onExport: handleExportCsv,
      endorseUrl: buildEndorsementUrl({
        category: 'library-resource-endorsement',
        title: 'Endorse: PQC Library',
        resourceType: 'Library Page',
        resourceId: 'PQC Library',
        resourceDetails:
          '**Page:** PQC Library — the standards, drafts and guidance that define post-quantum cryptography.',
        pageUrl: '/library',
      }),
      endorseLabel: 'Library Page',
      endorseResourceType: 'Library',
      flagUrl: buildFlagUrl({
        category: 'library-resource-endorsement',
        title: 'Flag: PQC Library',
        resourceType: 'Library Page',
        resourceId: 'PQC Library',
        resourceDetails:
          '**Page:** PQC Library — the standards, drafts and guidance that define post-quantum cryptography.',
        pageUrl: '/library',
      }),
      flagLabel: 'Library Page',
      flagResourceType: 'Library',
    })
    return () => clearPageActions()
  }, [simEmbed, handleExportCsv])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off/simEmbed path (Rule 1).
  if (isMobileShell) {
    return <MobileLibraryView />
  }

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      {!simEmbed && (
        <PageHeader
          icon={BookOpen}
          title="PQC Library"
          description="The standards, drafts and guidance that define post-quantum cryptography."
          actions={
            // Corpus health, stated openly (design_handoff_2026_pages/
            // IMPLEMENTATION-PLAN-LIBRARY-2026-08-01.md §3.1) — read live
            // from libraryData.ts's own count, never hardcoded. Tooltip
            // breaks down "why" using the CSV's real deprecated_reason
            // values, not invented copy.
            <span
              key="corpus-health"
              title={
                libraryCorpusHealth.reasonCounts.length > 0
                  ? `Why: ${libraryCorpusHealth.reasonCounts.map((r) => `${r.reason} (${r.count})`).join(', ')}`
                  : undefined
              }
              className="text-[11px] font-medium text-muted-foreground"
            >
              {libraryCorpusHealth.active} active
              {libraryCorpusHealth.deprecated > 0 &&
                ` · ${libraryCorpusHealth.deprecated} deprecated`}
            </span>
          }
        />
      )}

      <LibraryRecentlyChanged items={pipeline.activityItems} onOpen={openDetail} />

      <LibraryStartHere persona={selectedPersona} onOpen={openDetail} />

      <LibraryPurposeDoors
        active={activePurpose}
        counts={purposeCounts}
        onSelect={(p) => setParam('purpose', p === 'all' ? null : p)}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Filter toggle — mobile/tablet only */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setFiltersOpen((f) => !f)}
          className="flex w-full min-h-[44px] items-center justify-between rounded-lg border border-border bg-muted/20 px-4 text-sm font-semibold lg:hidden"
        >
          <span className="flex items-center gap-2">
            Filters
            {activeFilterChips.length > 0 && (
              <span className="rounded-full bg-primary/15 px-2 text-[11px] font-semibold text-primary">
                {activeFilterChips.length}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </Button>

        {/* Facet rail — collapsible on mobile, always visible on lg+ */}
        <div className={cn(filtersOpen ? 'flex' : 'hidden', 'flex-col lg:flex')}>
          <LibraryFacetRail
            quickView={quickView}
            onQuickView={(qv) => setParam('qv', qv)}
            categoryInfo={pipeline.categoryInfo}
            activeCategory={activeCategory}
            onCategory={(c) => setParam('cat', c)}
            personaPreferredCategories={pipeline.personaPreferredCategories}
            lifecycleBucket={lifecycleBucket}
            onLifecycle={(b) => setParam('lifecycle', b)}
            counts={{
              all: libraryData.length,
              new: pipeline.activityItems.length,
              cert: certRelevantIdSet.size,
              bookmarked: libraryBookmarks.length,
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <LibraryControlDeck
            search={filterText}
            onSearch={(q) => setParam('q', q, { replace: true })}
            semanticMode={semantic.mode}
            semanticLoading={semantic.loading}
            semanticHitCount={semantic.hits.length}
            sortBy={sortBy}
            onSort={(s) => setParam('sort', s)}
            view={view}
            onView={(v) => setParam('view', v)}
            orgs={orgs}
            activeOrg={activeOrg}
            onOrg={(o) => setParam('org', o)}
            authOnly={cswp39Only}
            onAuthOnly={(v) => setParam('cswp39', v ? '1' : null)}
            onReset={resetFilters}
            advancedExtra={
              <>
                <AlgorithmFamilyFilter params={params} setParams={setParams} />
                <GeoFilter options={geoOptions} params={params} setParams={setParams} />
                <SectorFilter params={params} setParams={setParams} />
                {/* Trust-tier control removed 2026-08-11 (all five pages).
                    `?tier=` still filters via useTrustTierFilter above. */}
              </>
            }
          />

          {showNarrowBanner && (
            <div className="flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-[12.5px]">
              <span className="text-foreground">
                Showing <strong>{displayedItems.length}</strong> of {libraryData.length} — narrowed
                to your role's focus areas ({pipeline.newHiddenByPersonaCount} new hidden).
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setParam('prefs', 'off')}
                className="ml-auto h-auto px-2 py-1 text-[12px] text-secondary"
              >
                Show all documents
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 px-1 text-[12.5px] text-muted-foreground">
            <span>
              {displayedItems.length} document{displayedItems.length === 1 ? '' : 's'}
            </span>
            {activeFilterChips.map((chip) => (
              <FilterChip key={chip.id} label={chip.label} onClear={chip.onClear} />
            ))}
            {activeFilterChips.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                className="h-auto px-2 py-0.5 text-[12px] text-secondary"
              >
                Clear all
              </Button>
            )}
          </div>

          {displayedItems.length === 0 ? (
            <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl p-10 text-center text-muted-foreground">
              <span>No documents match these filters.</span>
              {activeFilterChips.length > 0 && (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : view === 'table' ? (
            <>
              <div className="md:hidden rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Table view is only available on wider screens.
              </div>
              <div className="hidden md:block">
                <LibraryTreeTable data={displayedItems} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {displayedItems.map((item) => (
                <LibraryDocumentCard
                  key={item.referenceId}
                  item={item}
                  bookmarked={libraryBookmarks.includes(item.referenceId)}
                  onToggleBookmark={toggleLibraryBookmark}
                  onOpen={openDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <LibraryDetailDrawer
        item={detailItem}
        bookmarked={detailItem ? libraryBookmarks.includes(detailItem.referenceId) : false}
        onToggleBookmark={toggleLibraryBookmark}
        onClose={closeDetail}
      />
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11.5px] text-foreground">
      {label}
      <Button
        type="button"
        variant="ghost"
        aria-label={`Clear ${label}`}
        onClick={onClear}
        className="h-auto p-0 max-md:-m-1.5 max-md:p-1.5 text-muted-foreground hover:bg-transparent"
      >
        <X size={12} aria-hidden="true" />
      </Button>
    </span>
  )
}

export default LibraryViewRedesign
