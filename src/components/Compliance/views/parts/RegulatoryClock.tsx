// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import type { ComplianceFramework } from '../../../../data/complianceData'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'

interface RegulatoryClockProps {
  /** Mandatory-tier framework results — drives which deadlines we count down to. */
  mandatoryFrameworks: ApplicabilityResult<ComplianceFramework>[]
  /** Recognized tier — fallback source of deadlines when no Mandatory framework has a year. */
  recognizedFrameworks?: ApplicabilityResult<ComplianceFramework>[]
}

interface ClockLine {
  daysUntil: number
  date: string
  label: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Build a "30 Dec {year}" Date — the conventional end-of-year cutover anchor. */
function endOfYear(year: number): Date {
  return new Date(year, 11, 30)
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Renders the stacked countdown header for the executive view:
 *
 *     ⏱ 420 days · end-2026 — Transition plan due
 *     ⏱ 1,623 days · 30 Dec 2030 — ASD ISM cutover
 *
 * Planning milestone is the closest year before the earliest cutover where a
 * framework has a planning-phase milestone embedded in its description (we
 * heuristic-extract "end-of-{year}" or numeric year tokens). Cutover is the
 * earliest `deadlineYear` across Mandatory frameworks, with Recognized as a
 * fallback.
 */
export function RegulatoryClock({
  mandatoryFrameworks,
  recognizedFrameworks = [],
}: RegulatoryClockProps) {
  // Snapshot "now" at mount via lazy initial state — keeps the countdown
  // stable for the lifetime of the view (a few minutes) and pleases
  // react-compiler's purity check by avoiding Date.now() at render time.
  const [now] = useState(() => Date.now())

  const lines = useMemo<ClockLine[]>(() => {
    const out: ClockLine[] = []

    // Cutover: earliest mandatory deadlineYear, falling back to recognized
    const sources = [...mandatoryFrameworks, ...recognizedFrameworks]
    const yearItems = sources
      .map((r) => ({ year: r.item.deadlineYear, label: r.item.label }))
      .filter((y): y is { year: number; label: string } => typeof y.year === 'number')
      .sort((a, b) => a.year - b.year)

    if (yearItems.length === 0) return out

    const cutover = yearItems[0]
    const cutoverDate = endOfYear(cutover.year)
    out.push({
      daysUntil: Math.max(0, Math.round((cutoverDate.getTime() - now) / MS_PER_DAY)),
      date: formatDate(cutoverDate),
      label: `${cutover.label} cutover`,
    })

    // Planning milestone: heuristic — pick the closest pre-cutover year token
    // mentioned in any Mandatory framework's `notes` or `deadline` string.
    // Today's data uses phrases like "end-2026" or "2026 transition plan."
    const planningCandidates = new Set<number>()
    for (const r of mandatoryFrameworks) {
      const blob = `${r.item.deadline} ${r.item.notes}`
      const matches = blob.match(/\b20(2[6-9]|3[0-5])\b/g) ?? []
      for (const m of matches) {
        const y = parseInt(m, 10)
        if (y < cutover.year) planningCandidates.add(y)
      }
    }
    if (planningCandidates.size > 0) {
      const planningYear = Math.min(...planningCandidates)
      const planningDate = endOfYear(planningYear)
      out.unshift({
        daysUntil: Math.max(0, Math.round((planningDate.getTime() - now) / MS_PER_DAY)),
        date: `end-${planningYear}`,
        label: 'Transition plan due',
      })
    }

    return out
  }, [mandatoryFrameworks, recognizedFrameworks, now])

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Clock size={14} className="inline mr-2 text-muted-foreground" aria-hidden="true" />
        No firm deadlines yet — set country to see your regulatory clock.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-status-error/30 bg-status-error/5 px-4 py-3 space-y-1.5">
      {lines.map((line, i) => (
        <div key={i} className="flex items-baseline gap-3 text-sm">
          <Clock
            size={14}
            className={i === lines.length - 1 ? 'text-status-error' : 'text-status-warning'}
            aria-hidden="true"
          />
          <span className="font-bold text-foreground tabular-nums">
            {line.daysUntil.toLocaleString()} days
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{line.date}</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-foreground">{line.label}</span>
        </div>
      ))}
    </div>
  )
}
