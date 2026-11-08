// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Bookmark, CheckCircle2, Circle, CircleDot, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useModuleTopicKeywords } from '@/hooks/useModuleTopicKeywords'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import {
  BROWSE_ALL,
  BROWSE_SORT_ITEMS,
  BROWSE_STATUS_ITEMS,
  TOTAL_MODULE_COUNT,
  filterAndSortModules,
  resolveBrowseTrack,
  type BrowseSortMode,
} from '@/components/PKILearning/redesign/learnRedesign.helpers'
import { MobileSheet } from '../primitives/Sheet'
import { DESKTOP_ONLY_WORKSHOP_LABEL, workshopRunsOnPhone } from '../desktopOnlyWorkshop'

// The Filters sheet's radio buttons and checkbox keep the native input (so the keyboard, the
// grouping and the screen-reader roles come for free) but draw it from the theme's colours: a
// native control stays white in dark mode, because the site sets no `color-scheme`.
const CHECK_BASE =
  'relative h-5 w-5 shrink-0 cursor-pointer appearance-none border-2 border-muted-foreground bg-card checked:border-primary checked:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const RADIO_CLASS = `${CHECK_BASE} rounded-full before:absolute before:inset-[3px] before:scale-0 before:rounded-full before:bg-primary-foreground checked:before:scale-100`
const CHECKBOX_CLASS = `${CHECK_BASE} rounded before:absolute before:left-[5px] before:top-[1px] before:h-[10px] before:w-[5px] before:rotate-45 before:border-b-2 before:border-r-2 before:border-primary-foreground before:opacity-0 checked:before:opacity-100`

const STATUS_TEXT: Record<string, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
}

function StatusIcon({ status }: { status: string }) {
  // Three different shapes, not three colours: the state never relies on colour alone, and the
  // row's link also carries it as text for a screen reader.
  if (status === 'completed') {
    return <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
  }
  if (status === 'in-progress') {
    return <CircleDot size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
  }
  return <Circle size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
}

/**
 * "Browse all" on a phone: every module in the catalogue, found by search, track, status or
 * saved, in one list a thumb can work through. It reads the same catalogue, filter rules and
 * stores as the desktop view, so the two never disagree about which modules exist or what the
 * reader has saved or finished.
 *
 * The track and the search words live in the address (`?track=`, `?q=`, written with replace) so
 * a shared or assistant-made link such as `/learn?mode=browse&track=Protocols` opens the right
 * list, and the address always matches what is on screen. Status, sort and saved-only are
 * per-visit choices made in the Filters sheet.
 *
 * Out of scope on a phone, by decision: the workforce (NICE) lens and the algorithm and standard
 * filters stay on the desktop site.
 */
export function MobileBrowseAllView() {
  const [params, setParams] = useSearchParams()
  const modules = useModuleStore((s) => s.modules)
  const savedModules = useBookmarkStore((s) => s.myLearnModules)
  const toggleSaved = useBookmarkStore((s) => s.toggleMyLearnModule)

  const search = params.get('q') ?? ''
  // An unknown track name in the address is ignored, never an empty list.
  const track = resolveBrowseTrack(params.get('track'))
  const [status, setStatus] = useState(BROWSE_ALL)
  const [sort, setSort] = useState<BrowseSortMode>('default')
  const [savedOnly, setSavedOnly] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const baseId = useId()
  const searchId = `${baseId}-search`
  const statusName = `${baseId}-status`
  const sortName = `${baseId}-sort`

  const topicKeywords = useModuleTopicKeywords(search.trim().length > 0)
  const savedSet = useMemo(() => new Set(savedModules), [savedModules])

  const setParam = useCallback(
    (key: 'track' | 'q', value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const groups = useMemo(
    () =>
      filterAndSortModules({
        tracks: MODULE_TRACKS,
        search,
        topicKeywords,
        track,
        status,
        sort,
        savedOnly,
        savedIds: savedSet,
        progress: modules,
      }),
    [search, topicKeywords, track, status, sort, savedOnly, savedSet, modules]
  )
  const shown = groups.reduce((n, g) => n + g.modules.length, 0)
  const sheetFilterCount =
    (status !== BROWSE_ALL ? 1 : 0) + (sort !== 'default' ? 1 : 0) + (savedOnly ? 1 : 0)

  const resetSheetFilters = () => {
    setStatus(BROWSE_ALL)
    setSort('default')
    setSavedOnly(false)
  }
  const clearEverything = () => {
    resetSheetFilters()
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        next.delete('track')
        return next
      },
      { replace: true }
    )
  }

  const trackChips = [BROWSE_ALL, ...MODULE_TRACKS.map((t) => t.track)]

  return (
    <div className="flex flex-col gap-3" data-testid="mobile-browse-all">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border bg-card px-3 focus-within:border-primary">
          <Search size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor={searchId} className="sr-only">
            Search modules
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search modules"
            autoComplete="off"
            enterKeyHint="search"
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className={cn(
            'h-11 shrink-0 gap-1.5 rounded-[10px] border px-3 text-[12.5px] font-semibold',
            sheetFilterCount > 0
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-foreground'
          )}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          {/* One inline run, so the button's name reads "Filters (2 active)" in every browser. */}
          <span>
            Filters
            {sheetFilterCount > 0 && <span className="sr-only"> ({sheetFilterCount} active)</span>}
          </span>
          {sheetFilterCount > 0 && (
            <span
              aria-hidden="true"
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
            >
              {sheetFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Track chips: a scroll-snap row. Each chip is a 44 px-tall button around a smaller pill. */}
      <div
        role="group"
        aria-label="Filter by track"
        className="-mx-4 flex snap-x overflow-x-auto px-4"
      >
        {trackChips.map((t) => {
          const active = track === t
          const count =
            t === BROWSE_ALL
              ? TOTAL_MODULE_COUNT
              : (MODULE_TRACKS.find((x) => x.track === t)?.modules.length ?? 0)
          return (
            <Button
              key={t}
              type="button"
              variant="ghost"
              aria-pressed={active}
              onClick={() => setParam('track', t === BROWSE_ALL ? null : t)}
              className="h-11 shrink-0 snap-start rounded-full bg-transparent px-1 hover:bg-transparent"
            >
              <span
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                )}
              >
                {t === BROWSE_ALL ? 'All tracks' : t} · {count}
              </span>
            </Button>
          )
        })}
      </div>

      <p role="status" className="text-[12px] text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{shown}</span> of{' '}
        {TOTAL_MODULE_COUNT}
      </p>

      {shown === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-6 text-center">
          <p className="text-[12.5px] text-muted-foreground">No modules match your filters.</p>
          <Button
            type="button"
            variant="outline"
            onClick={clearEverything}
            className="h-11 rounded-[10px] px-5 text-[12.5px] font-bold"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5" data-testid="mobile-browse-list">
          {groups.map((g) => {
            const headingId = `${baseId}-track-${g.track.replace(/[^a-zA-Z0-9]+/g, '-')}`
            return (
              <section key={g.track} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="mb-2 flex items-baseline gap-2 text-[13px] font-extrabold text-foreground"
                >
                  {g.track}
                  <span className="text-[11.5px] font-normal text-muted-foreground">
                    {g.modules.length}
                  </span>
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {g.modules.map((m) => {
                    const st = modules[m.id]?.status ?? 'not-started'
                    const saved = savedSet.has(m.id)
                    return (
                      <li
                        key={m.id}
                        className="flex min-w-0 items-stretch rounded-xl border border-border bg-card"
                      >
                        <Link
                          to={`/learn/${m.id}`}
                          className="flex min-h-[44px] min-w-0 flex-1 gap-2.5 rounded-l-xl px-3 py-2.5 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <StatusIcon status={st} />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="break-words text-[13px] font-semibold leading-snug">
                              <span className="sr-only">
                                {STATUS_TEXT[st] ?? STATUS_TEXT['not-started']}:{' '}
                              </span>
                              {m.title}
                            </span>
                            <span className="text-[11.5px] text-muted-foreground">
                              {m.duration}
                              {m.difficulty ? ` · ${m.difficulty}` : ''}
                            </span>
                            {!workshopRunsOnPhone(m.id) && (
                              <span className="text-[11.5px] font-semibold text-muted-foreground">
                                {DESKTOP_ONLY_WORKSHOP_LABEL}
                              </span>
                            )}
                          </span>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-pressed={saved}
                          aria-label={`Save ${m.title}`}
                          onClick={() => toggleSaved(m.id)}
                          className={cn(
                            'h-auto min-h-[44px] w-11 shrink-0 rounded-l-none rounded-r-xl p-0',
                            saved ? 'text-status-warning' : 'text-muted-foreground'
                          )}
                        >
                          <Bookmark
                            size={18}
                            fill={saved ? 'currentColor' : 'none'}
                            aria-hidden="true"
                          />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        titleId={`${baseId}-filters-title`}
        testId="mobile-browse-filters"
      >
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Status
            </legend>
            {BROWSE_STATUS_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px] text-foreground"
              >
                <input
                  type="radio"
                  name={statusName}
                  value={item.id}
                  checked={status === item.id}
                  onChange={() => setStatus(item.id)}
                  className={RADIO_CLASS}
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col">
            <legend className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Sort by
            </legend>
            {BROWSE_SORT_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px] text-foreground"
              >
                <input
                  type="radio"
                  name={sortName}
                  value={item.id}
                  checked={sort === item.id}
                  onChange={() => setSort(item.id)}
                  className={RADIO_CLASS}
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[14px] text-foreground">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
              className={CHECKBOX_CLASS}
            />
            Saved modules only ({savedModules.length})
          </label>

          <div className="flex gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetSheetFilters}
              disabled={sheetFilterCount === 0}
              className="h-11 flex-1 rounded-[10px] text-[13px] font-semibold"
            >
              Reset filters
            </Button>
            <Button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="h-11 flex-[2] rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground"
            >
              Show {shown} {shown === 1 ? 'module' : 'modules'}
            </Button>
          </div>
        </div>
      </MobileSheet>
    </div>
  )
}
