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
  claimExcerpt: string
  chunkId: string
}

export function parseCitations(content: string): {
  cleanContent: string
  citations: ClaimCitation[]
} {
  const match = content.match(/```citations\n([\s\S]*?)```\s*\n?/)
  if (!match) {
    // Strip an incomplete ```citations block if the response was truncated
    // mid-fence — never leak raw JSON fragments into the displayed message.
    const incompleteMatch = content.match(/```citations[\s\S]*$/)
    if (incompleteMatch) {
      return {
        cleanContent: content.slice(0, incompleteMatch.index).trimEnd(),
        citations: [],
      }
    }
    return { cleanContent: content, citations: [] }
  }

  const citations = parseCitationsJson(match[1])
  const cleanContent = (content.slice(0, match.index) + content.slice(match.index! + match[0].length))
    .trim()
  return { cleanContent, citations }
}

/** Parse the fenced block's inner text as citation JSON. Never throws —
 *  a model that emits malformed JSON degrades to zero citations, exactly
 *  like a model that emits no citations block at all. */
function parseCitationsJson(raw: string): ClaimCitation[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.trim())
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
      typeof (entry as Record<string, unknown>).chunkId === 'string'
    ) {
      const e = entry as { claimExcerpt: string; chunkId: string }
      if (e.claimExcerpt.trim() && e.chunkId.trim()) {
        citations.push({ claimExcerpt: e.claimExcerpt, chunkId: e.chunkId })
      }
    }
  }
  return citations
}
