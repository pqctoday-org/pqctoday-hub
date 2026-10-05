// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search, Bookmark, BookmarkCheck, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { findLibraryItemByRef, findLibrarySuccessor, type LibraryItem } from '@/data/libraryData'
import {
  LIBRARY_DOORS as DOORS,
  type LibraryPurposeSelection as PurposeSelection,
} from '@/data/libraryPurposeDoors'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import { useLibraryPipeline } from '@/components/Library/redesign/useLibraryPipeline'
import { lifecycleLabel, formatLibDate } from '@/components/Library/redesign/libraryPills'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'
import { DocumentAnalysis } from '@/components/common/DocumentAnalysis'
import { SuccessionLinks } from '@/components/common/SuccessionLinks'
import { parseLifecycleParam } from '@/utils/libraryLifecycle'
import { cn } from '@/lib/utils'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import { MobileSheet } from '../primitives/Sheet'

type QuickView = 'all' | 'new' | 'cert' | 'bookmarked'

const QUICK_VIEWS: { id: QuickView; label: string }[] = [
  { id: 'all', label: 'All documents' },
  { id: 'new', label: 'New & updated' },
  { id: 'cert', label: 'Cert-relevant' },
  { id: 'bookmarked', label: 'Bookmarked' },
]

/**
 * Mobile Library (handoff Phase 7 — Reference set, design handoff §20).
 * Source: useLibraryPipeline.ts (the real filter/sort pipeline every
 * desktop Library surface already reads), libraryPills.ts, libraryData.ts.
 *
 * Three real corrections against the README's own §20 text, verified
 * before writing any UI:
 * - "Showing 7 of 214 · ... — search to reach the rest" doesn't exist
 *   anywhere in the codebase, and 214 matches no real denominator (full
 *   catalog is 916 active rows; Reference-purpose alone is ~696; the
 *   cert-relevant allowlist is 7). Replaced with the one real count line
 *   desktop itself renders: "{N} documents".
 * - The search placeholder ("assignee, algorithm or protocol") is a
 *   confirmed copy-paste from the Patents screen's own search — Library's
 *   real placeholder is `Search — try "ML-KEM", "FIPS 203", or "hybrid
 *   TLS"` (LibraryControlDeck.tsx), used verbatim here.
 * - "most cited this month" implies time-windowing that doesn't exist —
 *   `citationCount` is a real, all-time, dependency-graph in-degree with no
 *   monthly ranking. Not surfaced on this screen rather than mislabeled.
 *
 * Purpose-door labels/order match the real `LibraryPurposeDoors.tsx`
 * (Everything/Learn/Reference/Plan migration), not the mockup's reordering.
 * "Cert-relevant" is stated as what it really is — a 7-item curated
 * allowlist (`LIBRARY_OPS_PICKS`), not a computed corpus-wide flag.
 *
 * Distilled: no geo/sector/trust-tier/algorithm-family filters, no sort
 * picker ('published', matching every persona's real current default, unless
 * a shared link carries desktop's `?sort`), no semantic-search supplement
 * (lexical only) — stated below.
 * Sort/category/org/tier/geo/sector/algoFamily inputs are fixed to their
 * "off" values rather than exposed as controls; the pipeline itself is the
 * real one every desktop Library surface uses, not a re-derivation.
 */
type LibrarySort = Parameters<typeof useLibraryPipeline>[0]['sortBy']
// Desktop's sort options (SortControl.tsx) — a `?sort` from a shared desktop
// link orders the phone list the same way; anything else keeps the default.
const SORT_OPTIONS: readonly LibrarySort[] = [
  'newest',
  'published',
  'name',
  'referenceId',
  'urgency',
  'mostCited',
]

export function MobileLibraryView() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const toggleLibraryBookmark = useBookmarkStore((s) => s.toggleLibraryBookmark)

  // The open document lives in ?ref — the same param desktop reads — so a
  // shared /library?ref= link opens its sheet on a phone too, and Back closes it.
  // ?q and ?purpose seed the search box and door once, on arrival.
  const [params, setParams] = useSearchParams()
  const [purpose, setPurpose] = useState<PurposeSelection>(() => {
    const p = params.get('purpose')
    return DOORS.some((d) => d.id === p) ? (p as PurposeSelection) : 'all'
  })
  const [quickView, setQuickView] = useState<QuickView>('all')
  const [searchText, setSearchText] = useState(() => params.get('q') ?? '')
  const detailRef = params.get('ref')
  const sortParam = params.get('sort')
  const sortBy = SORT_OPTIONS.find((o) => o === sortParam)
  // A shared desktop link can carry ?lifecycle= (a label, or an old name such as
  // Published). The phone has no control for it, so it filters the list and shows as
  // a removable chip, as Community does for its link-only filters. A value that is
  // not a label filters nothing.
  const lifecycle = parseLifecycleParam(params.get('lifecycle')) ?? 'All'
  // Same resolution as desktop's resolveLibraryDeepLink (live ref, else the
  // document that superseded it), read straight from libraryData.
  const selected: LibraryItem | null = useMemo(
    () =>
      detailRef
        ? (findLibraryItemByRef(detailRef) ?? findLibrarySuccessor(detailRef) ?? null)
        : null,
    [detailRef]
  )
  const setDetailRef = useCallback(
    (ref: string | null) => {
      const next = new URLSearchParams(params)
      if (ref) next.set('ref', ref)
      else next.delete('ref')
      // Opening pushes (Back closes the sheet); closing replaces.
      setParams(next, { replace: !ref })
    },
    [params, setParams]
  )

  // Retired ref → swap to its successor and say so; unknown ref → say so,
  // rather than opening nothing. Scroll the list to the linked card.
  const [notice, setNotice] = useState<{ kind: 'not-found' | 'moved'; message: string } | null>(
    null
  )
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  useScrollToDeepLinkTarget(scrollTarget, scrollTarget ? deepLinkSelector(scrollTarget) : null)
  useEffect(() => {
    if (!detailRef) return
    if (!selected) {
      setNotice({
        kind: 'not-found',
        message: `No library document matches “${detailRef}”. It may have been retired, renamed or mistyped.`,
      })
      return
    }
    if (selected.referenceId !== detailRef && !findLibraryItemByRef(detailRef)) {
      setNotice({
        kind: 'moved',
        message: `“${detailRef}” has been superseded by ${selected.referenceId}. Showing it instead.`,
      })
      const next = new URLSearchParams(params)
      next.set('ref', selected.referenceId)
      setParams(next, { replace: true })
      return
    }
    setScrollTarget(selected.referenceId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per ref
  }, [detailRef])

  const certRelevantIdSet = useMemo(() => new Set(LIBRARY_OPS_PICKS.map((p) => p.referenceId)), [])

  const pipeline = useLibraryPipeline({
    activePurpose: purpose,
    activeCategory: 'All',
    activeOrg: 'All',
    filterText: searchText,
    geoFilter: [],
    sectorFilter: [],
    tierFilter: [],
    algoFamilyFilter: [],
    showOnlyLibraryBookmarks: quickView === 'bookmarked',
    libraryBookmarks,
    cswp39Only: false,
    certRelevantOnly: quickView === 'cert',
    certRelevantIdSet,
    lifecycleBucket: lifecycle,
    sortBy: sortBy ?? 'published',
    sortExplicit: sortBy !== undefined,
    selectedPersona,
    prefsOff: false,
    semanticIdSet: null,
  })

  const clearLifecycle = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('lifecycle')
    setParams(next, { replace: true })
  }, [params, setParams])

  const displayedItems =
    quickView === 'new'
      ? pipeline.sortedItems.filter((i) => i.status === 'New' || i.status === 'Updated')
      : pipeline.sortedItems

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4">
        <h1 className="sr-only">Library</h1>
        <p className="text-[11.5px] text-muted-foreground" data-testid="library-count">
          {displayedItems.length} documents
        </p>
      </div>

      {notice && (
        <DeepLinkNotice
          kind={notice.kind}
          message={notice.message}
          onDismiss={() => {
            // An unknown ref is still in the URL; drop it along with the notice.
            if (detailRef && !selected) setDetailRef(null)
            setNotice(null)
          }}
        />
      )}

      <div className="-mx-4 mb-3 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {DOORS.map((door) => {
          const Icon = door.icon
          const active = purpose === door.id
          return (
            <Button
              key={door.id}
              type="button"
              variant="ghost"
              onClick={() => setPurpose(door.id)}
              className={cn(
                'h-auto shrink-0 snap-start flex-col items-start gap-0.5 rounded-[11px] border px-3 py-2 text-left',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground'
              )}
            >
              <span className="flex items-center gap-1.5 text-[12px] font-bold">
                <Icon size={13} aria-hidden="true" />
                {door.label}
              </span>
              <span
                className={cn(
                  'text-[10px]',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {door.hint}
              </span>
            </Button>
          )
        })}
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-border bg-card px-3">
        <Search size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Search — try "ML-KEM", "FIPS 203", or "hybrid TLS"'
          className="h-11 flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="-mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1">
        {QUICK_VIEWS.map((qv) => (
          <Button
            key={qv.id}
            type="button"
            variant="ghost"
            onClick={() => setQuickView(qv.id)}
            aria-pressed={quickView === qv.id}
            className={cn(
              'h-8 shrink-0 snap-start rounded-full border px-3 text-[11px] font-semibold',
              quickView === qv.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {qv.label}
          </Button>
        ))}
      </div>

      {lifecycle !== 'All' && (
        <div
          className="mb-3 flex flex-wrap items-center gap-1.5"
          data-testid="library-link-filters"
        >
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-2.5 text-[11.5px]">
            <span className="text-muted-foreground">Status:</span>
            <span className="truncate font-medium text-foreground">{lifecycle}</span>
            <Button
              type="button"
              variant="ghost"
              aria-label="Remove Status filter"
              onClick={clearLifecycle}
              className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:bg-transparent"
            >
              <X size={12} aria-hidden="true" />
            </Button>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {displayedItems.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">No documents match these filters.</p>
        )}
        {displayedItems.map((item) => {
          const bookmarked = libraryBookmarks.includes(item.referenceId)
          const dateLabel = item.lastVerified
            ? `verified ${formatLibDate(item.lastVerified)}`
            : item.lastUpdateDate
              ? `updated ${formatLibDate(item.lastUpdateDate)}`
              : formatLibDate(item.initialPublicationDate)
          return (
            <article
              key={item.referenceId}
              data-deeplink-id={item.referenceId}
              className="glass-panel relative flex flex-col p-3.5"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLibraryBookmark(item.referenceId)
                }}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this document'}
                className={cn(
                  'absolute right-2.5 top-2.5 h-auto shrink-0 rounded p-1',
                  bookmarked ? 'text-warning' : 'text-muted-foreground/50'
                )}
              >
                {bookmarked ? (
                  <BookmarkCheck size={15} aria-hidden="true" />
                ) : (
                  <Bookmark size={15} aria-hidden="true" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDetailRef(item.referenceId)}
                // Button's own base classes hard-code whitespace-nowrap; this
                // button wraps item.documentTitle (a real document title),
                // which inherited nowrap and would run off the right edge
                // instead of wrapping (2026-08-24, same defect class found
                // and fixed on Threats/Patents).
                className="h-auto w-full flex-col items-start gap-1 whitespace-normal rounded-none p-0 pr-8 text-left font-normal"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10.5px] text-muted-foreground">
                    {item.referenceId}
                  </p>
                  <h2 className="text-[13px] font-bold leading-snug text-foreground">
                    {item.documentTitle}
                  </h2>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  {lifecycleLabel(item.lifecycleLabel)}
                  {dateLabel && ` · ${dateLabel}`}
                  {item.status && (
                    <span
                      className={cn(
                        'ml-1.5 rounded px-1.5 py-px text-sim-chip font-bold uppercase tracking-wide',
                        item.status === 'New'
                          ? 'bg-success/15 text-success'
                          : 'bg-primary/15 text-primary'
                      )}
                    >
                      {item.status}
                    </span>
                  )}
                </p>
              </Button>
            </article>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Category, organization, geography, trust-tier, and algorithm-family filters, sort options,
        and full-text semantic search are on a laptop.
      </p>

      <MobileSheet
        open={!!selected}
        onClose={() => setDetailRef(null)}
        title={selected?.referenceId}
        large
        shareUrl={selected ? `/library?ref=${encodeURIComponent(selected.referenceId)}` : undefined}
        testId="library-detail-sheet"
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-[15px] font-bold leading-snug text-foreground">
                {selected.documentTitle}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {selected.authorsOrOrganization || 'Unknown'}
                {' · '}
                {lifecycleLabel(selected.lifecycleLabel)}
                {selected.initialPublicationDate &&
                  ` · ${formatLibDate(selected.initialPublicationDate)}`}
              </p>
            </div>
            {selected.shortDescription && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.shortDescription}
              </p>
            )}
            <SuccessionLinks item={selected} onOpenRef={setDetailRef} />
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
              {[
                ['Type', selected.documentType],
                ['Algorithm family', selected.algorithmFamily],
                ['Security levels', selected.securityLevels],
                ['Region', selected.regionScope],
                ['Migration urgency', selected.migrationUrgency],
                ['Citations', selected.citationCount ? String(selected.citationCount) : undefined],
              ]
                // Screen real estate is scarce here — a row that only says "N/A" or
                // "0" costs a line without telling the reader anything, so it's
                // dropped rather than shown as a placeholder (unlike desktop, which
                // has room to list every field for completeness).
                .filter(([, v]) => v && v !== '—' && v.trim().toUpperCase() !== 'N/A')
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sim-chip font-bold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-[11.5px] text-foreground">{value}</dd>
                  </div>
                ))}
            </dl>
            {selected.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {selected.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {libraryEnrichments[selected.referenceId] && (
              <div className="border-t border-border pt-3">
                <DocumentAnalysis enrichment={libraryEnrichments[selected.referenceId]} />
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-border pt-3">
              {selected.downloadUrl ? (
                <a
                  href={selected.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[12.5px] font-bold text-primary-foreground"
                >
                  Open document
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : (
                <span className="flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-muted/50 text-[12px] font-semibold text-muted-foreground">
                  Source not available
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleLibraryBookmark(selected.referenceId)}
                aria-pressed={libraryBookmarks.includes(selected.referenceId)}
                className="h-10 gap-1.5 px-3 text-[12.5px]"
              >
                <Bookmark
                  size={14}
                  className={
                    libraryBookmarks.includes(selected.referenceId)
                      ? 'fill-primary text-primary'
                      : ''
                  }
                  aria-hidden="true"
                />
                {libraryBookmarks.includes(selected.referenceId) ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              CSWP-39 requirements, trust/evidence detail, prior revisions and endorse/flag are on a
              laptop.
            </p>
          </div>
        )}
      </MobileSheet>
    </div>
  )
}
