// SPDX-License-Identifier: AGPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import { appendGroundedDeepLinks } from './deepLinkInjection'
import {
  buildRetrievedEvidenceResponse,
  enforceGrounding,
  keepVerifiedStatements,
  type GroundingDecision,
} from './groundingPolicy'
import { citationChunkIds, type ClaimCitation } from './parseCitations'
import { withResolvedEvidence } from './citationVerification'
import { repairCitationIds } from './citationIds'

export type GroundedResponseMode = 'verified' | 'partially-verified' | 'extractive'

export interface FinalizedGroundedResponse {
  content: string
  decision: GroundingDecision
  mode: GroundedResponseMode
  citedChunkIds: string[]
  /** Citations behind the displayed text, with reference evidence resolved. */
  citations: ClaimCitation[]
  /** Statements removed from the draft (partially-verified only). The reader is told. */
  droppedStatements: number
}

/**
 * The citations as the rest of the pipeline should see them: near-miss chunk ids
 * repaired and reference evidence resolved.
 */
export function prepareCitations(
  rawCitations: ClaimCitation[],
  chunks: RAGChunk[]
): ClaimCitation[] {
  return withResolvedEvidence(repairCitationIds(rawCitations, chunks), chunks)
}

function chunkIdsOf(citations: ClaimCitation[]): string[] {
  return [...new Set(citations.flatMap(citationChunkIds))]
}

/**
 * Convert one model draft into the safest useful response available, for every
 * provider alike:
 *   verified            every statement is backed by a citation that resolves and
 *                       supports it; the draft is shown as written.
 *   partially-verified  at least one statement is backed; only those statements are
 *                       shown, in their original wording and order. The text of every
 *                       other statement is gone from the result.
 *   extractive          nothing is backed; the retrieved sources are listed instead.
 */
export function finalizeGroundedResponse(
  answer: string,
  rawCitations: ClaimCitation[],
  chunks: RAGChunk[]
): FinalizedGroundedResponse {
  const citations = prepareCitations(rawCitations, chunks)
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

  return {
    content: buildRetrievedEvidenceResponse(chunks),
    decision,
    mode: 'extractive',
    citedChunkIds: [],
    citations: [],
    droppedStatements: 0,
  }
}
