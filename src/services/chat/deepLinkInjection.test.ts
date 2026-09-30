// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { appendGroundedDeepLinks } from './deepLinkInjection'

const chunks: RAGChunk[] = [
  {
    id: 'timeline-uae',
    source: 'timeline',
    title: 'UAE Crypto Discovery Tool and PQC Index',
    content: 'Evidence',
    category: 'timeline',
    metadata: {},
    deepLink: '/timeline?event=uae-crypto-discovery-tool-and-pqc-index',
  },
  {
    id: 'library-rfc-9881',
    source: 'library',
    title: 'RFC 9881 — ML-DSA in X.509',
    content: 'Evidence',
    category: 'library',
    metadata: {},
    deepLink: '/library?ref=RFC%209881',
  },
]

describe('appendGroundedDeepLinks', () => {
  it('appends exact corpus deep links for cited chunks', () => {
    const answer = appendGroundedDeepLinks(
      'The corpus-supported answer.',
      [
        { claimExcerpt: 'Claim one.', chunkId: 'timeline-uae' },
        { claimExcerpt: 'Claim two.', chunkId: 'library-rfc-9881' },
      ],
      chunks
    )

    expect(answer).toContain('**Explore in PQC Today:**')
    expect(answer).toContain('/timeline?event=uae-crypto-discovery-tool-and-pqc-index')
    expect(answer).toContain('/library?ref=RFC%209881')
  })

  it('deduplicates links and does not append a link already in the answer', () => {
    const existing = '[RFC 9881](/library?ref=RFC%209881) is relevant.'
    const answer = appendGroundedDeepLinks(
      existing,
      [
        { claimExcerpt: 'Claim one.', chunkId: 'library-rfc-9881' },
        { claimExcerpt: 'Claim two.', chunkId: 'library-rfc-9881' },
      ],
      chunks
    )

    expect(answer).toBe(existing)
  })

  it('rejects unknown, external, and grammar-invalid links', () => {
    const unsafeChunks: RAGChunk[] = [
      ...chunks,
      {
        id: 'external',
        source: 'library',
        title: 'External',
        content: '',
        category: 'library',
        metadata: {},
        deepLink: 'https://x.test',
      },
      {
        id: 'invalid',
        source: 'library',
        title: 'Invalid',
        content: '',
        category: 'library',
        metadata: {},
        deepLink: '/library?bogus=1',
      },
    ]
    const answer = appendGroundedDeepLinks(
      'Answer.',
      [
        { claimExcerpt: 'A.', chunkId: 'missing' },
        { claimExcerpt: 'B.', chunkId: 'external' },
        { claimExcerpt: 'C.', chunkId: 'invalid' },
      ],
      unsafeChunks
    )

    expect(answer).toBe('Answer.')
  })
})
