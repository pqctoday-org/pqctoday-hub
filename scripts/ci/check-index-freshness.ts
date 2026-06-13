// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-index-freshness.ts — detect when the committed RAG search index has
 * drifted from source data.
 *
 * Data/feature PRs do NOT regenerate the index (`.gitattributes merge=ours`),
 * so the committed `rag-corpus.json` / `embeddings.bin` can lag behind source
 * until someone runs `npm run refresh-index`. This check makes that lag visible
 * instead of silent.
 *
 * Two cheap, CI-safe checks (NO embedding model — that's the slow part):
 *   1. Corpus ⇄ source: regenerate the corpus to a temp file (pure JS, fast)
 *      and compare its chunk-id set to the committed corpus. Added/removed ids
 *      mean source changed but the index wasn't refreshed.
 *   2. Embeddings ⇄ corpus: embeddings-meta.chunkCount must equal the committed
 *      corpus chunk count, and embeddings.bin size must equal
 *      chunkCount × dimensions × 4 (Float32). A mismatch means the vectors no
 *      longer line up with the corpus they index.
 *
 * Writes public/data/rag-index-freshness.json and exits 1 when stale, 0 when
 * fresh. The scheduled workflow inspects the report to open a tracking issue;
 * `npm run refresh-index` runs it as a post-rebuild sanity check.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, statSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'public', 'data')
const CORPUS = path.join(DATA, 'rag-corpus.json')
const META = path.join(DATA, 'embeddings-meta.json')
const BIN = path.join(DATA, 'embeddings.bin')
const REPORT = path.join(DATA, 'rag-index-freshness.json')

type Chunk = { id?: string; chunkId?: string }
const chunkId = (c: Chunk): string => c.id ?? c.chunkId ?? ''
const idSet = (corpusPath: string): Set<string> => {
  const json = JSON.parse(readFileSync(corpusPath, 'utf-8')) as { chunks: Chunk[] }
  return new Set(json.chunks.map(chunkId).filter(Boolean))
}

function regenerateCorpusToTemp(): string {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'rag-fresh-')), 'rag-corpus.json')
  execFileSync('npx', ['tsx', 'scripts/generate-rag-corpus.ts'], {
    cwd: ROOT,
    env: { ...process.env, RAG_CORPUS_OUT: out },
    stdio: 'ignore',
  })
  return out
}

function main(): number {
  const findings: string[] = []

  // 1. Corpus ⇄ source
  const committed = idSet(CORPUS)
  const fresh = idSet(regenerateCorpusToTemp())
  const added = [...fresh].filter((id) => !committed.has(id)) // in source, not in committed corpus
  const removed = [...committed].filter((id) => !fresh.has(id)) // in committed corpus, gone from source
  if (added.length)
    findings.push(`${added.length} source record(s) missing from the committed corpus`)
  if (removed.length) findings.push(`${removed.length} committed chunk(s) no longer in source`)

  // 2. Embeddings ⇄ corpus
  const meta = JSON.parse(readFileSync(META, 'utf-8')) as { chunkCount: number; dimensions: number }
  const corpusCount = committed.size
  if (meta.chunkCount !== corpusCount)
    findings.push(`embeddings-meta.chunkCount=${meta.chunkCount} ≠ corpus chunks=${corpusCount}`)
  const expectedBytes = meta.chunkCount * meta.dimensions * 4
  const actualBytes = statSync(BIN).size
  if (actualBytes !== expectedBytes)
    findings.push(
      `embeddings.bin=${actualBytes}B ≠ expected ${expectedBytes}B (${meta.chunkCount}×${meta.dimensions}×4)`
    )

  const stale = findings.length > 0
  const report = {
    generatedAt: new Date().toISOString(),
    stale,
    corpusChunks: corpusCount,
    sourceChunks: fresh.size,
    addedToSource: added.length,
    removedFromSource: removed.length,
    embeddingChunkCount: meta.chunkCount,
    findings,
    sampleAdded: added.slice(0, 20),
    sampleRemoved: removed.slice(0, 20),
  }
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf-8')

  if (stale) {
    console.error('✗ RAG index is STALE — run `npm run refresh-index`:')
    for (const f of findings) console.error(`   • ${f}`)
    console.error(`  report: ${path.relative(ROOT, REPORT)}`)
    return 1
  }
  console.log(`✓ RAG index fresh — ${corpusCount} chunks, embeddings in sync`)
  return 0
}

process.exit(main())
