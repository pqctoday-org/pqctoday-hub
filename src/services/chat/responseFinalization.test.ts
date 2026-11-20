// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { finalizeGroundedResponse } from './responseFinalization'

const chunks: RAGChunk[] = [
  {
    id: 'module-pqc-101',
    source: 'modules',
    title: 'PQC 101',
    content: 'PQC 101 introduces post-quantum cryptography fundamentals.',
    category: 'learning',
    metadata: {},
    deepLink: '/learn/pqc-101',
  },
]

describe('finalizeGroundedResponse', () => {
  it('falls back to extractive retrieved sources when citations are missing (strict verified-only mode)', () => {
    const answer = 'PQC 101 introduces post-quantum cryptography fundamentals.'
    const result = finalizeGroundedResponse(answer, [], chunks)
    expect(result.mode).toBe('extractive')
    expect(result.citedChunkIds).toEqual([])
    expect(result.content).toContain('[PQC 101](/learn/pqc-101)')
  })

  it('keeps the verified claim, drops the uncited introduction and records citedChunkIds', () => {
    const claim = 'PQC 101 introduces post-quantum cryptography fundamentals.'
    const result = finalizeGroundedResponse(
      `Available learning content includes:\n\n${claim}`,
      [{ claimExcerpt: claim, evidenceExcerpt: claim, chunkId: 'module-pqc-101' }],
      chunks
    )
    expect(result.mode).toBe('partially-verified')
    expect(result.droppedStatements).toBe(1)
    expect(result.citedChunkIds).toEqual(['module-pqc-101'])
    expect(result.content).toContain(claim)
    expect(result.content).not.toContain('Available learning content includes')
  })

  it('never displays a claim with fabricated evidence', () => {
    const badClaim = 'PQC 101 was published on Mars.'
    const result = finalizeGroundedResponse(
      badClaim,
      [{ claimExcerpt: badClaim, evidenceExcerpt: badClaim, chunkId: 'module-pqc-101' }],
      chunks
    )
    expect(result.mode).toBe('extractive')
    expect(result.citedChunkIds).toEqual([])
    expect(result.content).not.toContain(badClaim)
    expect(result.content).toContain('[PQC 101](/learn/pqc-101)')
  })
})
