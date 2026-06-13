// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deadline-buffer / Regulatory Horizon layer (PER-PAGE-CHANGES.md Compliance #4,
 * framework GRC §, p.180–182).
 *
 * Turns each dated PQC mandate into a months-to-deadline KRI badge so a GRC lead
 * sees the *buffer* shrinking, not just a year. Uses the framework GRC threshold
 * cascade: <12 months → amber, <6 months → red. Overdue mandates surface first.
 *
 * Reads the live `ComplianceFramework[]` already loaded by the page and the
 * existing `extractYear` parser — no new data is authored. Additive: when no
 * dated mandates are present the panel renders an empty-state and nothing else
 * on the page changes.
 */
import React, { useMemo } from 'react'
import { Radar } from 'lucide-react'
import { extractYear } from '@/utils/deadlineUrgency'
import type { ComplianceFramework } from '@/data/complianceData'

/** KRI tier for a deadline buffer — drives badge colour & escalation copy. */
type HorizonTier = 'overdue' | 'red' | 'amber' | 'green'

interface HorizonItem {
  framework: ComplianceFramework
  year: number
  /** Whole months from today to 1 Jan of the deadline year (can be negative). */
  monthsToDeadline: number
  tier: HorizonTier
}

const TIER_META: Record<HorizonTier, { label: string; chip: string; order: number }> = {
  overdue: {
    label: 'Overdue',
    chip: 'bg-status-error/15 border-status-error/40 text-status-error',
    order: 0,
  },
  red: {
    label: '< 6 mo',
    chip: 'bg-status-error/10 border-status-error/30 text-status-error',
    order: 1,
  },
  amber: {
    label: '< 12 mo',
    chip: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    order: 2,
  },
  green: {
    label: '12 mo+',
    chip: 'bg-status-success/10 border-status-success/30 text-status-success',
    order: 3,
  },
}

/** Whole months from `now` to 1 Jan of `year`. */
function monthsUntilYear(year: number, now: Date): number {
  const monthsNow = now.getFullYear() * 12 + now.getMonth()
  const monthsTarget = year * 12 // January (month 0) of the target year
  return monthsTarget - monthsNow
}

function tierFor(months: number): HorizonTier {
  if (months < 0) return 'overdue'
  if (months < 6) return 'red'
  if (months < 12) return 'amber'
  return 'green'
}

/** Human label for a months value, e.g. "3 mo overdue" / "8 months". */
function bufferLabel(months: number): string {
  if (months < 0) return `${Math.abs(months)} mo overdue`
  if (months === 0) return 'this month'
  return months === 1 ? '1 month' : `${months} months`
}

interface RegulatoryHorizonLayerProps {
  frameworks: ComplianceFramework[]
  /** Override "now" for deterministic tests. */
  now?: Date
}

export const RegulatoryHorizonLayer: React.FC<RegulatoryHorizonLayerProps> = ({
  frameworks,
  now = new Date(),
}) => {
  const items = useMemo<HorizonItem[]>(() => {
    return frameworks
      .map((framework): HorizonItem | null => {
        const year = extractYear(framework.deadline)
        if (year === null) return null
        const monthsToDeadline = monthsUntilYear(year, now)
        return { framework, year, monthsToDeadline, tier: tierFor(monthsToDeadline) }
      })
      .filter((x): x is HorizonItem => x !== null)
      .sort((a, b) => a.monthsToDeadline - b.monthsToDeadline)
  }, [frameworks, now])

  return (
    <section
      id="regulatory-horizon"
      className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      aria-labelledby="regulatory-horizon-heading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-status-warning/10">
          <Radar size={20} className="text-status-warning" />
        </div>
        <div>
          <h2 id="regulatory-horizon-heading" className="text-base font-bold text-foreground">
            Regulatory horizon — deadline buffer
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Months of buffer left before each dated PQC mandate, as a GRC KRI: under 12 months turns
            amber, under 6 months turns red. Closest deadlines first.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground" data-testid="horizon-empty">
          No dated PQC mandates in the current selection — nothing on the regulatory horizon yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const meta = TIER_META[item.tier]
            return (
              <li
                key={item.framework.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {item.framework.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {item.framework.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {bufferLabel(item.monthsToDeadline)}
                  </span>
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
                    aria-label={`${meta.label} deadline buffer`}
                  >
                    {meta.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
