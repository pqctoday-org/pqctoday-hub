// SPDX-License-Identifier: GPL-3.0-only
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
  type ResolvedTimelineEvent,
} from '@/data/timelineData'
import { applyTimelineScope } from '@/data/timelineScope'
import {
  REGION_COUNTRIES_MAP,
  REGION_COUNTRY_MAP,
  PERSONA_TIMELINE_REGION,
} from '@/data/personaConfig'
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
 * "Next 12 months" banner (design handoff §17). Same phase-sort/next-pick
 * logic WhenDoesThisReachMe.tsx uses internally (`trackFor`, not exported —
 * copied rather than routed through a prop, to keep this file's boundary
 * with that component at just its public `{data, countryName}` props),
 * extended one step further to also name the phase AFTER next, so the
 * banner can honestly say how long the calm stretch afterward is.
 *
 * The real data is year-granular only (no month field anywhere in
 * types/timeline.ts) — "next 12 months" is a label, not a literal cutoff,
 * matching the design's own example (a phase landing next calendar year is
 * still called "next 12 months" there). Shown only when the next phase
 * starts this year or next — far-future phases get no urgent banner, so the
 * label is never claiming more precision or urgency than the data has.
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
 * The §17 "Next 12 months" banner (`nextTwoPhases`, above) is real data,
 * honestly bounded — the underlying CSV only carries `startYear` (no month
 * anywhere in types/timeline.ts), so this shows only when the next phase is
 * genuinely imminent (this year or next), never claiming month-level
 * precision the data doesn't have.
 *
 * Region scope: reader's stored region if set, else their persona's default
 * (`PERSONA_TIMELINE_REGION`), else every country — same precedence chain
 * TimelineView.tsx uses for its own regionFilter: `?region=` (a known
 * region) first, `?prefs=off` → every country, then stored region, then
 * persona default. 'global' is treated as "no region filter," matching
 * TimelineView's own check. `?q=` narrows the list with desktop's lexical
 * match (country or body name), shown with a Clear search control.
 *
 * Deep links (same params as desktop): `?country=` shows just that country;
 * `?event=<event_id|title>` is resolved against the unscoped data, widened
 * into view if the region/country/default category hides it (with a notice
 * and Undo), opened in the detail popover, and scrolled to. Unknown events
 * get a not-found notice and the param is dropped. Opening a phase writes
 * `?event=` (push); closing clears it (replace).
 */
const KNOWN_REGIONS = new Set<string>([...Object.keys(REGION_COUNTRIES_MAP), 'global'])

/** ?region= → a known Region; unknown values are ignored (fall back to stored/persona). */
function parseRegionParam(raw: string | null): Region | 'All' | null {
  if (!raw) return null
  if (raw === 'All') return 'All'
  return KNOWN_REGIONS.has(raw) ? (raw as Region) : null
}

/** Desktop TimelineView's lexical ?q= match: country name or any body name. */
function matchesTimelineSearch(d: GanttCountryData, q: string): boolean {
  const qLc = q.toLowerCase()
  return (
    d.country.countryName.toLowerCase().includes(qLc) ||
    d.country.bodies.some((b) => b.name.toLowerCase().includes(qLc))
  )
}

export function MobileTimelineView() {
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

  const regionData = useMemo(() => {
    if (region === 'All' || region === 'global') return ganttData
    const allowed = new Set(REGION_COUNTRIES_MAP[region])
    return ganttData.filter((d) => allowed.has(d.country.countryName))
  }, [ganttData, region])

  const searchedData = useMemo(
    () =>
      searchText ? regionData.filter((d) => matchesTimelineSearch(d, searchText)) : regionData,
    [regionData, searchText]
  )

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
    !ganttData.some(
      (d) =>
        d.country.countryName === targetEvent.countryName && matchesTimelineSearch(d, searchText)
    )
  const eventSwitchCountry = eventCountryHidden || eventHiddenBySearch
  const displayCountry = targetEvent && eventSwitchCountry ? targetEvent.countryName : linkedCountry
  const listData = useMemo(() => {
    if (targetEvent && eventSwitchCountry)
      return ganttData.filter((d) => d.country.countryName === targetEvent.countryName)
    if (displayCountry) {
      const one = ganttData.filter((d) => d.country.countryName === displayCountry)
      return searchText ? one.filter((d) => matchesTimelineSearch(d, searchText)) : one
    }
    return searchedData
  }, [ganttData, searchedData, displayCountry, targetEvent, eventSwitchCountry, searchText])

  const selection = useMemo(() => findEventInGantt(listData, eventParam), [listData, eventParam])
  // The ?event value this screen wrote itself; any other value is an arrival.
  const [lastWritten, setLastWritten] = useState<string | null>(null)
  const scrollTarget = selection && eventParam !== lastWritten ? phaseRowKey(selection.phase) : null
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

  const readerCountry = storeSelectedRegion
    ? (REGION_COUNTRY_MAP[storeSelectedRegion] ?? null)
    : null

  const nextUp = useMemo(
    () => nextTwoPhases(ganttData.find((d) => d.country.countryName === readerCountry)),
    [ganttData, readerCountry]
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
              : region === 'All' || region === 'global'
                ? 'Global PQC timeline'
                : `${REGION_LABELS[region]} PQC timeline`}
          </h1>
          <p className="text-[11.5px] text-muted-foreground">
            {listData.length} countr{listData.length === 1 ? 'y' : 'ies'} tracked
            {listData.length > 0 &&
              ` · ${migrationPlusCount} of ${listData.length} already at Migration+`}
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
              Next 12 months
            </p>
          </div>
          <p className="text-[13px] font-semibold text-foreground">
            One marker lands: {nextUp.next.title} ({nextUp.next.startYear}).
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            {nextUp.afterNext
              ? `Everything else in ${readerCountry} is ${nextUp.afterNext.startYear - nextUp.year} year${nextUp.afterNext.startYear - nextUp.year === 1 ? '' : 's'} out or already passed.`
              : `Nothing else is scheduled for ${readerCountry} after this yet.`}
          </p>
        </section>
      )}

      <WhenDoesThisReachMe data={ganttData} countryName={readerCountry} />

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
