// SPDX-License-Identifier: GPL-3.0-only
/**
 * Breach-cost model for the Business Case workshop's Breach Scenario Simulator.
 *
 * v2 design (2026-07 rebuild — see pqctoday-priv/plans/breach-simulator-improvement-plan-2026-07-06.md):
 *
 *  - ONE source of truth for the baseline: the industry average total breach
 *    cost from roiBaselines (IBM 2025), passed in — no private, drifted table.
 *    The baseline is IBM's *total* breach cost (already inclusive of detection,
 *    notification, lost business and reputational damage), so we do NOT add a
 *    separate reputational term on top (that would double-count).
 *  - Quantum risk has TWO independently documented ingredients, not one hidden
 *    assumption:
 *      (1) HNDL amplification — how much MORE a breach costs if harvested data
 *          is later decrypted. Shelf-life decay (per data-sensitivity class)
 *          keeps old, no-longer-sensitive data from inflating this forever.
 *      (2) CRQC-arrival probability — HOW LIKELY that decryption capability
 *          exists within the planning horizon, from the GRI 2025 survey curve
 *          (crqcProbability.ts). This was entirely absent from v1: the old
 *          model applied the HNDL multiplier as if a CRQC's existence were
 *          certain, which silently answered the wrong question.
 *  - The two ingredients combine into a PROBABILITY-WEIGHTED expected annual
 *    loss (quantumALE below) — a blend across the CRQC-exists /
 *    CRQC-doesn't-exist futures, not just "amplified SLE × breach probability".
 *    This is the number that belongs in ROI math.
 *  - Future losses are discounted to present value (a $ figure ten years out
 *    is not equivalent to the same $ figure today).
 *  - A three-scenario range (slow / consensus / fast CRQC arrival) is exposed
 *    so headline numbers are not false-precision point estimates.
 *  - Impact vs likelihood are kept distinct: SLE = cost if a breach happens;
 *    ALE = SLE × annual probability. The simulator shows both.
 */

import {
  crqcProbabilityWithinHorizon,
  crqcCumulativeProbability,
  type CrqcScenario,
} from './crqcProbability'

export type { CrqcScenario }

/**
 * How long compromised data of a given class remains damaging if decrypted.
 * Not all classes have a hard citation — labeled per entry; the UI must show
 * this as an assumption where no authoritative source exists.
 */
export type DataSensitivityClass =
  | 'payment-card'
  | 'general-pii'
  | 'health-record'
  | 'ip-trade-secret'
  | 'state-secret'

export const DATA_SHELF_LIFE_YEARS: Record<DataSensitivityClass, number> = {
  'payment-card': 3, // card reissuance / tokenization lifecycle — assumption, no single authoritative source
  'general-pii': 10, // typical identity-theft monitoring / breach-notification window — assumption
  'health-record': 20, // health data stays sensitive far longer than most PII — assumption, capped for modeling
  'ip-trade-secret': 15, // trade-secret commercial value window — assumption
  'state-secret': 30, // approximates automatic declassification schedules (e.g. US EO 13526: 25 years)
}

export const DATA_SHELF_LIFE_HAS_CITATION: Record<DataSensitivityClass, boolean> = {
  'payment-card': false,
  'general-pii': false,
  'health-record': false,
  'ip-trade-secret': false,
  'state-secret': true,
}

export const DATA_SENSITIVITY_LABELS: Record<DataSensitivityClass, string> = {
  'payment-card': 'Payment card data',
  'general-pii': 'General customer/employee PII',
  'health-record': 'Health records',
  'ip-trade-secret': 'Intellectual property / trade secrets',
  'state-secret': 'Classified / state secrets',
}

/**
 * Cap on the raw HNDL amplification so long retention windows can't produce
 * absurd totals. quantum breach ≤ (1 + cap)× the classical breach.
 */
export const HNDL_MULTIPLIER_CAP = 4

/**
 * Raw quantum amplification of a single breach: once a CRQC exists, a breach
 * exposes not just today's data but accumulated harvested data.
 *
 * Modelled as `1 + cap·(1 − e^(−raw/cap))` where `raw = years × factor/100`.
 * This approaches — but never reaches — the cap, and is strictly increasing
 * everywhere, with slope 1 at the origin so low-exposure estimates stay close
 * to the previous linear form.
 *
 * It replaces a hard `min(cap, raw)` clamp. That clamp flatlined across whole
 * realistic input ranges: classified data at a 90% HNDL factor pinned the
 * multiplier to exactly 5.00 at every corpus size tested (5, 10, 14, 20 years),
 * so for the most exposed organizations the model reported that migration
 * timing made literally no difference to breach cost. A ceiling should damp
 * extreme inputs, not erase the signal below it. (Audit 2026-08-10.)
 */
export function hndlMultiplier(yearsOfData: number, hndlFactorPct: number): number {
  const raw = (Math.max(0, yearsOfData) * Math.max(0, hndlFactorPct)) / 100
  const cap = HNDL_MULTIPLIER_CAP
  return 1 + cap * (1 - Math.exp(-raw / cap))
}

/**
 * Freshness-weighted years of harvested data that still matter.
 *
 * Integrates the linear shelf-life decay across a corpus aged 0..Y: an item
 * harvested `a` years ago retains `max(0, 1 - a/S)` of its value, so the
 * corpus as a whole is worth ∫₀^Y max(0, 1 - a/S) da.
 *
 *   Y ≤ S → Y - Y²/(2S)
 *   Y > S → S/2   (saturates — the stale tail stops contributing, but the
 *                  fresh top of the corpus never does)
 *
 * The `Y ≤ S` branch is algebraically identical to the previous
 * `Y · (1 - (Y/2)/S)` form, so behaviour inside the shelf life is unchanged.
 * Past `Y = S` the old form kept falling and hit exactly ZERO at `Y = 2S`,
 * which said a payment processor holding 6 years of card data (S=3) faced no
 * quantum uplift at all — quantumSLE == classicalSLE. That was wrong on the
 * old form's OWN stated terms: it derived a decay factor from the corpus's
 * average age and then applied it to the whole corpus, which is only valid
 * while the entire corpus sits inside the shelf life. At Y = 2S the average
 * item has only just reached end-of-life, so half the corpus is still within
 * it. (Audit 2026-08-10, W1-2.)
 *
 * Simplification: decay is linear in age, not an exponential curve.
 *
 * `gapYears` — years between the END of the harvested corpus and the moment it
 * is actually decrypted. This is what makes migrating EARLY worth anything.
 *
 * The original model measured staleness as of TODAY. But harvested ciphertext
 * is not decrypted today — it is decrypted whenever a CRQC appears. Data
 * harvested the day before you migrate is fresh today and worthless in 2040;
 * data harvested the day before a 2038 CRQC is fresh when it is cracked. With
 * the gap fixed at 0, migrating in 2026 and migrating in 2035 protect almost
 * the same corpus, and the tool concluded migration timing barely mattered.
 * With the gap modelled, finishing more than one shelf-life ahead of the CRQC
 * drives the residual to exactly zero — which is Mosca's inequality falling
 * out of the cost model instead of being bolted on beside it.
 * (Audit 2026-08-10, W1-1 follow-up.)
 */
export function effectiveHndlYears(
  yearsOfData: number,
  shelfLifeYears: number,
  gapYears: number = 0
): number {
  const S = shelfLifeYears
  if (S <= 0) return 0
  const Y = Math.max(0, yearsOfData)
  const a = Math.max(0, gapYears) // age (at decryption) of the YOUNGEST item
  if (a >= S) return 0 // the whole corpus is stale before anyone can read it
  const b = Math.min(a + Y, S) // age of the oldest item that still matters
  // ∫ₐᵇ (1 − u/S) du — freshness integrated across the corpus's age range
  const F = (u: number) => u - (u * u) / (2 * S)
  return F(b) - F(a)
}

/**
 * Fraction (0–1) of the raw HNDL exposure that survives shelf-life decay —
 * `effectiveHndlYears / yearsOfData`. Kept as a separate export because the UI
 * and `BreachCosts.decayFactor` present it as a percentage.
 */
export function shelfLifeDecayFactor(yearsOfData: number, shelfLifeYears: number): number {
  if (shelfLifeYears <= 0) return 0
  const y = Math.max(0, yearsOfData)
  if (y === 0) return 1
  return effectiveHndlYears(y, shelfLifeYears) / y
}

export interface BreachModelInputs {
  /** Industry average total breach cost (SLE anchor), e.g. IBM 2025. */
  baseline: number
  /** Breach severity as a multiple of the industry-average breach. */
  breachScale: number
  /** Years of harvested/stored encrypted data at HNDL risk. */
  yearsOfData: number
  /** Fraction (0–100) of stored data an attacker could retroactively decrypt. */
  hndlFactorPct: number
  /** Annual probability (0–100) of a breach, for the expected-loss (ALE) view. */
  annualBreachProbPct: number
  /** Data class — drives the shelf-life decay applied to HNDL exposure. */
  dataSensitivityClass: DataSensitivityClass
  /** Reference "today" year the CRQC-probability lookup is evaluated from. */
  asOfYear: number
  /** Years of business-case planning horizon (also the CRQC-probability window). */
  planningHorizonYears: number
  /** Annual discount rate applied to future losses, e.g. 0.06. */
  discountRateAnnual: number
  /**
   * How pCrqc is read off the arrival curve. Default 'within-horizon'.
   *
   *  'within-horizon' — P(a CRQC ARRIVES during [asOfYear, asOfYear + H]).
   *      Correct when the question is "will the capability appear inside my
   *      planning window", which is what the Breach Scenario Simulator asks.
   *
   *  'cumulative'     — P(a CRQC EXISTS by asOfYear + H).
   *      Correct when projecting an expected loss for a specific future year,
   *      because a CRQC that arrived earlier has not gone away. The Cost of
   *      Inaction Analyzer evaluates one row per year with H=1; under
   *      'within-horizon' each row asked "does it arrive in THIS year" (~4%,
   *      flat across the whole horizon), so quantum risk never accumulated and
   *      the tool reported that delay was free. (Audit 2026-08-10, W1-1.)
   */
  crqcProbabilityMode?: 'within-horizon' | 'cumulative'
  /**
   * Years between the end of the harvested corpus and the moment it is
   * decrypted — see `effectiveHndlYears`. Callers that know when migration
   * completes (the Cost of Inaction Analyzer) pass it explicitly. When
   * omitted, it defaults per scenario to the time from `asOfYear` to that
   * scenario's median CRQC arrival, since harvested data is not read until a
   * CRQC exists.
   */
  decryptionGapYears?: number
}

export interface BreachCostScenario {
  scenario: CrqcScenario
  /** Probability a CRQC arrives within the planning horizon, this scenario. */
  pCrqc: number
  /** Probability-weighted expected annual loss, this scenario. */
  quantumALE: number
  /** Present value, over the horizon, of (quantumALE − classicalALE). */
  pvDelta: number
  /** Cost of one breach if a CRQC exists at this scenario's expected arrival. */
  quantumSLE: number
  /** Decay-adjusted HNDL amplification applied for this scenario. */
  hndlMultiplier: number
  /** Freshness-weighted years of corpus that still matter at decryption. */
  effYears: number
}

export interface BreachCosts {
  /** Cost of one breach today. */
  classicalSLE: number
  /** Cost of one breach if a CRQC already exists (consensus scenario). */
  quantumSLE: number
  /** quantumSLE − classicalSLE (consensus scenario). */
  delta: number
  /** Decay-adjusted HNDL amplification actually applied (≥ 1, consensus scenario). */
  hndlMultiplier: number
  /** Shelf-life decay factor applied (1 = no decay). */
  decayFactor: number
  /** Annual expected loss today = classicalSLE × probability. */
  classicalALE: number
  /** Probability-weighted expected annual loss — consensus scenario. THE number for ROI math. */
  quantumALE: number
  /** Probability a CRQC arrives within the planning horizon — consensus scenario. */
  pCrqc: number
  /** Present value, over the horizon, of the consensus-scenario ALE delta. */
  pvQuantumDelta: number
  /** Low / central / high range across CRQC-arrival scenarios (slow / consensus / fast). */
  range: {
    low: BreachCostScenario
    central: BreachCostScenario
    high: BreachCostScenario
  }
}

function computeForScenario(
  inp: BreachModelInputs,
  classicalSLE: number,
  classicalALE: number,
  scenario: CrqcScenario
): BreachCostScenario {
  const shelfLifeYears = DATA_SHELF_LIFE_YEARS[inp.dataSensitivityClass]
  const prob = Math.max(0, inp.annualBreachProbPct) / 100
  const r = Math.max(0, inp.discountRateAnnual)
  const horizon = Math.max(0, inp.planningHorizonYears)

  // Headline SLE: what one breach costs if a CRQC exists at this scenario's
  // expected arrival. The corpus has aged by then, which is the whole point of
  // migrating early — see effectiveHndlYears.
  // Default 0: an organization that has NOT migrated keeps harvesting, so the
  // newest data in the corpus is same-year fresh whenever a CRQC finally reads
  // it. A positive gap is what MIGRATING buys you — it freezes the corpus and
  // lets it age out. Callers that know when migration completes pass it.
  const headlineGap = inp.decryptionGapYears ?? 0
  const effYears = effectiveHndlYears(inp.yearsOfData, shelfLifeYears, headlineGap)
  const mult = hndlMultiplier(effYears, inp.hndlFactorPct)
  const quantumSLE = classicalSLE * mult

  const pCrqc =
    inp.crqcProbabilityMode === 'cumulative'
      ? crqcCumulativeProbability(inp.asOfYear + horizon, scenario)
      : crqcProbabilityWithinHorizon(inp.asOfYear, horizon, scenario)
  const quantumALE = classicalALE * (1 - pCrqc) + quantumSLE * prob * pCrqc

  // Present value, integrated year by year rather than ALE × annuity factor.
  // The annuity form applied ONE horizon-wide arrival probability uniformly to
  // every year, so year 1 was charged the full ten-year probability of a CRQC
  // existing. Each year now carries its own cumulative arrival probability and
  // its own corpus age at decryption. (Audit 2026-08-10, W1-3a.)
  let pvDelta = 0
  for (let t = 1; t <= horizon; t++) {
    const pAtT = crqcCumulativeProbability(inp.asOfYear + t, scenario)
    const gapAtT = inp.decryptionGapYears ?? 0
    const sleAtT =
      classicalSLE *
      hndlMultiplier(effectiveHndlYears(inp.yearsOfData, shelfLifeYears, gapAtT), inp.hndlFactorPct)
    const aleAtT = classicalALE * (1 - pAtT) + sleAtT * prob * pAtT
    pvDelta += (aleAtT - classicalALE) / Math.pow(1 + r, t)
  }

  return { scenario, pCrqc, quantumALE, pvDelta, quantumSLE, hndlMultiplier: mult, effYears }
}

export function computeBreachCosts(inp: BreachModelInputs): BreachCosts {
  const classicalSLE = inp.baseline * inp.breachScale
  const classicalALE = classicalSLE * (Math.max(0, inp.annualBreachProbPct) / 100)

  const low = computeForScenario(inp, classicalSLE, classicalALE, 'slow')
  const central = computeForScenario(inp, classicalSLE, classicalALE, 'consensus')
  const high = computeForScenario(inp, classicalSLE, classicalALE, 'fast')

  // Headline figures follow the consensus scenario, as before.
  const decayFactor = inp.yearsOfData > 0 ? central.effYears / inp.yearsOfData : 1

  return {
    classicalSLE,
    quantumSLE: central.quantumSLE,
    delta: central.quantumSLE - classicalSLE,
    hndlMultiplier: central.hndlMultiplier,
    decayFactor,
    classicalALE,
    quantumALE: central.quantumALE,
    pCrqc: central.pCrqc,
    pvQuantumDelta: central.pvDelta,
    range: { low, central, high },
  }
}
