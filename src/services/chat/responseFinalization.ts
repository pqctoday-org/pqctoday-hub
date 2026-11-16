// SPDX-License-Identifier: AGPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import { appendGroundedDeepLinks } from './deepLinkInjection'
import {
  buildRetrievedEvidenceResponse,
  enforceGrounding,
  salvageGroundedClaims,
  type GroundingDecision,
} from './groundingPolicy'
import type { ClaimCitation } from './parseCitations'

export type GroundedResponseMode = 'verified' | 'salvaged' | 'extractive'

export interface FinalizedGroundedResponse {
  content: string
  decision: GroundingDecision
  mode: GroundedResponseMode
  citedChunkIds: string[]
}

/** Convert one model draft into the safest useful response available. */
export function finalizeGroundedResponse(
  answer: string,
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): FinalizedGroundedResponse {
  const decision = enforceGrounding(answer, citations, chunks)
  if (decision.approved) {
    return {
      content: appendGroundedDeepLinks(answer, citations, chunks),
      decision,
      mode: 'verified',
      citedChunkIds: [...new Set(citations.map((c) => c.chunkId).filter(Boolean))],
    }
  }

  const salvaged = salvageGroundedClaims(answer, citations, chunks)
  if (salvaged) {
    return {
      content: appendGroundedDeepLinks(salvaged.content, salvaged.citations, chunks),
      decision,
      mode: 'salvaged',
      citedChunkIds: [...new Set(salvaged.citations.map((c) => c.chunkId).filter(Boolean))],
    }
  }

  return {
    content: buildRetrievedEvidenceResponse(chunks),
    decision,
    mode: 'extractive',
    citedChunkIds: [],
  }
}
