// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard — every browser-runnable tool is reachable from global search,
 * and no container-only scenario leaks into it.
 *
 * This is the guard for WS6a's whole point. Before it, `SOURCE_LABELS` indexed
 * tool *guide prose* and neither registry was wired into the palette at all, so
 * 71 tools were invisible to ⌘K and nothing failed. A new tool added to either
 * registry without a search entry must fail here rather than ship unfindable.
 *
 * Follows the house pattern of algorithmStatusTier.driftguard.test.ts /
 * industryLandscape.driftguard.test.ts: assert the invariant against the real
 * registry, no fixtures.
 */
import { describe, it, expect } from 'vitest'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { SOURCE_LABELS, chunkToRoute } from '@/data/searchRoutes'
import {
  BUSINESS_TOOL_SOURCE,
  WORKSHOP_TOOL_SOURCE,
  businessToolEntries,
  toolSearchEntries,
  workshopToolEntries,
} from './toolSearchEntries'
import type { SearchChunk } from './SearchIndex'

const browserTools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)
const sandboxTools = WORKSHOP_TOOLS.filter((t) => t.sandbox)

describe('tool search entries — coverage', () => {
  it('indexes every non-sandbox Crypto Lab tool', () => {
    const indexed = new Set(workshopToolEntries().map((e) => e.metadata.toolId))
    const missing = browserTools.filter((t) => !indexed.has(t.id)).map((t) => t.id)
    expect(missing, `browser tools missing from global search: ${missing.join(', ')}`).toEqual([])
    expect(indexed.size).toBe(browserTools.length)
  })

  it('indexes every business tool', () => {
    const indexed = new Set(businessToolEntries().map((e) => e.metadata.toolId))
    const missing = BUSINESS_TOOLS.filter((t) => !indexed.has(t.id)).map((t) => t.id)
    expect(missing, `business tools missing from global search: ${missing.join(', ')}`).toEqual([])
    expect(indexed.size).toBe(BUSINESS_TOOLS.length)
  })

  it('never leaks a container-only sandbox scenario into global search', () => {
    // Browser-only grading scope (2026-08-02): sandbox scenarios need an
    // access-gated Docker container, so surfacing them in the primary search
    // surface would offer the visitor results they cannot execute.
    const ids = new Set(toolSearchEntries().map((e) => e.metadata.toolId))
    const leaked = sandboxTools.filter((t) => ids.has(t.id)).map((t) => t.id)
    expect(leaked, `sandbox scenarios must not be searchable: ${leaked.join(', ')}`).toEqual([])
  })

  it('has at least one sandbox tool to exclude, so the check above is meaningful', () => {
    // If the sandbox re-homing block is ever removed, the exclusion assertion
    // becomes vacuously true — this catches that.
    expect(sandboxTools.length).toBeGreaterThan(0)
  })
})

describe('tool search entries — shape', () => {
  const entries = toolSearchEntries()

  it('produces unique ids', () => {
    const ids = entries.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('registers both sources in SOURCE_LABELS so the palette can group them', () => {
    expect(SOURCE_LABELS[WORKSHOP_TOOL_SOURCE]).toBeTruthy()
    expect(SOURCE_LABELS[BUSINESS_TOOL_SOURCE]).toBeTruthy()
  })

  it('routes every entry to its own tool route', () => {
    for (const entry of entries) {
      const route = chunkToRoute(entry as unknown as SearchChunk)
      expect(route, `${entry.id} routed to ${route}`).not.toBe('/')
      expect(route).toContain(String(entry.metadata.toolId))
    }
  })

  it('routes from metadata alone when deepLink is absent', () => {
    // Guards the explicit switch cases, which only run if the deepLink
    // fallthrough does not.
    const [workshop] = workshopToolEntries()
    const [business] = businessToolEntries()
    const strip = (e: (typeof entries)[number]): SearchChunk =>
      ({ ...e, deepLink: undefined }) as unknown as SearchChunk
    expect(chunkToRoute(strip(workshop))).toBe(`/playground/${workshop.metadata.toolId}`)
    expect(chunkToRoute(strip(business))).toBe(`/business/tools/${business.metadata.toolId}`)
  })

  it('makes each tool findable by name, by keyword and by algorithm', () => {
    // The three ways the WS6 acceptance criteria require a tool to resolve.
    // MiniSearch indexes title/content/category only, so keywords and
    // algorithms have to be present in one of those fields.
    for (const tool of browserTools) {
      const entry = workshopToolEntries().find((e) => e.metadata.toolId === tool.id)
      expect(entry, `no entry for ${tool.id}`).toBeDefined()
      const haystack = `${entry!.title} ${entry!.content} ${entry!.category}`.toLowerCase()
      expect(haystack).toContain(tool.name.toLowerCase())
      for (const kw of tool.keywords) {
        expect(haystack, `${tool.id} not findable by keyword "${kw}"`).toContain(kw.toLowerCase())
      }
      for (const algo of tool.algorithms) {
        expect(haystack, `${tool.id} not findable by algorithm "${algo}"`).toContain(
          algo.toLowerCase()
        )
      }
    }
  })
})
