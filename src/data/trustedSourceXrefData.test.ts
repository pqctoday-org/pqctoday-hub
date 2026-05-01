import { describe, it, expect } from 'vitest'
import { trustedSourceXrefs } from './trustedSourceXrefData'

describe('trustedSourceXrefData', () => {
  it('loads without error', () => {
    expect(trustedSourceXrefs.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of trustedSourceXrefs) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of trustedSourceXrefs) {
      expect(item.resourceId).toBeTruthy()
      expect(item.sourceId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = trustedSourceXrefs.map(
      (item) => item.resourceType + '|' + item.resourceId + '|' + item.sourceId
    )
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
