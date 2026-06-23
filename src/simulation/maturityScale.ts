// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-phase-relative maturity scaling.
 *
 * The framework caps several phases below L4 BY DESIGN — no framework activity sits
 * at the higher levels (e.g. p3 tops at L2, p6 at L3), so their trees ship fewer
 * bands. Scoring those phases on a fixed 0..4 scale made a fully-cleared phase read
 * as partial forever (the readiness bar could never fill; program maturity stayed
 * frozen at L2 because the risk domain maps only to p3). These pure helpers rescale
 * a phase's achieved level against its OWN top band so "all bands cleared" = maxed,
 * whether the ladder is 2, 3, or 4 long.
 */
import type { PhaseTree } from './types'

/** The highest maturity band a phase's tree actually ships (its top level), or
 *  `fallback` when the phase has no tree. */
export function topBandLevel(tree: PhaseTree | undefined, fallback: number): number {
  const levels = tree?.levels
  return levels && levels.length ? Math.max(...levels.map((b) => b.level)) : fallback
}

/** Rescale an achieved `level` onto the 0..`maxLevel` ladder relative to the phase's
 *  own `top` band. Clamped and rounded to an integer (safe to index level names). */
export function normalizeLevel(level: number, top: number, maxLevel: number): number {
  if (top <= 0) return 0
  return Math.round((Math.min(level, top) / top) * maxLevel)
}

/** A phase's contribution (0..1) to an aggregate readiness fraction: its achieved
 *  level over its own top band. A fully-cleared phase contributes 1 regardless of
 *  how many bands it has. */
export function phaseReadinessFraction(level: number, top: number): number {
  if (top <= 0) return 0
  return Math.min(1, level / top)
}
