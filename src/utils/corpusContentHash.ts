// SPDX-License-Identifier: GPL-3.0-only
/**
 * Content hash of the RAG corpus — the CHUNKS ONLY, deliberately not the file.
 *
 * `rag-corpus.json` opens with a `generatedAt` timestamp, so hashing the file
 * bytes would make a regeneration look like a change even when not one chunk
 * differed. The embedding index records the hash of the corpus it was built
 * from; comparing it with this hash tells whether the index is still current.
 *
 * WHAT THIS MUST STILL CATCH. Ids and counts can stay put while chunk text
 * changes, and then the vectors silently encode the OLD text. Hashing the
 * chunks array preserves that guarantee exactly — any edit to any chunk's text
 * changes this hash. Only the wrapper metadata (`generatedAt`, `chunkCount`) is
 * excluded.
 */
import { createHash } from 'node:crypto'

/** Shape of the corpus file: `{ generatedAt, chunkCount, chunks }`, or a bare array. */
type CorpusFile = { chunks?: unknown[] } | unknown[]

/**
 * Hash the corpus chunks. Accepts the parsed corpus (object with `chunks`, or a
 * bare array) so callers that already parsed the file do not pay to re-read it.
 *
 * Every chunk is built through the same object literals, so serialization is
 * stable run to run for identical content — the property this hash needs.
 */
export function corpusContentHash(parsed: CorpusFile): string {
  const chunks = Array.isArray(parsed) ? parsed : (parsed?.chunks ?? [])
  return createHash('sha256').update(JSON.stringify(chunks)).digest('hex')
}
