// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { ClaimCitation } from './parseCitations'
import { verifyCitations } from './citationVerification'
import { verifyFacts } from './factVerification'
import { checkGrounding } from './groundingCheck'

export type GroundingFailureReason =
  | 'empty-answer'
  | 'missing-citations'
  | 'claim-not-in-answer'
  | 'uncited-statement'
  | 'invalid-evidence'
  | 'fact-contradiction'
  | 'ungrounded-entity'

export interface GroundingDecision {
  approved: boolean
  reasons: GroundingFailureReason[]
}

export interface GroundedClaimFallback {
  content: string
  citations: ClaimCitation[]
}

const SAFE_REFUSAL =
  /^Based on the PQC Today database, I don't have enough information about .{1,160}\.$/i

function visibleText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~>#]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function substantiveStatements(answer: string): string[] {
  return answer
    .split(/(?<=[.!?])\s+|\n+/)
    .map(visibleText)
    .filter((line) => line.length >= 12)
}

/**
 * Enforce the corpus-only contract after generation and before display.
 *
 * A claim may be paraphrased, but it must occur in the answer and map to a
 * verbatim evidence excerpt in a retrieved chunk. Every substantive answer
 * statement needs at least one such claim mapping. Deterministic fact and
 * entity checks remain defense-in-depth.
 */
export function enforceGrounding(
  answer: string,
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): GroundingDecision {
  const trimmed = answer.trim()
  if (!trimmed) return { approved: false, reasons: ['empty-answer'] }

  // The one permitted citation-free output contains no factual answer.
  if (SAFE_REFUSAL.test(trimmed)) return { approved: true, reasons: [] }

  const reasons = new Set<GroundingFailureReason>()
  if (citations.length === 0) reasons.add('missing-citations')

  const normalizedAnswer = visibleText(trimmed)
  const normalizedClaims = citations.map((citation) => visibleText(citation.claimExcerpt))
  if (normalizedClaims.some((claim) => !claim || !normalizedAnswer.includes(claim))) {
    reasons.add('claim-not-in-answer')
  }

  const statements = substantiveStatements(trimmed)
  if (
    statements.some((statement) => !normalizedClaims.some((claim) => claim && statement === claim))
  ) {
    reasons.add('uncited-statement')
  }

  if (verifyCitations(citations, chunks).length > 0) reasons.add('invalid-evidence')
  if (verifyFacts(trimmed, chunks).length > 0) reasons.add('fact-contradiction')
  if (checkGrounding(trimmed, chunks).hasWarning) reasons.add('ungrounded-entity')

  return { approved: reasons.size === 0, reasons: [...reasons] }
}

export function buildGroundingFailureResponse(): string {
  return (
    "Based on the PQC Today database, I couldn't produce a fully source-verified answer " +
    'to this question. Try narrowing the question or review the retrieved sources below.'
  )
}

/**
 * Recover individually verified claims from a draft that failed the strict
 * whole-answer contract (usually because the model added an uncited heading
 * or introduction). Invalid evidence, contradictions, and ungrounded entities
 * are still rejected claim by claim. This keeps useful corpus-backed content
 * without weakening the evidence boundary.
 */
export function salvageGroundedClaims(
  answer: string,
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): GroundedClaimFallback | null {
  const normalizedAnswer = visibleText(answer)
  const seen = new Set<string>()
  const valid: ClaimCitation[] = []

  for (const citation of citations) {
    const claim = visibleText(citation.claimExcerpt)
    if (claim.length < 12 || !normalizedAnswer.includes(claim) || seen.has(claim)) continue
    if (verifyCitations([citation], chunks).length > 0) continue
    if (verifyFacts(citation.claimExcerpt, chunks).length > 0) continue
    if (checkGrounding(citation.claimExcerpt, chunks).hasWarning) continue
    seen.add(claim)
    valid.push(citation)
  }

  if (valid.length === 0) return null

  const content = valid
    .map((citation) => citation.claimExcerpt.trim().replace(/^[-+*]\s+/, ''))
    .map((claim) => `- ${claim}`)
    .join('\n')

  return { content, citations: valid }
}

/**
 * Last-resort corpus-only response for a non-empty retrieval result. Titles
 * and deep links come directly from retrieved chunks, so this remains useful
 * and deterministic even when a model fails the citation format twice.
 */
export function buildRetrievedEvidenceResponse(chunks: RAGChunk[], maxEntries = 8): string {
  const seen = new Set<string>()
  const entries: string[] = []

  for (const chunk of chunks) {
    const title = chunk.title?.replace(/\s+/g, ' ').trim()
    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(chunk.deepLink ? `- [${title}](${chunk.deepLink})` : `- ${title}`)
    if (entries.length >= maxEntries) break
  }

  if (entries.length === 0) return buildGroundingFailureResponse()
  return `These are the most relevant entries retrieved from the PQC Today corpus:\n\n${entries.join('\n')}`
}

export const GROUNDING_RETRY_INSTRUCTION = `Your previous draft failed corpus-only verification.
Regenerate it using ONLY the supplied CONTEXT. Return 2-6 short bullet sentences with no heading, introduction, conclusion, table, or follow-up block. Every bullet must have one citations entry with:
- claimExcerpt: that complete sentence exactly as written in your answer; a shorter substring does not count
- evidenceExcerpt: a verbatim supporting excerpt copied from the cited context chunk
- chunkId: that chunk's exact id
Do not use model memory or outside knowledge. If the context is insufficient, output exactly one sentence: "Based on the PQC Today database, I don't have enough information about this topic."`
