import { describe, it, expect } from 'vitest'
import { trustedSources } from './trustedSourcesData'

describe('trustedSourcesData', () => {
  it('loads without error', () => {
    expect(trustedSources.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of trustedSources) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of trustedSources) {
      expect(item.sourceId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = trustedSources.map((item) => item.sourceId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
