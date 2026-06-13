// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mosca's Inequality (X + Y > Z) — gap-closer #1 (spec §6, Assess #1).
 *
 * Surfaces the *existing* HNDL / HNFL window math (`riskWindows.ts`) as a NAMED,
 * structured "Mosca's Inequality" result on the Assess output. This module is a
 * pure read over `computeHNDLRiskWindow` / `computeHNFLRiskWindow` +
 * `getEffectiveThreatYear` — it introduces no new scoring, only a labelled
 * framing of numbers the engine already computes.
 *
 * Michele Mosca's theorem: if the time your data/credentials must stay secure
 * (X, shelf-life) plus the time it takes you to migrate (Y) exceeds the time
 * until a cryptographically-relevant quantum computer arrives (Z), you are
 * already too late and must act with urgency. Formally:  X + Y > Z.
 *
 * Phase: 3 (Risk Scoring). Framework ref: Applied Quantum App. C (p.193).
 */

import type { AssessmentInput } from '../assessmentTypes'
import { computeHNDLRiskWindow, computeHNFLRiskWindow, getEffectiveThreatYear } from './riskWindows'

/** Which secrecy horizon drives X (shelf-life) for a given Mosca evaluation. */
export type MoscaTrack = 'hndl' | 'hnfl'

/** Adopter verdict from Mosca's inequality. */
export type MoscaVerdict = 'urgent' | 'regular'

/**
 * A single, fully-named Mosca's-Inequality evaluation for one track. All values
 * are *years* unless the field name says otherwise; `z` is an absolute calendar
 * year (the CRQC estimate), while `x` and `y` are durations.
 */
export interface MoscaInequality {
  track: MoscaTrack
  /** Human label for the track ("Harvest-Now-Decrypt-Later" / "...Forge-Later"). */
  trackLabel: string
  /** X — shelf-life: how long the data / credential must remain secure (years). */
  x: number
  /** What X measures, in words (e.g. "data retention" / "credential lifetime"). */
  xLabel: string
  /** Y — estimated migration time (years). */
  y: number
  /** Z — the year a cryptographically-relevant quantum computer is estimated. */
  z: number
  /** The year the protected secret stops mattering: currentYear + X. */
  secretExpiryYear: number
  /** currentYear + X + Y — the year you finish protecting, if you start now. */
  protectedUntilYear: number
  /** true when X + Y > (Z − currentYear): the inequality holds → act now. */
  inequalityHolds: boolean
  /** Margin in years: (X + Y) − (Z − currentYear). Positive = over the line. */
  marginYears: number
  /** 'urgent' when the inequality holds, else 'regular' adopter. */
  verdict: MoscaVerdict
  /** true when X came from a conservative "I don't know" default. */
  isEstimated: boolean
  /** The current calendar year used as the baseline. */
  currentYear: number
}

/** The assembled Mosca result: per-track inequalities + an overall verdict. */
export interface MoscaResult {
  /** CRQC year Z (after applying any country planning horizon). */
  z: number
  /** Estimated migration time Y (years) shared across tracks. */
  migrationYears: number
  /** HNDL evaluation, when retention/data inputs are present. */
  hndl?: MoscaInequality
  /** HNFL evaluation, when credential/signing inputs are present. */
  hnfl?: MoscaInequality
  /** 'urgent' if EITHER track's inequality holds; else 'regular'. */
  verdict: MoscaVerdict
  /** Plain-language one-liner summarising the verdict for display. */
  summary: string
}

/**
 * Estimate Y — the migration time, in years — from how ready the org is.
 *
 * Deliberately coarse (whole-year buckets): Mosca's inequality is a planning
 * heuristic, not a precise schedule. Drivers (in increasing-time order):
 *   - already started migrating          → 1y
 *   - hardcoded crypto / heavy HSM/Legacy → +1–2y (agility & infra inertia)
 *   - large estate (200+ systems)         → +1y
 *   - unknown agility/infra               → conservative middle
 * Clamped to [1, 5] years.
 */
export function estimateMigrationYears(input: AssessmentInput): number {
  let years = 2 // baseline: a typical migration takes ~2 years

  if (input.migrationStatus === 'started') years = 1
  else if (input.migrationStatus === 'planning') years = 2

  if (input.cryptoAgility === 'hardcoded') years += 2
  else if (input.cryptoAgility === 'partially-abstracted') years += 1
  else if (input.cryptoAgility === 'fully-abstracted') years -= 1

  const hasHSMorLegacy = input.infrastructure?.some(
    (i) => i.includes('HSM') || i.includes('Legacy')
  )
  if (hasHSMorLegacy) years += 1

  if (input.systemCount === '200-plus') years += 1
  else if (input.systemCount === '51-200') years += 0.5

  return Math.max(1, Math.min(5, Math.round(years)))
}

function evaluate(
  track: MoscaTrack,
  trackLabel: string,
  xLabel: string,
  x: number,
  y: number,
  z: number,
  currentYear: number,
  isEstimated: boolean
): MoscaInequality {
  const yearsUntilThreat = z - currentYear
  const marginYears = x + y - yearsUntilThreat
  const inequalityHolds = marginYears > 0
  return {
    track,
    trackLabel,
    x,
    xLabel,
    y,
    z,
    secretExpiryYear: currentYear + x,
    protectedUntilYear: currentYear + x + y,
    inequalityHolds,
    marginYears,
    verdict: inequalityHolds ? 'urgent' : 'regular',
    isEstimated,
    currentYear,
  }
}

/**
 * Build the named Mosca's-Inequality result from an assessment input.
 *
 * Returns `undefined` only when there is no shelf-life signal at all (neither
 * retention nor credential-lifetime inputs) — in which case the inequality
 * cannot be framed and the Assess UI simply omits the Mosca panel.
 */
export function computeMoscaResult(input: AssessmentInput): MoscaResult | undefined {
  const z = getEffectiveThreatYear(input.country)
  const y = estimateMigrationYears(input)
  const currentYear = new Date().getFullYear()

  const hndlWindow = computeHNDLRiskWindow(input)
  const hnflWindow = computeHNFLRiskWindow(input)

  const hndl = hndlWindow
    ? evaluate(
        'hndl',
        'Harvest-Now-Decrypt-Later',
        'data retention',
        hndlWindow.dataRetentionYears,
        y,
        z,
        currentYear,
        !!hndlWindow.isEstimated
      )
    : undefined

  const hnfl = hnflWindow
    ? evaluate(
        'hnfl',
        'Harvest-Now-Forge-Later',
        'credential lifetime',
        hnflWindow.credentialLifetimeYears,
        y,
        z,
        currentYear,
        !!hnflWindow.isEstimated
      )
    : undefined

  if (!hndl && !hnfl) return undefined

  // HNFL only fires the "urgent" verdict when signing algorithms are actually
  // present (a forge risk needs something to forge) — mirror that gate here so
  // the overall verdict can't be urgent on a credential lifetime that has no
  // signing exposure behind it.
  const hnflUrgent = !!hnfl?.inequalityHolds && !!hnflWindow?.hasSigningAlgorithms
  const hndlUrgent = !!hndl?.inequalityHolds
  const urgent = hndlUrgent || hnflUrgent
  const verdict: MoscaVerdict = urgent ? 'urgent' : 'regular'

  const summary = urgent
    ? `X + Y > Z holds — you are an urgent adopter: secrets must stay protected past the ${z} quantum-threat horizon, so migration cannot wait.`
    : `X + Y > Z does not hold — you are a regular adopter: current shelf-life and migration time fit inside the ${z} quantum-threat horizon, but re-check as estimates tighten.`

  return { z, migrationYears: y, hndl, hnfl, verdict, summary }
}
