// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Globe, CalendarClock } from 'lucide-react'
import {
  timelineData,
  transformToGanttData,
  eventLinkKey,
  findEventInGantt,
  findTimelineEvent,
  phaseRowKey,
  resolveCountryParam,
  retiredTimelineEventSuccessor,
  type ResolvedTimelineEvent,
} from '@/data/timelineData'
import { applyTimelineScope } from '@/data/timelineScope'
import { REGION_COUNTRY_MAP, PERSONA_TIMELINE_REGION } from '@/data/personaConfig'
import { REGION_JURISDICTION_NAMES } from '@/data/jurisdictionsData'
import { timelineRegionCountries } from '@/data/timelineRegionCountries'
import { searchLane } from '@/data/timelineViewFilter'
import { REGION_LABELS } from '@/data/regionIndustryOptions'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { Region } from '@/store/usePersonaStore'
import type { GanttCountryData } from '@/types/timeline'
import { WhenDoesThisReachMe } from '@/components/Timeline/WhenDoesThisReachMe'
import { MobileTimelineList } from '@/components/Timeline/MobileTimelineList'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import { Button } from '@/components/ui/button'

// ACCEPTED duplication (2026-08-24 audit R3.7 — extraction ruled
// disproportionate for a 2-value Set): verified copy of
// CoverageByRegion.tsx's own MIGRATION_PLUS_PHASES, the two real execution
// stages on the technical-readiness track (Discovery → Testing → POC →
// Migration → Standardization). That file is desktop-only chrome with
// nothing else reusable, so a whole module for one Set felt like more
// surface than the 2 literals it would replace. Checked by the
// mobile.driftguard test (R3.4) — flag here first if that test ever moves.
const MIGRATION_PLUS_PHASES = new Set(['Migration', 'Standardization'])

/**
 * "Next recorded milestone" banner. Same phase-sort/next-pick
 * logic WhenDoesThisReachMe.tsx uses internally (`trackFor`, not exported —
 * copied rather than routed through a prop, to keep this file's boundary
 * with that component at just its public `{data, countryName}` props),
 * extended one step further to also name the phase AFTER next, so the
 * banner can honestly say how long the calm stretch afterward is.
 *
 * The real data is year-granular only (no month field anywhere in
 * types/timeline.ts), so the interface deliberately avoids month-level
 * precision. Shown only when the next phase starts this year or next.
 */
function nextTwoPhases(country: GanttCountryData | undefined) {
  if (!country) return null
  const year = new Date().getFullYear()
  const phases = [...country.phases]
    .filter((p) => Number.isFinite(p.startYear) && p.startYear > 0)
    .sort((a, b) => a.startYear - b.startYear)
  const nextIdx = phases.findIndex((p) => p.startYear >= year)
  if (nextIdx < 0) return null
  const next = phases[nextIdx]
  if (next.startYear > year + 1) return null
  const afterNext = phases[nextIdx + 1] ?? null
  return { next, afterNext, year }
}

/**
 * Mobile Timeline (handoff Phase 7 — Reference set, design handoff §17).
 * Distilled, not a port of TimelineView.tsx's 756 lines: no region-switcher,
 * deadlines-only filter, phase-color legend, category/tier filter UI,
 * search, CSV/.ics export, left-rail TOC, or 5-tile CoverageByRegion grid —
 * stated below rather than silently dropped.
 *
 * Reuses real, already-shipped components verbatim — WhenDoesThisReachMe and
 * MobileTimelineList both already exist under src/components/Timeline/ (the
 * latter is the legacy <768px breakpoint's own mobile view, already phone-
 * tested; §17's "compact is the default view" is honored via its new
 * `defaultMode` prop), so this screen is chrome and data-derivation around
 * them, not a rewrite. Same data pipeline desktop's own `ganttData` memo
 * uses (`applyTimelineScope` with no override applies the same default
 * government+standards category scope desktop starts from; no tier filter,
 * since desktop's own tier control has been unmounted since 2026-08-11).
 *
 * The next-milestone banner (`nextTwoPhases`, above) uses the year-granular
 * source data without turning a calendar year into a false 12-month window.
 *
 * Region scope: reader's stored region if set, else their persona's default
 * (`PERSONA_TIMELINE_REGION`), else every country — same precedence chain
 * TimelineView.tsx uses for its own regionFilter: `?region=` (a known
 * region) first, `?prefs=off` → every country, then stored region, then
 * persona default. A stored or persona 'global' means "no region filter", as
 * on desktop; an explicit `?region=global` shows the international bodies.
 * `?q=` narrows the list with desktop's search (lane names, then each
 * record's own text), shown with a Clear search control.
 *
 * Deep links (same params as desktop): `?country=` shows just that country;
 * `?event=<event_id|title>` is resolved against the unscoped data, widened
 * into view if the region/country/default category hides it (with a notice
 * and Undo), opened in the detail popover, and scrolled to. Unknown events
 * get a not-found notice and the param is dropped. Opening a phase writes
 * `?event=` (push); closing clears it (replace).
 */
const KNOWN_REGIONS = new Set<string>([...Object.keys(REGION_JURISDICTION_NAMES), 'global'])

/** ?region= → a known Region; unknown values are ignored (fall back to stored/persona). */
function parseRegionParam(raw: string | null): Region | 'All' | null {
  if (!raw) return null
  if (raw === 'All') return 'All'
  return KNOWN_REGIONS.has(raw) ? (raw as Region) : null
}

/** Desktop's ?q= search: lane names, then each record's own text. */
function searchData(data: GanttCountryData[], q: string): GanttCountryData[] {
  if (!q) return data
  return data.flatMap((d) => {
    const hit = searchLane(d, q)
    return hit ? [hit] : []
  })
}

export function MobileTimelineView({ comparison }: { comparison?: React.ReactNode } = {}) {
  const storeSelectedRegion = usePersonaStore((s) => s.selectedRegion)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const [searchParams, setSearchParams] = useSearchParams()
  const eventParam = searchParams.get('event')
  const countryParam = searchParams.get('country')
  // ?q= — the same lexical match desktop's search box applies (country name
  // or any body/organization name, case-insensitive).
  const searchText = searchParams.get('q') ?? ''

  // Region precedence matches TimelineView.tsx: ?region= (when it names a
  // known region) wins, ?prefs=off means no region, otherwise the reader's
  // stored region, then their persona's default. ?country= is applied on top
  // (country wins over region, as on desktop).
  const urlRegion = parseRegionParam(searchParams.get('region'))
  const region: Region | 'All' =
    urlRegion ??
    (searchParams.get('prefs') === 'off'
      ? 'All'
      : (storeSelectedRegion ??
        (selectedPersona ? PERSONA_TIMELINE_REGION[selectedPersona] : null) ??
        'All'))
  const linkedCountry = useMemo(() => {
    const { resolved } = resolveCountryParam(
      countryParam,
      timelineData.map((d) => d.countryName)
    )
    return resolved === 'All' ? null : resolved
  }, [countryParam])

  // Resolved against the unscoped data so the default scope can't fail it.
  const targetEvent = useMemo(() => findTimelineEvent(timelineData, eventParam), [eventParam])
  const [notFound, setNotFound] = useState<string | null>(null)
  const [widenDismissed, setWidenDismissed] = useState<string | null>(null)
  // Unknown ?event: remember it for the notice (render-time adjustment), then
  // drop the param from the URL.
  const unknownEvent = eventParam && !targetEvent ? eventParam : null
  if (unknownEvent && notFound !== unknownEvent) setNotFound(unknownEvent)
  useEffect(() => {
    if (!unknownEvent) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('event')
        return next
      },
      { replace: true }
    )
  }, [unknownEvent, setSearchParams])

  // Default scope (government + standards, as desktop starts from); widened
  // by the linked event's own category if that scope hides it.
  const defaultScoped = useMemo(() => applyTimelineScope(timelineData, {}), [])
  const widenCategory =
    !!targetEvent &&
    !defaultScoped.some((c) => c.bodies.some((b) => b.events.includes(targetEvent)))
  const ganttData = useMemo(() => {
    if (!widenCategory || !targetEvent) return transformToGanttData(defaultScoped)
    const cats = new Set(
      defaultScoped.flatMap((c) => c.bodies.flatMap((b) => b.events.map((e) => e.entityType)))
    )
    cats.add(targetEvent.entityType)
    return transformToGanttData(applyTimelineScope(timelineData, { categories: [...cats] }))
  }, [defaultScoped, widenCategory, targetEvent])

  // A STORED 'global' (every visitor's default) means no region filter, as on
  // desktop; only an explicit ?region=global narrows to the international bodies.
  const regionScope = region === 'global' && urlRegion !== 'global' ? 'All' : region
  const regionData = useMemo(() => {
    if (regionScope === 'All') return ganttData
    const allowed = new Set(timelineRegionCountries(regionScope))
    return ganttData.filter((d) => allowed.has(d.country.countryName))
  }, [ganttData, regionScope])

  const searchedData = useMemo(() => searchData(regionData, searchText), [regionData, searchText])

  // A linked event hidden by the region, ?country= or ?q= scope: show its
  // country instead (and drop the search for this view), as desktop does.
  const eventCountryHidden =
    !!targetEvent &&
    (linkedCountry
      ? linkedCountry !== targetEvent.countryName
      : !regionData.some((d) => d.country.countryName === targetEvent.countryName))
  const eventHiddenBySearch =
    !!targetEvent &&
    !!searchText &&
    !searchData(
      ganttData.filter((d) => d.country.countryName === targetEvent.countryName),
      searchText
    ).some((d) => d.phases.some((p) => p.events.includes(targetEvent)))
  const eventSwitchCountry = eventCountryHidden || eventHiddenBySearch
  const displayCountry = targetEvent && eventSwitchCountry ? targetEvent.countryName : linkedCountry
  const listData = useMemo(() => {
    if (targetEvent && eventSwitchCountry)
      return ganttData.filter((d) => d.country.countryName === targetEvent.countryName)
    if (displayCountry) {
      const one = ganttData.filter((d) => d.country.countryName === displayCountry)
      return searchData(one, searchText)
    }
    return searchedData
  }, [ganttData, searchedData, displayCountry, targetEvent, eventSwitchCountry, searchText])

  // A retired ?event id resolves to its successor (findTimelineEvent); open
  // that record and rewrite the URL to its own id, as desktop does.
  const canonicalKey = targetEvent ? eventLinkKey(targetEvent) : eventParam
  const retiredLink =
    !!targetEvent &&
    !!eventParam &&
    retiredTimelineEventSuccessor(eventParam) === targetEvent.eventId
  const selection = useMemo(
    () => findEventInGantt(listData, canonicalKey),
    [listData, canonicalKey]
  )
  const [retiredNotice, setRetiredNotice] = useState<string | null>(null)
  if (retiredLink && targetEvent && retiredNotice !== targetEvent.title)
    setRetiredNotice(targetEvent.title)
  useEffect(() => {
    if (!retiredLink || !canonicalKey) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('event', canonicalKey)
        return next
      },
      { replace: true }
    )
  }, [retiredLink, canonicalKey, setSearchParams])
  // The ?event value this screen wrote itself; any other value is an arrival.
  const [lastWritten, setLastWritten] = useState<string | null>(null)
  const scrollTarget =
    selection && canonicalKey !== lastWritten ? phaseRowKey(selection.phase) : null
  useScrollToDeepLinkTarget(scrollTarget, scrollTarget ? deepLinkSelector(scrollTarget) : null)

  const handleSelectEvent = (next: ResolvedTimelineEvent | null) => {
    const key = next ? (next.event ? eventLinkKey(next.event) : next.phase.title) : null
    setLastWritten(key)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (key) params.set('event', key)
        else params.delete('event')
        return params
      },
      { replace: !key }
    )
  }

  const widened = !!targetEvent && (widenCategory || eventSwitchCountry)
  const showWidenNotice = widened && widenDismissed !== eventParam
  const clearParam = (key: 'country' | 'q') =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(key)
        return next
      },
      { replace: true }
    )
  const showSearch = !!searchText && !(targetEvent && eventSwitchCountry)

  const readerCountry =
    displayCountry ??
    (storeSelectedRegion ? (REGION_COUNTRY_MAP[storeSelectedRegion] ?? null) : null)

  const nextUp = useMemo(
    () => nextTwoPhases(listData.find((d) => d.country.countryName === readerCountry)),
    [listData, readerCountry]
  )

  const migrationPlusCount = listData.filter((d) =>
    d.phases.some((p) => MIGRATION_PLUS_PHASES.has(p.phase))
  ).length

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Globe size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
            {displayCountry
              ? `${displayCountry} PQC timeline`
              : regionScope === 'All'
                ? 'Global PQC timeline'
                : regionScope === 'global'
                  ? 'International bodies PQC timeline'
                  : `${REGION_LABELS[regionScope]} PQC timeline`}
          </h1>
          <p className="text-[11.5px] text-muted-foreground">
            {listData.length} countr{listData.length === 1 ? 'y' : 'ies'} tracked
            {listData.length > 0 &&
              ` · ${migrationPlusCount} with a recorded migration or standardization phase`}
          </p>
        </div>
        {linkedCountry && !widened && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearParam('country')}
            className="ml-auto text-xs"
          >
            All countries
          </Button>
        )}
      </div>

      {comparison}

      {showSearch && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <p className="text-[12px] text-foreground">
            Showing countries matching <span className="font-semibold">“{searchText}”</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearParam('q')}
            className="ml-auto text-xs"
          >
            Clear search
          </Button>
        </div>
      )}

      {notFound && (
        <DeepLinkNotice
          kind="not-found"
          message={`The timeline event "${notFound}" linked here was not found — it may have been retired or renamed.`}
          onDismiss={() => setNotFound(null)}
        />
      )}
      {retiredNotice && (
        <DeepLinkNotice
          kind="widened"
          message={`The record this link named was retired; "${retiredNotice}" replaced it, so it is shown instead.`}
          onDismiss={() => setRetiredNotice(null)}
        />
      )}
      {showWidenNotice && targetEvent && (
        <DeepLinkNotice
          kind="widened"
          message={`"${targetEvent.title}" was outside this view, so we ${[
            eventSwitchCountry && `switched to ${targetEvent.countryName}`,
            eventHiddenBySearch && 'set aside the search',
            widenCategory && 'added its category',
          ]
            .filter(Boolean)
            .join(' and ')} to show it.`}
          onUndo={() => handleSelectEvent(null)}
          onDismiss={() => setWidenDismissed(eventParam)}
        />
      )}

      {nextUp && (
        <section className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <CalendarClock size={15} className="shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">
              Next recorded milestone
            </p>
          </div>
          <p className="text-[13px] font-semibold text-foreground">
            {nextUp.next.title} ({nextUp.next.startYear}).
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {nextUp.afterNext
              ? `The following recorded milestone starts in ${nextUp.afterNext.startYear}. These are year-level records, not a finding that either milestone applies to you.`
              : `No later milestone is recorded for ${readerCountry} in this dataset. This is not a finding that the milestone applies to you.`}
          </p>
        </section>
      )}

      <WhenDoesThisReachMe data={listData} countryName={readerCountry} />

      {listData.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          {showSearch
            ? `No countries match “${searchText}” here.`
            : 'No countries tracked for this region.'}
        </p>
      ) : (
        <MobileTimelineList
          data={listData}
          defaultMode="compact"
          selected={selection}
          onSelectEvent={handleSelectEvent}
        />
      )}

      <p className="mt-2 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Switching region, a deadlines-only filter, phase-type color coding, category/trust-tier
        filters, a search box, calendar export, and the full country-comparison chart are on a
        laptop.
      </p>
    </div>
  )
}
