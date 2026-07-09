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

  it('classifies every row as curated or auto-imported', () => {
    for (const item of leadersData) {
      expect(['curated', 'auto-imported']).toContain(item.sourceKind)
    }
  })

  it('curated profiles outnumber auto-imported stubs and both tiers are non-empty', () => {
    const curated = leadersData.filter((l) => l.sourceKind === 'curated')
    const autoImported = leadersData.filter((l) => l.sourceKind === 'auto-imported')
    expect(curated.length).toBeGreaterThan(0)
    expect(autoImported.length).toBeGreaterThan(0)
    expect(curated.length).toBeGreaterThan(autoImported.length)
  })

  it('parses verifiedDate as an ISO date string when present', () => {
    const withDate = leadersData.filter((l) => l.verifiedDate)
    expect(withDate.length).toBeGreaterThan(0)
    for (const item of withDate) {
      expect(item.verifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('backfills peer_reviewed for most rows carrying a library reference link', () => {
    const linked = leadersData.filter((l) => l.keyResourceRefs && l.keyResourceRefs.length > 0)
    const withTrust = linked.filter((l) => l.peerReviewed)
    expect(linked.length).toBeGreaterThan(0)
    // Not every linked ref has library-side peer_reviewed data (some are blank at
    // the source too) — assert strong majority coverage rather than 100%.
    expect(withTrust.length / linked.length).toBeGreaterThan(0.85)
  })
})
