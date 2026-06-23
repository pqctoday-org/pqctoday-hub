// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryViewRedesign — the rebuilt /library page (handoff: design_handoff_library_redesign).
 *
 * Composition: PageHeader → Role Lens → Recently-changed strip → Start here →
 * two-pane (facet rail + results) → detail drawer. Filtering/sorting is delegated
 * to useLibraryPipeline (lifted verbatim from the live LibraryView for parity).
 * Persona lives in usePersonaStore, bookmarks in useBookmarkStore, the rest of the
 * filter/sort/view/ref state in the URL (?cat/org/q/sort/view/lifecycle/cswp39/qv/
 * ref/prefs plus the geo[]/sector[]/tier params the shared filters own).
 */
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, X } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { libraryData, libraryMetadata, type LibraryItem } from '@/data/libraryData'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { GeoFilter, useGeoFilter } from '@/components/common/GeoFilter'
import { SectorFilter, useSectorFilter } from '@/components/common/SectorFilter'
import { TrustTierFilter, useTrustTierFilter } from '@/components/common/TrustTierFilter'
import { LibraryTreeTable } from '@/components/Library/LibraryTreeTable'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LIBRARY_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import type { SortOption } from '@/components/Library/SortControl'
import type { ViewMode } from '@/components/Library/ViewToggle'
import type { PersonaId } from '@/data/learningPersonas'
import { libraryDefaultSortForPersona } from '@/data/libraryPersonaConfig'
import { useLibraryPipeline, ORG_CANONICAL_MAP } from './useLibraryPipeline'
import { LibraryRoleLens } from './LibraryRoleLens'
import { LibraryControlDeck } from './LibraryControlDeck'
import { LibraryFacetRail, type LibraryQuickView } from './LibraryFacetRail'
import { LibraryRecentlyChanged } from './LibraryRecentlyChanged'
import { LibraryStartHere } from './LibraryStartHere'
import { LibraryDocumentCard } from './LibraryDocumentCard'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'

const FILTER_PARAMS = [
  'cat',
  'org',
  'q',
  'lifecycle',
  'cswp39',
  'qv',
  'prefs',
  'geo[]',
  'sector[]',
  'tier',
]

export function LibraryViewRedesign({
  simEmbed = false,
  simEmbedQuery,
}: { simEmbed?: boolean; simEmbedQuery?: string } = {}) {
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
  const setPersona = usePersonaStore((s) => s.setPersona)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const toggleLibraryBookmark = useBookmarkStore((s) => s.toggleLibraryBookmark)

  const geoFilter = useGeoFilter()
  const sectorFilter = useSectorFilter()
  const tierFilter = useTrustTierFilter()

  // ── URL-derived state ──────────────────────────────────────────────────────
  const activeCategory = params.get('cat') ?? 'All'
  const activeOrg = params.get('org') ?? 'All'
  const filterText = params.get('q') ?? ''
  const lifecycleBucket = params.get('lifecycle') ?? 'All'
  const cswp39Only = params.get('cswp39') === '1'
  const quickView = (params.get('qv') as LibraryQuickView | null) ?? 'all'
  const prefsOff = params.get('prefs') === 'off'
  const view = (params.get('view') as ViewMode | null) ?? 'cards'
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
    activeCategory,
    activeOrg,
    filterText,
    geoFilter,
    sectorFilter,
    tierFilter,
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
  })

  const displayedItems = useMemo(() => {
    if (!newOnly) return pipeline.sortedItems
    return pipeline.sortedItems.filter((i) => i.status === 'New' || i.status === 'Updated')
  }, [pipeline.sortedItems, newOnly])

  // ── Org dropdown options (canonical) ───────────────────────────────────────
  const orgs = useMemo(() => {
    const set = new Set<string>()
    for (const item of libraryData) {
      if (!item.authorsOrOrganization) continue
      for (const raw of item.authorsOrOrganization.split(';')) {
        const canon = ORG_CANONICAL_MAP[raw.trim()]
        if (canon) set.add(canon)
      }
    }
    return Array.from(set).sort()
  }, [])

  const detailItem: LibraryItem | null = useMemo(
    () => (detailRef ? (libraryData.find((i) => i.referenceId === detailRef) ?? null) : null),
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

  const showNarrowBanner = pipeline.personaPreferredActive && pipeline.newHiddenByPersonaCount > 0

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      {!simEmbed && (
        <PageHeader
          icon={BookOpen}
          pageId="library"
          title="PQC Library"
          description="The standards, drafts and guidance that define post-quantum cryptography."
          dataSource={
            libraryMetadata
              ? `${libraryMetadata.filename} • Updated: ${libraryMetadata.lastUpdate.toLocaleDateString()}`
              : undefined
          }
          viewType="Library"
          shareTitle="PQC Library — NIST, IETF, ETSI & More"
          shareText="Explore post-quantum cryptography standards, drafts, and key documents."
          onExport={handleExportCsv}
        />
      )}

      <LibraryRoleLens
        selectedPersona={selectedPersona}
        onSelectPersona={(p: PersonaId) => setPersona(p)}
      />

      <LibraryRecentlyChanged items={pipeline.activityItems} onOpen={openDetail} />

      <LibraryStartHere persona={selectedPersona} onOpen={openDetail} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
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
                <GeoFilter options={[]} />
                <SectorFilter />
                <TrustTierFilter />
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

          <div className="flex items-center gap-2 px-1 text-[12.5px] text-muted-foreground">
            <span>
              {displayedItems.length} document{displayedItems.length === 1 ? '' : 's'}
            </span>
            {filterText && (
              <FilterChip label={`“${filterText}”`} onClear={() => setParam('q', null)} />
            )}
            {activeCategory !== 'All' && (
              <FilterChip label={activeCategory} onClear={() => setParam('cat', null)} />
            )}
            {activeOrg !== 'All' && (
              <FilterChip label={activeOrg} onClear={() => setParam('org', null)} />
            )}
          </div>

          {displayedItems.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
              No documents match these filters.
            </div>
          ) : view === 'table' ? (
            <LibraryTreeTable data={displayedItems} />
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
        className="h-auto p-0 text-muted-foreground hover:bg-transparent"
      >
        <X size={12} aria-hidden="true" />
      </Button>
    </span>
  )
}

export default LibraryViewRedesign
