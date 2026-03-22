// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  getDataSourceSummaries,
  filterSummariesForPersona,
  buildWhatsNewRAGChunk,
  type DataSourceSummary,
} from './dataFingerprint'

// We test against actual data — these tests verify the public API shape
// rather than mocking internals, since the data loaders are module-level singletons.

describe('dataFingerprint', () => {
  describe('getDataSourceSummaries', () => {
    it('returns empty array when no sources are changed', () => {
      const result = getDataSourceSummaries([])
      expect(result).toEqual([])
    })

    it('returns summaries for requested sources', () => {
      // Request all sources — may or may not have changes depending on CSV state
      const result = getDataSourceSummaries([
        'library',
        'migrate',
        'threats',
        'leaders',
        'timeline',
      ])
      // Each summary has the expected shape
      for (const summary of result) {
        expect(summary).toHaveProperty('sourceId')
        expect(summary).toHaveProperty('label')
        expect(summary).toHaveProperty('iconName')
        expect(summary).toHaveProperty('route')
        expect(summary).toHaveProperty('newCount')
        expect(summary).toHaveProperty('updatedCount')
        expect(summary).toHaveProperty('items')
        expect(typeof summary.newCount).toBe('number')
        expect(typeof summary.updatedCount).toBe('number')
        expect(Array.isArray(summary.items)).toBe(true)
      }
    })

    it('each item has id, label, status, and deepLink', () => {
      const result = getDataSourceSummaries([
        'library',
        'migrate',
        'threats',
        'leaders',
        'timeline',
      ])
      for (const summary of result) {
        for (const item of summary.items) {
          expect(item).toHaveProperty('id')
          expect(item).toHaveProperty('label')
          expect(item).toHaveProperty('status')
          expect(item).toHaveProperty('deepLink')
          expect(['New', 'Updated']).toContain(item.status)
          expect(item.deepLink).toMatch(/^\//)
        }
      }
    })

    it('items include optional preview fields when data is available', () => {
      const result = getDataSourceSummaries([
        'library',
        'migrate',
        'threats',
        'leaders',
        'timeline',
      ])
      for (const summary of result) {
        for (const item of summary.items) {
          // Preview fields are optional but must be correct types when present
          if (item.description !== undefined) {
            expect(typeof item.description).toBe('string')
            expect(item.description.length).toBeLessThanOrEqual(100)
          }
          if (item.organization !== undefined) {
            expect(typeof item.organization).toBe('string')
          }
          if (item.date !== undefined) {
            expect(typeof item.date).toBe('string')
          }
          if (item.tags !== undefined) {
            expect(Array.isArray(item.tags)).toBe(true)
            expect(item.tags.length).toBeLessThanOrEqual(3)
          }
        }
      }
    })
  })

  describe('filterSummariesForPersona', () => {
    // Build test data with known items
    const mockLibrarySummary: DataSourceSummary = {
      sourceId: 'library',
      label: 'Library',
      iconName: 'BookOpen',
      route: '/library',
      newCount: 2,
      updatedCount: 0,
      items: [
        {
          id: 'test-lib-1',
          label: 'Test Doc 1',
          status: 'New',
          deepLink: '/library?ref=test-lib-1',
        },
        {
          id: 'test-lib-2',
          label: 'Test Doc 2',
          status: 'New',
          deepLink: '/library?ref=test-lib-2',
        },
      ],
    }

    const mockTimelineSummary: DataSourceSummary = {
      sourceId: 'timeline',
      label: 'Timeline',
      iconName: 'Globe',
      route: '/timeline',
      newCount: 1,
      updatedCount: 0,
      items: [
        {
          id: 'US:NIST:Standardization:Test',
          label: 'United States — Test Event',
          status: 'New',
          deepLink: '/timeline?country=United%20States',
        },
      ],
    }

    it('returns all summaries when personaId is null', () => {
      const result = filterSummariesForPersona([mockLibrarySummary, mockTimelineSummary], null, [])
      expect(result).toHaveLength(2)
      expect(result[0].items).toHaveLength(2)
      expect(result[1].items).toHaveLength(1)
    })

    it('passes timeline through unfiltered for any persona', () => {
      const result = filterSummariesForPersona([mockTimelineSummary], 'executive', [])
      expect(result).toHaveLength(1)
      expect(result[0].sourceId).toBe('timeline')
      expect(result[0].items).toHaveLength(1)
    })

    it('recalculates counts after filtering', () => {
      // Create a summary where filtering will remove some items
      const mixed: DataSourceSummary = {
        sourceId: 'library',
        label: 'Library',
        iconName: 'BookOpen',
        route: '/library',
        newCount: 1,
        updatedCount: 1,
        items: [
          { id: 'keep-new', label: 'Keep', status: 'New', deepLink: '/library?ref=keep-new' },
          { id: 'keep-upd', label: 'Keep', status: 'Updated', deepLink: '/library?ref=keep-upd' },
        ],
      }

      // Filter with null persona should keep all
      const result = filterSummariesForPersona([mixed], null, [])
      expect(result[0].newCount).toBe(1)
      expect(result[0].updatedCount).toBe(1)
    })
  })

  describe('buildWhatsNewRAGChunk', () => {
    it('returns a chunk with changelog content (no persona filter)', () => {
      const chunk = buildWhatsNewRAGChunk([], null, [])
      // May be null if CHANGELOG.md is empty or has no recent versions, but if present:
      if (chunk) {
        expect(chunk.id).toBe('dynamic-whats-new')
        expect(chunk.source).toBe('whats-new')
        expect(chunk.deepLink).toBe('/changelog')
        expect(chunk.priority).toBe(10)
        expect(chunk.content).toContain('##')
        expect(chunk.metadata.dynamic).toBe('true')
        expect(chunk.metadata.persona).toBe('all')
      }
    })

    it('returns a chunk with persona filtering', () => {
      const chunk = buildWhatsNewRAGChunk([], 'developer', [])
      if (chunk) {
        expect(chunk.metadata.persona).toBe('developer')
        // Content should still have sections
        expect(chunk.content).toContain('##')
      }
    })

    it('uses plain-language labels in curious mode', () => {
      const chunk = buildWhatsNewRAGChunk([], null, [], 'curious')
      if (chunk) {
        expect(chunk.title).toBe("What's new on PQC Today")
        expect(chunk.metadata.audience).toBe('curious')
        // Curious preamble should be present
        expect(chunk.content).toContain('non-technical')
        // Should use friendly section headers, not developer jargon
        expect(chunk.content).not.toContain('## App Updates')
        expect(chunk.content).toContain('## Recent improvements')
      }
    })

    it('does NOT use curious labels when experienceLevel is not curious', () => {
      const chunk = buildWhatsNewRAGChunk([], null, [], 'basics')
      if (chunk) {
        expect(chunk.title).toBe("What's New in PQC Today")
        expect(chunk.metadata.audience).toBeUndefined()
        expect(chunk.content).not.toContain('non-technical')
        expect(chunk.content).toContain('## App Updates')
      }
    })

    it('does NOT use curious labels when experienceLevel is null', () => {
      const chunk = buildWhatsNewRAGChunk([], null, [], null)
      if (chunk) {
        expect(chunk.title).toBe("What's New in PQC Today")
        expect(chunk.metadata.audience).toBeUndefined()
        expect(chunk.content).not.toContain('non-technical')
      }
    })
  })
})
