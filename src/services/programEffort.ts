// SPDX-License-Identifier: GPL-3.0-only
/**
 * Program effort rollup shared by the board pack's program-effort.md and its
 * sources of figures, so both state the same figures from the same assumptions.
 * Illustrative planning figures only — never a quote.
 */
import type { AssessmentResult, MigrationEffortItem } from '@/hooks/assessmentTypes'

type Scope = MigrationEffortItem['estimatedScope']

/** Person-month band per migration scope — illustrative planning figures. */
export const SCOPE_PERSON_MONTHS = new Map<Scope, [number, number]>([
  ['quick-win', [0.5, 1]],
  ['moderate', [1, 2]],
  ['major-project', [3, 6]],
  ['multi-year', [6, 12]],
])
export const SCOPE_LABEL = new Map<Scope, string>([
  ['quick-win', 'Quick win'],
  ['moderate', 'Moderate'],
  ['major-project', 'Major project'],
  ['multi-year', 'Multi-year'],
])
/** Illustrative blended, fully-loaded cost per person-month (USD). Override with your rates. */
export const ASSUMED_COST_PER_PERSON_MONTH = 18000
/** Assumed parallel workstreams used only for the calendar-time band. */
export const ASSUMED_PARALLEL_WORKSTREAMS = 2

/** The scope bands as one sentence, e.g. "quick-win 0.5–1, moderate 1–2, …". */
export const SCOPE_BANDS_TEXT = [...SCOPE_PERSON_MONTHS.entries()]
  .map(([scope, [lo, hi]]) => `${scope} ${lo}–${hi}`)
  .join(', ')

export interface ScopeRow {
  scope: Scope
  label: string
  count: number
  pmLow: number
  pmHigh: number
}

export interface ProgramEffort {
  migrations: number
  pmLow: number
  pmHigh: number
  calLow: number
  calHigh: number
  costLow: number
  costHigh: number
  byScope: ScopeRow[]
}

/** "$18k" for thousands, "$900" below that. */
export function usd(n: number): string {
  return n >= 1000
    ? `$${Math.round(n / 1000).toLocaleString()}k`
    : `$${Math.round(n).toLocaleString()}`
}

/** The rollup, or null when the assessment computed no per-algorithm effort. */
export function computeProgramEffort(result: AssessmentResult): ProgramEffort | null {
  const effort = result.migrationEffort ?? []
  if (effort.length === 0) return null
  let pmLow = 0
  let pmHigh = 0
  const counts = new Map<Scope, number>()
  for (const item of effort) {
    const band = SCOPE_PERSON_MONTHS.get(item.estimatedScope) ?? [1, 2]
    pmLow += band[0]
    pmHigh += band[1]
    counts.set(item.estimatedScope, (counts.get(item.estimatedScope) ?? 0) + 1)
  }
  const byScope: ScopeRow[] = []
  for (const [scope, band] of SCOPE_PERSON_MONTHS) {
    const n = counts.get(scope) ?? 0
    if (n === 0) continue
    byScope.push({
      scope,
      label: SCOPE_LABEL.get(scope) ?? scope,
      count: n,
      pmLow: band[0] * n,
      pmHigh: band[1] * n,
    })
  }
  return {
    migrations: effort.length,
    pmLow,
    pmHigh,
    calLow: Math.max(1, Math.ceil(pmLow / ASSUMED_PARALLEL_WORKSTREAMS)),
    calHigh: Math.max(1, Math.ceil(pmHigh / ASSUMED_PARALLEL_WORKSTREAMS)),
    costLow: pmLow * ASSUMED_COST_PER_PERSON_MONTH,
    costHigh: pmHigh * ASSUMED_COST_PER_PERSON_MONTH,
    byScope,
  }
}
