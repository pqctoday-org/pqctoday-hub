// SPDX-License-Identifier: GPL-3.0-only
/**
 * SIM_BALANCE — the single source of truth for the simulation's tunable balance
 * (WS-03). Every probability/weight the quarter engine and scoring use lives
 * here, grouped and documented, so tuning the game means editing config, not
 * component code. This is the substrate the difficulty presets (WS-14) ride on.
 *
 * Pure data — no React, no RNG. The engine reads these with a seeded RNG (WS-02)
 * so outcomes stay deterministic per seed.
 */

export interface SimBalance {
  /** End-Quarter world-event roll probabilities. */
  events: {
    /** Danger event when residual classical crypto remains (P1 or P5 < win). */
    dangerWhenClassical: number
    /** Warning event each quarter. */
    warning: number
    /** A good-news event fires this quarter… */
    goodNews: number
    /** …and when it does, this is the chance it's a success (else info). */
    successVsInfo: number
  }
  /** CRQC pull-forward (Q-Day gets closer). */
  crqc: {
    /** Chance the CRQC estimate is pulled forward one year this quarter. */
    pullForwardPerQuarter: number
  }
  /** AI-team behaviour. */
  ai: {
    /** Per-phase chance the AI completes the next unlocked tree step this quarter. */
    advanceChance: number
    /** Wave 4 (WP4.3) — €M charged per step when the player delegates a whole
     *  phase to the AI team. Scales with difficulty: Hard makes delegation a
     *  real trade-off against a tighter budget, not a free lunch. */
    delegationCostPerStepM: number
  }
  /**
   * P0 budget fraction (WS-04): budget fraction = doneWeight·(P0 steps done / total).
   * Activity-driven so every secured euro traces to a specific completed activity.
   * (A level-bonus term once lived here but shipped inert across all presets and was
   * removed; difficulty touches budget via `estate.budgetMultiplier`, see WS-14/PR4.)
   */
  budget: { doneWeight: number }
  /**
   * Estate / difficulty structure (WS-14, PR4). Only the budget lever ships now:
   * `budgetMultiplier` scales the program budget target so Hard secures less per
   * activity. (Estate-widening fields — extraVulnerableBias etc. — are parked
   * until the grounded-readiness model settles; see SIMULATION-REMEDIATION-PLAN.)
   */
  estate: { budgetMultiplier: number }
  /**
   * Wave 4 (WP4.1) — event consequences. Previously every event was flavor text
   * with no mechanical effect regardless of difficulty; this is what makes
   * difficulty a real stake, not just a probability dial on cosmetic text.
   * A rolled `dangerWhenClassical` event applies a setback + incident cost ONLY
   * when `hndlExposure` (the fraction of the estate still unmigrated) is above
   * `hndlExposureThreshold` — residual classical crypto has to actually be
   * exposing something for the danger event to bite. A rolled good-news event
   * always grants `goodNewsCreditM` regardless of exposure.
   */
  consequences: {
    /** Quarters of rework lost when a danger event bites (see threshold above). */
    setbackQuarters: number
    /** Illustrative incident cost (€M) drawn from the budget pool when it bites. */
    incidentCostM: number
    /** Illustrative credit (€M) granted to the budget pool on a good-news event. */
    goodNewsCreditM: number
    /** hndlExposure (0–1) must exceed this for a danger event to have teeth. */
    hndlExposureThreshold: number
  }
  /**
   * Decision-card stakes (2026-08-02). Easy grants a costless "↺ try again" on a
   * wrong Next-Move pick; the grounded presets make the setback real — you see
   * why the pick failed, but it stands. This lever previously rode on the GUIDED
   * mode toggle, which conflated a difficulty choice with a layout one; GUIDED's
   * layout half is gone (the Expert rail is now the Signals tab, closed by
   * default for everyone) and its stakes half lives here, on the dial that
   * already owns every other difficulty consequence.
   */
  decisions: {
    /** Whether a wrong decision pick can be retried for free. */
    freeRetryOnWrongPick: boolean
  }
}

/** Difficulty presets (WS-14) — each is a complete SimBalance variant. Pure
 *  config swap: the engine reads the active balance, it never branches on preset. */
export type DifficultyId = 'easy' | 'realistic' | 'hard'

export const SIM_PRESETS: Record<DifficultyId, SimBalance> = {
  // Forgiving: fewer shocks, slower Q-Day creep, faster AI help.
  easy: {
    events: { dangerWhenClassical: 0.4, warning: 0.4, goodNews: 0.65, successVsInfo: 0.65 },
    crqc: { pullForwardPerQuarter: 0.1 },
    ai: { advanceChance: 0.55, delegationCostPerStepM: 0.5 },
    budget: { doneWeight: 1 },
    estate: { budgetMultiplier: 1.2 },
    consequences: {
      setbackQuarters: 1,
      incidentCostM: 2,
      goodNewsCreditM: 2,
      hndlExposureThreshold: 0.5,
    },
    decisions: { freeRetryOnWrongPick: true },
  },
  // The grounded baseline (the original WS-03 values).
  realistic: {
    events: { dangerWhenClassical: 0.6, warning: 0.55, goodNews: 0.5, successVsInfo: 0.5 },
    crqc: { pullForwardPerQuarter: 0.22 },
    ai: { advanceChance: 0.35, delegationCostPerStepM: 1 },
    budget: { doneWeight: 1 },
    estate: { budgetMultiplier: 1 },
    consequences: {
      setbackQuarters: 1,
      incidentCostM: 5,
      goodNewsCreditM: 1.5,
      hndlExposureThreshold: 0.35,
    },
    decisions: { freeRetryOnWrongPick: false },
  },
  // Punishing: more shocks, faster Q-Day creep, sparse AI help.
  hard: {
    events: { dangerWhenClassical: 0.75, warning: 0.65, goodNews: 0.4, successVsInfo: 0.4 },
    crqc: { pullForwardPerQuarter: 0.35 },
    ai: { advanceChance: 0.2, delegationCostPerStepM: 2 },
    budget: { doneWeight: 1 },
    estate: { budgetMultiplier: 0.8 },
    consequences: {
      setbackQuarters: 2,
      incidentCostM: 10,
      goodNewsCreditM: 1,
      hndlExposureThreshold: 0.2,
    },
    decisions: { freeRetryOnWrongPick: false },
  },
}

/** Default balance (Realistic) — kept as a named export for back-compat. */
export const SIM_BALANCE: SimBalance = SIM_PRESETS.realistic

/** Resolve the active balance for a difficulty (falls back to Realistic). */
export const getBalance = (id: DifficultyId): SimBalance => SIM_PRESETS[id] ?? SIM_PRESETS.realistic

/**
 * Wave 4 (WP4.2) — par quarters per difficulty: the quarter count runScore.ts
 * grades "on pace" against. Hard's par is deliberately more generous (fewer AI
 * assists, harsher setbacks mean the SAME diligence takes longer) — par adjusts
 * for difficulty so the grade rewards playing Hard well, not just playing fast.
 */
export const PAR_QUARTERS: Record<DifficultyId, number> = {
  easy: 16,
  realistic: 20,
  hard: 24,
}
