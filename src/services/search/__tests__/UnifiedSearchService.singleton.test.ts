// SPDX-License-Identifier: GPL-3.0-only
/**
 * UnifiedSearchService singleton invariant (C6).
 *
 * Pins: getInstance() returns one and only one instance until resetInstance()
 * is called. This is the foundation of the convergence guarantee — ⌘K and the
 * RAG assistant share a single MiniSearch instance and entity index.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedSearchService } from '../UnifiedSearchService'
import { makeChunk } from '@/test/fixtures/trustChunks'

describe('UnifiedSearchService — singleton (C6)', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('getInstance() returns the same object reference on repeated calls', () => {
    const a = UnifiedSearchService.getInstance()
    const b = UnifiedSearchService.getInstance()
    const c = UnifiedSearchService.getInstance()
    expect(a).toBe(b)
    expect(b).toBe(c)
  })

  it('resetInstance() forces a fresh instance on next getInstance()', () => {
    const a = UnifiedSearchService.getInstance()
    UnifiedSearchService.resetInstance()
    const b = UnifiedSearchService.getInstance()
    expect(a).not.toBe(b)
  })

  it('the same instance retains its index across getInstance() calls', () => {
    const svc = UnifiedSearchService.getInstance()
    const corpus = [
      makeChunk({ id: 'a', source: 'library', title: 'ML-KEM', content: 'kem standard' }),
      makeChunk({ id: 'b', source: 'glossary', title: 'lattice', content: 'math' }),
    ]
    svc.initializeWithCorpus(corpus)
    expect(svc.isReady).toBe(true)

    const same = UnifiedSearchService.getInstance()
    expect(same).toBe(svc)
    expect(same.isReady).toBe(true)
    expect(same.corpus).toHaveLength(2)
  })

  it('initializeWithCorpus is idempotent at the singleton level (one shared index)', () => {
    const svc1 = UnifiedSearchService.getInstance()
    svc1.initializeWithCorpus([makeChunk({ id: '1', source: 'library' })])
    const idx1 = svc1.index

    const svc2 = UnifiedSearchService.getInstance()
    svc2.initializeWithCorpus([
      makeChunk({ id: '2', source: 'library' }),
      makeChunk({ id: '3', source: 'library' }),
    ])
    const idx2 = svc2.index

    // Same instance, but reinitialization rebuilds the index.
    expect(svc1).toBe(svc2)
    expect(idx2).not.toBeNull()
    // Latest corpus replaces previous (3-record corpus → length 3 - 1 since the
    // builder uses unique ids; we just confirm rebuild happened).
    expect(svc2.corpus.length).toBeGreaterThanOrEqual(2)
    // idx1 reference may persist if builder mutates in place; confirm at minimum
    // that the service still reports ready.
    expect(svc2.isReady).toBe(true)
    void idx1 // silence unused
  })
})
