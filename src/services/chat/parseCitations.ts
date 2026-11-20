// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Parse LLM-generated claim citations from a fenced ```citations block
 * (a JSON array of {claimExcerpt, chunkId}), emitted after the prose
 * response and BEFORE the ```followups block (see promptBuilder.ts's
 * citation instructions and parseFollowUps.ts, which expects follow-ups
 * to remain the last thing in the string). Call this BEFORE
 * parseFollowUps() on the raw streamed content.
 *
 * Mirrors parseFollowUps.ts's structure and its handling of a block
 * truncated mid-fence by an interrupted stream.
 */

export interface ClaimCitation {
  /** Exact claim text as it appears in the answer. */
  claimExcerpt: string
  /** Verbatim text copied from the cited RAG chunk that supports the claim. */
  evidenceExcerpt?: string
  /** Sentence references "<chunkId>#<n>" (cite-by-sentence). When present they
   *  are the evidence; `chunkId` is the first reference's chunk. */
  evidenceRefs?: string[]
  chunkId: string
  /** True when a near-miss chunk id in the references was rewritten to the one
   *  retrieved chunk it names (citationIds.ts). `evidenceRefs` then hold the repaired
   *  references and `repairedFrom` what the model wrote. */
  idRepaired?: boolean
  repairedFrom?: string[]
}

/** Every chunk id a citation points at (its chunkId plus any reference chunks). */
export function citationChunkIds(citation: ClaimCitation): string[] {
  const ids = [citation.chunkId]
  for (const ref of citation.evidenceRefs ?? []) {
    const hash = ref.lastIndexOf('#')
    if (hash > 0) ids.push(ref.slice(0, hash).trim())
  }
  return [...new Set(ids.filter(Boolean))]
}

export function parseCitations(content: string): {
  cleanContent: string
  citations: ClaimCitation[]
} {
  // Models are not perfectly consistent about fence casing, a space before
  // the newline, or CRLF output. Treat those presentation differences as the
  // same citations block; the JSON and evidence are still verified below.
  let match = content.match(/```[ \t]*citations[ \t]*\r?\n([\s\S]*?)```\s*\r?\n?/i)
  let citations = match ? parseCitationsJson(match[1]) : []

  // Qwen 3 reliably emits the requested citation objects but sometimes uses
  // the generic `json` fence label. Accept that variant only when its payload
  // parses as one or more citation-shaped objects; ordinary JSON shown as part
  // of an answer remains visible and is not mistaken for hidden metadata.
  if (!match) {
    const jsonMatch = content.match(/```[ \t]*json[ \t]*\r?\n([\s\S]*?)```\s*\r?\n?/i)
    if (jsonMatch) {
      const jsonCitations = parseCitationsJson(jsonMatch[1])
      if (jsonCitations.length > 0) {
        match = jsonMatch
        citations = jsonCitations
      }
    }
  }
  if (!match) {
    // Strip an incomplete ```citations block if the response was truncated
    // mid-fence — never leak raw JSON fragments into the displayed message.
    const incompleteMatch = content.match(/```[ \t]*citations\b[\s\S]*$/i)
    if (incompleteMatch) {
      return {
        cleanContent: content.slice(0, incompleteMatch.index).trimEnd(),
        citations: [],
      }
    }
    return { cleanContent: content, citations: [] }
  }

  const cleanContent = (
    content.slice(0, match.index) + content.slice(match.index! + match[0].length)
  ).trim()
  return { cleanContent, citations }
}

/** Parse the fenced block's inner text as citation JSON. Never throws —
 *  a model that emits malformed JSON degrades to zero citations, exactly
 *  like a model that emits no citations block at all. */
function parseCitationsJson(raw: string): ClaimCitation[] {
  let parsed: unknown
  try {
    const trimmed = raw.trim()
    // Smaller local models sometimes emit one valid JSON array per claim
    // inside the single requested fence. Treat adjacent arrays as one array;
    // every resulting entry still passes the normal chunk/evidence verifier.
    parsed = JSON.parse(trimmed.replace(/\]\s*\[/g, ','))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const citations: ClaimCitation[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    if (typeof e.claimExcerpt !== 'string' || !e.claimExcerpt.trim()) continue
    if (e.evidenceExcerpt !== undefined && typeof e.evidenceExcerpt !== 'string') continue

    const refs = parseRefs(e.evidenceRef)
    // A reference carries its own chunk id, so chunkId is optional when one is given.
    const explicitChunkId = typeof e.chunkId === 'string' ? e.chunkId.trim() : ''
    const refChunkId =
      refs.length > 0 ? refs[0].slice(0, Math.max(refs[0].lastIndexOf('#'), 0)).trim() : ''
    // A reference without "#<n>" is kept (named by its own text) so the id check
    // rejects it; dropping it would leave the claim uncited and open to re-derivation.
    const chunkId = refChunkId || explicitChunkId || (refs[0] ?? '')
    if (!chunkId) continue

    const citation: ClaimCitation = { claimExcerpt: e.claimExcerpt, chunkId }
    if (typeof e.evidenceExcerpt === 'string' && e.evidenceExcerpt.trim()) {
      citation.evidenceExcerpt = e.evidenceExcerpt.trim()
    }
    if (refs.length > 0) citation.evidenceRefs = refs
    citations.push(citation)
  }
  return citations
}

/** Longest evidenceRef text read; a real one is a few chunk ids. */
const MAX_REF_TEXT = 2000
const REF_EDGE = new Set([' ', '\t', '\n', '\r', '"', "'", '[', ']'])

function trimRefPunctuation(part: string): string {
  let start = 0
  let end = part.length
  while (start < end && REF_EDGE.has(part.charAt(start))) start += 1
  while (end > start && REF_EDGE.has(part.charAt(end - 1))) end -= 1
  return part.slice(start, end)
}

/** Accept "id#n", ["id#n", ...] or a comma/space separated string of refs. */
function parseRefs(value: unknown): string[] {
  const items: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const refs: string[] = []
  for (const item of items) {
    if (typeof item !== 'string') continue
    // Chunk ids may contain spaces, so refs are found by their "#<n>" tail
    // rather than by splitting on whitespace. Plain splitting and trimming keep this
    // linear on any input (no backtracking regex over model output).
    const text = item.slice(0, MAX_REF_TEXT)
    const found = text.split(/[,;]/).filter((part) => /#\d+$/.test(part.trimEnd()))
    for (const part of found.length > 0 ? found : [text]) {
      const ref = trimRefPunctuation(part)
      if (ref) refs.push(ref)
    }
  }
  return [...new Set(refs)]
}
