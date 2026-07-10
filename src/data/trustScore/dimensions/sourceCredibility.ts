// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

/**
 * Tier scores keyed on the trusted-sources registry vocabulary
 * (trust_tier column of src/data/trusted_sources_*.csv):
 * 1_Authoritative > 2_Core > 3_Supporting > 4_Contextual.
 * A drift-guard test (sourceCredibility.registry.test.ts) asserts every
 * distinct tier value in the registry CSV is a key here.
 */
export const TIER_SCORES: Record<string, number> = {
  '1_Authoritative': 100,
  '2_Core': 80,
  '3_Supporting': 55,
  '4_Contextual': 30,
}

/**
 * Penalty by xref match method. 'exact' is an exact match — strongest
 * evidence, penalized no worse than 'direct'. Unknown methods fall back
 * to -10 (see scorer below).
 */
export const MATCH_PENALTY: Record<string, number> = {
  exact: 0,
  direct: 0,
  mapped: -5,
  inferred: -10,
  'category-inferred': -15,
}

const SOURCE_TYPE_BONUS: Record<string, number> = {
  Government: 5,
  Standards_Body: 5,
  Academic: 0,
  Industry_Workgroup: -5,
  Industry_Analyst: -10,
}

export function scoreSourceCredibility(resourceId: string, ctx: ScoringContext): DimensionResult {
  const xrefs = ctx.xrefsByResource.get(resourceId)
  if (!xrefs || xrefs.length === 0) {
    return { rawScore: 10, rationale: 'No linked trusted source' }
  }

  let bestScore = 0
  let bestSourceId = ''
  let bestSourceType = ''
  let bestTierLabel = ''

  for (const xref of xrefs) {
    const source = ctx.trustedSources.get(xref.sourceId)
    if (!source) continue

    const tierScore = TIER_SCORES[source.trustTier] ?? 20
    const matchPenalty = MATCH_PENALTY[xref.matchMethod] ?? -10
    const typeBonus = SOURCE_TYPE_BONUS[source.sourceType] ?? 0
    const score = Math.min(100, Math.max(0, tierScore + matchPenalty + typeBonus))

    if (score > bestScore) {
      bestScore = score
      bestSourceId = xref.sourceId
      bestSourceType = source.sourceType.replace('_', ' ')
      bestTierLabel = source.trustTier.replace(/^\d_/, '')
    }
  }

  // Density bonus: +3 per additional source, capped at +10
  const densityBonus = Math.min(10, (xrefs.length - 1) * 3)
  const finalScore = Math.min(100, bestScore + densityBonus)

  const sourceDetail = `${bestSourceId} (${bestSourceType}, ${bestTierLabel})`
  return {
    rawScore: finalScore,
    rationale:
      xrefs.length === 1
        ? `Linked to ${sourceDetail}`
        : `Linked to ${sourceDetail} + ${xrefs.length - 1} other source(s)`,
  }
}
