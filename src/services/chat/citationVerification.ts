// SPDX-License-Identifier: AGPL-3.0-only
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
import { assessClaimSupport, type SupportAssessment } from './citationRelevance'
import { citeProtoFlags } from './citeProtoFlags'
import { resolveEvidenceRef } from './sentenceIndex'

export interface CitationViolation extends ClaimCitation {
  /** unknown-chunk: cited an id not among this turn's retrieved chunks
   *  (the citation itself is fabricated). evidence-not-found: the cited
   *  chunk is real, but doesn't contain the quoted evidence (the claim is
   *  misattributed, or fabricated with a real-looking source attached). */
  reason:
    | 'unknown-chunk'
    | 'evidence-not-found'
    | 'sentence-not-found'
    | 'malformed-ref'
    /** Every reference resolves, but the cited sentence(s) do not support the claim
     *  (relevance guard; reference citations only). */
    | 'weak-evidence'
  /** Why a weak-evidence citation failed (numbers, coverage and counts). */
  support?: SupportAssessment
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

/**
 * Does the sentence evidence behind a reference citation support its claim? Returns
 * null when the citation has no resolvable references (verifyCitations reports those).
 */
export function assessCitationSupport(
  citation: ClaimCitation,
  chunkById: Map<string, RAGChunk>
): SupportAssessment | null {
  if (!citation.evidenceRefs || citation.evidenceRefs.length === 0) return null
  const sentences: string[] = []
  const cited = new Map<string, RAGChunk>()
  for (const ref of citation.evidenceRefs) {
    const resolved = resolveEvidenceRef(ref, chunkById)
    if (!resolved.ok) return null
    sentences.push(resolved.sentence)
    const chunk = chunkById.get(resolved.chunkId)
    if (chunk) cited.set(chunk.id, chunk)
  }
  const chunksCited = [...cited.values()]
  return assessClaimSupport(citation.claimExcerpt, sentences, {
    titles: chunksCited.map((c) => c.title),
    ids: chunksCited.map((c) => c.id),
  })
}

export function verifyCitations(
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): CitationViolation[] {
  const chunkById = new Map(chunks.map((c) => [c.id, c]))
  const violations: CitationViolation[] = []
  const guard = citeProtoFlags().relevanceGuard

  for (const citation of citations) {
    // Cite-by-sentence: the references are the evidence. Every reference must
    // name a chunk retrieved this turn and a sentence that exists in it.
    if (citation.evidenceRefs && citation.evidenceRefs.length > 0) {
      const failure = citation.evidenceRefs
        .map((ref) => resolveEvidenceRef(ref, chunkById))
        .find((resolved) => !resolved.ok)
      if (failure && !failure.ok) {
        violations.push({ ...citation, reason: failure.reason })
        continue
      }
      if (guard) {
        const support = assessCitationSupport(citation, chunkById)
        if (support && !support.supported) {
          violations.push({ ...citation, reason: 'weak-evidence', support })
        }
      }
      continue
    }
    const chunk = chunkById.get(citation.chunkId)
    if (!chunk) {
      violations.push({ ...citation, reason: 'unknown-chunk' })
      continue
    }
    // Legacy citations used claimExcerpt for both fields. New citations keep
    // the answer's paraphrase separate from a verbatim supporting excerpt.
    const evidence = citation.evidenceExcerpt ?? citation.claimExcerpt
    if (!normalize(chunkText(chunk)).includes(normalize(evidence))) {
      violations.push({ ...citation, reason: 'evidence-not-found' })
    }
  }

  return violations
}

/**
 * The evidence text a citation stands for: the resolved sentence(s) for a
 * cite-by-sentence citation, the quoted excerpt otherwise. Null when a
 * reference does not resolve.
 */
export function resolveCitationEvidence(
  citation: ClaimCitation,
  chunks: RAGChunk[]
): string | null {
  if (!citation.evidenceRefs || citation.evidenceRefs.length === 0) {
    return citation.evidenceExcerpt ?? null
  }
  const chunkById = new Map(chunks.map((c) => [c.id, c]))
  const sentences: string[] = []
  for (const ref of citation.evidenceRefs) {
    const resolved = resolveEvidenceRef(ref, chunkById)
    if (!resolved.ok) return null
    sentences.push(resolved.sentence)
  }
  return sentences.join(' ')
}

/** Fill `evidenceExcerpt` from the resolved sentences so everything downstream
 *  that shows or stores evidence sees the same text as before. References that
 *  do not resolve are left untouched (they fail verification). */
export function withResolvedEvidence(
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): ClaimCitation[] {
  return citations.map((citation) => {
    if (!citation.evidenceRefs || citation.evidenceRefs.length === 0) return citation
    const evidence = resolveCitationEvidence(citation, chunks)
    return evidence === null ? citation : { ...citation, evidenceExcerpt: evidence }
  })
}
