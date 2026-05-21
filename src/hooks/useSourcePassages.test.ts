// SPDX-License-Identifier: GPL-3.0-only
/**
 * Verifies the useSourcePassages hook resolves PROV-DM source passages
 * for a known chunk and falls back gracefully for missing chunks.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import type { RAGChunk } from '@/types/ChatTypes'
import { useSourcePassages } from './useSourcePassages'

function makeChunk(id: string, prov?: Partial<RAGChunk['prov']>): RAGChunk {
  return {
    id,
    source: 'library',
    title: id,
    content: 'content',
    category: 'algorithm',
    metadata: {},
    prov: {
      entity_id: 'e1',
      was_generated_by: 'test',
      was_attributed_to: 'qwen3.6:27b',
      was_derived_from: 'library_test.csv:1',
      source_doc: 'public/library/FIPS_203.pdf',
      source_passages: ['Passage one.', 'Passage two.'],
      ...prov,
    },
  }
}

describe('useSourcePassages', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('returns empty/done state when no chunkId is provided', () => {
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus([])
    const { result } = renderHook(() => useSourcePassages(undefined))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.passages).toEqual([])
  })

  it('resolves passages from corpus synchronously when service is ready', () => {
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus([makeChunk('library-FIPS 203')])
    const { result } = renderHook(() => useSourcePassages('library-FIPS 203'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.passages).toEqual(['Passage one.', 'Passage two.'])
    expect(result.current.sourceDoc).toBe('public/library/FIPS_203.pdf')
    expect(result.current.wasAttributedTo).toBe('qwen3.6:27b')
  })

  it('returns empty passages for an unknown chunkId', () => {
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus([makeChunk('library-FIPS 203')])
    const { result } = renderHook(() => useSourcePassages('library-DOES-NOT-EXIST'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.passages).toEqual([])
    expect(result.current.sourceDoc).toBeUndefined()
  })

  it('handles chunks with empty source_passages array', async () => {
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus([makeChunk('library-empty', { source_passages: [], source_doc: '' })])
    const { result } = renderHook(() => useSourcePassages('library-empty'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.passages).toEqual([])
    expect(result.current.sourceDoc).toBeUndefined()
  })
})
