// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { chunkToRoute } from './searchRoutes'
import { validateDeepLink } from '@/services/search/deepLinkGrammar'
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

  it('reads the corpus patentNumber key and adds the US prefix', () => {
    expect(chunkToRoute(chunk({ source: 'patents', metadata: { patentNumber: '12676741' } }))).toBe(
      '/patents?patent=US12676741'
    )
  })

  it('routes a timeline chunk by its event_id', () => {
    expect(chunkToRoute(chunk({ source: 'timeline', metadata: { eventId: 'TL-042' } }))).toBe(
      '/timeline?event=TL-042'
    )
  })

  it('routes a migrate chunk to ?product=<product_id>, never ?q=', () => {
    expect(
      chunkToRoute(chunk({ source: 'migrate', title: 'BTQ', metadata: { productId: 'btq-1' } }))
    ).toBe('/migrate?product=btq-1')
    expect(chunkToRoute(chunk({ source: 'migrate', title: 'Some Product' }))).toBe(
      '/migrate?product=Some%20Product'
    )
    expect(
      chunkToRoute(
        chunk({ source: 'document-enrichment', metadata: { collection: 'catalog', refId: 'X Y' } })
      )
    ).toBe('/migrate?product=X%20Y')
  })

  it('routes vendors and vendor roadmaps to the roadmaps tab', () => {
    expect(chunkToRoute(chunk({ source: 'vendors', metadata: { vendorId: 'VND-089' } }))).toBe(
      '/migrate?tab=roadmaps&vendor=VND-089'
    )
    expect(
      chunkToRoute(chunk({ source: 'vendor-roadmap', metadata: { vendorId: 'VND-001' } }))
    ).toBe('/migrate?tab=roadmaps&vendor=VND-001')
  })

  it('routes a leaders chunk to ?leader= (id first, name fallback)', () => {
    expect(chunkToRoute(chunk({ source: 'leaders', title: 'Dustin Moody' }))).toBe(
      '/leaders?leader=Dustin%20Moody'
    )
    expect(
      chunkToRoute(chunk({ source: 'leaders', title: 'X', metadata: { leaderId: 'LDR-1' } }))
    ).toBe('/leaders?leader=LDR-1')
  })

  it('routes a compliance framework chunk to ?framework=<id>', () => {
    expect(chunkToRoute(chunk({ source: 'compliance', metadata: { id: 'CNSA-2' } }))).toBe(
      '/compliance?framework=CNSA-2'
    )
    expect(chunkToRoute(chunk({ source: 'certifications', metadata: { certId: 'A123' } }))).toBe(
      '/compliance?cert=A123'
    )
  })

  it('never emits a link the deep-link grammar rejects', () => {
    const chunks: SearchChunk[] = [
      chunk({ source: 'patents', metadata: { patentNumber: '1' } }),
      chunk({ source: 'timeline', metadata: { eventId: 'E' } }),
      chunk({ source: 'migrate', metadata: { productId: 'p' } }),
      chunk({ source: 'vendors', metadata: { vendorId: 'VND-1' } }),
      chunk({ source: 'leaders' }),
      chunk({ source: 'compliance', metadata: { id: 'NIST' } }),
      chunk({ source: 'protocol-matrix', metadata: { protocolId: 'ssh' } }),
    ]
    for (const c of chunks) {
      const url = chunkToRoute(c)
      expect(validateDeepLink(url), url).toBeNull()
    }
  })
})
