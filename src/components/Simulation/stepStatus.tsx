// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Status controls for the two step kinds that are not "open a resource":
 *
 *  - `recurrence` — operate an activity again in a later quarter. The tool opens
 *    in the sim; this banner says how many quarters are on file and what to do next.
 *  - `measure` — a condition read from the run (budget secured, share of
 *    connections decided). There is nothing to open, so instead of a link back to
 *    /simulation the learner sees the live value against the target, and, where one
 *    exists, a button for the action that moves it.
 *
 * Pure and prop-driven, like atoms.tsx: the caller reads the stores.
 */
import { Button } from '@/components/ui/button'
import { metricDef } from '@/simulation/runMetrics'
import type { TreeStep } from '@/simulation/types'

export function RecurrenceProgressBanner({
  quarters,
  needed,
  currentQuarter,
}: {
  /** Distinct run quarters this artifact has been saved in. */
  quarters: readonly string[]
  needed: number
  currentQuarter: string
}) {
  const have = quarters.length
  const done = have >= needed
  const savedThisQuarter = quarters.includes(currentQuarter)
  const next = done
    ? 'This recurring check is complete.'
    : savedThisQuarter
      ? `Saved for ${currentQuarter}. End the quarter, then come back and save an updated version.`
      : `Save it here to record ${currentQuarter}.`
  return (
    <div
      role="status"
      data-testid="recurrence-progress"
      className={`mb-3 rounded-md border px-3 py-2 text-xs ${
        done ? 'border-success/40 bg-success/5 text-success' : 'border-primary/40 bg-primary/5'
      }`}
    >
      <span className="font-bold text-foreground">
        Recurring check: saved in {Math.min(have, needed)} of {needed} quarters
      </span>
      {have > 0 && <span className="text-muted-foreground"> ({quarters.join(', ')})</span>}
      <span className="block text-muted-foreground">{next}</span>
    </div>
  )
}

/** What moves each measurable condition, in the learner's terms. */
const METRIC_HINT: Record<string, string> = {
  'budget-secured-pct':
    'Secured budget grows as you complete this phase’s other activities and decisions.',
  'migration-coverage-pct': 'Decide more of the migratable connections in the architecture.',
  'migration-decisions': 'Decide more of the migratable connections in the architecture.',
  'inventory-coverage-pct': 'Run discovery so more of the estate is accounted for.',
}

export function formatMetric(value: number, unit: string | undefined): string {
  const rounded = Math.round(value)
  return unit === 'percent' ? `${rounded}%` : String(rounded)
}

export function MeasureStatus({
  step,
  value,
  onAct,
  actLabel,
  compact = false,
}: {
  step: TreeStep
  /** Current metric value, or null when the run cannot measure it yet. */
  value: number | null
  /** The action that moves this metric, when the sim has one to open. */
  onAct?: () => void
  actLabel?: string
  compact?: boolean
}) {
  const def = step.metricId ? metricDef(step.metricId) : null
  const target = step.minValue
  const met = value !== null && target !== undefined && value >= target
  const now = value === null ? 'not measurable yet' : formatMetric(value, def?.unit)
  const goal = target === undefined ? '' : formatMetric(target, def?.unit)
  const hint = step.metricId ? METRIC_HINT[step.metricId] : undefined
  return (
    <div
      data-testid="measure-status"
      className={`flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 ${
        met ? 'border-success/40 bg-success/5' : 'border-border bg-card'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block font-semibold text-foreground ${compact ? 'text-[11.5px]' : 'text-sim-body'}`}
        >
          {step.label}
        </span>
        <span className="block font-mono text-sim-micro text-muted-foreground">
          {met ? '✓ ' : ''}Measured now: {now}
          {goal ? ` · needs ${goal}` : ''}
        </span>
        {!met && hint && <span className="block text-sim-micro text-muted-foreground">{hint}</span>}
      </span>
      {!met && onAct && (
        <Button type="button" variant="outline" size="sm" onClick={onAct} className="shrink-0">
          {actLabel ?? 'Open'}
        </Button>
      )}
    </div>
  )
}
