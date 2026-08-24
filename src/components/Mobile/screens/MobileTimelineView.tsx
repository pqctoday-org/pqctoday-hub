// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Globe, CalendarClock } from 'lucide-react'
import { timelineData, transformToGanttData } from '@/data/timelineData'
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
 * TimelineView.tsx uses for its own regionFilter initial state, minus the
 * URL-param branches (no deep-linking UI on this screen). 'global' is
 * treated as "no region filter," matching TimelineView's own check.
 */
export function MobileTimelineView() {
  const storeSelectedRegion = usePersonaStore((s) => s.selectedRegion)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const region: Region | 'All' =
    storeSelectedRegion ??
    (selectedPersona ? PERSONA_TIMELINE_REGION[selectedPersona] : null) ??
    'All'

  const ganttData = useMemo(() => transformToGanttData(applyTimelineScope(timelineData, {})), [])

  const regionData = useMemo(() => {
    if (region === 'All' || region === 'global') return ganttData
    const allowed = new Set(REGION_COUNTRIES_MAP[region])
    return ganttData.filter((d) => allowed.has(d.country.countryName))
  }, [ganttData, region])

  const readerCountry = storeSelectedRegion
    ? (REGION_COUNTRY_MAP[storeSelectedRegion] ?? null)
    : null

  const nextUp = useMemo(
    () => nextTwoPhases(ganttData.find((d) => d.country.countryName === readerCountry)),
    [ganttData, readerCountry]
  )

  const migrationPlusCount = regionData.filter((d) =>
    d.phases.some((p) => MIGRATION_PLUS_PHASES.has(p.phase))
  ).length

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Globe size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
            {region === 'All' || region === 'global'
              ? 'Global PQC timeline'
              : `${REGION_LABELS[region]} PQC timeline`}
          </h1>
          <p className="text-[11.5px] text-muted-foreground">
            {regionData.length} countr{regionData.length === 1 ? 'y' : 'ies'} tracked
            {regionData.length > 0 &&
              ` · ${migrationPlusCount} of ${regionData.length} already at Migration+`}
          </p>
        </div>
      </div>

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

      {regionData.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No countries tracked for this region.</p>
      ) : (
        <MobileTimelineList data={regionData} defaultMode="compact" />
      )}

      <p className="mt-2 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Switching region, a deadlines-only filter, phase-type color coding, category/trust-tier
        filters, search, calendar export, and the full country-comparison chart are on a laptop.
      </p>
    </div>
  )
}
