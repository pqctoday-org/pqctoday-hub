// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

const HEURISTIC_METHODS = new Set(['inferred', 'category-inferred'])

/** Normalise tier label to the v2 vocabulary "tier-N" key. */
function tierKey(tier: string | undefined): string | null {
  if (!tier) return null
  if (tier.startsWith('1_')) return 'tier-1'
  if (tier.startsWith('2_')) return 'tier-2'
  if (tier.startsWith('3_')) return 'tier-3'
  if (tier.startsWith('4_')) return 'tier-4'
  if (tier === 'T1') return 'tier-1'
  if (tier === 'T2') return 'tier-2'
  if (tier === 'T3') return 'tier-3'
  return null
}

/**
 * Count distinct cross-references for a resource, separating verified
 * (direct/mapped) from heuristic (inferred/category-inferred) attributions.
 *
 * Sources: xref table, compliance libraryRefs/timelineRefs,
 * library dependencies, threat module refs.
 */
function countRefs(
  resourceId: string,
  ctx: ScoringContext
): { verified: number; heuristic: number; tiers: Set<string> } {
  const verifiedRefs = new Set<string>()
  const heuristicRefs = new Set<string>()
  const tiers = new Set<string>()

  // TrustedSourceXref entries — split by matchMethod, accumulate cited tier
  const xrefs = ctx.xrefsByResource.get(resourceId)
  if (xrefs) {
    for (const x of xrefs) {
      const key = `xref:${x.sourceId}`
      if (HEURISTIC_METHODS.has(x.matchMethod)) heuristicRefs.add(key)
      else verifiedRefs.add(key)
      const tier = ctx.trustedSources.get(x.sourceId)?.trustTier
      const tk = tierKey(tier)
      if (tk) tiers.add(tk)
    }
  }

  // Compliance, library deps, threat module refs are all direct edges → verified
  for (const [fwId, libraryRefs] of ctx.complianceLibraryRefs) {
    if (libraryRefs.includes(resourceId)) verifiedRefs.add(`compliance:${fwId}`)
  }
  for (const [fwId, timelineRefs] of ctx.complianceTimelineRefs) {
    if (timelineRefs.includes(resourceId)) verifiedRefs.add(`compliance-tl:${fwId}`)
  }
  for (const [libId, deps] of ctx.libraryDependencies) {
    if (deps.includes(resourceId)) verifiedRefs.add(`lib-dep:${libId}`)
  }
  for (const [threatId, modules] of ctx.threatModuleRefs) {
    if (modules.includes(resourceId)) verifiedRefs.add(`threat:${threatId}`)
  }

  return { verified: verifiedRefs.size, heuristic: heuristicRefs.size, tiers }
}

/**
 * Tier-diversity multiplier (T17 — §15.4 of trust-engine-explainability).
 * A claim cited by multiple distinct trust tiers is more trustworthy than
 * a claim cited by N sources of the same tier (independence > redundancy).
 *
 *   1 distinct tier  → 1.00 (baseline)
 *   2 distinct tiers → 1.05
 *   3+ distinct tiers → 1.10
 */
function tierDiversityMultiplier(tierCount: number): number {
  if (tierCount >= 3) return 1.1
  if (tierCount === 2) return 1.05
  return 1.0
}

export function scoreCrossRefDensity(resourceId: string, ctx: ScoringContext): DimensionResult {
  const { verified, heuristic, tiers } = countRefs(resourceId, ctx)
  // Heuristic refs count as half-weight: a category-inferred match is weaker
  // evidence than a direct/mapped one.
  const effective = verified + heuristic * 0.5
  const total = verified + heuristic

  let baseScore: number
  if (effective >= 7) baseScore = 100
  else if (effective >= 4) baseScore = 80
  else if (effective >= 2) baseScore = 60
  else if (effective >= 1) baseScore = 40
  else baseScore = 10

  const diversity = tierDiversityMultiplier(tiers.size)
  const score = Math.min(100, Math.round(baseScore * diversity))

  let rationale: string
  if (total === 0) rationale = 'No cross-references'
  else if (heuristic === 0) rationale = `${verified} verified cross-reference(s)`
  else if (verified === 0)
    rationale = `${heuristic} heuristic-only reference(s) (inferred / category-inferred)`
  else rationale = `${total} cross-reference(s) (${verified} verified, ${heuristic} heuristic)`

  if (tiers.size >= 2) {
    rationale += ` — cited across ${tiers.size} trust tiers (×${diversity.toFixed(2)} diversity bonus)`
  }

  return { rawScore: score, rationale }
}
