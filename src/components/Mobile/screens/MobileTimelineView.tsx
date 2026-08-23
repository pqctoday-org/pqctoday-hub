// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Globe } from 'lucide-react'
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
import { WhenDoesThisReachMe } from '@/components/Timeline/WhenDoesThisReachMe'
import { MobileTimelineList } from '@/components/Timeline/MobileTimelineList'

// Same editorial definition CoverageByRegion.tsx uses for its per-region "at
// Migration+" stat — the two real execution stages on the technical-readiness
// track (Discovery → Testing → POC → Migration → Standardization). Not
// re-exported from there (that file is desktop-only chrome, none of the rest
// of it is reusable), so the definition is copied verbatim rather than routed
// through a shared import, to keep this one number honestly sourced.
const MIGRATION_PLUS_PHASES = new Set(['Migration', 'Standardization'])

/**
 * Mobile Timeline (handoff Phase 7 — Reference set). Distilled, not a port of
 * TimelineView.tsx's 742 lines: no region/category/tier filter UI, no
 * search, no CSV/.ics export, no left-rail TOC, no 5-tile CoverageByRegion
 * grid — stated below rather than silently dropped. What stays is the two
 * pieces the B+ remediation already identified as what a first-time reader
 * actually needs (WhenDoesThisReachMe's own doc comment): their own
 * country's next date, then a scannable list of every country in their
 * region.
 *
 * Reuses real, already-shipped components verbatim — WhenDoesThisReachMe and
 * MobileTimelineList both already exist under src/components/Timeline/ (the
 * latter is the legacy <768px breakpoint's own mobile view, already phone-
 * tested), so this screen is chrome and data-derivation around them, not a
 * rewrite. Same data pipeline desktop's own `ganttData` memo uses
 * (`applyTimelineScope` with no override applies the same default
 * government+standards category scope desktop starts from; no tier filter,
 * since desktop's own tier control has been unmounted since 2026-08-11).
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

  const migrationPlusCount = regionData.filter((d) =>
    d.phases.some((p) => MIGRATION_PLUS_PHASES.has(p.phase))
  ).length

  return (
    <div className="px-4 pb-24 pt-4">
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

      <WhenDoesThisReachMe data={ganttData} countryName={readerCountry} />

      {regionData.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No countries tracked for this region.</p>
      ) : (
        <MobileTimelineList data={regionData} />
      )}

      <p className="mt-2 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Region and category filters, search, calendar export, and the full country-comparison chart
        are on a laptop.
      </p>
    </div>
  )
}
