// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

/**
 * Count distinct cross-references for a resource.
 * Sources: xref table, compliance libraryRefs/timelineRefs,
 * library dependencies, threat module refs.
 */
function countRefs(resourceId: string, ctx: ScoringContext): number {
  const refs = new Set<string>()

  // TrustedSourceXref entries
  const xrefs = ctx.xrefsByResource.get(resourceId)
  if (xrefs) {
    for (const x of xrefs) refs.add(`xref:${x.sourceId}`)
  }

  // Compliance frameworks referencing this resource via libraryRefs
  for (const [fwId, libraryRefs] of ctx.complianceLibraryRefs) {
    if (libraryRefs.includes(resourceId)) refs.add(`compliance:${fwId}`)
  }

  // Compliance frameworks referencing this resource via timelineRefs
  for (const [fwId, timelineRefs] of ctx.complianceTimelineRefs) {
    if (timelineRefs.includes(resourceId)) refs.add(`compliance-tl:${fwId}`)
  }

  // Library items that depend on this resource
  for (const [libId, deps] of ctx.libraryDependencies) {
    if (deps.includes(resourceId)) refs.add(`lib-dep:${libId}`)
  }

  // Threats that reference this resource via modules
  for (const [threatId, modules] of ctx.threatModuleRefs) {
    if (modules.includes(resourceId)) refs.add(`threat:${threatId}`)
  }

  return refs.size
}

export function scoreCrossRefDensity(resourceId: string, ctx: ScoringContext): DimensionResult {
  const count = countRefs(resourceId, ctx)

  let score: number
  if (count >= 7) score = 100
  else if (count >= 4) score = 80
  else if (count >= 2) score = 60
  else if (count >= 1) score = 40
  else score = 10

  return {
    rawScore: score,
    rationale: count === 0 ? 'No cross-references' : `${count} cross-reference(s)`,
  }
}
