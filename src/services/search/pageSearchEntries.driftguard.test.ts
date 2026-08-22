// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard — the page tier cannot silently lose its search representation.
 *
 * This is the guard for WS22 Stage 3's third task. Before it, four routed pages
 * (/revisions, /editorial-independence, /sponsor, /simulation) had ZERO chunks
 * in public/data/rag-corpus.json pointing at them, no query could reach them,
 * and nothing failed — the identical root cause toolSearchEntries.ts closed one
 * tier down. A new route added to ROUTE_META without an entry, or a rename that
 * unwires the palette's `ensureSources` guarantee, must fail here.
 *
 * Follows toolSearchEntries.driftguard.test.ts: assert against the real
 * registry, no fixtures.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { ROUTE_META, isNoindexRoute } from '@/seo/routeMeta'
import {
  SOURCE_LABELS,
  ADVANCED_SOURCES,
  PALETTE_ENSURE_SOURCES,
  chunkToRoute,
} from '@/data/searchRoutes'
import { PAGE_SOURCE, pageEntryTitle, pageSearchEntries } from './pageSearchEntries'
import { BUSINESS_TOOL_SOURCE, WORKSHOP_TOOL_SOURCE } from './toolSearchEntries'
import type { SearchChunk } from './SearchIndex'
import type { RAGChunk } from '@/types/ChatTypes'

let entries: RAGChunk[] = []
let indexedRoutes = new Set<string>()

beforeAll(async () => {
  entries = await pageSearchEntries()
  indexedRoutes = new Set(entries.map((e) => e.metadata.route))
})

/**
 * The routed page-tier items measured at zero corpus chunks on 2026-08-21
 * against the 2026-08-18 corpus (16,322 chunks). These are the reason this
 * file exists; losing any of them is the regression it guards.
 */
const PREVIOUSLY_UNFINDABLE = [
  '/revisions',
  '/editorial-independence',
  '/sponsor',
  '/simulation',
] as const

describe('page search entries — coverage', () => {
  it('indexes every indexable non-module route in ROUTE_META', () => {
    const expected = Object.keys(ROUTE_META).filter(
      (r) => !r.startsWith('/learn/') && !isNoindexRoute(r)
    )
    const missing = expected.filter((r) => !indexedRoutes.has(r))
    expect(missing, `routes missing from global search: ${missing.join(', ')}`).toEqual([])
    expect(entries.length).toBe(expected.length)
  })

  it.each(PREVIOUSLY_UNFINDABLE)('%s is findable', (route) => {
    const entry = entries.find((e) => e.deepLink === route)
    expect(entry, `${route} has no search entry`).toBeDefined()
    expect(entry!.title.length).toBeGreaterThan(0)
    expect(entry!.content.length).toBeGreaterThan(0)
  })

  it('never indexes a learn module route — the corpus already covers those', () => {
    const leaked = entries.filter((e) => String(e.metadata.route).startsWith('/learn/'))
    expect(leaked.map((e) => e.deepLink)).toEqual([])
  })

  it('never indexes a noindex route', () => {
    const leaked = entries.filter((e) => isNoindexRoute(String(e.metadata.route)))
    expect(leaked.map((e) => e.deepLink)).toEqual([])
  })

  it('has at least one noindex route to exclude, so the check above is meaningful', () => {
    expect(isNoindexRoute('/embed')).toBe(true)
  })
})

describe('page search entries — shape', () => {
  it('produces unique ids', () => {
    const ids = entries.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('routes every entry to its own page', () => {
    for (const entry of entries) {
      expect(chunkToRoute(entry as unknown as SearchChunk)).toBe(entry.metadata.route)
    }
  })

  it('registers the source in SOURCE_LABELS so the palette can group it', () => {
    expect(SOURCE_LABELS[PAGE_SOURCE]).toBeTruthy()
  })

  it('is not hidden from the curious persona', () => {
    expect(ADVANCED_SOURCES.has(PAGE_SOURCE)).toBe(false)
  })

  it('trims only a trailing site name from the title', () => {
    expect(pageEntryTitle('Editorial Independence Policy | PQC Today')).toBe(
      'Editorial Independence Policy'
    )
    expect(pageEntryTitle('Terms of Service — PQC Today')).toBe('Terms of Service')
    // Site name mid-title is content, not chrome — left alone.
    expect(pageEntryTitle('Changelog — PQC Today Version History & Release Notes')).toBe(
      'Changelog — PQC Today Version History & Release Notes'
    )
  })
})

describe('page search entries — the palette guarantee stays wired', () => {
  it('PALETTE_ENSURE_SOURCES names the real source constants', () => {
    expect([...PALETTE_ENSURE_SOURCES].sort()).toEqual(
      [WORKSHOP_TOOL_SOURCE, BUSINESS_TOOL_SOURCE, PAGE_SOURCE].sort()
    )
  })
})
