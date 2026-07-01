// SPDX-License-Identifier: GPL-3.0-only
import {
  BUSINESS_TOOLS,
  ARTIFACT_TYPE_TO_TOOL_ID,
} from '@/components/BusinessCenter/businessToolsRegistry'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { EXEC_TOUR_REVEAL_BLURBS } from './execTourConfig'

/**
 * The "what this document is" line for a revealed board artifact. Reuses the matching
 * business tool's name + description (single source of truth), or an authored
 * `EXEC_TOUR_REVEAL_BLURBS` override where one is set. Returns null if neither exists.
 */
export function revealText(type: ExecutiveDocumentType): { title: string; body: string } | null {
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  const tool = toolId ? BUSINESS_TOOLS.find((t) => t.id === toolId) : undefined
  const body = EXEC_TOUR_REVEAL_BLURBS[type] ?? tool?.description ?? ''
  if (!body) return null
  return { title: tool?.name ?? type, body }
}
