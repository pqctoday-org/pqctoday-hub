// SPDX-License-Identifier: AGPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { ClaimCitation } from './parseCitations'
import { verifyCitations } from './citationVerification'
import { verifyFacts } from './factVerification'
import { checkGrounding } from './groundingCheck'
import { chunkSentences } from './sentenceIndex'

export type GroundingFailureReason =
  | 'empty-answer'
  | 'missing-citations'
  | 'claim-not-in-answer'
  | 'uncited-statement'
  | 'invalid-evidence'
  | 'weak-evidence'
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
    .filter(Boolean)
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
  if (SAFE_REFUSAL.test(trimmed) && !/[.!?]\s/.test(trimmed)) return { approved: true, reasons: [] }

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

  // A reference that resolves but does not support its claim (weak-evidence) blocks
  // the answer exactly like evidence that cannot be found; the reason is kept
  // separate so logs show which of the two happened.
  const violations = verifyCitations(citations, chunks)
  if (violations.some((v) => v.reason !== 'weak-evidence')) reasons.add('invalid-evidence')
  if (violations.some((v) => v.reason === 'weak-evidence')) reasons.add('weak-evidence')
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

export interface PartiallyVerifiedAnswer {
  /** The original answer with every unverified sentence or bullet removed. */
  content: string
  /** Verified citations whose claim is still shown. */
  citations: ClaimCitation[]
  /** Number of substantive sentences removed. */
  dropped: number
  /** Number of substantive sentences kept. */
  kept: number
}

/**
 * Judge each statement, not the whole answer. Keep a substantive sentence only
 * when a citation whose claim contains it passes the per-claim checks (claim present
 * in the answer, evidence resolves and supports the claim, no fact contradiction, no
 * ungrounded entity). Everything else - uncited sentences,
 * sentences backed only by an invalid or weak citation, short fragments that no
 * verified claim contains, headings - is removed from the text, so the reader never
 * sees it. The surviving sentences keep their original wording, order and line
 * structure; nothing is rebuilt from claims.
 *
 * Returns null when no verified statement remains (the caller then falls back to
 * the retrieved-sources list).
 */
/** A sentence ends at . ! ? followed by space, or at CJK 。！？ (no space follows those). */
const SENTENCE_BREAK = /(?<=[.!?])\s+|(?<=[。！？])\s*/u

export function keepVerifiedStatements(
  answer: string,
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): PartiallyVerifiedAnswer | null {
  const normalizedAnswer = visibleText(answer)
  const validClaims: Array<{ claim: string; citation: ClaimCitation }> = []
  for (const citation of citations) {
    const claim = visibleText(citation.claimExcerpt)
    if (claim.length < 12 || !normalizedAnswer.includes(claim)) continue
    if (verifyCitations([citation], chunks).length > 0) continue
    if (verifyFacts(citation.claimExcerpt, chunks).length > 0) continue
    if (checkGrounding(citation.claimExcerpt, chunks).hasWarning) continue
    validClaims.push({ claim, citation })
  }
  if (validClaims.length === 0) return null

  // A piece of the answer is kept only when it is a whole sentence of a verified claim
  // (or the whole claim). A fragment that merely occurs inside a claim ("FIPS 140-3
  // validated." inside "... is not FIPS 140-3 validated.") is not the claim.
  const verifiedPieces = new Set<string>()
  for (const { claim } of validClaims) {
    verifiedPieces.add(claim)
    for (const piece of claim.split(SENTENCE_BREAK))
      if (piece.trim()) verifiedPieces.add(piece.trim())
  }

  const keptLines: string[] = []
  let kept = 0
  let dropped = 0
  for (const line of answer.split(/\r?\n/)) {
    if (!line.trim()) {
      if (keptLines.length > 0 && keptLines[keptLines.length - 1] !== '') keptLines.push('')
      continue
    }
    if (/^\s{0,3}#{1,6}\s/.test(line)) continue
    // Split after the bullet marker so it stays attached to the first sentence.
    const marker = line.match(/^\s*(?:[-+*]\s+|\d+[.)]\s+)?/)?.[0] ?? ''
    const body = line.slice(marker.length)
    const pieces = body.split(SENTENCE_BREAK).filter((piece) => piece.trim())
    const keptPieces: string[] = []
    for (const piece of pieces) {
      const visible = visibleText(piece)
      if (/^[\p{P}\s]*$/u.test(visible)) {
        keptPieces.push(piece) // bare punctuation: nothing to judge
      } else if (verifiedPieces.has(visible)) {
        keptPieces.push(piece)
        kept += 1
      } else {
        dropped += 1 // any statement, symbol or word, in any script, not in a verified claim
      }
    }
    if (keptPieces.length > 0) keptLines.push(`${marker}${keptPieces.join(' ')}`)
  }
  if (kept === 0) return null

  const content = keptLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const normalizedContent = visibleText(content)
  const seen = new Set<string>()
  const shown: ClaimCitation[] = []
  for (const { claim, citation } of validClaims) {
    if (seen.has(claim) || !normalizedContent.includes(claim)) continue
    seen.add(claim)
    shown.push(citation)
  }
  return { content, citations: shown, dropped, kept }
}

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'been',
  'were',
  'they',
  'their',
  'what',
  'when',
  'where',
  'which',
  'while',
  'into',
  'only',
  'also',
  'than',
  'then',
  'some',
  'more',
  'most',
  'such',
  'used',
  'uses',
  'using',
  'does',
  'each',
  'both',
  'over',
  'under',
  'between',
  'through',
  'about',
  'based',
])

/**
 * Deterministically synthesize corpus-backed citations for any substantive statement
 * in `answer` that the model left out of its ```citations block (common on small
 * local models), provided the statement:
 *   1. passes `verifyFacts(statement, chunks)` (zero factual contradictions),
 *   2. passes `checkGrounding(statement, chunks)` (zero ungrounded entities), and
 *   3. shares at least two content tokens with one sentence of a retrieved chunk.
 * The synthesized citation points at that sentence ("<chunkId>#<n>"), exactly like a
 * model-written one, so it still goes through the same id check and relevance guard
 * in `verifyCitations` and `enforceGrounding`: a statement whose best sentence does not
 * support it is dropped, not shown. A statement that already has a model citation
 * (even one the guard rejects) is never re-derived.
 */
export function deriveCorpusCitations(
  answer: string,
  existingCitations: ClaimCitation[],
  chunks: RAGChunk[]
): ClaimCitation[] {
  const trimmed = answer.trim()
  if (!trimmed || chunks.length === 0 || SAFE_REFUSAL.test(trimmed)) return existingCitations

  const result: ClaimCitation[] = [...existingCitations]
  const existingNormClaims = new Set(existingCitations.map((c) => visibleText(c.claimExcerpt)))
  const sentencesByChunk = new Map(chunks.map((c) => [c.id, chunkSentences(c)]))

  const rawStatements = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) =>
      s
        .trim()
        .replace(/^[-+*]\s+/, '')
        .trim()
    )
    .filter((s) => visibleText(s).length >= 12)

  for (const rawStmt of rawStatements) {
    const normStmt = visibleText(rawStmt)
    if (!normStmt || existingNormClaims.has(normStmt)) continue

    // Never synthesize a citation for a statement with a fact violation or ungrounded entity
    if (verifyFacts(rawStmt, chunks).length > 0) continue
    if (checkGrounding(rawStmt, chunks).hasWarning) continue

    const stmtTokens = Array.from(
      new Set(normStmt.split(/[^a-z0-9-]+/).filter((t) => t.length >= 4 && !STOPWORDS.has(t)))
    )
    if (stmtTokens.length === 0) continue

    let best: { chunkId: string; n: number } | null = null
    let bestOverlap = 0
    for (const chunk of chunks) {
      const sentences = sentencesByChunk.get(chunk.id) ?? []
      sentences.forEach((sentence, index) => {
        const hay = sentence.toLowerCase()
        let overlap = 0
        for (const tok of stmtTokens) {
          if (hay.includes(tok)) overlap += 1
        }
        if (overlap > bestOverlap) {
          bestOverlap = overlap
          best = { chunkId: chunk.id, n: index + 1 }
        }
      })
    }

    if (best && bestOverlap >= 2) {
      const { chunkId, n } = best as { chunkId: string; n: number }
      result.push({ claimExcerpt: rawStmt, chunkId, evidenceRefs: [`${chunkId}#${n}`] })
      existingNormClaims.add(normStmt)
    }
  }

  return result
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
