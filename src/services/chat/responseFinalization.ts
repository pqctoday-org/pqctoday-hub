// SPDX-License-Identifier: AGPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import { appendGroundedDeepLinks } from './deepLinkInjection'
import {
  buildRetrievedEvidenceResponse,
  enforceGrounding,
  keepVerifiedStatements,
  salvageGroundedClaims,
  type GroundingDecision,
} from './groundingPolicy'
import { citeProtoFlags } from './citeProtoFlags'
import { citationChunkIds, type ClaimCitation } from './parseCitations'
import { withResolvedEvidence } from './citationVerification'

export type GroundedResponseMode = 'verified' | 'partially-verified' | 'salvaged' | 'extractive'

export interface FinalizedGroundedResponse {
  content: string
  decision: GroundingDecision
  mode: GroundedResponseMode
  citedChunkIds: string[]
  /** Citations behind the displayed text, with reference evidence resolved. */
  citations: ClaimCitation[]
  /** Sentences removed from the draft (partially-verified only). */
  droppedStatements: number
}

function chunkIdsOf(citations: ClaimCitation[]): string[] {
  return [...new Set(citations.flatMap(citationChunkIds))]
}

/** Convert one model draft into the safest useful response available. */
export function finalizeGroundedResponse(
  answer: string,
  rawCitations: ClaimCitation[],
  chunks: RAGChunk[]
): FinalizedGroundedResponse {
  const citations = withResolvedEvidence(rawCitations, chunks)
  const decision = enforceGrounding(answer, citations, chunks)
  if (decision.approved) {
    return {
      content: appendGroundedDeepLinks(answer, citations, chunks),
      decision,
      mode: 'verified',
      citedChunkIds: chunkIdsOf(citations),
      citations,
      droppedStatements: 0,
    }
  }

  if (citeProtoFlags().partial) {
    const partial = keepVerifiedStatements(answer, citations, chunks)
    if (partial) {
      return {
        content: appendGroundedDeepLinks(partial.content, partial.citations, chunks),
        decision,
        mode: 'partially-verified',
        citedChunkIds: chunkIdsOf(partial.citations),
        citations: partial.citations,
        droppedStatements: partial.dropped,
      }
    }
  }

  const salvaged = salvageGroundedClaims(answer, citations, chunks)
  if (salvaged) {
    return {
      content: appendGroundedDeepLinks(salvaged.content, salvaged.citations, chunks),
      decision,
      mode: 'salvaged',
      citedChunkIds: chunkIdsOf(salvaged.citations),
      citations: salvaged.citations,
      droppedStatements: 0,
    }
  }

  return {
    content: buildRetrievedEvidenceResponse(chunks),
    decision,
    mode: 'extractive',
    citedChunkIds: [],
    citations: [],
    droppedStatements: 0,
  }
}
