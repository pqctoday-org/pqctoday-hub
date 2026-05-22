import { describe, it, expect } from 'vitest'
import { libraryData, computeCitationCounts } from './libraryData'

describe('libraryData', () => {
  it('loads without error', () => {
    expect(libraryData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of libraryData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of libraryData) {
      expect(item.referenceId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = libraryData.map((item) => item.referenceId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  it('derives a citationCount field on every item', () => {
    for (const item of libraryData) {
      expect(typeof item.citationCount).toBe('number')
      expect(item.citationCount).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('computeCitationCounts', () => {
  it('counts inbound references from the dependencies field', () => {
    // Plan §Tests/Unit #7 — given A.deps=[B]; C.deps=[B], B.citationCount === 2
    const items = [
      { referenceId: 'A', dependencies: 'B' },
      { referenceId: 'B', dependencies: '' },
      { referenceId: 'C', dependencies: 'B' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('B')).toBe(2)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('C') ?? 0).toBe(0)
  })

  it('handles semicolon-delimited multi-dep entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'X; Y; Z' },
      { referenceId: 'B', dependencies: 'X;Y' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('X')).toBe(2)
    expect(counts.get('Y')).toBe(2)
    expect(counts.get('Z')).toBe(1)
  })

  it('ignores self-references and empty entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'A; ; B' },
      { referenceId: 'B', dependencies: '' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('B')).toBe(1)
  })

  it('returns an empty map when no items have dependencies', () => {
    const items = [
      { referenceId: 'A', dependencies: '' },
      { referenceId: 'B', dependencies: '' },
    ]
    expect(computeCitationCounts(items).size).toBe(0)
  })
})
