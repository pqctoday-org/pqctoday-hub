// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { ComplianceFramework, DeadlinePhase } from '@/data/complianceData'
import { Button } from '@/components/ui/button'
import { ScrollFadeContainer } from '@/components/ui/ScrollFadeContainer'

interface Props {
  /**
   * Frameworks to plot. Caller is expected to pass an already-filtered list
   * (e.g. only the user's applicable frameworks). Frameworks without a
   * `deadlineYear` are dropped from the bar render and surfaced in the legend
   * as "Ongoing / undated."
   */
  frameworks: readonly ComplianceFramework[]
  /** Optional click handler for a row — opens a framework drawer. */
  onSelectFramework?: (fw: ComplianceFramework) => void
  /** Caps the bar count so the chart stays scannable. Default: 12. */
  maxRows?: number
}

interface PlotRow {
  fw: ComplianceFramework
  /** Year the row is drawn at: next stated milestone, else the latest one that passed. */
  year: number
  /** Every milestone the source states, earliest first (empty when only a single year is known). */
  milestones: { year: number; label: string }[]
}

function plotRowFor(fw: ComplianceFramework, currentYear: number): PlotRow {
  const milestones = [...(fw.deadlineDates ?? [])].sort((a, b) => a.year - b.year)
  if (milestones.length === 0) {
    return { fw, year: fw.deadlineYear as number, milestones }
  }
  const upcoming = milestones.find((m) => m.year >= currentYear)
  const year = upcoming ? upcoming.year : milestones[milestones.length - 1].year
  return { fw, year, milestones }
}

const yearRangeLabel = (first: number, last: number) =>
  first === last ? `${first}` : `${first}–${last}`

/**
 * Validation deadline gantt (P11-P1-07).
 *
 * Plots each framework as a horizontal bar from "now" to its next stated
 * milestone so an executive or architect can see the relative pressure of every
 * regulator at one glance. A framework whose stated milestones have all passed
 * is drawn as a dashed marker at its actual year, labelled "passed", rather than
 * being pulled forward to today. Bars are color-coded by `deadlinePhase`; rows
 * without a concrete year fall through to a "no firm deadline" tally under the
 * chart, and rows beyond `maxRows` are counted in a note instead of vanishing.
 * A "Show all" toggle under the chart lifts the cap and plots every dated
 * framework; "Show fewer" returns to the capped view.
 *
 * Pure data-vis: no DOM measurement, no resize observer. Renders inside the
 * parent's flex/grid box.
 */
export const ValidationGantt: React.FC<Props> = ({
  frameworks,
  onSelectFramework,
  maxRows = 12,
}) => {
  // Collapsed by default: the chart stays scannable. The toggle below lifts the row cap.
  const [expanded, setExpanded] = useState(false)
  const { rows, undated, omitted, datedTotal, yearMin, yearMax } = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const dated = frameworks
      .filter((f) => typeof f.deadlineYear === 'number')
      .map((f) => plotRowFor(f, currentYear))
      .sort((a, b) => a.year - b.year)
    const limit = expanded ? dated.length : maxRows
    const sliced = dated.slice(0, limit)
    const omitted = dated.slice(limit)
    const undated = frameworks.filter((f) => typeof f.deadlineYear !== 'number')
    const years = sliced.map((r) => r.year)
    const yearMin = Math.min(currentYear, ...years)
    // Cap the right edge at the furthest deadline + 1 so even ongoing rows show progress.
    const yearMax = Math.max(currentYear + 1, ...years)
    return { rows: sliced, undated, omitted, datedTotal: dated.length, yearMin, yearMax }
  }, [frameworks, maxRows, expanded])

  if (rows.length === 0 && undated.length === 0) {
    return null
  }

  // The toggle shows whenever the cap would hide something, and stays while expanded so it can be undone.
  const canExpand = datedTotal > maxRows
  const span = yearMax - yearMin || 1
  const currentYear = new Date().getFullYear()
  const nowPct = ((currentYear - yearMin) / span) * 100

  return (
    <section
      data-section-id="compliance-validation-gantt"
      className="glass-panel p-4 space-y-3 scroll-mt-20"
      aria-label="Compliance deadline timeline"
    >
      <header className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={16} className="text-primary" />
        <h3 className="text-base font-semibold text-foreground">Deadline timeline</h3>
        <span className="text-xs text-muted-foreground">
          {omitted.length > 0
            ? `Showing ${rows.length} of ${datedTotal} frameworks with a concrete year`
            : `${rows.length} framework${rows.length !== 1 ? 's' : ''} with a concrete year`}
          {undated.length > 0 && ` · ${undated.length} ongoing`}
        </span>
      </header>

      {rows.length > 0 && (
        <ScrollFadeContainer>
          <div className="relative min-w-[480px]">
            {/* Year axis */}
            <div className="grid max-md:grid-cols-[92px_1fr] grid-cols-[160px_1fr] gap-3 items-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Framework
              </div>
              <div className="relative h-5 border-b border-border/60">
                {Array.from({ length: span + 1 }, (_, i) => {
                  const year = yearMin + i
                  const pct = (i / span) * 100
                  return (
                    <span
                      key={year}
                      className="absolute -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums"
                      style={{ left: `${pct}%`, top: 0 }}
                    >
                      {year}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Today marker */}
            <div className="grid max-md:grid-cols-[92px_1fr] grid-cols-[160px_1fr] gap-3">
              <div />
              <div className="relative h-0">
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 border-l-2 border-primary/40"
                  style={{ left: `${nowPct}%`, height: `${rows.length * 28}px` }}
                />
                <span
                  className="absolute -translate-x-1/2 text-[9px] font-mono uppercase tracking-wider text-primary/70"
                  style={{ left: `${nowPct}%`, top: 2 }}
                >
                  now
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="mt-1 space-y-1.5">
              {rows.map(({ fw, year, milestones }) => {
                // A milestone before the current year is drawn where it fell, not at "now".
                const past = year < currentYear
                const endPct = ((year - yearMin) / span) * 100
                const startPct = past ? endPct : ((currentYear - yearMin) / span) * 100
                const widthPct = past ? PAST_MARKER_PCT : Math.max(2, endPct - startPct)
                const leftPct = past ? Math.max(0, endPct - PAST_MARKER_PCT / 2) : startPct
                const phaseClass = PHASE_BAR_CLASS[fw.deadlinePhase] ?? 'bg-muted'
                const labelClickable = !!onSelectFramework
                const timing = past
                  ? `milestone passed in ${year}`
                  : milestones.length > 1
                    ? `next milestone ${year}`
                    : `deadline ${year}`
                // When the source states several milestones, list them all so the
                // bar's single year is not mistaken for the whole schedule.
                const schedule =
                  milestones.length > 1
                    ? `; stated milestones: ${milestones
                        .map((m) => (m.label ? `${m.year} ${m.label}` : `${m.year}`))
                        .join(', ')}`
                    : ''

                return (
                  <div
                    key={fw.id}
                    className="grid max-md:grid-cols-[92px_1fr] grid-cols-[160px_1fr] gap-3 items-center group"
                  >
                    {labelClickable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectFramework?.(fw)}
                        className="h-auto px-0 py-1 justify-start text-xs font-medium text-foreground truncate group-hover:text-primary"
                        title={`${fw.label} — ${timing}`}
                      >
                        {fw.label}
                      </Button>
                    ) : (
                      <span
                        className="text-xs font-medium text-foreground truncate"
                        title={`${fw.label} — ${timing}`}
                      >
                        {fw.label}
                      </span>
                    )}
                    <div className="relative h-6 rounded-sm bg-muted/30">
                      <div
                        className={`absolute top-1 bottom-1 rounded-sm ${phaseClass}${past ? ' border border-dashed border-foreground/50' : ''}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${fw.label}: ${fw.deadlinePhase} (${year}${past ? ', passed' : ''})${schedule}`}
                      />
                      <span className="absolute right-2 inset-y-0 flex items-center text-[10px] font-mono text-foreground/80 tabular-nums">
                        {past ? `${year} · passed` : year}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollFadeContainer>
      )}

      {omitted.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {omitted.length} more dated framework{omitted.length !== 1 ? 's' : ''} (
          {yearRangeLabel(omitted[0].year, omitted[omitted.length - 1].year)}) not plotted. This
          chart shows the {rows.length} earliest of {datedTotal} dated frameworks, so it is not a
          complete deadline list.
        </p>
      )}

      {canExpand && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="text-xs"
        >
          {expanded ? 'Show fewer' : `Show all ${datedTotal} dated frameworks`}
        </Button>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap pt-1 border-t border-border/40">
        {LEGEND.map(({ phase, label, cls }) => (
          <span key={phase} className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-3 h-2 rounded-sm ${cls}`} aria-hidden="true" />
            {label}
          </span>
        ))}
        {undated.length > 0 && (
          <span className="ml-auto">
            {undated.length} ongoing / undated framework{undated.length !== 1 ? 's' : ''} omitted
          </span>
        )}
      </div>
    </section>
  )
}

/** Width of the marker drawn for a milestone that has already passed. */
const PAST_MARKER_PCT = 2

// Fills use the colour tokens themselves (`bg-destructive/70`), which accept an
// opacity step. The `bg-status-*` names are fixed tint classes with no opacity
// step: `bg-status-error/70` generates no CSS, so the bar and its legend swatch
// were drawn with no colour at all.
const PHASE_BAR_CLASS: Record<DeadlinePhase, string> = {
  active: 'bg-destructive/70',
  imminent: 'bg-warning/80',
  near: 'bg-warning/60',
  mid: 'bg-primary/60',
  long: 'bg-primary/40',
  ongoing: 'bg-muted',
}

const LEGEND: { phase: DeadlinePhase; label: string; cls: string }[] = [
  { phase: 'active', label: 'Active', cls: PHASE_BAR_CLASS.active },
  { phase: 'imminent', label: 'Imminent', cls: PHASE_BAR_CLASS.imminent },
  { phase: 'near', label: 'Near', cls: PHASE_BAR_CLASS.near },
  { phase: 'mid', label: 'Mid', cls: PHASE_BAR_CLASS.mid },
  { phase: 'long', label: 'Long', cls: PHASE_BAR_CLASS.long },
]
