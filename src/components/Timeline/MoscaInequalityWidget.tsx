// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ChevronDown, Sigma, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CRQC_ESTIMATES } from '@/data/regulatoryTimelines'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'

/**
 * Mosca's-Inequality widget for the Timeline page (PER-PAGE-CHANGES Timeline #4).
 *
 * Surfaces the Mosca instrument keyed off the centralized `CRQC_ESTIMATES`
 * constant in `regulatoryTimelines.ts` (lower / moderate / upper bounds) — the
 * same standards-body horizon the rest of the Timeline reads from. Lets the user
 * pick a CRQC bound and tune data-lifetime + migration-time to see the migration
 * deadline (Z − X − Y) against the national-roadmap backdrop on the page.
 *
 * Additive: collapsed by default; the Gantt timeline is unchanged when it is not
 * expanded.
 */

/** Phase tag — the CRQC horizon is a cross-cutting Foundations input (matches REGULATORY_PHASE). */
const MOSCA_PHASE: PhaseId = 'p0'
// eslint-disable-next-line security/detect-object-injection
const MOSCA_PHASE_DEF = FRAMEWORK_PHASES[MOSCA_PHASE]

const CURRENT_YEAR = 2026

const CRQC_BOUNDS: ReadonlyArray<{ id: string; label: string; year: number }> = [
  { id: 'lower', label: 'Conservative lower bound', year: CRQC_ESTIMATES.lowerBound },
  { id: 'moderate', label: 'Moderate estimate', year: CRQC_ESTIMATES.moderate },
  { id: 'upper', label: 'Upper bound', year: CRQC_ESTIMATES.upperBound },
]

type Urgency = 'overdue' | 'critical' | 'urgent' | 'planning'

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bg: string }> = {
  overdue: {
    label: 'OVERDUE',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  critical: {
    label: 'CRITICAL',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
  urgent: { label: 'URGENT', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  planning: { label: 'PLANNING', color: 'text-success', bg: 'bg-success/10 border-success/20' },
}

export const MoscaInequalityWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [crqcYear, setCrqcYear] = useState<number>(CRQC_ESTIMATES.workshopDefault)
  const [dataLifetime, setDataLifetime] = useState(10)
  const [migrationTime, setMigrationTime] = useState(5)

  const migrationDeadline = useMemo(
    () => crqcYear - dataLifetime - migrationTime,
    [crqcYear, dataLifetime, migrationTime]
  )
  const yearsRemaining = useMemo(() => migrationDeadline - CURRENT_YEAR, [migrationDeadline])

  const urgencyLevel = useMemo<Urgency>(() => {
    if (yearsRemaining < 0) return 'overdue'
    if (yearsRemaining <= 2) return 'critical'
    if (yearsRemaining <= 5) return 'urgent'
    return 'planning'
  }, [yearsRemaining])

  // eslint-disable-next-line security/detect-object-injection
  const urgency = URGENCY_CONFIG[urgencyLevel]

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="mosca-widget-heading"
      data-testid="mosca-inequality-widget"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sigma size={20} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="mosca-widget-heading"
              className="text-base font-bold text-foreground flex items-center gap-2"
            >
              Mosca&apos;s Inequality
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary uppercase tracking-wide">
                Phase {MOSCA_PHASE_DEF.number} · {MOSCA_PHASE_DEF.name}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              When must you finish migrating? Test the deadline against the standards-body CRQC
              horizon used across this timeline.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="mosca-widget-body"
          className="shrink-0 text-xs gap-1"
        >
          {expanded ? 'Hide' : 'Calculate'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {expanded && (
        <div id="mosca-widget-body" className="mt-4 space-y-4">
          {/* CRQC bound presets from CRQC_ESTIMATES */}
          <div>
            <span className="block text-xs font-medium text-foreground mb-1">
              CRQC arrival horizon (Z)
            </span>
            <div className="flex flex-wrap gap-2">
              {CRQC_BOUNDS.map((bound) => (
                <Button
                  key={bound.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCrqcYear(bound.year)}
                  aria-pressed={crqcYear === bound.year}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    crqcYear === bound.year
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {bound.label} ({bound.year})
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Source: centralized <code>CRQC_ESTIMATES</code> — lower {CRQC_ESTIMATES.lowerBound},
              moderate {CRQC_ESTIMATES.moderate}, upper {CRQC_ESTIMATES.upperBound}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="mosca-data-lifetime"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Data secrecy lifetime (X)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="mosca-data-lifetime"
                  type="range"
                  min={1}
                  max={75}
                  value={dataLifetime}
                  onChange={(e) => setDataLifetime(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-bold text-primary w-12 text-right">
                  {dataLifetime}y
                </span>
              </div>
            </div>
            <div>
              <label
                htmlFor="mosca-migration-time"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Migration time (Y)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="mosca-migration-time"
                  type="range"
                  min={1}
                  max={15}
                  value={migrationTime}
                  onChange={(e) => setMigrationTime(Number(e.target.value))}
                  className="flex-1 accent-warning"
                />
                <span className="text-sm font-bold text-warning w-12 text-right">
                  {migrationTime}y
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${urgency.bg}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={13} className={urgency.color} aria-hidden="true" />
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${urgency.bg} ${urgency.color}`}
                  >
                    {urgency.label}
                  </span>
                  <span className="text-xs text-muted-foreground">Migrate-by year</span>
                </div>
                <div className={`text-2xl font-bold ${urgency.color}`}>{migrationDeadline}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {yearsRemaining < 0
                    ? `Already ${Math.abs(yearsRemaining)} year${
                        Math.abs(yearsRemaining) === 1 ? '' : 's'
                      } past the deadline for this profile.`
                    : `${yearsRemaining} year${
                        yearsRemaining === 1 ? '' : 's'
                      } of runway against a ${crqcYear} CRQC.`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Mosca&apos;s Inequality</div>
                <div className="font-mono text-xs text-foreground">
                  {crqcYear} &minus; {dataLifetime} &minus; {migrationTime} = {migrationDeadline}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  If X + Y &gt; Z &minus; today, migrate now.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
