import { describe, it, expect } from 'vitest'
import { timelineData } from './timelineData'

describe('timelineData', () => {
  it('loads without error', () => {
    expect(timelineData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of timelineData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of timelineData) {
      expect(item.countryName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = timelineData.map((item) => item.countryName)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
