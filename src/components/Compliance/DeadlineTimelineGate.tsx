// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeadlineTimeline } from './ComplianceLandscape'
import { extractYear } from '@/utils/deadlineUrgency'
import { bindingGroupOf } from '@/utils/bindingSplit'
import type { ComplianceFramework } from '@/data/complianceData'
import type { PersonaId } from '@/data/learningPersonas'

interface DeadlineTimelineGateProps {
  persona: PersonaId | null
  frameworks: ComplianceFramework[]
  label?: string
  /**
   * True once the visitor has loaded `/compliance` before (per the same
   * "seen it already" signal that collapses the onboarding banner stack).
   * On a first visit the executive/ops/null full timeline still renders
   * open by default; on a return visit it starts as a closed disclosure
   * like the developer/architect/researcher treatment, so repeat visitors
   * aren't forced to scroll past it to reach the tab bar every time.
   */
  returningVisitor?: boolean
}

interface NarrativeData {
  datedCount: number
  earliestYear: number
  latestYear: number
  /** Next dated milestone of a record classified as binding, when one is ahead. */
  nextBindingLabel: string | null
}

/** Years a record states: its structured milestones, else the year in its deadline text. */
function yearsOf(fw: ComplianceFramework): number[] {
  const dated = fw.deadlineDates ?? []
  if (dated.length > 0) return dated.map((d) => d.year)
  const year = extractYear(fw.deadline)
  return year === null ? [] : [year]
}

function buildNarrative(frameworks: ComplianceFramework[]): NarrativeData | null {
  const dated = frameworks
    .map((fw) => ({ fw, years: yearsOf(fw) }))
    .filter((x) => x.years.length > 0)
  if (dated.length === 0) return null
  const all = dated.flatMap((x) => x.years)
  const today = new Date().getFullYear()
  // A hard deadline is named only from a record classified as binding (a law, or
  // binding for its stated scope). Advisory targets, drafts, recommendations and
  // records not yet classified carry dates too, but those dates are not deadlines.
  const ahead = dated
    .filter((x) => bindingGroupOf(x.fw.bindingStatus) === 'binding')
    .flatMap((x) => x.years.filter((y) => y >= today).map((year) => ({ fw: x.fw, year })))
    .sort((a, b) => a.year - b.year)[0]
  return {
    datedCount: dated.length,
    earliestYear: Math.min(...all),
    latestYear: Math.max(...all),
    nextBindingLabel: ahead ? `${ahead.fw.label} (${ahead.year})` : null,
  }
}

/** Describes the dated entries in the current selection, with no claim beyond it. */
function narrativeText(frameworks: ComplianceFramework[]): string {
  const n = buildNarrative(frameworks)
  if (!n) return 'No dated entries in the current selection.'
  const span =
    n.earliestYear === n.latestYear
      ? `dated ${n.earliestYear}`
      : `with dates from ${n.earliestYear} to ${n.latestYear}`
  const head = `${n.datedCount} ${n.datedCount === 1 ? 'entry' : 'entries'} in the current selection ${span}. A date can be an advisory target or a draft rather than a deadline, so check each entry's status.`
  return n.nextBindingLabel
    ? `${head} The next dated milestone in a record classified as binding is ${n.nextBindingLabel}; it applies only within its stated scope.`
    : head
}

/**
 * Persona-aware wrapper around DeadlineTimeline:
 *   executive | grc | ops | null (first visit)   → full timeline (current behaviour)
 *   executive | grc | ops | null (return visit)  → closed disclosure (mounts on click)
 *   curious                                       → one-line narrative summary
 *   developer | architect | researcher           → closed disclosure (mounts on click)
 *
 * GRC added 2026-09-07 (Executive/GRC split, plan §D) — deadline dates are
 * core obligations-tracking territory, so GRC gets the same open-by-default
 * treatment as executive/ops rather than the closed disclosure.
 */
export function DeadlineTimelineGate({
  persona,
  frameworks,
  label,
  returningVisitor = false,
}: DeadlineTimelineGateProps) {
  const [open, setOpen] = useState(false)
  const narrative = useMemo(() => narrativeText(frameworks), [frameworks])

  if (
    (persona === 'executive' || persona === 'grc' || persona === 'ops' || persona === null) &&
    !returningVisitor
  ) {
    return <DeadlineTimeline frameworks={frameworks} label={label} />
  }

  if (persona === 'curious') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card text-sm">
        <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-muted-foreground" data-testid="deadline-timeline-narrative">
          {narrative}
        </p>
      </div>
    )
  }

  // developer | architect | researcher → closed disclosure
  return (
    <div className="rounded-lg border border-border bg-card">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="deadline-timeline-disclosure"
        className="w-full justify-between text-sm font-medium px-3 py-2 h-auto"
      >
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" aria-hidden="true" />
          Show deadline timeline
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
      </Button>
      {open && (
        <div id="deadline-timeline-disclosure" className="px-3 pb-3 pt-1">
          <DeadlineTimeline frameworks={frameworks} label={label} />
        </div>
      )}
    </div>
  )
}
