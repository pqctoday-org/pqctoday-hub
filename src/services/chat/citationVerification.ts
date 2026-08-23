// SPDX-License-Identifier: GPL-3.0-only
/**
 * Verify LLM-emitted claim citations (parseCitations.ts) against the
 * chunks actually retrieved for this turn.
 *
 * Two deterministic, exact-match checks — no LLM judge, no fuzzy scoring.
 * See pqctoday-hub-assistant-hallucination-reduction-plan-08182026.md §7.1:
 * this generalizes factVerification.ts's hardcoded relational checks
 * (FIPS↔algorithm, security level, certification) to any claim shape,
 * without a new hardcoded pattern per claim type, and is a strictly
 * stronger signal than groundingCheck.ts's entity-substring matching —
 * a citation names the EXACT chunk a claim came from, so "is this claim
 * actually in that chunk" is a containment check, not an entailment guess.
 */
import type { RAGChunk } from '@/types/ChatTypes'
import type { ClaimCitation } from './parseCitations'

export interface CitationViolation extends ClaimCitation {
  /** unknown-chunk: cited an id not among this turn's retrieved chunks
   *  (the citation itself is fabricated). excerpt-not-found: the cited
   *  chunk is real, but doesn't contain the claimed text (the claim is
   *  misattributed, or fabricated with a real-looking source attached). */
  reason: 'unknown-chunk' | 'excerpt-not-found'
}

/** Collapse whitespace and case for a tolerant-but-still-exact substring
 *  match — not fuzzy/edit-distance matching, just normalizing formatting
 *  differences (streaming reflow, curly vs straight quotes handled by the
 *  caller's markdown, extra spaces) that aren't a real discrepancy. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function chunkText(chunk: RAGChunk): string {
  // Matches what buildContextBlocks() actually showed the model — a claim
  // excerpt may be lifted from the title as legitimately as from the body.
  return `${chunk.title} ${chunk.content}`
}

export function verifyCitations(
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): CitationViolation[] {
  const chunkById = new Map(chunks.map((c) => [c.id, c]))
  const violations: CitationViolation[] = []

  for (const citation of citations) {
    const chunk = chunkById.get(citation.chunkId)
    if (!chunk) {
      violations.push({ ...citation, reason: 'unknown-chunk' })
      continue
    }
    if (!normalize(chunkText(chunk)).includes(normalize(citation.claimExcerpt))) {
      violations.push({ ...citation, reason: 'excerpt-not-found' })
    }
  }

  return violations
}
