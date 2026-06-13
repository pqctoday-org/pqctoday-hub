// SPDX-License-Identifier: GPL-3.0-only
/**
 * Stable public surface of the Assess engine's framework-gap closers.
 *
 * Other pages (notably the Report "communicate" surface) import the QRA type +
 * builder and the supporting Mosca / Urgency-Tier / Two-Track / Maturity
 * builders from here, so the engine's internal file layout can change without
 * breaking consumers.
 *
 * All exports are additive — importing them has no effect on existing Assess
 * behaviour; they only assemble structured views over the engine's existing
 * `AssessmentResult`.
 */

// Quantum Readiness Assessment — the headline structured artifact.
export { buildQRA } from './qra'
export type {
  QuantumReadinessAssessment,
  QRAHeatmapCell,
  QRABacklogItem,
  QRARegulatoryGap,
  QRAComplianceRow,
  BuildQRAOptions,
} from './qra'

// Mosca's Inequality (X + Y > Z).
export { computeMoscaResult, estimateMigrationYears } from './mosca'
export type { MoscaResult, MoscaInequality, MoscaTrack, MoscaVerdict } from './mosca'

// Urgency Tiers 1–4.
export { getUrgencyTier, URGENCY_TIERS, URGENCY_TIER_ORDER } from './urgencyTiers'
export type { UrgencyTier, UrgencyTierId } from './urgencyTiers'

// Two-Track (A: KEM/HNDL · B: signatures/PKI/HNFL) sequencing.
export { buildTwoTrackPlan } from './twoTrack'
export type { TwoTrackPlan, MigrationTrack, TrackId } from './twoTrack'

// Maturity self-rating L0–L4.
export {
  aggregateMaturity,
  emptyMaturityRatings,
  MATURITY_DOMAINS,
  MATURITY_DOMAIN_ORDER,
} from './maturity'
export type {
  MaturityAssessment,
  MaturityDomain,
  MaturityDomainId,
  MaturityDomainRating,
  MaturityLevel,
} from './maturity'

// Persisted maturity self-rating store (Assess collects it; Report reads it
// back to feed buildQRA({ maturityRatings })).
export { useMaturityStore } from './useMaturityStore'
