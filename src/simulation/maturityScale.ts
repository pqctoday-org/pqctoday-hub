// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Two different measures, kept apart on purpose.
 *
 * FRAMEWORK MATURITY is the source's own 0–4 ladder. It is never rescaled. A
 * phase whose simulator ladder stops at L2 has earned L2 — not "the top of what
 * we shipped, therefore 4".
 *
 * SCENARIO COMPLETION is how much of what this simulation actually offers the
 * player has finished. It is legitimate and useful (a fully-cleared short phase
 * IS 100% of that phase's available exercises), but it is a completion
 * percentage, not a maturity level, and must never be displayed as one.
 *
 * The defect this replaces: `normalizeLevel` stretched a short ladder onto 0–4
 * and the result was fed into PROGRAM MATURITY. P3 ships bands L1–L2, so a
 * player at P3 L2 was reported at framework level 4 — the framework's own L3
 * ("QRA updated quarterly… legal risk dimension assessed") and L4 ("continuous
 * risk posture management… integrated into enterprise risk register and audit
 * cycle") were simply skipped, and the comment claiming the framework caps
 * these phases was wrong: the framework has L1–L4 indicators for every phase,
 * the IMPLEMENTATION has a shorter activity ladder.
 */
import type { PhaseTree } from './types'

/** The highest maturity band a phase's tree actually ships (its top level), or
 *  `fallback` when the phase has no tree. This is a fact about the SIMULATOR,
 *  not about the framework. */
export function topBandLevel(tree: PhaseTree | undefined, fallback: number): number {
  const levels = tree?.levels
  return levels && levels.length ? Math.max(...levels.map((b) => b.level)) : fallback
}

/**
 * SCENARIO COMPLETION for one phase (0..1): achieved level over the phase's own
 * top band. A fully-cleared phase contributes 1 regardless of how many bands it
 * ships. Name it as completion wherever it is shown — never as maturity.
 */
export function scenarioCompletionFraction(level: number, top: number): number {
  if (top <= 0) return 0
  return Math.min(1, level / top)
}

/**
 * FRAMEWORK MATURITY for one phase, on the source's fixed 0..maxLevel ladder.
 * Clamped, never stretched: an unimplemented band is a band NOT earned, so the
 * number stays below the ceiling and the gap stays visible.
 */
export function frameworkLevel(level: number, maxLevel: number): number {
  return Math.max(0, Math.min(maxLevel, Math.round(level)))
}

/**
 * Is this phase's ladder shorter than the framework's? True whenever the
 * simulator cannot take a player to the source's top band, which is exactly
 * when a maturity claim has to be qualified.
 */
export function hasShortenedLadder(tree: PhaseTree | undefined, maxLevel: number): boolean {
  return topBandLevel(tree, maxLevel) < maxLevel
}
