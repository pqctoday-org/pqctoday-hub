// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch'
import localforage from 'localforage'

export interface SearchChunk {
  id: string
  source: string
  title: string
  content: string
  category?: string
  deepLink?: string
  priority?: number
  metadata?: Record<string, unknown>
}

export interface SearchResult extends SearchChunk {
  score: number
  match: Record<string, string[]>
}

const CACHE_KEY = 'pqc-search-index-v1'
const CORPUS_PATH = '/data/rag-corpus.json'

const MINISEARCH_OPTS = {
  fields: ['title', 'content'],
  storeFields: ['id', 'source', 'title', 'content', 'category', 'deepLink', 'priority', 'metadata'],
  searchOptions: {
    boost: { title: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
}

interface CachedIndex {
  version: string
  serialized: string
}

let indexInstance: MiniSearch<SearchChunk> | null = null
let buildPromise: Promise<MiniSearch<SearchChunk>> | null = null

function dedupeChunks(chunks: SearchChunk[]): SearchChunk[] {
  const seen = new Set<string>()
  const out: SearchChunk[] = []
  let duplicates = 0
  for (const c of chunks) {
    if (seen.has(c.id)) {
      duplicates++
      continue
    }
    seen.add(c.id)
    out.push(c)
  }
  if (duplicates > 0) {
    console.warn(`[SearchIndex] dropped ${duplicates} duplicate chunk id(s) from corpus`)
  }
  return out
}

function buildIndex(chunks: SearchChunk[]): MiniSearch<SearchChunk> {
  const ms = new MiniSearch<SearchChunk>(MINISEARCH_OPTS)
  ms.addAll(dedupeChunks(chunks))
  return ms
}

async function loadAndBuild(): Promise<MiniSearch<SearchChunk>> {
  const resp = await fetch(CORPUS_PATH)
  if (!resp.ok) throw new Error(`Failed to fetch corpus: ${resp.status}`)
  const data = (await resp.json()) as { chunks: SearchChunk[]; generatedAt?: string }
  const currentVersion = data.generatedAt ?? 'unknown'

  // Check cache, but only use it if the corpus version matches
  try {
    const cached = await localforage.getItem<CachedIndex>(CACHE_KEY)
    if (cached && cached.version === currentVersion) {
      return MiniSearch.loadJSON<SearchChunk>(cached.serialized, MINISEARCH_OPTS)
    }
    if (cached) {
      // Stale cache from an older corpus — clear it
      await localforage.removeItem(CACHE_KEY)
    }
  } catch {
    // Cache read or parse error — fall through to rebuild
  }

  const ms = buildIndex(data.chunks)

  try {
    await localforage.setItem(CACHE_KEY, {
      version: currentVersion,
      serialized: JSON.stringify(ms),
    })
  } catch {
    // Non-critical — in-memory works fine
  }

  return ms
}

/** Pre-load the index on first ⌘K open. Subsequent calls resolve immediately. */
export function getSearchIndex(): Promise<MiniSearch<SearchChunk>> {
  if (indexInstance) return Promise.resolve(indexInstance)
  if (buildPromise) return buildPromise

  buildPromise = loadAndBuild().then(
    (ms) => {
      indexInstance = ms
      buildPromise = null
      return ms
    },
    (err) => {
      buildPromise = null
      throw err
    }
  )

  return buildPromise
}

/** Invalidate cache + force rebuild (e.g., after corpus update). */
export async function invalidateSearchCache(): Promise<void> {
  await localforage.removeItem(CACHE_KEY)
  indexInstance = null
  buildPromise = null
}

export async function search(
  query: string,
  opts?: { limit?: number; sources?: string[] }
): Promise<SearchResult[]> {
  const ms = await getSearchIndex()
  const raw = ms.search(query)
  const results = raw.slice(0, opts?.limit ?? 50) as unknown as SearchResult[]
  if (opts?.sources && opts.sources.length > 0) {
    return results.filter((r) => opts.sources!.includes(r.source))
  }
  return results
}
