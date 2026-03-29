import { describe, it, expect } from 'vitest'
import { libraryData } from './libraryData'

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
})
