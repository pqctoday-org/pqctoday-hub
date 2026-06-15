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
  }
  /**
   * P0 budget blend (WS-04): budget fraction = doneWeight·(P0 steps done / total)
   * + levelWeight·(P0 level / max). Default is activity-driven (doneWeight 1,
   * levelWeight 0) so every secured euro traces to a specific completed activity;
   * presets (WS-14) may dial in a level bonus.
   */
  budget: { doneWeight: number; levelWeight: number }
}

export const SIM_BALANCE: SimBalance = {
  events: {
    dangerWhenClassical: 0.6,
    warning: 0.55,
    goodNews: 0.5,
    successVsInfo: 0.5,
  },
  crqc: {
    pullForwardPerQuarter: 0.22,
  },
  ai: {
    advanceChance: 0.35,
  },
  budget: { doneWeight: 1, levelWeight: 0 },
}
