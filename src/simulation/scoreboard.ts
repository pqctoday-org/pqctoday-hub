// SPDX-License-Identifier: GPL-3.0-only
/**
 * scoreboard — the ONE program-progress model every UI surface reads from
 * (WP2.2, a-grade-remediation-plan Wave 2).
 *
 * Before this, three surfaces independently displayed program progress:
 * the KPI ribbon's "Phases cleared … win bar = Level 2" stat, the
 * TransformationStatusPanel's three objectives, and the run-complete
 * ceremony's `fullyMature` trigger. The Level-2 floor and the real win
 * condition (every phase at its OWN top band — P3 tops at L2, P6 at L3,
 * others at L4) are genuinely different thresholds; showing them as two
 * unrelated numbers side by side read as competing scoreboards (see
 * simulation-mode-review-07182026.md, weakness #2).
 *
 * Under the hood `fullyMature` already single-sources the win condition (the
 * ceremony trigger and the objectives panel's "migration completed" item were
 * always the same boolean) — this module doesn't change that computation, it
 * packages it with the L2 milestone count into one object so every consumer
 * reads the SAME values instead of three call sites independently deriving
 * overlapping numbers as the code evolves. Pure: no store reads.
 */
import type { TransformationStatus } from '../components/Simulation/autorun/transformationStatus'

export interface ProgramScoreboard {
  /** Governance/process FLOOR — phases past the Level-2 bar. A milestone on
   *  the way to `complete`, never the win condition itself. */
  milestone: { cleared: number; total: number }
  /** The three real objectives (governance / critical assets protected /
   *  migration completed), each with its on-time judgment. */
  objectives: TransformationStatus['objectives']
  /** Program maturity 0..4 (continuous). */
  maturity: number
  /** THE win condition: every lifecycle phase at its OWN top band. Drives
   *  the run-complete ceremony and the objectives panel's "complete" item —
   *  both already read this same boolean, never derive it separately. */
  complete: boolean
}

export function buildScoreboard(params: {
  lifecyclePhases: readonly string[]
  levelOf: (phase: string) => number
  winLevel: number
  fullyMature: boolean
  txStatus: TransformationStatus
}): ProgramScoreboard {
  const cleared = params.lifecyclePhases.filter((p) => params.levelOf(p) >= params.winLevel).length
  return {
    milestone: { cleared, total: params.lifecyclePhases.length },
    objectives: params.txStatus.objectives,
    maturity: params.txStatus.maturity,
    complete: params.fullyMature,
  }
}
