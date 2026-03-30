// SPDX-License-Identifier: GPL-3.0-only

/** The 8 scoring dimensions */
export type TrustDimension =
  | 'sourceCredibility'
  | 'peerReview'
  | 'orgVetting'
  | 'docGrounding'
  | 'cryptoSimulation'
  | 'temporalFreshness'
  | 'crossRefDensity'
  | 'enrichmentCompleteness'

/** Resource types that receive trust scores */
export type ScoredResourceType =
  | 'library'
  | 'timeline'
  | 'compliance'
  | 'migrate'
  | 'threats'
  | 'leaders'
  | 'algorithm'

/** Score for a single dimension (0-100 raw, before weighting) */
export interface DimensionScore {
  dimension: TrustDimension
  rawScore: number
  weight: number
  weightedScore: number
  rationale: string
}

/** Trust tier derived from numeric score */
export type TrustTier = 'Authoritative' | 'High' | 'Moderate' | 'Low'

/** Complete trust score for a resource */
export interface TrustScore {
  resourceType: ScoredResourceType
  resourceId: string
  compositeScore: number
  tier: TrustTier
  dimensions: DimensionScore[]
  computedAt: string
}

/** Peer review status from CSV */
export type PeerReviewStatus = 'yes' | 'no' | 'partial'

/** Weight configuration for each dimension (base weights, sum to 1.0) */
export type WeightConfig = Record<TrustDimension, number>

/** Defines which dimensions apply to each resource type */
export type DimensionApplicability = Record<ScoredResourceType, TrustDimension[]>

/** Raw result from a dimension scorer */
export interface DimensionResult {
  rawScore: number
  rationale: string
  notApplicable?: boolean
}

/** All data references needed by dimension scorers */
export interface ScoringContext {
  trustedSources: Map<string, { trustTier: string; sourceType: string }>
  xrefsByResource: Map<string, Array<{ sourceId: string; matchMethod: string }>>
  libraryEnrichments: Record<string, { populatedCount: number; totalCount: number }>
  timelineEnrichments: Record<string, { populatedCount: number; totalCount: number }>
  threatsEnrichments: Record<string, { populatedCount: number; totalCount: number }>
  manifestStatuses: Map<string, 'downloaded' | 'skipped' | 'failed'>
  complianceLibraryRefs: Map<string, string[]>
  complianceTimelineRefs: Map<string, string[]>
  libraryDependencies: Map<string, string[]>
  threatModuleRefs: Map<string, string[]>
  demonstrableAlgorithms: Set<string>
}
