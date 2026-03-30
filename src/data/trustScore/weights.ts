// SPDX-License-Identifier: GPL-3.0-only
import type { TrustDimension, WeightConfig, DimensionApplicability, TrustTier } from './types'

export const BASE_WEIGHTS: WeightConfig = {
  sourceCredibility: 0.2,
  peerReview: 0.2,
  orgVetting: 0.15,
  docGrounding: 0.15,
  cryptoSimulation: 0.1,
  temporalFreshness: 0.1,
  crossRefDensity: 0.05,
  enrichmentCompleteness: 0.05,
}

export const DIMENSION_APPLICABILITY: DimensionApplicability = {
  library: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'docGrounding',
    'cryptoSimulation',
    'temporalFreshness',
    'crossRefDensity',
    'enrichmentCompleteness',
  ],
  timeline: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'docGrounding',
    'temporalFreshness',
    'crossRefDensity',
    'enrichmentCompleteness',
  ],
  compliance: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'temporalFreshness',
    'crossRefDensity',
  ],
  migrate: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'docGrounding',
    'cryptoSimulation',
    'temporalFreshness',
    'crossRefDensity',
  ],
  threats: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'docGrounding',
    'temporalFreshness',
    'crossRefDensity',
    'enrichmentCompleteness',
  ],
  leaders: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'temporalFreshness',
    'crossRefDensity',
  ],
  algorithm: [
    'sourceCredibility',
    'peerReview',
    'orgVetting',
    'cryptoSimulation',
    'temporalFreshness',
    'crossRefDensity',
  ],
}

/**
 * Redistribute base weights across only the applicable dimensions,
 * so they sum to 1.0.
 */
export function redistributeWeights(
  applicableDimensions: TrustDimension[]
): Record<TrustDimension, number> {
  const total = applicableDimensions.reduce((sum, d) => sum + BASE_WEIGHTS[d], 0)
  const result = {} as Record<TrustDimension, number>
  for (const d of applicableDimensions) {
    result[d] = total > 0 ? BASE_WEIGHTS[d] / total : 0
  }
  return result
}

/** Derive a trust tier from a composite score (0-100). */
export function getTrustTier(score: number): TrustTier {
  if (score >= 85) return 'Authoritative'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Moderate'
  return 'Low'
}

/** Human-readable labels for each dimension. */
export const DIMENSION_LABELS: Record<TrustDimension, string> = {
  sourceCredibility: 'Source Credibility',
  peerReview: 'Peer Review',
  orgVetting: 'Organizational Vetting',
  docGrounding: 'Reference Document',
  cryptoSimulation: 'Cryptographic Simulation',
  temporalFreshness: 'Temporal Freshness',
  crossRefDensity: 'Cross-Reference Density',
  enrichmentCompleteness: 'Enrichment Completeness',
}
