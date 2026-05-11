#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * propose-xref-edges.ts — Phase 2.5 trusted-source xref auto-population.
 *
 * Reads the latest `trusted_source_xref_*.csv` and proposes new edges
 * via cosine similarity between (resource chunk × trusted-source chunk)
 * in the Phase 1 embedding index. Output is a JSON candidate list for
 * SME review in the admin portal.
 *
 * POLICY: LOCAL-ONLY (mirrors build-embedding-index.ts §6.4 of
 * embedding-optimization.md). CI hard-fail; candidates are produced by
 * the maintainer and reviewed before any CSV write happens.
 *
 * Usage:
 *   tsx scripts/propose-xref-edges.ts                  # writes /tmp/xref-candidates.json
 *   tsx scripts/propose-xref-edges.ts --out=path.json  # custom output
 *   tsx scripts/propose-xref-edges.ts --threshold=0.8  # raise cosine cutoff
 *   tsx scripts/propose-xref-edges.ts --max-existing=5 # tune under-attribution filter
 *   tsx scripts/propose-xref-edges.ts --dry-run        # plan only, no output
 */
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import Papa from 'papaparse'
import { loadEmbeddingsFromDisk } from './lib/load-embeddings-from-disk.js'
import { cosineSearch } from '../src/services/search/embeddingRetrieval.js'
import { chunkToResource } from '../src/services/search/chunkToResource.js'
import type { RAGChunk } from '../src/types/ChatTypes.js'

// CI hard-fail per §6.4
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  console.error(
    'propose-xref-edges is local-only by policy.\n' +
      'Run on a maintainer machine; output JSON is for admin-portal SME review.'
  )
  process.exit(2)
}

const REPO_ROOT = process.cwd()
// eslint-disable-next-line security/detect-unsafe-regex -- bounded date pattern + optional revision suffix; no backtracking risk
const DATED_CSV_RE = /^trusted_source_xref_\d{8}(?:_r\d+)?\.csv$/

interface CliOptions {
  outPath: string
  threshold: number
  maxExisting: number
  dryRun: boolean
  topKPerResource: number
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    outPath: '/tmp/xref-candidates.json',
    threshold: 0.75,
    maxExisting: 3,
    dryRun: false,
    topKPerResource: 5,
  }
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg.startsWith('--out=')) opts.outPath = arg.slice('--out='.length)
    else if (arg.startsWith('--threshold=')) opts.threshold = Number(arg.slice('--threshold='.length))
    else if (arg.startsWith('--max-existing='))
      opts.maxExisting = Number(arg.slice('--max-existing='.length))
    else if (arg.startsWith('--top-k='))
      opts.topKPerResource = Number(arg.slice('--top-k='.length))
  }
  return opts
}

function findLatestXrefCsv(): string {
  const all = glob.sync('src/data/trusted_source_xref_*.csv', { cwd: REPO_ROOT })
  const matches = all.filter((p) => DATED_CSV_RE.test(path.basename(p)))
  if (matches.length === 0) throw new Error('No trusted_source_xref CSV found')
  matches.sort()
  return matches.at(-1)!
}

interface XrefRow {
  resource_type: string
  resource_id: string
  source_id: string
  match_method: string
}

interface Candidate {
  resource_type: string
  resource_id: string
  source_id: string
  score: number
  resource_label: string
  source_label: string
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  console.log('propose-xref-edges v1')
  console.log(`  threshold:    ${opts.threshold}`)
  console.log(`  max-existing: ${opts.maxExisting} (only propose for resources with < this many edges)`)
  console.log(`  top-K:        ${opts.topKPerResource} per resource`)
  console.log(`  output:       ${opts.outPath}`)
  console.log(`  dry-run:      ${opts.dryRun}`)
  console.log('')

  // Load embedding runtime
  await loadEmbeddingsFromDisk()

  // Load existing xref
  const csvPath = findLatestXrefCsv()
  console.log(`Loading xref: ${csvPath}`)
  const raw = fs.readFileSync(path.join(REPO_ROOT, csvPath), 'utf8')
  const existing = Papa.parse<XrefRow>(raw, { header: true, skipEmptyLines: true }).data
  console.log(`  ${existing.length} existing edges`)

  // Build:
  //   existingPairs: Set of "type|resource|source" — to skip already-present
  //   edgesPerResource: Map "type|resource" → existing edge count
  const existingPairs = new Set<string>()
  const edgesPerResource = new Map<string, number>()
  for (const r of existing) {
    const key = `${r.resource_type}|${r.resource_id}|${r.source_id}`
    existingPairs.add(key)
    const rkey = `${r.resource_type}|${r.resource_id}`
    edgesPerResource.set(rkey, (edgesPerResource.get(rkey) ?? 0) + 1)
  }

  // Load corpus and build chunk-id → (resource_type, resource_id) map
  const corpus = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'public/data/rag-corpus.json'), 'utf8')
  )
  const chunks = (corpus.chunks ?? corpus) as RAGChunk[]
  const chunkById = new Map(chunks.map((c) => [c.id, c]))

  // trusted-source chunk pool + their source_id mapping
  const tsChunks = chunks.filter((c) => c.id.startsWith('trusted-source-'))
  const tsIdToSourceId = new Map<string, string>()
  const tsIdToLabel = new Map<string, string>()
  for (const tc of tsChunks) {
    tsIdToSourceId.set(tc.id, tc.id.replace(/^trusted-source-/, ''))
    tsIdToLabel.set(tc.id, tc.title)
  }
  const tsChunkIds = tsChunks.map((c) => c.id)
  console.log(`  ${tsChunkIds.length} trusted-source chunks in the embedding index`)

  // Walk resources: for each chunk that maps to a scored resource via
  // chunkToResource, propose edges if under-attributed.
  const candidates: Candidate[] = []
  let processedResources = 0
  let skippedSaturated = 0
  let skippedUnscored = 0

  // De-duplicate by (resource_type, resource_id) — multiple chunks can map
  // to the same resource (e.g., doc-enrichment + library chunk for FIPS_203).
  const seenResources = new Set<string>()
  for (const chunk of chunks) {
    const ref = chunkToResource(chunk)
    if (!ref) {
      skippedUnscored++
      continue
    }
    const rkey = `${ref.resourceType}|${ref.resourceId}`
    if (seenResources.has(rkey)) continue
    seenResources.add(rkey)

    const existingCount = edgesPerResource.get(rkey) ?? 0
    if (existingCount >= opts.maxExisting) {
      skippedSaturated++
      continue
    }

    // Cosine-search this chunk's vector against trusted-source pool
    // Use chunk.title + content as the query proxy (matches build-time encoding).
    const queryText = `${chunk.title}\n${chunk.content.slice(0, 1000)}`
    const hits = await cosineSearch(queryText, {
      candidateIds: tsChunkIds,
      k: opts.topKPerResource,
    })

    for (const hit of hits) {
      if (hit.score < opts.threshold) continue
      const sourceId = tsIdToSourceId.get(hit.chunkId)
      if (!sourceId) continue
      const pairKey = `${ref.resourceType}|${ref.resourceId}|${sourceId}`
      if (existingPairs.has(pairKey)) continue
      candidates.push({
        resource_type: ref.resourceType,
        resource_id: ref.resourceId,
        source_id: sourceId,
        score: hit.score,
        resource_label: chunk.title,
        source_label: tsIdToLabel.get(hit.chunkId) ?? sourceId,
      })
    }
    processedResources++
    if (processedResources % 200 === 0) {
      console.log(`  processed ${processedResources} resources, ${candidates.length} candidates so far`)
    }
    void chunkById // silence unused
  }

  console.log('')
  console.log(`Processed:           ${processedResources} resources`)
  console.log(`Skipped saturated:   ${skippedSaturated} (already ≥ ${opts.maxExisting} edges)`)
  console.log(`Skipped unscored:    ${skippedUnscored} (chunks that don't map to a scored resource)`)
  console.log(`Total candidates:    ${candidates.length}`)

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    threshold: opts.threshold,
    maxExisting: opts.maxExisting,
    sourceXrefFile: csvPath,
    candidateCount: candidates.length,
    candidates,
  }

  if (opts.dryRun) {
    console.log('')
    console.log('Dry-run: no file written. Top 10 candidates would be:')
    for (const c of candidates.slice(0, 10)) {
      console.log(`  ${c.score.toFixed(3)} ${c.resource_type}/${c.resource_id} → ${c.source_id}`)
    }
    return 0
  }

  fs.writeFileSync(opts.outPath, JSON.stringify(output, null, 2))
  console.log(`Wrote ${opts.outPath} (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`)
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('propose-xref-edges failed:', err)
    process.exit(1)
  })
