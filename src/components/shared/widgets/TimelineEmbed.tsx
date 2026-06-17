// SPDX-License-Identifier: GPL-3.0-only
/**
 * TimelineEmbed (C6) — renders the interactive Gantt chart inside the
 * simulation without the full TimelineView chrome (no PageHeader, no filter
 * toolbar, no URL state). The player sees the real chart, pre-scoped to the
 * provided country/region, with all bar interactivity (popovers, milestones,
 * hover) intact.
 *
 * Used by SimulationView when a `reference` step with refId:'timeline' is
 * opened via `openStep()`. The scope is derived from the player's assessed
 * country (or the step's `?country=` / `?region=` query).
 */
import { useMemo } from 'react'
import { timelineData, transformToGanttData } from '@/data/timelineData'
import { applyTimelineScope, type TimelineScope } from '@/data/timelineScope'
import { SimpleGanttChart } from '@/components/Timeline/SimpleGanttChart'

interface TimelineEmbedProps {
  scope: TimelineScope
}

/** Human-readable label for the active scope (shown in the scope chip). */
function scopeLabelFor(scope: TimelineScope): string {
  if (scope.country) return `${scope.country} · PQC migration timeline`
  if (scope.region) return `${scope.region} · PQC migration timeline`
  return 'Global PQC migration timeline'
}

// Stub handlers — controls are hidden in embedded mode, so these are never called.
const NOOP = () => {}
const EMPTY_ITEMS: { id: string; label: string }[] = [{ id: 'All', label: 'All' }]
const EMPTY_COUNTRY_ITEMS: { id: string; label: string; icon: null }[] = [
  { id: 'All', label: 'All Countries', icon: null },
]

export function TimelineEmbed({ scope }: TimelineEmbedProps) {
  const ganttData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    return transformToGanttData(applyTimelineScope(timelineData, scope))
  }, [scope])

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <SimpleGanttChart
        data={ganttData}
        embedded
        scopeLabel={scopeLabelFor(scope)}
        // The Controls block is hidden when embedded — these props are no-ops.
        regionFilter="All"
        onRegionSelect={NOOP}
        regionItems={EMPTY_ITEMS}
        selectedCountry="All"
        onCountrySelect={NOOP}
        countryItems={EMPTY_COUNTRY_ITEMS}
      />
    </div>
  )
}
