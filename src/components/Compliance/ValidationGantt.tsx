// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import type { ComplianceFramework, DeadlinePhase } from '@/data/complianceData'
import { Button } from '@/components/ui/button'

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

/**
 * Validation deadline gantt (P11-P1-07).
 *
 * Plots each framework as a horizontal bar from "now" to its deadline year so
 * an executive or architect can see the relative pressure of every regulator
 * at one glance. Bars are color-coded by `deadlinePhase`; rows without a
 * concrete year fall through to a "no firm deadline" tally under the chart.
 *
 * Pure data-vis: no DOM measurement, no resize observer. Renders inside the
 * parent's flex/grid box.
 */
export const ValidationGantt: React.FC<Props> = ({
  frameworks,
  onSelectFramework,
  maxRows = 12,
}) => {
  const { rows, undated, yearMin, yearMax } = useMemo(() => {
    const dated = frameworks
      .filter((f) => typeof f.deadlineYear === 'number')
      .sort((a, b) => (a.deadlineYear ?? 0) - (b.deadlineYear ?? 0))
    const sliced = dated.slice(0, maxRows)
    const undated = frameworks.filter((f) => typeof f.deadlineYear !== 'number')
    const currentYear = new Date().getFullYear()
    const years = sliced.map((f) => f.deadlineYear as number)
    const yearMin = Math.min(currentYear, ...years)
    // Cap the right edge at the furthest deadline + 1 so even ongoing rows show progress.
    const yearMax = Math.max(currentYear + 1, ...years)
    return { rows: sliced, undated, yearMin, yearMax }
  }, [frameworks, maxRows])

  if (rows.length === 0 && undated.length === 0) {
    return null
  }

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
          {rows.length} framework{rows.length !== 1 ? 's' : ''} with a concrete year
          {undated.length > 0 && ` · ${undated.length} ongoing`}
        </span>
      </header>

      {rows.length > 0 && (
        <div className="relative">
          {/* Year axis */}
          <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
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
          <div className="grid grid-cols-[160px_1fr] gap-3">
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
            {rows.map((fw) => {
              const year = fw.deadlineYear as number
              const startPct = ((Math.max(currentYear, yearMin) - yearMin) / span) * 100
              const endPct = ((year - yearMin) / span) * 100
              const widthPct = Math.max(2, endPct - startPct)
              const phaseClass = PHASE_BAR_CLASS[fw.deadlinePhase] ?? 'bg-muted'
              const labelClickable = !!onSelectFramework

              return (
                <div key={fw.id} className="grid grid-cols-[160px_1fr] gap-3 items-center group">
                  {labelClickable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectFramework?.(fw)}
                      className="h-auto px-0 py-1 justify-start text-xs font-medium text-foreground truncate group-hover:text-primary"
                      title={`${fw.label} — deadline ${year}`}
                    >
                      {fw.label}
                    </Button>
                  ) : (
                    <span
                      className="text-xs font-medium text-foreground truncate"
                      title={`${fw.label} — deadline ${year}`}
                    >
                      {fw.label}
                    </span>
                  )}
                  <div className="relative h-6 rounded-sm bg-muted/30">
                    <div
                      className={`absolute top-1 bottom-1 rounded-sm ${phaseClass}`}
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                      }}
                      title={`${fw.label}: ${fw.deadlinePhase} (${year})`}
                    />
                    <span className="absolute right-2 inset-y-0 flex items-center text-[10px] font-mono text-foreground/80 tabular-nums">
                      {year}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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

const PHASE_BAR_CLASS: Record<DeadlinePhase, string> = {
  active: 'bg-status-error/70',
  imminent: 'bg-status-warning/80',
  near: 'bg-status-warning/60',
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
