import { describe, it, expect } from 'vitest'
import type { CertificationXref } from '../types/MigrateTypes'
import {
  certificationXrefs,
  certsByProduct,
  getCertsForProduct,
  indexCertsByProduct,
} from './certificationXrefData'

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

const xref = (over: Partial<CertificationXref>): CertificationXref => ({
  productId: 'prod-a',
  softwareName: 'Product A',
  certType: 'FIPS 140-3',
  certId: '1001',
  certVendor: 'Vendor',
  certProduct: 'Product A',
  pqcAlgorithms: '',
  certificationLevel: '',
  status: 'Active',
  certDate: '2026-01-01',
  certLink: 'https://example.com/1001',
  classicalOnly: false,
  ...over,
})

describe('indexCertsByProduct', () => {
  it('lists each distinct certificate once when the product id equals its display name', () => {
    const rows = [
      xref({ productId: 'Same Name', softwareName: 'Same Name', certId: '1001' }),
      xref({ productId: 'Same Name', softwareName: 'Same Name', certId: '1002', certType: 'ACVP' }),
      xref({ productId: 'Same Name', softwareName: 'Same Name', certId: '1003' }),
    ]
    const index = indexCertsByProduct(rows)
    expect(index.get('Same Name')?.map((c) => c.certId)).toEqual(['1001', '1002', '1003'])
  })

  it('still finds a product under both its id and its name when they differ', () => {
    const index = indexCertsByProduct([xref({})])
    expect(index.get('prod-a')).toHaveLength(1)
    expect(index.get('Product A')).toHaveLength(1)
  })

  it('counts a certificate that appears in two rows once, without merging different certificates', () => {
    const index = indexCertsByProduct([
      xref({ certId: '1001' }),
      xref({ certId: '1001' }), // the same FIPS 140-3 certificate again
      xref({ certId: '1001', certType: 'ACVP' }), // same number, different scheme: a different record
      xref({ certId: '1002' }),
    ])
    const list = index.get('prod-a') ?? []
    expect(list.map((c) => `${c.certType}:${c.certId}`)).toEqual([
      'FIPS 140-3:1001',
      'ACVP:1001',
      'FIPS 140-3:1002',
    ])
  })

  it('never merges rows that have no certificate number', () => {
    const index = indexCertsByProduct([
      xref({ certId: '', certLink: 'https://example.com/a' }),
      xref({ certId: '', certLink: 'https://example.com/b' }),
    ])
    expect(index.get('prod-a')).toHaveLength(2)
  })

  it('does not double the real catalogue rows whose id equals their name', () => {
    const same = certificationXrefs.filter((x) => x.productId && x.productId === x.softwareName)
    for (const row of same) {
      const list = certsByProduct.get(row.productId) ?? []
      const identities = list.map((c) => `${c.certType}|${c.certId}`)
      expect(new Set(identities).size).toBe(identities.length)
    }
  })
})
