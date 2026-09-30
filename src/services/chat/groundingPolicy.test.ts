// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import {
  buildGroundingFailureResponse,
  buildRetrievedEvidenceResponse,
  enforceGrounding,
  salvageGroundedClaims,
} from './groundingPolicy'

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

  it('salvages verified claims when an uncited introduction rejects the whole draft', () => {
    const claim = 'ML-KEM provides key encapsulation under FIPS 203.'
    const answer = `Here is what the corpus says:\n\n${claim}`
    const citations = [
      {
        claimExcerpt: claim,
        evidenceExcerpt: 'ML-KEM is a key encapsulation mechanism standardized in FIPS 203.',
        chunkId: 'algo-ml-kem',
      },
    ]

    expect(enforceGrounding(answer, citations, chunks).reasons).toContain('uncited-statement')
    expect(salvageGroundedClaims(answer, citations, chunks)).toEqual({
      content: `- ${claim}`,
      citations,
    })
  })

  it('never salvages a claim backed by fabricated evidence', () => {
    const answer = 'ML-KEM was standardized on Mars.'
    expect(
      salvageGroundedClaims(
        answer,
        [
          {
            claimExcerpt: answer,
            evidenceExcerpt: 'ML-KEM was standardized on Mars.',
            chunkId: 'algo-ml-kem',
          },
        ],
        chunks
      )
    ).toBeNull()
  })

  it('falls back to deduplicated corpus titles and deep links instead of a refusal', () => {
    const linkedChunks = [
      { ...chunks[0], deepLink: '/algorithms?highlight=ml-kem' },
      { ...chunks[0], id: 'duplicate' },
    ]
    expect(buildRetrievedEvidenceResponse(linkedChunks)).toBe(
      'These are the most relevant entries retrieved from the PQC Today corpus:\n\n' +
        '- [ML-KEM](/algorithms?highlight=ml-kem)'
    )
  })
})
