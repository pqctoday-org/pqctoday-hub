// SPDX-License-Identifier: GPL-3.0-only
/**
 * Breach-cost model for the Business Case workshop's Breach Scenario Simulator.
 *
 * Design decisions that fix the prior model:
 *  - ONE source of truth for the baseline: the industry average total breach
 *    cost from roiBaselines (IBM 2024), passed in — no private, drifted table.
 *  - The baseline is IBM's *total* breach cost (already inclusive of detection,
 *    notification, lost business and reputational damage), so we do NOT add a
 *    separate reputational term on top (that double-counted).
 *  - The quantum effect is modelled as ONE thing — harvest-now-decrypt-later
 *    retroactive exposure — via a single, capped multiplier. We do NOT also
 *    multiply per-record cost by a "quantum factor" (a quantum computer doesn't
 *    make each leaked record cost more to remediate; it changes how much data is
 *    exposed and how likely the breach is).
 *  - Impact vs likelihood are kept distinct: SLE = cost if a breach happens;
 *    ALE = SLE × annual probability. The simulator shows both.
 */

export interface BreachModelInputs {
  /** Industry average total breach cost (SLE anchor), e.g. IBM 2024. */
  baseline: number
  /** Breach severity as a multiple of the industry-average breach. */
  breachScale: number
  /** Years of harvested/stored encrypted data at HNDL risk. */
  yearsOfData: number
  /** Fraction (0–100) of stored data an attacker could retroactively decrypt. */
  hndlFactorPct: number
  /** Annual probability (0–100) of a breach, for the expected-loss (ALE) view. */
  annualBreachProbPct: number
}

/**
 * Cap on the HNDL amplification so long retention windows can't produce absurd
 * totals. quantum breach ≤ (1 + cap)× the classical breach.
 */
export const HNDL_MULTIPLIER_CAP = 4

/**
 * Quantum amplification of a single breach: once a CRQC exists, a breach exposes
 * not just today's data but accumulated harvested data. Modelled as
 * 1 + min(cap, years × factor). Defaults 5yr × 30% → 2.5×.
 */
export function hndlMultiplier(yearsOfData: number, hndlFactorPct: number): number {
  const raw = (Math.max(0, yearsOfData) * Math.max(0, hndlFactorPct)) / 100
  return 1 + Math.min(HNDL_MULTIPLIER_CAP, raw)
}

export interface BreachCosts {
  /** Cost of one breach today. */
  classicalSLE: number
  /** Cost of one quantum-enabled breach. */
  quantumSLE: number
  /** quantumSLE − classicalSLE. */
  delta: number
  /** The applied HNDL amplification (≥ 1). */
  hndlMultiplier: number
  /** Annual expected loss today = classicalSLE × probability. */
  classicalALE: number
  /** Annual expected loss post-quantum = quantumSLE × probability. */
  quantumALE: number
}

export function computeBreachCosts(inp: BreachModelInputs): BreachCosts {
  const classicalSLE = inp.baseline * inp.breachScale
  const mult = hndlMultiplier(inp.yearsOfData, inp.hndlFactorPct)
  const quantumSLE = classicalSLE * mult
  const p = Math.max(0, inp.annualBreachProbPct) / 100
  return {
    classicalSLE,
    quantumSLE,
    delta: quantumSLE - classicalSLE,
    hndlMultiplier: mult,
    classicalALE: classicalSLE * p,
    quantumALE: quantumSLE * p,
  }
}
