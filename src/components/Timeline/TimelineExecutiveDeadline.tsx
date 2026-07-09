// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { CalendarClock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { REGION_COUNTRIES_MAP } from '@/data/personaConfig'
import { TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME } from '@/data/timelineFacts.generated'
import type { GanttCountryData, TimelineEvent } from '@/types/timeline'

// "Binding" is single-sourced from the curated timeline CSV `mandate_type` label —
// the SAME field GanttDetailPopover.tsx reads — instead of the phase category. The
// old heuristic (any Deadline/Regulation-phase event counts as binding) is why the
// executive card could say "binding" for a milestone the popover separately labeled
// SOFT guidance. Only Deadline-phase rows carry a curated mandate label (that's the
// scope of the mandate-label completion sweep); Regulation-phase rows (general laws,
// sector ordinances) aren't PQC-deadline mandates and are intentionally out of scope
// here — surfacing them as "binding" without a reviewed label would be a guess.
function mandateFor(event: TimelineEvent, countryName: string) {
  if (event.phase !== 'Deadline') return undefined
  return event.mandateType ?? TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME[countryName]
}

// Module scope, so the current-year read is not an impure call during render.
const CURRENT_YEAR = new Date().getFullYear()

interface Milestone {
  year: number
  title: string
  country: string
}

/** Soonest upcoming Deadline-phase milestone in the current view matching `predicate`,
 *  scoped to the selected region. Year granularity — the data has no finer date. */
function nearestDeadlineMilestone(
  data: GanttCountryData[],
  regionFilter: string,
  predicate: (event: TimelineEvent, countryName: string) => boolean
): Milestone | null {
  const inRegion = (name: string) => {
    if (regionFilter === 'All' || regionFilter === 'global') return true
    const allowed = REGION_COUNTRIES_MAP[regionFilter as keyof typeof REGION_COUNTRIES_MAP]
    return allowed ? allowed.includes(name) : true
  }

  let best: Milestone | null = null
  for (const row of data) {
    if (!inRegion(row.country.countryName)) continue
    for (const phase of row.phases) {
      for (const ev of phase.events) {
        if (ev.phase !== 'Deadline') continue
        if (ev.startYear < CURRENT_YEAR) continue
        if (!predicate(ev, row.country.countryName)) continue
        if (!best || ev.startYear < best.year) {
          best = { year: ev.startYear, title: ev.title, country: row.country.countryName }
        }
      }
    }
  }
  return best
}

/** Nearest milestone with a curated HARD (confirmed-binding) mandate label. */
function nearestBindingMilestone(data: GanttCountryData[], regionFilter: string): Milestone | null {
  return nearestDeadlineMilestone(
    data,
    regionFilter,
    (ev, country) => mandateFor(ev, country) === 'HARD'
  )
}

/** Nearest Deadline-phase milestone whose binding status is NOT confirmed HARD —
 *  i.e. curated SOFT guidance, DRAFT/pending review, or genuinely unlabeled. Used
 *  only as an honest fallback when no confirmed-binding milestone is in view, so the
 *  card never silently implies "nothing is coming" when something is, just unconfirmed. */
function nearestPendingMilestone(data: GanttCountryData[], regionFilter: string): Milestone | null {
  return nearestDeadlineMilestone(
    data,
    regionFilter,
    (ev, country) => mandateFor(ev, country) !== 'HARD'
  )
}

interface Props {
  ganttData: GanttCountryData[]
  regionFilter: string
  regionLabel: string
}

/**
 * Executive-only readout above the analyst Gantt: answers "what is my nearest
 * binding milestone, and what do I do about it" before the chart. Rendered only
 * for the executive persona (caller gates it), so other roles see the page as-is.
 */
export function TimelineExecutiveDeadline({ ganttData, regionFilter, regionLabel }: Props) {
  const next = nearestBindingMilestone(ganttData, regionFilter)
  // Only computed as a fallback when nothing confirmed-binding is in view, so we
  // never silently imply "nothing is coming" when something is, just unconfirmed.
  const pending = next ? null : nearestPendingMilestone(ganttData, regionFilter)
  const scope =
    regionFilter === 'All' || regionFilter === 'global' ? 'globally' : `in ${regionLabel}`
  const yearsOut = next ? next.year - CURRENT_YEAR : null

  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <CalendarClock size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-foreground mb-1">Your nearest binding milestone</p>
          {next ? (
            <p className="text-muted-foreground leading-relaxed mb-2">
              {scope.charAt(0).toUpperCase() + scope.slice(1)}, the soonest enforceable milestone in
              this view is <strong className="text-foreground">{next.title}</strong> ({next.country}
              , <strong className="text-foreground">{next.year}</strong>
              {yearsOut !== null && yearsOut <= 0
                ? ' — now'
                : yearsOut !== null
                  ? ` — about ${yearsOut} year${yearsOut === 1 ? '' : 's'} out`
                  : ''}
              ). The colored bars below are analyst phases; binding regulations and deadlines carry
              more weight than advisory guidance — confirm the dates that legally apply to you on
              the compliance page.
            </p>
          ) : pending ? (
            <p className="text-muted-foreground leading-relaxed mb-2">
              No confirmed-binding milestone appears {scope} yet. The nearest upcoming deadline in
              this view is <strong className="text-foreground">{pending.title}</strong> (
              {pending.country}, <strong className="text-foreground">{pending.year}</strong>) — but
              its binding status is guidance or still under review, not a confirmed legal mandate.
              Confirm the obligations that legally apply to you on the compliance page.
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed mb-2">
              No upcoming binding regulation or deadline appears in this view. Widen the region
              filter or confirm the obligations that apply to you on the compliance page — and start
              planning now, before one lands.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link to="/migrate">
              <Button variant="gradient" size="sm" className="h-7 px-2 text-xs gap-1">
                Build your migration plan
                <ArrowRight size={12} aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/compliance">
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Binding compliance deadlines →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
