// SPDX-License-Identifier: GPL-3.0-only
/**
 * Urgency Tiers 1–4 — gap-closer #2 (spec, Assess #2; framework §3.2 p.75).
 *
 * Maps the engine's existing 0–100 composite risk score onto the framework's
 * four discrete urgency tiers, each carrying a *start* window (when to begin)
 * and a *deploy* window (when migration should be substantially complete).
 *
 * This is a pure, additive read over `AssessmentResult.riskScore` — it does not
 * change the score, only buckets it. The four tiers are deliberately aligned to
 * the same cut-points the engine already uses for `riskLevel`
 * (≤25 low · ≤55 medium · ≤75 high · else critical), so a Tier and a riskLevel
 * never contradict each other.
 *
 * Phase: 3 (Risk Scoring).
 */

/** Tier numbers run 1 (most urgent) → 4 (least). */
export type UrgencyTierId = 1 | 2 | 3 | 4

export interface UrgencyTier {
  tier: UrgencyTierId
  /** Short name shown on the tier badge. */
  label: string
  /** The risk-score band [min, max] (inclusive) that maps to this tier. */
  scoreRange: [number, number]
  /** When to *start* the migration program for this tier. */
  startWindow: string
  /** When migration should be substantially *deployed* for this tier. */
  deployWindow: string
  /** One-line description of the posture this tier represents. */
  description: string
}

/**
 * Tier 1 is the most urgent (highest score). Ordered 1→4 for display. The
 * score bands are contiguous and cover 0–100 with no gaps/overlaps:
 *   Tier 1: 76–100 · Tier 2: 56–75 · Tier 3: 26–55 · Tier 4: 0–25
 */
export const URGENCY_TIERS: Record<UrgencyTierId, UrgencyTier> = {
  1: {
    tier: 1,
    label: 'Tier 1 — Act now',
    scoreRange: [76, 100],
    startWindow: 'Immediately (0–6 months)',
    deployWindow: 'Within 2 years',
    description:
      'Critical exposure. Harvestable long-life secrets and/or imminent regulatory deadlines — begin migration without waiting for a full inventory.',
  },
  2: {
    tier: 2,
    label: 'Tier 2 — Plan & pilot',
    scoreRange: [56, 75],
    startWindow: 'Within 6–12 months',
    deployWindow: 'Within 3–4 years',
    description:
      'High exposure. Stand up the program, complete the cryptographic inventory, and run pilots on the highest-risk systems first.',
  },
  3: {
    tier: 3,
    label: 'Tier 3 — Prepare',
    scoreRange: [26, 55],
    startWindow: 'Within 12–24 months',
    deployWindow: 'Within 5–7 years',
    description:
      'Moderate exposure. Build crypto-agility and governance now so migration is a fast follow when standards and tooling mature.',
  },
  4: {
    tier: 4,
    label: 'Tier 4 — Monitor',
    scoreRange: [0, 25],
    startWindow: 'Within 24 months (track & re-assess)',
    deployWindow: 'Align with normal refresh cycles',
    description:
      'Lower exposure. Maintain awareness, track the CRQC timeline, and fold PQC into routine technology-refresh planning.',
  },
}

/** Display order, most-urgent first. */
export const URGENCY_TIER_ORDER: UrgencyTierId[] = [1, 2, 3, 4]

/**
 * Map a 0–100 composite risk score to its urgency tier.
 *
 * Cut-points mirror the engine's `riskLevel` thresholds so Tier and riskLevel
 * stay consistent:  >75 → Tier 1 (critical), >55 → Tier 2 (high),
 * >25 → Tier 3 (medium), else Tier 4 (low). Out-of-range scores are clamped.
 */
export function getUrgencyTier(riskScore: number): UrgencyTier {
  const s = Math.max(0, Math.min(100, riskScore))
  if (s > 75) return URGENCY_TIERS[1]
  if (s > 55) return URGENCY_TIERS[2]
  if (s > 25) return URGENCY_TIERS[3]
  return URGENCY_TIERS[4]
}
