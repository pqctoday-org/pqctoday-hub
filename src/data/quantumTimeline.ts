// SPDX-License-Identifier: GPL-3.0-only
/**
 * quantumTimeline — the single source for the Q-Day horizon, aligned to the
 * Applied Quantum PQC Migration Framework: a first CRQC ("Q-Day") in 2029 that
 * can break the most sensitive assets, and broad CRQC availability by 2035.
 *
 * Imported by moscaClock (SIM_CRQC_YEAR), simAssets, and the Assess risk windows
 * so the simulation and the assessment compute "at risk" against the same year.
 *
 * RELATIONSHIP TO `CRQC_ESTIMATES` (regulatoryTimelines.ts): those are the public
 * research RANGE (conservative 2030 → moderate 2035 → upper 2040) the assessment
 * cites. The sim DELIBERATELY plans against a more aggressive first-CRQC anchor
 * (2029, at/below the public conservative floor) so the Mosca clock conveys
 * urgency for the most sensitive assets — intentional, not a contradiction.
 * `QC_BROAD_YEAR` (2035) == `CRQC_ESTIMATES.moderate`. The invariant is locked by
 * quantumTimeline.test.ts so the two blocks can't silently drift apart.
 */

/** First CRQC ("Q-Day") — the most sensitive assets become breakable.
 *  Deliberately aggressive (≤ CRQC_ESTIMATES.lowerBound) as a planning anchor. */
export const QC_FIRST_YEAR = 2029
/** CRQC broadly available — every sensitivity tier is at risk (== CRQC_ESTIMATES.moderate). */
export const QC_BROAD_YEAR = 2035
