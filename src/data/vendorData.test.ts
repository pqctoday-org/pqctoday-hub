import { describe, it, expect } from 'vitest'
import { vendors } from './vendorData'

describe('vendorData', () => {
  it('loads without error', () => {
    expect(vendors.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of vendors) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of vendors) {
      expect(item.vendorId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = vendors.map((item) => item.vendorId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
