// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoredResourceType, ScoringContext } from '../types'

function getEnrichmentLookup(
  resourceType: ScoredResourceType,
  ctx: ScoringContext
): Record<string, { populatedCount: number; totalCount: number }> {
  switch (resourceType) {
    case 'library':
      return ctx.libraryEnrichments
    case 'timeline':
      return ctx.timelineEnrichments
    case 'threats':
      return ctx.threatsEnrichments
    default:
      return {}
  }
}

export function scoreEnrichmentCompleteness(
  resourceId: string,
  resourceType: ScoredResourceType,
  ctx: ScoringContext
): DimensionResult {
  const lookup = getEnrichmentLookup(resourceType, ctx)
  const entry = lookup[resourceId]

  if (!entry) {
    return { rawScore: 0, rationale: 'No enrichment data available' }
  }

  const pct = entry.totalCount > 0 ? entry.populatedCount / entry.totalCount : 0
  const score = Math.round(pct * 100)

  return {
    rawScore: score,
    rationale: `${entry.populatedCount}/${entry.totalCount} enrichment dimensions populated`,
  }
}
