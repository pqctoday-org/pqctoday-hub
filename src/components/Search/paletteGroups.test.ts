// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { SearchResult } from '@/services/search/SearchIndex'
import {
  PALETTE_GROUP_CAP,
  buildNav,
  capGroups,
  groupResults,
  hiddenHintText,
  summarizeHidden,
} from './paletteGroups'

function hit(id: string, source: string): SearchResult {
  return { id, source, title: id, content: id, score: 1, match: {} }
}

/** 16 Learn Q&A hits first, then 2 glossary, 1 library — the "purdue model for OT" shape. */
function purdueShape(): SearchResult[] {
  return [
    ...Array.from({ length: 16 }, (_, i) => hit(`qa-${i}`, 'module-qa')),
    hit('glossary-383', 'glossary'),
    hit('glossary-9', 'glossary'),
    hit('lib-1', 'library'),
  ]
}

describe('groupResults', () => {
  it('orders groups by their first hit and keeps ranking order inside a group', () => {
    const groups = groupResults([
      hit('a1', 'library'),
      hit('g1', 'glossary'),
      hit('a2', 'library'),
      hit('g2', 'glossary'),
    ])
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([
      ['a1', 'a2'],
      ['g1', 'g2'],
    ])
    expect(groups[0].source).toBe('library')
  })

  it('returns [] for no results', () => {
    expect(groupResults([])).toEqual([])
  })
})

describe('capGroups', () => {
  it('shows the top 5 rows per group and reports the remainder', () => {
    const capped = capGroups(groupResults(purdueShape()), new Set())
    expect(PALETTE_GROUP_CAP).toBe(5)
    expect(capped[0].total).toBe(16)
    expect(capped[0].visible.map((i) => i.id)).toEqual(['qa-0', 'qa-1', 'qa-2', 'qa-3', 'qa-4'])
    expect(capped[0].moreCount).toBe(11)
    // small groups are untouched, no control
    expect(capped[1].visible).toHaveLength(2)
    expect(capped[1].moreCount).toBe(0)
  })

  it('a group of exactly 5 gets no control', () => {
    const capped = capGroups(
      groupResults(Array.from({ length: 5 }, (_, i) => hit(`x${i}`, 'glossary'))),
      new Set()
    )
    expect(capped[0].visible).toHaveLength(5)
    expect(capped[0].moreCount).toBe(0)
  })

  it('expands only the named group, in place and in order', () => {
    const groups = groupResults(purdueShape())
    const qaLabel = groups[0].label
    const capped = capGroups(groups, new Set([qaLabel]))
    expect(capped[0].visible).toHaveLength(16)
    expect(capped[0].moreCount).toBe(0)
    expect(capped.map((g) => g.label)).toEqual(groups.map((g) => g.label))
  })
})

describe('buildNav (keyboard navigation list)', () => {
  it('contains exactly the visible rows plus one "more" entry per capped group, in render order', () => {
    const capped = capGroups(groupResults(purdueShape()), new Set())
    const nav = buildNav(capped)
    // 5 + more + 2 + 1
    expect(nav).toHaveLength(9)
    expect(nav[5]).toMatchObject({ kind: 'more', moreCount: 11 })
    expect(nav.filter((n) => n.kind === 'result')).toHaveLength(8)
    // the glossary hit is reachable at flat index 6 instead of 16
    const idx = nav.findIndex((n) => n.kind === 'result' && n.item.id === 'glossary-383')
    expect(idx).toBe(6)
  })

  it("after expanding, the first newly revealed row takes the control's index", () => {
    const groups = groupResults(purdueShape())
    const before = buildNav(capGroups(groups, new Set()))
    const moreIdx = before.findIndex((n) => n.kind === 'more')
    const after = buildNav(capGroups(groups, new Set([groups[0].label])))
    expect(after).toHaveLength(19)
    const entry = after[moreIdx]
    expect(entry.kind === 'result' && entry.item.id).toBe('qa-5')
  })
})

describe('summarizeHidden / hiddenHintText', () => {
  it('counts hits, lists source labels most-hidden first (max 3)', () => {
    const s = summarizeHidden([
      { source: 'glossary' },
      { source: 'module-qa' },
      { source: 'module-qa' },
      { source: 'quiz' },
      { source: 'patents' },
    ])
    expect(s.count).toBe(5)
    expect(s.labels).toHaveLength(3)
    expect(s.labels[0]).toBe('Learn')
  })

  it('formats singular and plural wording', () => {
    expect(hiddenHintText({ count: 1, labels: ['Glossary'] })).toBe(
      '1 more result hidden by Authoritative only (e.g. Glossary)'
    )
    expect(hiddenHintText({ count: 12, labels: ['Glossary', 'Learn'] })).toBe(
      '12 more results hidden by Authoritative only (e.g. Glossary, Learn)'
    )
    expect(hiddenHintText({ count: 2, labels: [] })).toBe(
      '2 more results hidden by Authoritative only'
    )
  })
})
