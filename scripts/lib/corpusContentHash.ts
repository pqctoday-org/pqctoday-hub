/**
 * Content hash of the RAG corpus — the CHUNKS ONLY, deliberately not the file.
 *
 * WHY THIS EXISTS (2026-08-09). `rag-corpus.json` opens with a `generatedAt`
 * timestamp, so hashing the file bytes made a regeneration look like a change
 * even when not one chunk differed. Both the encoder (which records the hash it
 * built from) and check-index-freshness (which re-derives it) hashed the file,
 * so the two agreed only while the exact byte-identical file the vectors were
 * built from stayed on disk. refresh-index.sh regenerates the corpus as step 1
 * of every run, so a second, concurrent run — or any no-op regeneration — marked
 * a perfectly valid index stale and cost a full ~40-minute re-encode. That
 * happened twice in one afternoon during the 4.45.0 merge.
 *
 * WHAT THIS MUST STILL CATCH. The comparison was added 2026-07-31 after editing
 * two Q&A answers and watching the gate pass: ids and counts stayed put while
 * the text changed, so the vectors silently encoded the OLD text and retrieval
 * ranked on it. Hashing the chunks array preserves that guarantee exactly — any
 * edit to any chunk's text still changes this hash. Only the wrapper metadata
 * (`generatedAt`, `chunkCount`) is excluded, and `chunkCount` is separately
 * asserted against the real chunk count by the same gate.
 */
import { createHash } from 'node:crypto'

/** Shape of the corpus file: `{ generatedAt, chunkCount, chunks }`, or a bare array. */
type CorpusFile = { chunks?: unknown[] } | unknown[]

/**
 * Hash the corpus chunks. Accepts the parsed corpus (object with `chunks`, or a
 * bare array) so callers that already parsed the file do not pay to re-read it.
 *
 * Key order comes from generate-rag-corpus.ts, which builds every chunk through
 * the same object literals, so serialization is stable run to run for identical
 * content — which is the property this hash needs.
 */
export function corpusContentHash(parsed: CorpusFile): string {
  const chunks = Array.isArray(parsed) ? parsed : (parsed?.chunks ?? [])
  return createHash('sha256').update(JSON.stringify(chunks)).digest('hex')
}
