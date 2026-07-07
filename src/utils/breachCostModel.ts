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

import { crqcProbabilityWithinHorizon, type CrqcScenario } from './crqcProbability'

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
 * Raw quantum amplification of a single breach, BEFORE shelf-life decay:
 * once a CRQC exists, a breach exposes not just today's data but accumulated
 * harvested data. Modelled as 1 + min(cap, years × factor).
 */
export function hndlMultiplier(yearsOfData: number, hndlFactorPct: number): number {
  const raw = (Math.max(0, yearsOfData) * Math.max(0, hndlFactorPct)) / 100
  return 1 + Math.min(HNDL_MULTIPLIER_CAP, raw)
}

/**
 * Fraction (0–1) of the raw HNDL exposure that survives shelf-life decay.
 * Uses the harvested corpus's AVERAGE age TODAY (yearsOfData / 2) against the
 * data class's shelf life — i.e. "is the data already-harvested still fresh
 * enough to matter". Deliberately does NOT also add the planning horizon or
 * time-until-CRQC: that uncertainty is a separate dimension, already carried
 * by the CRQC-arrival probability weighting in computeBreachCosts — adding it
 * here too would double-count the same "how much longer until this is
 * decrypted" question. Simplification: decay is linear to zero at the
 * shelf-life boundary, not an exponential curve.
 */
export function shelfLifeDecayFactor(yearsOfData: number, shelfLifeYears: number): number {
  if (shelfLifeYears <= 0) return 0
  const avgAgeToday = Math.max(0, yearsOfData) / 2
  return Math.min(1, Math.max(0, 1 - avgAgeToday / shelfLifeYears))
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
}

export interface BreachCostScenario {
  scenario: CrqcScenario
  /** Probability a CRQC arrives within the planning horizon, this scenario. */
  pCrqc: number
  /** Probability-weighted expected annual loss, this scenario. */
  quantumALE: number
  /** Present value, over the horizon, of (quantumALE − classicalALE). */
  pvDelta: number
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

/** Present-value annuity factor for a level annual amount over N years at rate r. */
function annuityPvFactor(discountRateAnnual: number, years: number): number {
  const r = Math.max(0, discountRateAnnual)
  const n = Math.max(0, years)
  if (r === 0) return n
  return (1 - Math.pow(1 + r, -n)) / r
}

function computeForScenario(
  inp: BreachModelInputs,
  classicalALE: number,
  quantumSLE: number,
  scenario: CrqcScenario
): BreachCostScenario {
  const pCrqc = crqcProbabilityWithinHorizon(inp.asOfYear, inp.planningHorizonYears, scenario)
  const quantumALEConditional = quantumSLE * (Math.max(0, inp.annualBreachProbPct) / 100)
  const quantumALE = classicalALE * (1 - pCrqc) + quantumALEConditional * pCrqc
  const pvFactor = annuityPvFactor(inp.discountRateAnnual, inp.planningHorizonYears)
  const pvDelta = (quantumALE - classicalALE) * pvFactor
  return { scenario, pCrqc, quantumALE, pvDelta }
}

export function computeBreachCosts(inp: BreachModelInputs): BreachCosts {
  const classicalSLE = inp.baseline * inp.breachScale
  const classicalALE = classicalSLE * (Math.max(0, inp.annualBreachProbPct) / 100)

  const shelfLifeYears = DATA_SHELF_LIFE_YEARS[inp.dataSensitivityClass]
  const decayFactor = shelfLifeDecayFactor(inp.yearsOfData, shelfLifeYears)
  const effectiveYearsOfData = inp.yearsOfData * decayFactor
  const mult = hndlMultiplier(effectiveYearsOfData, inp.hndlFactorPct)
  const quantumSLE = classicalSLE * mult

  const low = computeForScenario(inp, classicalALE, quantumSLE, 'slow')
  const central = computeForScenario(inp, classicalALE, quantumSLE, 'consensus')
  const high = computeForScenario(inp, classicalALE, quantumSLE, 'fast')

  return {
    classicalSLE,
    quantumSLE,
    delta: quantumSLE - classicalSLE,
    hndlMultiplier: mult,
    decayFactor,
    classicalALE,
    quantumALE: central.quantumALE,
    pCrqc: central.pCrqc,
    pvQuantumDelta: central.pvDelta,
    range: { low, central, high },
  }
}
