// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simplified, illustrative simulation of the six PQC-migration cost-model
 * families taught in the Business Case Learn module. Every figure here is
 * driven by the user's scenario inputs through a transparent formula — none of
 * it is an authoritative benchmark. The point is pedagogical: let a learner
 * feel HOW MUCH the methods disagree on the same scenario.
 *
 * Five families estimate the cost of MIGRATING; the sixth (Risk / ALE) estimates
 * the cost of NOT migrating, so it is returned separately as a reference, never
 * mixed into the migration-cost comparison.
 */

import { INDUSTRY_BREACH_BASELINES } from '@/data/roiBaselines'

export interface CostModelInputs {
  /** Number of systems / applications in scope. */
  systems: number
  /** Annual IT budget (USD). Drives the top-down parametric lens. */
  itBudgetAnnual: number
  /** Legacy / complexity factor, ~0.5 (modern) to ~2.0 (heavy legacy). */
  complexity: number
  /** Planning horizon in years. */
  horizonYears: number
}

/**
 * Illustrative constants. Surfaced in the UI so the learner can see exactly what
 * each lens assumes. Deliberately round, order-of-magnitude figures.
 */
export const SIM_CONSTANTS = {
  /** Parametric lens: share of annual IT budget spent per year on migration. */
  budgetSharePct: 8,
  /** Bottom-up lens: base cost to migrate one system before complexity. */
  perSystemBase: 40_000,
  /** Bottom-up lens: fixed program cost (governance, discovery, PMO). */
  fixedProgramCost: 2_000_000,
  /** Analogical lens: illustrative per-system cost from past crypto migrations. */
  histPerSystem: 30_000,
  /** Scenario lens multipliers on the bottom-up expected value. */
  optimisticFactor: 0.7,
  conservativeFactor: 1.6,
  /** Monte-Carlo lens: triangular spread on the average per-system cost. */
  mcMinFactor: 0.5,
  mcMaxFactor: 2.5,
  /** ALE reference (cost of inaction). Same source as the Breach Scenario Simulator — no drift. */
  breachBaseline: INDUSTRY_BREACH_BASELINES.Other,
  annualBreachProb: 0.15,
  quantumFactor: 2.5,
} as const

/** Parametric / budget-anchored: a share of the multi-year IT budget. */
export function parametricEstimate(inp: CostModelInputs): number {
  return (SIM_CONSTANTS.budgetSharePct / 100) * inp.itBudgetAnnual * inp.horizonYears
}

/** Bottom-up / activity-based: per-system cost × systems + fixed program cost. */
export function bottomUpEstimate(inp: CostModelInputs): number {
  return SIM_CONSTANTS.perSystemBase * inp.complexity * inp.systems + SIM_CONSTANTS.fixedProgramCost
}

export interface ScenarioBand {
  optimistic: number
  expected: number
  conservative: number
}

/** Judgemental / scenario: optimistic / expected / conservative around bottom-up. */
export function scenarioEstimate(inp: CostModelInputs): ScenarioBand {
  const expected = bottomUpEstimate(inp)
  return {
    optimistic: expected * SIM_CONSTANTS.optimisticFactor,
    expected,
    conservative: expected * SIM_CONSTANTS.conservativeFactor,
  }
}

/** Analogical / historical: illustrative per-system cost from past migrations. */
export function analogicalEstimate(inp: CostModelInputs): number {
  return SIM_CONSTANTS.histPerSystem * inp.complexity * inp.systems
}

/**
 * Risk / ALE reference — the cost of NOT migrating over the horizon. Returned
 * separately from the migration-cost lenses (different quantity).
 */
export function aleReference(inp: CostModelInputs): number {
  return (
    SIM_CONSTANTS.breachBaseline *
    SIM_CONSTANTS.quantumFactor *
    SIM_CONSTANTS.annualBreachProb *
    inp.horizonYears
  )
}

// ── Seeded PRNG + triangular sampling (deterministic → testable) ────────────

/** mulberry32 — small, fast, seedable PRNG. Deterministic for a given seed. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Inverse-CDF sample from a triangular(min, mode, max) distribution. */
export function sampleTriangular(
  rng: () => number,
  min: number,
  mode: number,
  max: number
): number {
  if (max <= min) return min
  const u = rng()
  const c = (mode - min) / (max - min)
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min))
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}

export interface MonteCarloResult {
  p10: number
  p50: number
  p90: number
  mean: number
  /** Sorted total-cost samples, ascending. */
  samples: number[]
}

/**
 * Monte-Carlo lens. Simplification: each run samples one uncertain *average*
 * cost-per-system (triangular), so the whole estate moves together — this makes
 * the uncertainty band visible without pretending to model per-system
 * diversification. Deterministic for a given seed.
 */
export function monteCarloEstimate(
  inp: CostModelInputs,
  opts: { draws?: number; seed?: number } = {}
): MonteCarloResult {
  const draws = opts.draws ?? 1000
  const rng = mulberry32(opts.seed ?? 42)
  const base = SIM_CONSTANTS.perSystemBase * inp.complexity
  const min = base * SIM_CONSTANTS.mcMinFactor
  const max = base * SIM_CONSTANTS.mcMaxFactor
  const samples: number[] = []
  for (let i = 0; i < draws; i++) {
    const perSystem = sampleTriangular(rng, min, base, max)
    samples.push(perSystem * inp.systems + SIM_CONSTANTS.fixedProgramCost)
  }
  samples.sort((a, b) => a - b)
  const mean = samples.reduce((sum, v) => sum + v, 0) / (samples.length || 1)
  return {
    p10: percentile(samples, 10),
    p50: percentile(samples, 50),
    p90: percentile(samples, 90),
    mean,
    samples,
  }
}

/** Nearest-rank percentile on an already-sorted ascending array. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const rank = Math.ceil((p / 100) * sorted.length)
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1))
  return sorted[idx]
}

export interface CostModelComparison {
  parametric: number
  bottomUp: number
  scenario: ScenarioBand
  analogical: number
  monteCarlo: MonteCarloResult
  /** Cost-of-inaction reference (not a migration-cost method). */
  aleReference: number
  /** Point estimates of the five migration-cost lenses (MC uses p50). */
  migrationPoints: number[]
  /** max ÷ min across the five migration-cost point estimates (≥ 1). */
  spreadRatio: number
}

/** Run all six lenses on one scenario. */
export function compareCostModels(
  inp: CostModelInputs,
  opts: { draws?: number; seed?: number } = {}
): CostModelComparison {
  const parametric = parametricEstimate(inp)
  const bottomUp = bottomUpEstimate(inp)
  const scenario = scenarioEstimate(inp)
  const analogical = analogicalEstimate(inp)
  const monteCarlo = monteCarloEstimate(inp, opts)
  const migrationPoints = [parametric, bottomUp, scenario.expected, analogical, monteCarlo.p50]
  const positive = migrationPoints.filter((v) => v > 0)
  const spreadRatio = positive.length ? Math.max(...positive) / Math.min(...positive) : 1
  return {
    parametric,
    bottomUp,
    scenario,
    analogical,
    monteCarlo,
    aleReference: aleReference(inp),
    migrationPoints,
    spreadRatio,
  }
}
