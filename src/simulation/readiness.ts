// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Migration readiness (WS-04) — grounded in the estate, gated by two locks.
 *
 * An estate edge counts as MIGRATED only when BOTH gates pass:
 *   1. Effort   — the player has completed enough P5 activities to "unlock" it
 *                 (activity gate: floor(p5Frac × migratableEdges)).
 *   2. Judgment — the player has chosen a sound strategy (hybrid/pure) for it
 *                 (decision gate: edgeDecisions[edgeKey] ∈ {hybrid, pure}).
 * Neither gate alone moves the score — a choice on paper with no work, or work
 * with no choice, both count for nothing.
 *
 * The denominator is ALL vulnerable edges, so residual edges (no PQC path,
 * vendor-dependent, or touching a product with no PQC story) permanently hold
 * readiness below 100% — the intended supply-chain pressure.
 *
 * Strategy alignment is a SEPARATE scenario meter. A valid choice can receive
 * planning credit while disagreeing with the scenario's country-level stance;
 * this does not establish actual cryptographic protection or compliance.
 * It reports what it actually evaluated — an unknown jurisdiction or
 * a run with no decisions yields `null`, never a perfect score.
 *
 * Pure function (no React); the caller supplies the P5 completion fraction, the
 * persisted per-edge decisions, and the org's country.
 */
import { ARCHITECTURES, edgeKey } from '@/data/simArchitecture'
import { checkChoice, jurisdictionFor } from '@/data/jurisdiction'
import { planningForArchitecture, type EdgePlanningProgress } from './edgePlanningProgress'

/** Migration strategy persisted per edge (a migrated edge carries hybrid|pure). */
export type EdgeChoice = 'hybrid' | 'pure'

export interface Readiness {
  /** Exact named choices, effort credit and declared sample-purpose groups. Never persisted. */
  planning: EdgePlanningProgress
  /** 0–100 — migrated ÷ all vulnerable edges (residual edges cap this < 100). */
  pct: number
  /** Vulnerable edges actually migrated (both gates passed). */
  migrated: number
  /** Total quantum-vulnerable edges (the denominator). */
  vulnerable: number
  /** Topology ceiling: edges that COULD be migrated (PQC path + both ends ready). */
  migratable: number
  /** Activity gate: how many migratable edges P5 progress has unlocked so far. */
  unlocked: number
  /**
   * W4 — SCENARIO STRATEGY ALIGNMENT, 0–100: of the decisions actually
   * evaluated against a jurisdiction rule, how many align with it.
   *
   * `null` when nothing was evaluated (no decisions made, or no rule on file
   * for the country). It used to be a plain number that read 100 in exactly
   * that case, so a run that had decided nothing displayed a perfect meter.
   * Absence of evidence is not alignment — callers must render `null` as
   * "not evaluated", never as a score.
   *
   * This is not a compliance determination: it compares a choice against one
   * country-level stance, with no sector, system-scope or effective-date view.
   */
  alignmentPct: number | null
  /** Decisions that were actually assessed against a rule. */
  evaluated: number
  /** Migratable edges with no decision yet — the meter's blind spot. */
  unevaluated: number
  /** Whether a rule exists for this run's country at all. */
  jurisdictionState: 'known' | 'unknown'
}

/**
 * @param size           org size preset (selects the architecture topology)
 * @param p5Frac         fraction (0–1) of P5 activities completed (effort gate)
 * @param edgeDecisions  persisted per-edge migration choices (decision gate)
 * @param country        org jurisdiction (for the compliance meter)
 */
export function computeReadiness(
  size: string,
  p5Frac: number,
  edgeDecisions: Record<string, EdgeChoice> = {},
  country = ''
): Readiness {
  const arch = ARCHITECTURES[size as keyof typeof ARCHITECTURES] ?? ARCHITECTURES.mid
  const vuln = arch.edges.filter((e) => e.vulnerable)
  const planning = planningForArchitecture(arch, p5Frac, edgeDecisions)
  const selected = new Set(planning.selectedKeys)
  const decidedEdges = arch.edges.filter((e) => selected.has(edgeKey(e)))
  const unlocked = planning.unlocked

  // Credit the exact selected set only when the whole set fits the effort gate.
  // Never choose an anonymous subset of restored selections by count or source order.
  const migrated = planning.creditedKeys.length
  const pct = vuln.length ? Math.round((migrated / vuln.length) * 100) : 100

  // Alignment is a separate scenario comparison of valid choices, independent
  // of effort credit. A planning choice is not an executed protection check.
  // Only decisions that a
  // rule actually assessed are counted; an unknown jurisdiction evaluates
  // nothing and therefore scores nothing.
  const verdicts = decidedEdges.map((e) => checkChoice(country, edgeDecisions[edgeKey(e)]))
  const assessed = verdicts.filter((v) => v.evaluated)
  const aligned = assessed.filter((v) => v.level !== 'fail').length
  const alignmentPct = assessed.length ? Math.round((aligned / assessed.length) * 100) : null

  return {
    planning,
    pct,
    migrated,
    vulnerable: vuln.length,
    migratable: planning.eligibleKeys.length,
    unlocked,
    alignmentPct,
    evaluated: assessed.length,
    unevaluated: Math.max(0, planning.eligibleKeys.length - assessed.length),
    jurisdictionState: jurisdictionFor(country) ? 'known' : 'unknown',
  }
}
