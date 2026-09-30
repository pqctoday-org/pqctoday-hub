// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import { validateDeepLink } from '@/services/search/deepLinkGrammar'
import type { ClaimCitation } from './parseCitations'

const MAX_INLINE_DEEP_LINKS = 5

function safeLabel(title: string): string {
  return title.replaceAll('[', '').replaceAll(']', '').trim() || 'Open source'
}

/**
 * Append deterministic Hub links for the chunks that actually support an
 * approved answer. This runs only after the grounding gate, so links never
 * depend on a model remembering the route grammar or inventing query params.
 */
export function appendGroundedDeepLinks(
  answer: string,
  citations: ClaimCitation[],
  chunks: RAGChunk[]
): string {
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]))
  const seen = new Set<string>()
  const links: string[] = []

  for (const citation of citations) {
    const chunk = chunkById.get(citation.chunkId)
    const deepLink = chunk?.deepLink
    if (
      !chunk ||
      !deepLink?.startsWith('/') ||
      validateDeepLink(deepLink) !== null ||
      seen.has(deepLink) ||
      answer.includes(`](${deepLink})`)
    ) {
      continue
    }

    seen.add(deepLink)
    links.push(`[${safeLabel(chunk.title)}](${deepLink})`)
    if (links.length >= MAX_INLINE_DEEP_LINKS) break
  }

  if (links.length === 0) return answer
  return `${answer.trimEnd()}\n\n**Explore in PQC Today:** ${links.join(' · ')}`
}
