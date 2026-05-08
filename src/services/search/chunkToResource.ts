// SPDX-License-Identifier: GPL-3.0-only
/**
 * chunkToResource — map a RAG corpus chunk to a (resourceType, resourceId)
 * pair compatible with `getTrustScore` from `src/data/trustScore`.
 *
 * Returns null when the chunk's source is not a scored resource type
 * (glossary, module-content, module-qa, quiz, patents, vendors, etc.) —
 * the caller treats null as "unknown trust" and applies the default
 * multiplier (0.95) per §14.3 of trust-engine-explainability.md.
 */
import type { RAGChunk } from '@/types/ChatTypes'
import type { ScoredResourceType } from '@/data/trustScore'

export interface ResourceRef {
  resourceType: ScoredResourceType
  resourceId: string
}

function metaString(chunk: RAGChunk, key: string): string | null {
  const v = (chunk.metadata as Record<string, unknown> | undefined)?.[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function chunkToResource(chunk: RAGChunk): ResourceRef | null {
  switch (chunk.source) {
    case 'library': {
      const id = metaString(chunk, 'referenceId') ?? chunk.title
      return { resourceType: 'library', resourceId: id }
    }
    case 'compliance': {
      const id = metaString(chunk, 'id') ?? chunk.title
      return { resourceType: 'compliance', resourceId: id }
    }
    case 'timeline':
      return { resourceType: 'timeline', resourceId: chunk.title }
    case 'migrate':
      return { resourceType: 'migrate', resourceId: chunk.title }
    case 'threats': {
      const id = metaString(chunk, 'threatId') ?? chunk.title
      return { resourceType: 'threats', resourceId: id }
    }
    case 'leaders':
      return { resourceType: 'leaders', resourceId: chunk.title }
    case 'algorithms':
      return { resourceType: 'algorithm', resourceId: chunk.title }
    case 'document-enrichment':
    case 'governance-maturity': {
      const refId = metaString(chunk, 'refId')
      if (!refId) return null
      return { resourceType: 'library', resourceId: refId }
    }
    default:
      return null
  }
}

/**
 * Tier-aware ranking multiplier per §14.3 of the explainability doc.
 * Deliberately gentle — nudges ranking, doesn't bury Moderate-tier results.
 */
export function trustTierMultiplier(
  tier: 'Authoritative' | 'High' | 'Moderate' | 'Low' | null
): number {
  switch (tier) {
    case 'Authoritative':
      return 1.2
    case 'High':
      return 1.1
    case 'Moderate':
      return 1.0
    case 'Low':
      return 0.8
    case null:
    default:
      return 0.95
  }
}
