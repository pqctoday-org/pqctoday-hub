// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

/**
 * Extract algorithm family names referenced by a resource.
 * Handles various field formats across resource types.
 */
function extractAlgorithmRefs(fields: {
  algorithmFamily?: string
  pqcReplacement?: string
  pqcSupport?: string
}): string[] {
  const refs: string[] = []
  if (fields.algorithmFamily) {
    refs.push(
      ...fields.algorithmFamily
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }
  if (fields.pqcReplacement) {
    refs.push(
      ...fields.pqcReplacement
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  }
  return refs
}

export function scoreCryptoSimulation(
  algorithmFields: { algorithmFamily?: string; pqcReplacement?: string; pqcSupport?: string },
  ctx: ScoringContext
): DimensionResult {
  const refs = extractAlgorithmRefs(algorithmFields)

  if (refs.length === 0) {
    return { rawScore: 0, rationale: 'No algorithm reference', notApplicable: true }
  }

  const demonstrable = refs.some((r) => {
    const normalized = r.toLowerCase().replace(/[-_\s]+/g, '')
    return [...ctx.demonstrableAlgorithms].some(
      (d) => normalized.includes(d) || d.includes(normalized)
    )
  })

  if (demonstrable) {
    return { rawScore: 100, rationale: 'Algorithm demonstrable in Playground' }
  }

  return { rawScore: 40, rationale: 'Algorithm referenced but not demonstrable in Playground' }
}
