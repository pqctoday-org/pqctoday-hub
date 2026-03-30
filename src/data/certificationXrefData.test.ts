import { describe, it, expect } from 'vitest'
import { certificationXrefs } from './certificationXrefData'

describe('certificationXrefData', () => {
  it('loads without error', () => {
    expect(certificationXrefs.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of certificationXrefs) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of certificationXrefs) {
      expect(item.softwareName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = certificationXrefs.map((item) => item.softwareName + '-' + item.certId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
