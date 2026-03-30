// SPDX-License-Identifier: GPL-3.0-only
import type {
  TrustScore,
  TrustDimension,
  DimensionScore,
  ScoredResourceType,
  ScoringContext,
  PeerReviewStatus,
} from './types'
import { DIMENSION_APPLICABILITY, redistributeWeights, getTrustTier } from './weights'
import { scoreSourceCredibility } from './dimensions/sourceCredibility'
import { scorePeerReview } from './dimensions/peerReview'
import { scoreOrgVetting } from './dimensions/orgVetting'
import { scoreDocGrounding } from './dimensions/docGrounding'
import { scoreCryptoSimulation } from './dimensions/cryptoSimulation'
import { scoreTemporalFreshness } from './dimensions/temporalFreshness'
import { scoreCrossRefDensity } from './dimensions/crossRefDensity'
import { scoreEnrichmentCompleteness } from './dimensions/enrichmentCompleteness'

/** Fields extracted from a resource record for scoring. */
export interface ResourceFields {
  peerReviewed?: PeerReviewStatus
  vettingBody?: string[]
  localFile?: string
  documentType?: string
  algorithmFamily?: string
  pqcReplacement?: string
  pqcSupport?: string
  lastVerifiedDate?: string
  lastUpdateDate?: string
  releaseDate?: string
}

type DimensionScorer = (
  resourceId: string,
  resourceType: ScoredResourceType,
  fields: ResourceFields,
  ctx: ScoringContext
) => { rawScore: number; rationale: string; notApplicable?: boolean }

const SCORERS: Record<TrustDimension, DimensionScorer> = {
  sourceCredibility: (resourceId, _rt, _f, ctx) => scoreSourceCredibility(resourceId, ctx),
  peerReview: (_rid, _rt, fields) => scorePeerReview(fields.peerReviewed, fields.documentType),
  orgVetting: (_rid, rt, fields) => scoreOrgVetting(fields.vettingBody ?? [], rt),
  docGrounding: (resourceId, _rt, fields, ctx) =>
    scoreDocGrounding(resourceId, fields.localFile, ctx),
  cryptoSimulation: (_rid, _rt, fields, ctx) =>
    scoreCryptoSimulation(
      {
        algorithmFamily: fields.algorithmFamily,
        pqcReplacement: fields.pqcReplacement,
        pqcSupport: fields.pqcSupport,
      },
      ctx
    ),
  temporalFreshness: (_rid, _rt, fields) =>
    scoreTemporalFreshness({
      lastVerifiedDate: fields.lastVerifiedDate,
      lastUpdateDate: fields.lastUpdateDate,
      releaseDate: fields.releaseDate,
    }),
  crossRefDensity: (resourceId, _rt, _f, ctx) => scoreCrossRefDensity(resourceId, ctx),
  enrichmentCompleteness: (resourceId, rt, _f, ctx) =>
    scoreEnrichmentCompleteness(resourceId, rt, ctx),
}

export function computeTrustScore(
  resourceType: ScoredResourceType,
  resourceId: string,
  fields: ResourceFields,
  ctx: ScoringContext
): TrustScore {
  const applicableDimensions = [...DIMENSION_APPLICABILITY[resourceType]]

  // Run all applicable dimension scorers
  const results: Array<{ dimension: TrustDimension; rawScore: number; rationale: string }> = []
  const notApplicableDimensions: TrustDimension[] = []

  for (const dim of applicableDimensions) {
    const scorer = SCORERS[dim]
    const result = scorer(resourceId, resourceType, fields, ctx)
    if (result.notApplicable) {
      notApplicableDimensions.push(dim)
    } else {
      results.push({ dimension: dim, rawScore: result.rawScore, rationale: result.rationale })
    }
  }

  // Remove N/A dimensions and redistribute weights
  const activeDimensions = applicableDimensions.filter((d) => !notApplicableDimensions.includes(d))
  const weights = redistributeWeights(activeDimensions)

  // Build dimension scores
  const dimensions: DimensionScore[] = results.map(({ dimension, rawScore, rationale }) => {
    const weight = weights[dimension] ?? 0
    return {
      dimension,
      rawScore,
      weight,
      weightedScore: rawScore * weight,
      rationale,
    }
  })

  const compositeScore = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        dimensions.reduce((sum, d) => sum + d.weightedScore, 0)
      )
    )
  )

  return {
    resourceType,
    resourceId,
    compositeScore,
    tier: getTrustTier(compositeScore),
    dimensions,
    computedAt: new Date().toISOString(),
  }
}
