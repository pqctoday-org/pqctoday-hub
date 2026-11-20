// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import {
  buildGroundingFailureResponse,
  buildRetrievedEvidenceResponse,
  deriveCorpusCitations,
  enforceGrounding,
  keepVerifiedStatements,
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

  it('rejects an empty supporting excerpt even when the source exists', () => {
    const claim = 'The training deployment has an approved rollout.'
    const citations = [{ claimExcerpt: claim, evidenceExcerpt: '  ', chunkId: 'algo-ml-kem' }]
    expect(enforceGrounding(claim, citations, chunks).reasons).toContain('invalid-evidence')
  })

  it('requires evidence for a short factual sentence', () => {
    const claim = 'ML-KEM is a key encapsulation mechanism standardized in FIPS 203.'
    const result = enforceGrounding(
      `${claim} Approved.`,
      [{ claimExcerpt: claim, chunkId: 'algo-ml-kem' }],
      chunks
    )
    expect(result.reasons).toContain('uncited-statement')
  })

  it('requires citations if a refusal also asserts a finding', () => {
    const answer =
      "Based on the PQC Today database, I don't have enough information about this topic. Production use is approved."
    expect(enforceGrounding(answer, [], chunks).approved).toBe(false)
  })

  it('provides a deterministic safe fallback', () => {
    expect(buildGroundingFailureResponse()).toContain("couldn't produce a fully source-verified")
  })

  it('keeps verified claims in their own words when an uncited introduction rejects the whole draft', () => {
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
    const kept = keepVerifiedStatements(answer, citations, chunks)
    expect(kept?.content).toBe(claim)
    expect(kept?.dropped).toBe(1)
    expect(kept?.citations).toEqual(citations)
  })

  it('never keeps a claim backed by fabricated evidence', () => {
    const answer = 'ML-KEM was standardized on Mars.'
    expect(
      keepVerifiedStatements(
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

  it('rejects a response containing even a single ungrounded RFC or standard entity', () => {
    const answer = 'ML-KEM is standardized in FIPS 203 and RFC 99999.'
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
    expect(result.approved).toBe(false)
    expect(result.reasons).toContain('ungrounded-entity')
  })

  it('derives corpus-verified citations for uncited WebLLM sentences that pass fact and entity checks', () => {
    const answer = 'ML-KEM is a Key Encapsulation Mechanism standardized in FIPS 203.'
    const derived = deriveCorpusCitations(answer, [], chunks)
    expect(derived).toHaveLength(1)
    expect(derived[0].chunkId).toBe('algo-ml-kem')
    expect(enforceGrounding(answer, derived, chunks)).toEqual({ approved: true, reasons: [] })
  })

  it('never derives corpus citations for sentences containing an ungrounded entity or fact contradiction', () => {
    const badAnswer = 'ML-KEM is standardized in FIPS 203 and RFC 99999.'
    expect(deriveCorpusCitations(badAnswer, [], chunks)).toEqual([])
  })
})
