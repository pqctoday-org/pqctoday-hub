// SPDX-License-Identifier: GPL-3.0-only
/**
 * Verifies SourcePassagesDrawer renders the toggle, expands passages on
 * click, and silently renders nothing when no passages are available.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import type { RAGChunk } from '@/types/ChatTypes'
import { SourcePassagesDrawer } from './SourcePassagesDrawer'

function seedCorpus(chunks: RAGChunk[]): void {
  UnifiedSearchService.resetInstance()
  UnifiedSearchService.getInstance().initializeWithCorpus(chunks)
}

const sampleChunk: RAGChunk = {
  id: 'library-FIPS 203',
  source: 'library',
  title: 'FIPS 203',
  content: 'ML-KEM standard',
  category: 'standard',
  metadata: {},
  prov: {
    entity_id: 'abc123',
    was_generated_by: 'generate-rag-corpus.ts@2026-05-20',
    was_attributed_to: 'qwen3.6:27b',
    was_derived_from: 'library_05192026.csv:10',
    source_doc: 'public/library/FIPS_203.pdf',
    source_passages: ['ML-KEM uses module lattices.', 'Security categories 1, 3, 5.'],
  },
}

describe('SourcePassagesDrawer', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('renders nothing when no chunkId is supplied', () => {
    seedCorpus([sampleChunk])
    const { container } = render(<SourcePassagesDrawer chunkId={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for chunks with empty source_passages', () => {
    seedCorpus([{ ...sampleChunk, prov: { ...sampleChunk.prov!, source_passages: [] } }])
    const { container } = render(<SourcePassagesDrawer chunkId="library-FIPS 203" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when chunk is missing from the corpus', () => {
    seedCorpus([sampleChunk])
    const { container } = render(<SourcePassagesDrawer chunkId="library-MISSING" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the toggle with attribution and passage count', () => {
    seedCorpus([sampleChunk])
    render(<SourcePassagesDrawer chunkId="library-FIPS 203" />)
    expect(screen.getByRole('button', { name: /Source evidence/i })).toBeInTheDocument()
    expect(screen.getByText(/qwen3\.6:27b/)).toBeInTheDocument()
    expect(screen.getByText(/2 passages from FIPS_203\.pdf/)).toBeInTheDocument()
  })

  it('expands and renders passages when toggle is clicked', () => {
    seedCorpus([sampleChunk])
    render(<SourcePassagesDrawer chunkId="library-FIPS 203" />)
    const toggle = screen.getByRole('button', { name: /Source evidence/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText(/ML-KEM uses module lattices/)).toBeInTheDocument()
    expect(screen.getByText(/Security categories 1, 3, 5/)).toBeInTheDocument()
    // Source doc link uses the cached path
    const sourceLink = screen.getByRole('link', { name: /View source document/i })
    expect(sourceLink.getAttribute('href')).toBe('/library/FIPS_203.pdf')
  })
})
