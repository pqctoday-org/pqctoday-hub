// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch'
import localforage from 'localforage'
import type { RAGChunk } from '@/types/ChatTypes'

/**
 * UnifiedSearchService — single MiniSearch instance + entityIndex + corpus map
 * shared by ⌘K (SearchIndex facade) and the PQC Assistant (RetrievalService).
 *
 * Convergence goals:
 * - One corpus load per session (was two: one in SearchIndex, one in RetrievalService).
 * - One MiniSearch index with consistent fields and boosts.
 * - One entityIndex so direct entity lookups (acronym, refId, country, toolId,
 *   patentNumber, vendorId, …) work in both consumers.
 * - localforage cache for cold-start performance, version-keyed by `generatedAt`.
 *
 * Public API (intentionally narrow):
 * - initialize() / initializeWithCorpus(corpus) — load + build
 * - corpus, corpusById, entityIndex, index — readonly accessors used by the
 *   Assistant pipeline (boosts, diversity caps, library guarantee).
 * - searchPalette(query, opts) — simple ranked results for ⌘K.
 * - corpusDate, isReady, invalidateCache().
 */

const CORPUS_PATH = '/data/rag-corpus.json'
const CACHE_KEY = 'pqc-search-index-v2'

const MINISEARCH_CONFIG = {
  fields: ['title', 'content', 'category'],
  storeFields: ['id', 'source', 'title', 'content', 'category', 'deepLink', 'priority', 'metadata'],
  searchOptions: {
    boost: { title: 3, category: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  },
}

interface CachedIndex {
  version: string
  serialized: string
}

export interface PaletteResult {
  id: string
  source: string
  title: string
  content: string
  category?: string
  deepLink?: string
  priority?: number
  metadata?: Record<string, unknown>
  score: number
  match: Record<string, string[]>
}

export class UnifiedSearchService {
  private static instance: UnifiedSearchService | null = null

  private _corpus: RAGChunk[] = []
  private _corpusById = new Map<string, RAGChunk>()
  private _entityIndex = new Map<string, string[]>()
  private _index: MiniSearch<RAGChunk> | null = null
  private _generatedAt: string | null = null
  private initPromise: Promise<void> | null = null

  static getInstance(): UnifiedSearchService {
    if (!UnifiedSearchService.instance) {
      UnifiedSearchService.instance = new UnifiedSearchService()
    }
    return UnifiedSearchService.instance
  }

  /** Reset singleton — for testing only */
  static resetInstance(): void {
    UnifiedSearchService.instance = null
  }

  get corpus(): ReadonlyArray<RAGChunk> {
    return this._corpus
  }

  get corpusById(): ReadonlyMap<string, RAGChunk> {
    return this._corpusById
  }

  get entityIndex(): ReadonlyMap<string, string[]> {
    return this._entityIndex
  }

  get index(): MiniSearch<RAGChunk> | null {
    return this._index
  }

  get corpusDate(): string | null {
    return this._generatedAt
  }

  get isReady(): boolean {
    return this._index !== null
  }

  async initialize(): Promise<void> {
    if (this._index) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.load().catch((err) => {
      this.initPromise = null
      throw err
    })
    return this.initPromise
  }

  /** Initialize with a pre-loaded corpus — for unit tests */
  initializeWithCorpus(corpus: RAGChunk[]): void {
    this._corpus = [...corpus]
    this._generatedAt = null
    this.buildIndex()
  }

  async invalidateCache(): Promise<void> {
    try {
      await localforage.removeItem(CACHE_KEY)
    } catch {
      // non-critical
    }
    this._index = null
    this.initPromise = null
  }

  private async load(): Promise<void> {
    const response = await fetch(CORPUS_PATH)
    if (!response.ok) {
      throw new Error(`Failed to load RAG corpus: ${response.status}`)
    }
    const data = await response.json()

    if (Array.isArray(data)) {
      this._corpus = data
      this._generatedAt = null
    } else {
      this._corpus = data.chunks ?? []
      this._generatedAt = data.generatedAt ?? null
    }

    this.buildIndex()
  }

  private buildIndex(): void {
    this._corpusById.clear()
    this._entityIndex.clear()

    // Deduplicate by id — last entry wins
    for (const chunk of this._corpus) {
      this._corpusById.set(chunk.id, chunk)
    }
    this._corpus = Array.from(this._corpusById.values())

    for (const chunk of this._corpus) {
      this.indexEntity(chunk)
    }

    this._index = new MiniSearch<RAGChunk>(MINISEARCH_CONFIG)
    this._index.addAll(this._corpus)
  }

  private indexEntity(chunk: RAGChunk): void {
    const pushAlias = (raw: unknown): void => {
      if (typeof raw !== 'string') return
      const key = raw.trim().toLowerCase()
      if (!key) return
      const existing = this._entityIndex.get(key) ?? []
      existing.push(chunk.id)
      this._entityIndex.set(key, existing)
    }

    // Title and title variants
    const titleLower = chunk.title.toLowerCase()
    pushAlias(titleLower)
    // "ML-DSA-44" → "ml-dsa", "ml dsa"
    const baseName = titleLower.replace(/-\d+.*$/, '').trim()
    if (baseName !== titleLower) pushAlias(baseName)
    const noHyphens = titleLower.replace(/-/g, ' ')
    if (noHyphens !== titleLower) pushAlias(noHyphens)

    const m = chunk.metadata
    if (!m) return

    pushAlias(m.acronym)
    pushAlias(m.categoryName)
    pushAlias(m.referenceId)
    pushAlias(m.country)
    pushAlias(m.org)

    if (chunk.source === 'business-center' && typeof m.toolId === 'string') {
      pushAlias(m.toolId)
      pushAlias(m.toolId.replace(/-/g, ' '))
    }
    if (chunk.source === 'patents') {
      pushAlias(m.patentNumber)
      pushAlias(m.assignee)
      if (typeof m.quantumRelevance === 'string') {
        pushAlias(m.quantumRelevance)
        pushAlias(m.quantumRelevance.replace(/_/g, ' '))
      }
    }
    if (chunk.source === 'vendors') {
      pushAlias(m.vendorId)
    }
    if (chunk.source === 'governance-maturity') {
      pushAlias(m.pillar)
      pushAlias(m.refId)
      pushAlias(m.sourceName)
    }
    if (chunk.source === 'document-enrichment') {
      pushAlias(m.refId)
    }
    if (chunk.source === 'trusted-sources') {
      pushAlias(m.sourceId)
    }
  }

  /**
   * Cached cold-start path used by ⌘K. Loads serialized MiniSearch from
   * localforage when available, version-keyed by corpus.generatedAt. Falls
   * back to fresh build + write-through cache.
   *
   * Used only by the SearchIndex palette facade — RetrievalService
   * always rebuilds in-memory because it needs the entityIndex.
   */
  async loadCached(): Promise<void> {
    if (this._index) return

    const response = await fetch(CORPUS_PATH)
    if (!response.ok) throw new Error(`Failed to fetch corpus: ${response.status}`)
    const data = await response.json()
    const chunks: RAGChunk[] = Array.isArray(data) ? data : (data.chunks ?? [])
    const version: string = (Array.isArray(data) ? null : (data.generatedAt ?? null)) ?? 'unknown'
    this._generatedAt = version === 'unknown' ? null : version

    try {
      const cached = await localforage.getItem<CachedIndex>(CACHE_KEY)
      if (cached && cached.version === version) {
        // Cached MiniSearch JSON — restore directly. We still need to populate
        // corpusById and entityIndex for Assistant mode, so build those from
        // the corpus separately.
        this._corpus = chunks
        for (const chunk of this._corpus) this._corpusById.set(chunk.id, chunk)
        this._corpus = Array.from(this._corpusById.values())
        for (const chunk of this._corpus) this.indexEntity(chunk)
        this._index = MiniSearch.loadJSON<RAGChunk>(cached.serialized, MINISEARCH_CONFIG)
        return
      }
      if (cached) await localforage.removeItem(CACHE_KEY)
    } catch {
      // fall through to rebuild
    }

    this._corpus = chunks
    this.buildIndex()

    try {
      if (this._index) {
        await localforage.setItem(CACHE_KEY, {
          version,
          serialized: JSON.stringify(this._index),
        })
      }
    } catch {
      // non-critical
    }
  }

  /**
   * Palette search — simple ranked results for ⌘K. No re-ranking, no
   * diversity caps; the palette UI groups by source itself.
   */
  searchPalette(query: string, opts?: { limit?: number; sources?: string[] }): PaletteResult[] {
    if (!this._index) return []
    const raw = this._index.search(query)
    const sliced = raw.slice(0, opts?.limit ?? 50)
    const results = sliced.map((r) => {
      const chunk = this._corpusById.get(r.id)
      return {
        id: r.id,
        source: chunk?.source ?? '',
        title: chunk?.title ?? '',
        content: chunk?.content ?? '',
        category: chunk?.category,
        deepLink: chunk?.deepLink,
        priority: chunk?.priority,
        metadata: chunk?.metadata as Record<string, unknown> | undefined,
        score: r.score,
        match: r.match as Record<string, string[]>,
      }
    })
    if (opts?.sources && opts.sources.length > 0) {
      return results.filter((r) => opts.sources!.includes(r.source))
    }
    return results
  }
}
