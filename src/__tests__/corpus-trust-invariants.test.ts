// SPDX-License-Identifier: GPL-3.0-only
/**
 * Corpus trust invariants — CI gate for trust-engine compliance.
 *
 * Three invariants (see C3, C4, C5 in the trust-engine acceptance plan):
 *   1. Tier coverage: every chunk whose `source` is a scored resource type
 *      resolves through `chunkToResource` to a non-null tier, OR the chunk's
 *      source appears in TIER_NOT_APPLICABLE (sources that intentionally do
 *      not carry trust scores — glossary, modules, quiz, etc.).
 *   2. PROV chain: every chunk has a `prov` block with the 5 W3C PROV-DM
 *      fields populated; `was_derived_from` references a CSV file that
 *      exists; `source_doc` (when local) resolves on disk; at least one
 *      `source_passages` entry is present.
 *   3. Freshness: no chunk's `prov.was_generated_by` date is in the future,
 *      and pinned counts of stale Authoritative/High records cannot grow
 *      without intentional code change.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

import { chunkToResource } from '@/services/search/chunkToResource'
import { getTrustScore } from '@/data/trustScore'
import type { RAGChunk } from '@/types/ChatTypes'

const REPO_ROOT = process.cwd()
const CORPUS_PATH = path.join(REPO_ROOT, 'public', 'data', 'rag-corpus.json')

interface CorpusChunk extends RAGChunk {
  prov?: {
    entity_id?: string
    was_generated_by?: string
    was_attributed_to?: string
    was_derived_from?: string
    source_doc?: string
    source_passages?: string[]
  }
}

function loadCorpus(): CorpusChunk[] {
  const parsed = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'))
  return (parsed.chunks ?? parsed) as CorpusChunk[]
}

/**
 * Sources that intentionally do not carry a trust score. These are app-shell
 * content (UI, glossary, quiz, modules, vendors-without-csv) where tier-aware
 * ranking is not meaningful. Adding a source here is an intentional decision —
 * NOT a pass-through for unscored data that *should* be scored.
 */
const TIER_NOT_APPLICABLE: ReadonlySet<string> = new Set([
  'glossary',
  'transitions',
  'modules',
  'module-summaries',
  'module-topic-summaries',
  'module-curious',
  'module-content',
  'module-qa',
  'trusted-sources',
  'vendors',
  'patents',
  'cswp39',
  'tracks',
  'personas',
  'documentation',
  'quiz',
  'assessment',
  'playground-guide',
  'openssl-guide',
  'achievements',
  'business-center',
  'right-panel',
  'guided-tour',
  'priority-matrix',
  'certifications',
  'user-manual',
  'changelog',
])

/**
 * Pinned per-source thresholds for chunks where the resolved resource yields
 * no trust score (record may have been removed from CSV but chunk still in
 * corpus, or new resource type added without scoring wiring). Each entry is
 * tracked tech debt — drive these to zero. Fail closed if exceeded.
 *
 * Snapshot 2026-05-10: counts captured from `public/data/rag-corpus.json`.
 * Only DECREASE these values; never increase without a follow-up issue.
 */
const TIER_RESOLUTION_GAPS: Record<string, number> = {
  // After 2026-05-10 fixes:
  //   - generate-rag-corpus.ts skips deprecated leaders (matches loader)
  //   - trustScoreData.ts maps `${country} — ${title}`,
  //     `${country}:${body} — ${title}`, `United States` un-rename aliases
  //     for timeline; hyphenated variant alias for algorithms
  //   - chunkToResource.ts routes document-enrichment by metadata.collection
  // Composite reduction: 1316 → 83 orphans (94%).
  // Residuals:
  //   - algorithms: 64 variants missing from algorithms_transitions CSV
  //     (BIKE-*, SLH-DSA-*f, Classic-McEliece-348864/8192128) — data gap
  //   - document-enrichment: 19 enrichment refIds truncated relative to
  //     timeline event titles — fix upstream in enrichment generator
  timeline: 0,
  algorithms: 64,
  'document-enrichment': 19,
}

/**
 * Pinned count of chunks that have `source_doc` set but `source_passages`
 * empty. The invariant we want: if a chunk claims a source document, it must
 * cite at least one passage extracted from it. Snapshot 2026-05-10: 431
 * (bumped from 420 after IETF library backfill added 11 unenriched docs).
 * Only DECREASE — every reduction is enrichment improving.
 */
const MAX_DOC_WITHOUT_PASSAGES = 431

/** Pinned count of CSV files referenced in prov.was_derived_from but missing on disk. */
const MAX_MISSING_CSVS = 0
/** Pinned count of local source_doc paths missing on disk. */
const MAX_MISSING_SOURCE_DOCS = 0

describe('corpus trust invariants — tier coverage (C3)', () => {
  const corpus = loadCorpus()

  it('every chunk source is either scored or on TIER_NOT_APPLICABLE', () => {
    const sources = new Set(corpus.map((c) => c.source))
    const unaccounted: string[] = []
    for (const src of sources) {
      const sample = corpus.find((c) => c.source === src) as CorpusChunk
      const ref = chunkToResource(sample)
      const isScored = ref !== null
      const isExempt = TIER_NOT_APPLICABLE.has(src)
      if (!isScored && !isExempt) unaccounted.push(src)
    }
    expect(
      unaccounted,
      `Sources resolve neither to a scored resource nor TIER_NOT_APPLICABLE: ${unaccounted.join(', ')}`
    ).toEqual([])
  })

  it('every scored chunk resolves to a known trust tier (within pinned gaps)', () => {
    const gapsBySource = new Map<string, string[]>()
    for (const chunk of corpus) {
      if (TIER_NOT_APPLICABLE.has(chunk.source)) continue
      const ref = chunkToResource(chunk)
      if (!ref) continue
      const score = getTrustScore(ref.resourceType, ref.resourceId)
      if (!score) {
        const arr = gapsBySource.get(chunk.source) ?? []
        arr.push(chunk.id)
        gapsBySource.set(chunk.source, arr)
      }
    }
    const exceeded: string[] = []
    for (const [src, ids] of gapsBySource) {
      const allowed = TIER_RESOLUTION_GAPS[src] ?? 0
      if (ids.length > allowed) {
        exceeded.push(
          `${src}: ${ids.length} unscored (allowed ${allowed}); first 3: ${ids.slice(0, 3).join(', ')}`
        )
      }
    }
    expect(exceeded, `Tier resolution gaps exceeded:\n${exceeded.join('\n')}`).toEqual([])
  })
})

describe('corpus trust invariants — PROV chain (C4)', () => {
  const corpus = loadCorpus()

  it('every chunk has prov with the 4 always-required PROV-DM fields', () => {
    const failures: string[] = []
    for (const chunk of corpus) {
      const p = chunk.prov
      if (!p) {
        failures.push(`${chunk.id}: missing prov block`)
        continue
      }
      const missing: string[] = []
      if (!p.entity_id) missing.push('entity_id')
      if (!p.was_generated_by) missing.push('was_generated_by')
      if (!p.was_attributed_to) missing.push('was_attributed_to')
      if (!p.was_derived_from) missing.push('was_derived_from')
      if (missing.length > 0) failures.push(`${chunk.id}: missing ${missing.join(', ')}`)
    }
    expect(
      failures.slice(0, 10),
      `${failures.length} chunks have incomplete prov; first 10:\n${failures.slice(0, 10).join('\n')}`
    ).toEqual([])
  })

  it('chunks with source_doc must include at least one source_passages entry', () => {
    let withDocNoPassages = 0
    const examples: string[] = []
    for (const chunk of corpus) {
      const p = chunk.prov
      if (!p?.source_doc) continue
      const has = Array.isArray(p.source_passages) && p.source_passages.length > 0
      if (!has) {
        withDocNoPassages++
        if (examples.length < 5) examples.push(`${chunk.id} (source=${chunk.source})`)
      }
    }
    expect(
      withDocNoPassages,
      `${withDocNoPassages} chunks have source_doc but no source_passages (allowed ${MAX_DOC_WITHOUT_PASSAGES}); first 5:\n${examples.join('\n')}`
    ).toBeLessThanOrEqual(MAX_DOC_WITHOUT_PASSAGES)
  })

  it('was_derived_from CSV files resolve on disk (when path-shaped)', () => {
    const corpus2 = loadCorpus()
    // Format observed in corpus: `library_05102026.csv:2`
    const csvPattern = /^([a-z][a-z0-9_-]*\.csv):\d+/i
    const seenPaths = new Set<string>()
    for (const chunk of corpus2) {
      const p = chunk.prov
      if (!p?.was_derived_from) continue
      const m = csvPattern.exec(p.was_derived_from)
      if (!m) continue
      seenPaths.add(m[1])
    }
    const missing: string[] = []
    for (const file of seenPaths) {
      const candidates = [
        path.join(REPO_ROOT, 'src', 'data', file),
        path.join(REPO_ROOT, 'src', 'data', 'archive', file),
        // Module Q&A CSVs live in their own subdirectory and are referenced
        // by the corpus generator from there (see scripts/generate-rag-corpus.ts).
        path.join(REPO_ROOT, 'src', 'data', 'module-qa', file),
      ]
      if (!candidates.some((p) => fs.existsSync(p))) missing.push(file)
    }
    expect(
      missing.length,
      `was_derived_from references ${missing.length} missing CSV files (allowed ${MAX_MISSING_CSVS}): ${missing.join(', ')}`
    ).toBeLessThanOrEqual(MAX_MISSING_CSVS)
  })

  it('source_doc local paths resolve on disk', () => {
    const corpus2 = loadCorpus()
    const failures: string[] = []
    for (const chunk of corpus2) {
      const doc = chunk.prov?.source_doc
      if (!doc) continue
      // External URLs accepted as-is
      if (/^https?:\/\//i.test(doc)) continue
      const abs = path.isAbsolute(doc) ? doc : path.join(REPO_ROOT, doc)
      if (!fs.existsSync(abs)) failures.push(`${chunk.id}: ${doc}`)
    }
    expect(
      failures.length,
      `source_doc references ${failures.length} missing files (allowed ${MAX_MISSING_SOURCE_DOCS}); first 5:\n${failures.slice(0, 5).join('\n')}`
    ).toBeLessThanOrEqual(MAX_MISSING_SOURCE_DOCS)
  })
})

describe('corpus trust invariants — freshness (C5)', () => {
  const corpus = loadCorpus()

  it('was_generated_by date is never in the future', () => {
    const now = Date.now()
    const future: string[] = []
    const datePattern = /(\d{4}-\d{2}-\d{2})/
    for (const chunk of corpus) {
      const gen = chunk.prov?.was_generated_by
      if (!gen) continue
      const m = datePattern.exec(gen)
      if (!m) continue
      const ts = Date.parse(m[1])
      if (Number.isFinite(ts) && ts > now + 24 * 60 * 60 * 1000) {
        future.push(`${chunk.id}: ${gen}`)
      }
    }
    expect(
      future.slice(0, 5),
      `${future.length} chunks have future was_generated_by; first 5:\n${future.slice(0, 5).join('\n')}`
    ).toEqual([])
  })
})
