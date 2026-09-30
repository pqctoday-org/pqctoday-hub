// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import { appendGroundedDeepLinks, appendRetrievedDeepLinks } from './deepLinkInjection'
import {
  buildRetrievedEvidenceResponse,
  enforceGrounding,
  salvageGroundedClaims,
  type GroundingDecision,
} from './groundingPolicy'
import type { ClaimCitation } from './parseCitations'

export type GroundedResponseMode = 'verified' | 'salvaged' | 'format-tolerant' | 'extractive'

export interface FinalizedGroundedResponse {
  content: string
  decision: GroundingDecision
  mode: GroundedResponseMode
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
    }
  }

  const salvaged = salvageGroundedClaims(answer, citations, chunks)
  if (salvaged) {
    return {
      content: appendGroundedDeepLinks(salvaged.content, salvaged.citations, chunks),
      decision,
      mode: 'salvaged',
    }
  }

  const formattingOnlyFailure = decision.reasons.every((reason) =>
    ['missing-citations', 'claim-not-in-answer', 'uncited-statement'].includes(reason)
  )
  if (formattingOnlyFailure && answer.trim()) {
    return {
      content: appendRetrievedDeepLinks(answer, chunks),
      decision,
      mode: 'format-tolerant',
    }
  }

  return {
    content: buildRetrievedEvidenceResponse(chunks),
    decision,
    mode: 'extractive',
  }
}
