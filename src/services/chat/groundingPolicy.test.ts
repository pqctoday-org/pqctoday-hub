// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { buildGroundingFailureResponse, enforceGrounding } from './groundingPolicy'

const chunks: RAGChunk[] = [
  {
    id: 'algo-ml-kem',
    source: 'algorithms',
    title: 'ML-KEM',
    content: 'ML-KEM is a key encapsulation mechanism standardized in FIPS 203.',
    category: 'algorithm',
    metadata: {},
  },
]

describe('enforceGrounding', () => {
  it('accepts a paraphrase mapped to verbatim corpus evidence', () => {
    const answer = 'ML-KEM provides key encapsulation under FIPS 203.'
    const result = enforceGrounding(
      answer,
      [
        {
          claimExcerpt: answer,
          evidenceExcerpt: 'ML-KEM is a key encapsulation mechanism standardized in FIPS 203.',
          chunkId: 'algo-ml-kem',
        },
      ],
      chunks
    )
    expect(result).toEqual({ approved: true, reasons: [] })
  })

  it('rejects an answer with no citations', () => {
    expect(enforceGrounding('ML-KEM is useful.', [], chunks)).toEqual(
      expect.objectContaining({
        approved: false,
        reasons: expect.arrayContaining(['missing-citations']),
      })
    )
  })

  it('rejects evidence that is not verbatim in the cited chunk', () => {
    const answer = 'ML-KEM was standardized in 1994.'
    const result = enforceGrounding(
      answer,
      [
        {
          claimExcerpt: answer,
          evidenceExcerpt: 'ML-KEM was standardized in 1994.',
          chunkId: 'algo-ml-kem',
        },
      ],
      chunks
    )
    expect(result.approved).toBe(false)
    expect(result.reasons).toContain('invalid-evidence')
  })

  it('rejects a substantive sentence omitted from the claim map', () => {
    const answer = 'ML-KEM provides key encapsulation. It was invented on Mars.'
    const result = enforceGrounding(
      answer,
      [
        {
          claimExcerpt: 'ML-KEM provides key encapsulation.',
          evidenceExcerpt: 'ML-KEM is a key encapsulation mechanism',
          chunkId: 'algo-ml-kem',
        },
      ],
      chunks
    )
    expect(result.reasons).toContain('uncited-statement')
  })

  it('rejects a sentence when only a harmless substring is cited', () => {
    const answer = 'ML-KEM was invented on Mars.'
    const result = enforceGrounding(
      answer,
      [
        {
          claimExcerpt: 'ML-KEM',
          evidenceExcerpt: 'ML-KEM',
          chunkId: 'algo-ml-kem',
        },
      ],
      chunks
    )
    expect(result.reasons).toContain('uncited-statement')
  })

  it('accepts the exact corpus-insufficient refusal without citations', () => {
    const answer =
      "Based on the PQC Today database, I don't have enough information about this topic."
    expect(enforceGrounding(answer, [], chunks)).toEqual({ approved: true, reasons: [] })
  })

  it('provides a deterministic safe fallback', () => {
    expect(buildGroundingFailureResponse()).toContain("couldn't produce a fully source-verified")
  })
})
