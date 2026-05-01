// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

const HEURISTIC_METHODS = new Set(['inferred', 'category-inferred'])

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
): { verified: number; heuristic: number } {
  const verifiedRefs = new Set<string>()
  const heuristicRefs = new Set<string>()

  // TrustedSourceXref entries — split by matchMethod
  const xrefs = ctx.xrefsByResource.get(resourceId)
  if (xrefs) {
    for (const x of xrefs) {
      const key = `xref:${x.sourceId}`
      if (HEURISTIC_METHODS.has(x.matchMethod)) heuristicRefs.add(key)
      else verifiedRefs.add(key)
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

  return { verified: verifiedRefs.size, heuristic: heuristicRefs.size }
}

export function scoreCrossRefDensity(resourceId: string, ctx: ScoringContext): DimensionResult {
  const { verified, heuristic } = countRefs(resourceId, ctx)
  // Heuristic refs count as half-weight: a category-inferred match is weaker
  // evidence than a direct/mapped one.
  const effective = verified + heuristic * 0.5
  const total = verified + heuristic

  let score: number
  if (effective >= 7) score = 100
  else if (effective >= 4) score = 80
  else if (effective >= 2) score = 60
  else if (effective >= 1) score = 40
  else score = 10

  let rationale: string
  if (total === 0) rationale = 'No cross-references'
  else if (heuristic === 0) rationale = `${verified} verified cross-reference(s)`
  else if (verified === 0)
    rationale = `${heuristic} heuristic-only reference(s) (inferred / category-inferred)`
  else rationale = `${total} cross-reference(s) (${verified} verified, ${heuristic} heuristic)`

  return { rawScore: score, rationale }
}
