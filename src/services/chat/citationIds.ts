// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Safe repair of near-miss chunk ids in cite-by-sentence references.
 *
 * Small local models sometimes copy a long chunk id imperfectly (a dropped "-0"
 * suffix) or write the source name instead of the id. The sentence number is still
 * meaningful, so when the id names exactly one chunk retrieved THIS turn the ref is
 * rewritten to it. Anything ambiguous or unmatched stays invalid, and a chunk that
 * was not retrieved this turn is never a candidate.
 *
 * Rules, tried in this order; the first rule that finds any candidate decides, and
 * it only repairs when it finds exactly one:
 *   normalised  case and separator differences ("Library-RFC_9881" -> "library-RFC 9881")
 *   suffix      a missing or extra "-<n>" suffix ("...-cmpkemkeyupdate" -> "...-cmpkemkeyupdate-0")
 *   source      the chunk's `source` field, when one retrieved chunk has that source
 *   title       the chunk's title, when one retrieved chunk has that title
 * The repaired reference is then verified exactly like any other, including the
 * relevance guard, so a wrong repair is still caught when the claim does not match
 * the sentence.
 */
import type { RAGChunk } from '@/types/ChatTypes'
import type { ClaimCitation } from './parseCitations'
import { parseEvidenceRef } from './sentenceIndex'

export type IdRepairRule = 'normalised' | 'suffix' | 'source' | 'title'

export interface IdRepair {
  chunkId: string
  rule: IdRepairRule
}

function key(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const DIGITS = /^\d+$/

/**
 * Resolve a chunk id that is not among `chunks` to exactly one of them, or null.
 * Never returns an id that is not in `chunks`.
 */
export function resolveNearMissChunkId(rawId: string, chunks: RAGChunk[]): IdRepair | null {
  const wanted = key(rawId)
  if (!wanted) return null

  const decide = (matches: RAGChunk[], rule: IdRepairRule): IdRepair | null | undefined => {
    if (matches.length === 0) return undefined // try the next rule
    const ids = new Set(matches.map((c) => c.id))
    return ids.size === 1 ? { chunkId: [...ids][0], rule } : null // several: stay invalid
  }

  const byId = decide(
    chunks.filter((c) => key(c.id) === wanted),
    'normalised'
  )
  if (byId !== undefined) return byId

  const bySuffix = decide(
    chunks.filter((c) => {
      const id = key(c.id)
      const missing = id.startsWith(`${wanted}-`) && DIGITS.test(id.slice(wanted.length + 1))
      const extra = wanted.startsWith(`${id}-`) && DIGITS.test(wanted.slice(id.length + 1))
      return missing || extra
    }),
    'suffix'
  )
  if (bySuffix !== undefined) return bySuffix

  const bySource = decide(
    chunks.filter((c) => key(c.source) === wanted),
    'source'
  )
  if (bySource !== undefined) return bySource

  const byTitle = decide(
    chunks.filter((c) => key(c.title) === wanted),
    'title'
  )
  return byTitle ?? null
}

/**
 * Rewrite references whose chunk id is not among this turn's chunks when exactly one
 * retrieved chunk matches. A repaired citation gets `idRepaired: true` and keeps the
 * model's original references in `repairedFrom`.
 */
export function repairCitationIds(citations: ClaimCitation[], chunks: RAGChunk[]): ClaimCitation[] {
  const known = new Set(chunks.map((c) => c.id))
  return citations.map((citation) => {
    if (!citation.evidenceRefs || citation.evidenceRefs.length === 0) return citation
    let changed = false
    const refs = citation.evidenceRefs.map((ref) => {
      const parsed = parseEvidenceRef(ref)
      if (!parsed || known.has(parsed.chunkId)) return ref
      const repair = resolveNearMissChunkId(parsed.chunkId, chunks)
      if (!repair) return ref
      changed = true
      return `${repair.chunkId}#${parsed.n}`
    })
    if (!changed) return citation
    const first = parseEvidenceRef(refs[0])
    return {
      ...citation,
      evidenceRefs: refs,
      chunkId: first?.chunkId ?? citation.chunkId,
      idRepaired: true,
      repairedFrom: citation.evidenceRefs,
    }
  })
}
