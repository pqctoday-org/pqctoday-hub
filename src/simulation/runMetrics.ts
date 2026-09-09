// SPDX-License-Identifier: GPL-3.0-only
/**
 * runMetrics (W2.5) — the measurable conditions a maturity criterion states.
 *
 * Most of the framework's L2–L4 indicators describe an operating CONDITION, not
 * a document: "Year 1 budget secured", "≥70% Tier-1 coverage", "2+ production
 * pilots running with measured results", "Top 10 vendors formally engaged".
 * Producing an artifact about a condition is not the same as reaching it, which
 * is why those bands were honestly recorded as proxies.
 *
 * A `measure` step names one of these metrics and a threshold taken from the
 * criterion's own wording. The value is read out of real run state, so the band
 * evidences the condition itself.
 *
 * Rules this file exists to enforce:
 *  - An UNKNOWN metric id returns null and never completes a step. A criterion
 *    we cannot measure must fail closed, not silently pass.
 *  - Thresholds live in the trees next to the criterion they came from, not
 *    here, so a reader can check one against the other.
 */

/** What a metric reads from, so a reader can audit the number. */
export interface RunMetricDef {
  id: string
  /** Units, for the UI and for anyone reading a threshold. */
  unit: 'percent' | 'count' | 'year'
  /** Plain description of what is being measured. */
  describes: string
}

export const RUN_METRICS: readonly RunMetricDef[] = [
  {
    id: 'budget-secured-pct',
    unit: 'percent',
    describes:
      'Programme budget secured, as a percentage of the scenario’s target for this organisation.',
  },
  {
    id: 'inventory-coverage-pct',
    unit: 'percent',
    describes: 'Share of the modelled asset estate that discovery has actually accounted for.',
  },
  {
    id: 'migration-decisions',
    unit: 'count',
    describes: 'Architecture decisions the player has taken on real connections in this run.',
  },
  {
    id: 'migration-coverage-pct',
    unit: 'percent',
    describes:
      'Share of the run’s MIGRATABLE connections that have been decided. Capacity-relative on purpose: "estate-wide" means all of THIS estate, and a smaller organisation must not face an unreachable absolute count.',
  },
  {
    id: 'evidence-records',
    unit: 'count',
    describes: 'Evidence records this run has produced, of any origin.',
  },
  {
    id: 'learner-evidence-records',
    unit: 'count',
    describes:
      'Evidence records the LEARNER produced themselves — narrated demonstrations do not count.',
  },
  {
    id: 'reporting-periods-elapsed',
    unit: 'count',
    describes: 'Quarters elapsed since the run began.',
  },
] as const

const IDS = new Set(RUN_METRICS.map((m) => m.id))

/** Is this a metric the simulation can actually measure? */
export const isKnownMetric = (id: string): boolean => IDS.has(id)

export const metricDef = (id: string): RunMetricDef | null =>
  RUN_METRICS.find((m) => m.id === id) ?? null

/** Inputs a run can supply. Anything absent makes its metric unmeasurable. */
export interface RunMetricInputs {
  budgetSecuredM: number
  budgetTargetM: number
  /** Assets discovered / total modelled assets. */
  assetsAccounted: number
  assetsTotal: number
  edgeDecisions: number
  /** Total migratable connections in this run's architecture. */
  edgeCapacity: number
  evidenceTotal: number
  evidenceByLearner: number
  quartersElapsed: number
}

/**
 * Read one metric. Returns null for an unknown id, and for a ratio whose
 * denominator is zero — an undefined percentage must not read as 0 and must not
 * read as 100.
 */
export function readRunMetric(id: string, i: RunMetricInputs): number | null {
  switch (id) {
    case 'budget-secured-pct':
      return i.budgetTargetM > 0 ? (i.budgetSecuredM / i.budgetTargetM) * 100 : null
    case 'inventory-coverage-pct':
      return i.assetsTotal > 0 ? (i.assetsAccounted / i.assetsTotal) * 100 : null
    case 'migration-decisions':
      return i.edgeDecisions
    case 'migration-coverage-pct':
      return i.edgeCapacity > 0 ? (i.edgeDecisions / i.edgeCapacity) * 100 : null
    case 'evidence-records':
      return i.evidenceTotal
    case 'learner-evidence-records':
      return i.evidenceByLearner
    case 'reporting-periods-elapsed':
      return i.quartersElapsed
    default:
      return null
  }
}
