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
      // Aggregate / summary compliance chunks (e.g. framework-fines-summary
      // from frameworkFines.ts) lack a per-framework metadata.id; they don't
      // represent a single scoreable framework, so route them to "unknown
      // trust" rather than falling back to the human title (which never
      // resolves in trustScoreData).
      const id = metaString(chunk, 'id')
      if (!id) return null
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
    case 'algorithms': {
      // Classical / deprecated algorithms are not subjects of trust evaluation
      // — they appear in the algorithms corpus because they're the source of
      // PQC migration (the "what replaces what" CSV), but trustScoreData.ts
      // only scores PQC replacements. Returning null here avoids spurious
      // tier-resolution orphans for RSA/ECDH/ECDSA/Ed25519/etc.
      const family = metaString(chunk, 'family') ?? ''
      if (family === 'Classical KEM' || family === 'Classical Sig') return null
      return { resourceType: 'algorithm', resourceId: chunk.title }
    }
    case 'document-enrichment': {
      const refId = metaString(chunk, 'refId')
      if (!refId) return null
      // metadata.collection records which dataset the refId belongs to
      // (library / timeline / threats / catalog), set by
      // scripts/generate-rag-corpus.ts processDocumentEnrichments.
      // Without this, timeline/threats/catalog enrichments orphan against
      // library trust scores.
      const collection = metaString(chunk, 'collection')
      switch (collection) {
        case 'timeline':
          return { resourceType: 'timeline', resourceId: refId }
        case 'threats':
          return { resourceType: 'threats', resourceId: refId }
        case 'catalog':
          return { resourceType: 'migrate', resourceId: refId }
        case 'library':
        default:
          return { resourceType: 'library', resourceId: refId }
      }
    }
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
