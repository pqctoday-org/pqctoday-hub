// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoringContext } from '../types'

export function scoreDocGrounding(
  resourceId: string,
  localFile: string | undefined,
  ctx: ScoringContext
): DimensionResult {
  if (!localFile) {
    return { rawScore: 0, rationale: 'No local reference document', notApplicable: true }
  }

  const manifestStatus = ctx.manifestStatuses.get(resourceId)

  if (manifestStatus === 'downloaded') {
    return { rawScore: 100, rationale: 'Reference document downloaded and available' }
  }

  if (manifestStatus === 'skipped') {
    return { rawScore: 50, rationale: 'Document known but access restricted' }
  }

  if (manifestStatus === 'failed') {
    return { rawScore: 20, rationale: 'Document download failed' }
  }

  // localFile field exists but no manifest entry — file may still be present
  return { rawScore: 70, rationale: 'Local file reference exists' }
}
