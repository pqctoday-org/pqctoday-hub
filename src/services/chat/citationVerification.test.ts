// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { verifyCitations } from './citationVerification'
import type { RAGChunk } from '@/types/ChatTypes'

const CHUNK: RAGChunk = {
  id: 'algo-ml-kem-768',
  source: 'algorithms',
  title: 'ML-KEM-768',
  content: 'ML-KEM-768 provides NIST security level 3 and is standardized under FIPS 203.',
  category: 'algorithms',
  metadata: {},
}

describe('verifyCitations', () => {
  it('returns no violations for a citation whose excerpt is in the cited chunk', () => {
    const violations = verifyCitations(
      [{ claimExcerpt: 'ML-KEM-768 provides NIST security level 3', chunkId: 'algo-ml-kem-768' }],
      [CHUNK]
    )
    expect(violations).toEqual([])
  })

  it('flags a citation to a chunk id not among the retrieved chunks', () => {
    const violations = verifyCitations(
      [{ claimExcerpt: 'Some claim', chunkId: 'nonexistent-chunk' }],
      [CHUNK]
    )
    expect(violations).toEqual([
      { claimExcerpt: 'Some claim', chunkId: 'nonexistent-chunk', reason: 'unknown-chunk' },
    ])
  })

  it('flags a citation to a real chunk that does not contain the claimed excerpt', () => {
    const violations = verifyCitations(
      [{ claimExcerpt: 'ML-KEM-768 is FIPS 140-3 certified', chunkId: 'algo-ml-kem-768' }],
      [CHUNK]
    )
    expect(violations).toEqual([
      {
        claimExcerpt: 'ML-KEM-768 is FIPS 140-3 certified',
        chunkId: 'algo-ml-kem-768',
        reason: 'excerpt-not-found',
      },
    ])
  })

  it('matches an excerpt drawn from the chunk title, not just the body', () => {
    const violations = verifyCitations(
      [{ claimExcerpt: 'ML-KEM-768', chunkId: 'algo-ml-kem-768' }],
      [CHUNK]
    )
    expect(violations).toEqual([])
  })

  it('is tolerant of whitespace/case differences without being fuzzy', () => {
    const violations = verifyCitations(
      [{ claimExcerpt: '  ML-KEM-768   PROVIDES nist security  level 3  ', chunkId: 'algo-ml-kem-768' }],
      [CHUNK]
    )
    expect(violations).toEqual([])
  })

  it('returns no violations when there are no citations', () => {
    expect(verifyCitations([], [CHUNK])).toEqual([])
  })

  it('checks each citation independently across multiple chunks', () => {
    const otherChunk: RAGChunk = {
      id: 'algo-ml-dsa-65',
      source: 'algorithms',
      title: 'ML-DSA-65',
      content: 'ML-DSA-65 provides NIST security level 3.',
      category: 'algorithms',
      metadata: {},
    }
    const violations = verifyCitations(
      [
        { claimExcerpt: 'ML-KEM-768 provides NIST security level 3', chunkId: 'algo-ml-kem-768' },
        { claimExcerpt: 'ML-DSA-65 provides NIST security level 5', chunkId: 'algo-ml-dsa-65' }, // wrong level
      ],
      [CHUNK, otherChunk]
    )
    expect(violations).toEqual([
      {
        claimExcerpt: 'ML-DSA-65 provides NIST security level 5',
        chunkId: 'algo-ml-dsa-65',
        reason: 'excerpt-not-found',
      },
    ])
  })
})
