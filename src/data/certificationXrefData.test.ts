import { describe, it, expect } from 'vitest'
import { certificationXrefs, certsByProduct, getCertsForProduct } from './certificationXrefData'

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

  // Regression: migrate-process remediation Phase 5 (U3) — this join used
  // to be keyed by software_name only, which silently dropped the
  // Certifications section on any rename. product_id is now the primary
  // key (populated by match_certifications.py as of 2026-07-16); verify
  // both the writer side (real rows carry product_id) and the reader side
  // (lookup actually resolves via it) — the seam, not just each half.
  it('most active rows carry a real product_id (writer side of the fix)', () => {
    const withId = certificationXrefs.filter((x) => x.productId)
    expect(withId.length).toBeGreaterThan(0)
    expect(withId.length / certificationXrefs.length).toBeGreaterThan(0.9)
  })

  it('getCertsForProduct resolves by productId before softwareName', () => {
    const sample = certificationXrefs.find((x) => x.productId)
    expect(sample).toBeDefined()
    if (!sample) return
    const byId = getCertsForProduct(sample.productId, 'a-name-that-does-not-exist')
    expect(byId.length).toBeGreaterThan(0)
    expect(byId.some((c) => c.certId === sample.certId)).toBe(true)
  })

  it('getCertsForProduct falls back to softwareName when productId is unknown', () => {
    const sample = certificationXrefs[0]
    const byName = getCertsForProduct('a-product-id-that-does-not-exist', sample.softwareName)
    expect(byName.length).toBeGreaterThan(0)
  })

  it('getCertsForProduct returns empty for a product with neither key known', () => {
    expect(getCertsForProduct('nope-id', 'nope-name')).toEqual([])
  })

  it('certsByProduct map is still exported for any remaining direct consumers', () => {
    expect(certsByProduct).toBeInstanceOf(Map)
  })
})
