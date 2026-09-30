// SPDX-License-Identifier: GPL-3.0-only
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
  chunkId: string
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
    if (
      entry &&
      typeof entry === 'object' &&
      typeof (entry as Record<string, unknown>).claimExcerpt === 'string' &&
      ((entry as Record<string, unknown>).evidenceExcerpt === undefined ||
        typeof (entry as Record<string, unknown>).evidenceExcerpt === 'string') &&
      typeof (entry as Record<string, unknown>).chunkId === 'string'
    ) {
      const e = entry as { claimExcerpt: string; evidenceExcerpt?: string; chunkId: string }
      if (e.claimExcerpt.trim() && e.chunkId.trim()) {
        const citation: ClaimCitation = { claimExcerpt: e.claimExcerpt, chunkId: e.chunkId }
        if (e.evidenceExcerpt?.trim()) citation.evidenceExcerpt = e.evidenceExcerpt.trim()
        citations.push(citation)
      }
    }
  }
  return citations
}
