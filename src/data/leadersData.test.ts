import { describe, it, expect } from 'vitest'
import { leadersData } from './leadersData'

describe('leadersData', () => {
  it('loads without error', () => {
    expect(leadersData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of leadersData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of leadersData) {
      expect(item.id).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = leadersData.map((item) => item.id)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
