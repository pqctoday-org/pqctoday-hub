// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { chunkToRoute } from './searchRoutes'
import type { SearchChunk } from '@/services/search/SearchIndex'

function chunk(partial: Partial<SearchChunk> & { source: string }): SearchChunk {
  return { id: 'x', title: 't', content: 'c', ...partial }
}

describe('chunkToRoute', () => {
  it('repairs the stale protocol-matrix deep link to the Protocol Support tab + ?protocol=', () => {
    // The corpus historically emitted a non-existent `?tab=protocol&highlight=` link.
    // chunkToRoute must override it with the real Protocol Support detail deep link.
    const route = chunkToRoute(
      chunk({
        source: 'protocol-matrix',
        deepLink: '/algorithms?tab=protocol&highlight=tls-1-3',
        metadata: { protocolId: 'tls-1-3' },
      })
    )
    expect(route).toBe('/algorithms?tab=support&protocol=tls-1-3')
  })

  it('falls back to the Protocol Support tab when no protocolId is present', () => {
    expect(chunkToRoute(chunk({ source: 'protocol-matrix', metadata: {} }))).toBe(
      '/algorithms?tab=support'
    )
  })

  it('honors a well-formed explicit deepLink (e.g. leaders ?leader=)', () => {
    expect(
      chunkToRoute(chunk({ source: 'leaders', deepLink: '/leaders?leader=Andrei%20Gurtov' }))
    ).toBe('/leaders?leader=Andrei%20Gurtov')
  })

  it('routes a library chunk to its document deep link', () => {
    expect(
      chunkToRoute(chunk({ source: 'library', metadata: { referenceId: 'NIST-IR-8547' } }))
    ).toBe('/library?ref=NIST-IR-8547')
  })

  it('routes a patents chunk to its patent deep link', () => {
    expect(chunkToRoute(chunk({ source: 'patents', metadata: { patentNum: 'US123' } }))).toBe(
      '/patents?patent=US123'
    )
  })
})
