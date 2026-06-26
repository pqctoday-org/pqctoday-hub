// SPDX-License-Identifier: GPL-3.0-only
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
 * Compliance is a SEPARATE meter: a `pure` choice where the jurisdiction requires
 * `hybrid` still counts as migrated (it is quantum-safe) but lowers compliance.
 *
 * Pure function (no React); the caller supplies the P5 completion fraction, the
 * persisted per-edge decisions, and the org's country.
 */
import { ARCHITECTURES, edgeState, edgeKey } from '@/data/simArchitecture'
import { checkChoice } from '@/data/jurisdiction'

/** Migration strategy persisted per edge (a migrated edge carries hybrid|pure). */
export type EdgeChoice = 'hybrid' | 'pure'

export interface Readiness {
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
  /** 0–100 — compliant decisions ÷ decisions made (separate from readiness). */
  compliancePct: number
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
  const migratableEdges = vuln.filter((e) => edgeState(arch, e) === 'migratable')

  // Effort gate — completed P5 activities unlock the right to migrate this many edges.
  const frac = Math.max(0, Math.min(1, p5Frac))
  const unlocked = Math.floor(frac * migratableEdges.length)

  // Decision gate — migratable edges the player has chosen to migrate (hybrid/pure).
  const decidedEdges = migratableEdges.filter((e) => {
    const c = edgeDecisions[edgeKey(e)]
    return c === 'hybrid' || c === 'pure'
  })

  // Both gates: an edge counts only if decided AND within activity-unlocked capacity.
  const migrated = Math.min(decidedEdges.length, unlocked)
  const pct = vuln.length ? Math.round((migrated / vuln.length) * 100) : 100

  // Compliance meter — a non-compliant (failing) choice still counts migrated above,
  // but lowers this separate score.
  const compliant = decidedEdges.filter(
    (e) => checkChoice(country, edgeDecisions[edgeKey(e)]).level !== 'fail'
  ).length
  const compliancePct = decidedEdges.length
    ? Math.round((compliant / decidedEdges.length) * 100)
    : 100

  return {
    pct,
    migrated,
    vulnerable: vuln.length,
    migratable: migratableEdges.length,
    unlocked,
    compliancePct,
  }
}
