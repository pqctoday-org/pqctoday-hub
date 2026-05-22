// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeadlineTimeline } from './ComplianceLandscape'
import { extractYear } from '@/utils/deadlineUrgency'
import type { ComplianceFramework } from '@/data/complianceData'
import type { PersonaId } from '@/data/learningPersonas'

interface DeadlineTimelineGateProps {
  persona: PersonaId | null
  frameworks: ComplianceFramework[]
  label?: string
}

interface NarrativeData {
  earliestYear: number
  latestYear: number
  nextDeadlineLabel: string | null
}

function buildNarrative(frameworks: ComplianceFramework[]): NarrativeData | null {
  const withYears = frameworks
    .map((f) => ({ fw: f, year: extractYear(f.deadline) }))
    .filter((x): x is { fw: ComplianceFramework; year: number } => x.year !== null)
  if (withYears.length === 0) return null
  const years = withYears.map((x) => x.year)
  const earliestYear = Math.min(...years)
  const latestYear = Math.max(...years)
  const today = new Date().getFullYear()
  const future = withYears.filter((x) => x.year >= today).sort((a, b) => a.year - b.year)
  const next = future[0] ?? withYears.sort((a, b) => b.year - a.year)[0]
  return {
    earliestYear,
    latestYear,
    nextDeadlineLabel: next ? `${next.fw.label} (${next.year})` : null,
  }
}

/**
 * Persona-aware wrapper around DeadlineTimeline:
 *   executive | ops | null              → full timeline (current behaviour)
 *   curious                              → one-line narrative summary
 *   developer | architect | researcher  → closed disclosure (mounts on click)
 */
export function DeadlineTimelineGate({ persona, frameworks, label }: DeadlineTimelineGateProps) {
  const [open, setOpen] = useState(false)
  const narrative = useMemo(() => buildNarrative(frameworks), [frameworks])

  if (persona === 'executive' || persona === 'ops' || persona === null) {
    return <DeadlineTimeline frameworks={frameworks} label={label} />
  }

  if (persona === 'curious') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card text-sm">
        <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-muted-foreground" data-testid="deadline-timeline-narrative">
          {narrative
            ? narrative.nextDeadlineLabel
              ? `PQC mandates land between ${narrative.earliestYear} and ${narrative.latestYear}; the next hard deadline is ${narrative.nextDeadlineLabel}.`
              : `PQC mandates land between ${narrative.earliestYear} and ${narrative.latestYear}.`
            : 'No dated PQC mandates have been published yet — check back as new regulations land.'}
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
