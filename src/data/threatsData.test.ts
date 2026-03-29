import { describe, it, expect } from 'vitest'
import { threatsData } from './threatsData'

describe('threatsData', () => {
  it('loads without error', () => {
    expect(threatsData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of threatsData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of threatsData) {
      expect(item.threatId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = threatsData.map((item) => item.threatId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
