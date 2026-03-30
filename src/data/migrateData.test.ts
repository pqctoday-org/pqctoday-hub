import { describe, it, expect } from 'vitest'
import { softwareData } from './migrateData'

describe('migrateData', () => {
  it('loads without error', () => {
    expect(softwareData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of softwareData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of softwareData) {
      expect(item.softwareName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = softwareData.map((item) => item.softwareName)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
