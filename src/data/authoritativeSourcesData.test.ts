import { describe, it, expect } from 'vitest'
import { authoritativeSources } from './authoritativeSourcesData'

describe('authoritativeSourcesData', () => {
  it('loads without error', () => {
    expect(authoritativeSources.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of authoritativeSources) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of authoritativeSources) {
      expect(item.sourceName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = authoritativeSources.map((item) => item.sourceName)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
