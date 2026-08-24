// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import {
  Search,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  GraduationCap,
  BookMarked,
  Route,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { LibraryPurpose } from '@/data/libraryData'
import { LIBRARY_OPS_PICKS } from '@/data/libraryOpsPicks'
import { useLibraryPipeline } from '@/components/Library/redesign/useLibraryPipeline'
import { lifecycleLabel, formatLibDate } from '@/components/Library/redesign/libraryPills'
import { cn } from '@/lib/utils'

type PurposeSelection = LibraryPurpose | 'all'
type QuickView = 'all' | 'new' | 'cert' | 'bookmarked'

const DOORS: { id: PurposeSelection; label: string; hint: string; icon: typeof LayoutGrid }[] = [
  { id: 'all', label: 'Everything', hint: 'The full catalog', icon: LayoutGrid },
  { id: 'education', label: 'Learn', hint: 'Research, analysis & explainers', icon: GraduationCap },
  { id: 'reference', label: 'Reference', hint: 'Standards, specs & policy', icon: BookMarked },
  { id: 'planning', label: 'Plan migration', hint: 'Guidance & report picks', icon: Route },
]

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
 * picker (fixed at 'published', matching every persona's real current
 * default), no semantic-search supplement (lexical only) — stated below.
 * Sort/category/org/tier/geo/sector/algoFamily inputs are fixed to their
 * "off" values rather than exposed as controls; the pipeline itself is the
 * real one every desktop Library surface uses, not a re-derivation.
 */
export function MobileLibraryView() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const toggleLibraryBookmark = useBookmarkStore((s) => s.toggleLibraryBookmark)

  const [purpose, setPurpose] = useState<PurposeSelection>('all')
  const [quickView, setQuickView] = useState<QuickView>('all')
  const [searchText, setSearchText] = useState('')

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
    lifecycleBucket: 'All',
    sortBy: 'published',
    sortExplicit: false,
    selectedPersona,
    prefsOff: false,
    semanticIdSet: null,
  })

  const displayedItems =
    quickView === 'new'
      ? pipeline.sortedItems.filter((i) => i.status === 'New' || i.status === 'Updated')
      : pipeline.sortedItems

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Library</h1>
        <p className="text-[11.5px] text-muted-foreground" data-testid="library-count">
          {displayedItems.length} documents
        </p>
      </div>

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
            <article key={item.referenceId} className="glass-panel flex flex-col gap-1 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10.5px] text-muted-foreground">
                    {item.referenceId}
                  </p>
                  <h2 className="text-[13px] font-bold leading-snug text-foreground">
                    {item.documentTitle}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleLibraryBookmark(item.referenceId)}
                  aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this document'}
                  className={cn(
                    'h-auto shrink-0 rounded p-1',
                    bookmarked ? 'text-warning' : 'text-muted-foreground/50'
                  )}
                >
                  {bookmarked ? (
                    <BookmarkCheck size={15} aria-hidden="true" />
                  ) : (
                    <Bookmark size={15} aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                {lifecycleLabel(item.documentStatusBucket)}
                {dateLabel && ` · ${dateLabel}`}
                {item.status && (
                  <span
                    className={cn(
                      'ml-1.5 rounded px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide',
                      item.status === 'New'
                        ? 'bg-success/15 text-success'
                        : 'bg-primary/15 text-primary'
                    )}
                  >
                    {item.status}
                  </span>
                )}
              </p>
            </article>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Category, organization, geography, trust-tier, and algorithm-family filters, sort options,
        and full-text semantic search are on a laptop.
      </p>
    </div>
  )
}
