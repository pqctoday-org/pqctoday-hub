// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { diffList, splitTokens, isListColumn, LIST_COLUMNS } from './listDiff'

describe('splitTokens', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(splitTokens(null)).toEqual([])
    expect(splitTokens(undefined)).toEqual([])
    expect(splitTokens('')).toEqual([])
    expect(splitTokens('   ')).toEqual([])
  })

  it('splits, trims, and filters empties', () => {
    expect(splitTokens('a;b;c')).toEqual(['a', 'b', 'c'])
    expect(splitTokens(' a ;  b;c ')).toEqual(['a', 'b', 'c'])
    expect(splitTokens('a;;b;')).toEqual(['a', 'b'])
  })
})

describe('isListColumn', () => {
  it('matches snake_case and camelCase variants', () => {
    expect(isListColumn('library_refs')).toBe(true)
    expect(isListColumn('libraryRefs')).toBe(true)
    expect(isListColumn('timeline_refs')).toBe(true)
    expect(isListColumn('cswp39_tags')).toBe(true)
  })

  it('rejects unknown columns', () => {
    expect(isListColumn('description')).toBe(false)
    expect(isListColumn('id')).toBe(false)
    expect(isListColumn('')).toBe(false)
  })

  it('LIST_COLUMNS is a non-empty readonly set', () => {
    expect(LIST_COLUMNS.size).toBeGreaterThan(5)
  })
})

describe('diffList', () => {
  it('all unchanged when before equals after', () => {
    const d = diffList('a;b;c', 'a;b;c')
    expect(d.unchanged).toEqual(['a', 'b', 'c'])
    expect(d.added).toEqual([])
    expect(d.removed).toEqual([])
    expect(d.ordered.every((t) => t.status === 'unchanged')).toBe(true)
  })

  it('detects added tokens preserving after-order', () => {
    const d = diffList('a;b', 'a;b;c;d')
    expect(d.added).toEqual(['c', 'd'])
    expect(d.unchanged).toEqual(['a', 'b'])
    expect(d.removed).toEqual([])
  })

  it('detects removed tokens preserving before-order', () => {
    const d = diffList('a;b;c;d', 'a;c')
    expect(d.removed).toEqual(['b', 'd'])
    expect(d.unchanged).toEqual(['a', 'c'])
    expect(d.added).toEqual([])
  })

  it('handles mixed adds and removes', () => {
    const d = diffList('FIPS-203;FIPS-204;RFC-9189', 'FIPS-203;FIPS-205;RFC-9189;RFC-9190')
    expect(d.unchanged).toEqual(['FIPS-203', 'RFC-9189'])
    expect(d.added).toEqual(['FIPS-205', 'RFC-9190'])
    expect(d.removed).toEqual(['FIPS-204'])
  })

  it('treats empty before as all-added', () => {
    const d = diffList('', 'a;b;c')
    expect(d.added).toEqual(['a', 'b', 'c'])
    expect(d.unchanged).toEqual([])
    expect(d.removed).toEqual([])
  })

  it('treats empty after as all-removed', () => {
    const d = diffList('a;b;c', '')
    expect(d.removed).toEqual(['a', 'b', 'c'])
    expect(d.unchanged).toEqual([])
    expect(d.added).toEqual([])
  })

  it('treats null/undefined as empty', () => {
    expect(diffList(null, 'a;b').added).toEqual(['a', 'b'])
    expect(diffList('a;b', null).removed).toEqual(['a', 'b'])
    expect(diffList(undefined, undefined).ordered).toEqual([])
  })

  it('collapses duplicate tokens (case-sensitive)', () => {
    const d = diffList('a;a;b', 'a;b;b;c')
    expect(d.unchanged).toEqual(['a', 'b'])
    expect(d.added).toEqual(['c'])
    expect(d.removed).toEqual([])
  })

  it('treats token case as significant', () => {
    const d = diffList('FIPS-203', 'fips-203')
    expect(d.added).toEqual(['fips-203'])
    expect(d.removed).toEqual(['FIPS-203'])
  })

  it('ordered array places after-tokens first then removed-tokens', () => {
    const d = diffList('x;y', 'a;b')
    expect(d.ordered.map((t) => `${t.token}:${t.status}`)).toEqual([
      'a:added',
      'b:added',
      'x:removed',
      'y:removed',
    ])
  })

  it('handles whitespace + semicolons gracefully', () => {
    const d = diffList(' a; b ;c ', 'a; b; d')
    expect(d.unchanged).toEqual(['a', 'b'])
    expect(d.added).toEqual(['d'])
    expect(d.removed).toEqual(['c'])
  })
})
