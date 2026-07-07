// SPDX-License-Identifier: GPL-3.0-only
import hndlCurve from '@/data/actuarial/hndlExposureCurve.json'

/**
 * The one CRQC-arrival probability curve used across the app (Cyber Insurance
 * Lens and the Breach Scenario Simulator) — see hndlExposureCurve.json for
 * sources and methodology. 'slow'/'fast' are the GRI 2025 survey's low/high
 * bounds; 'consensus' is their midpoint, computed here rather than stored.
 */
export type CrqcScenario = 'slow' | 'consensus' | 'fast'

const YEARS: number[] = hndlCurve.years
const SLOW: number[] = hndlCurve.optimistic
const FAST: number[] = hndlCurve.pessimistic

function curveFor(scenario: CrqcScenario): number[] {
  if (scenario === 'slow') return SLOW
  if (scenario === 'fast') return FAST
  return SLOW.map((v, i) => (v + FAST[i]) / 2)
}

/** Cumulative probability a CRQC exists by `year`, clamped to the curve's range. */
export function crqcCumulativeProbability(year: number, scenario: CrqcScenario): number {
  const curve = curveFor(scenario)
  const first = YEARS[0]
  const last = YEARS[YEARS.length - 1]
  if (year <= first) return curve[0]
  if (year >= last) return curve[curve.length - 1]
  const idx = YEARS.findIndex((y) => y >= year)
  if (YEARS[idx] === year) return curve[idx]
  const y0 = YEARS[idx - 1]
  const y1 = YEARS[idx]
  const t = (year - y0) / (y1 - y0)
  return curve[idx - 1] + t * (curve[idx] - curve[idx - 1])
}

/**
 * Probability a CRQC arrives within [fromYear, fromYear + horizonYears] —
 * a simple cumulative-probability difference, not conditioned on it not
 * having already arrived by fromYear (that correction is negligible for the
 * near-term fromYear values this tool is used with, and materially simpler
 * to explain in the UI).
 */
export function crqcProbabilityWithinHorizon(
  fromYear: number,
  horizonYears: number,
  scenario: CrqcScenario
): number {
  const pStart = crqcCumulativeProbability(fromYear, scenario)
  const pEnd = crqcCumulativeProbability(fromYear + horizonYears, scenario)
  return Math.max(0, pEnd - pStart)
}

/**
 * The year cumulative probability first reaches 50% for a scenario — the
 * "median CRQC arrival year" used by the Mosca decision layer. Returns the
 * curve's last year if the scenario never reaches 50% within it.
 */
export function medianCrqcYear(scenario: CrqcScenario): number {
  const curve = curveFor(scenario)
  const idx = curve.findIndex((v) => v >= 0.5)
  if (idx === -1) return YEARS[YEARS.length - 1]
  if (idx === 0) return YEARS[0]
  const p0 = curve[idx - 1]
  const p1 = curve[idx]
  const y0 = YEARS[idx - 1]
  const y1 = YEARS[idx]
  const t = p1 === p0 ? 0 : (0.5 - p0) / (p1 - p0)
  return y0 + t * (y1 - y0)
}

export const CRQC_CURVE_YEAR_RANGE = { first: YEARS[0], last: YEARS[YEARS.length - 1] }
