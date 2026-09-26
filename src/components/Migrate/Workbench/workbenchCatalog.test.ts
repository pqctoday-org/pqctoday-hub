// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  applyProductFacets,
  filterProducts,
  NO_FACETS,
  searchProducts,
  type ProductFacets,
} from './workbenchCatalog'
import type { SoftwareItem } from '../../../types/MigrateTypes'

function item(overrides: Partial<SoftwareItem>): SoftwareItem {
  return {
    productId: 'testlib',
    softwareName: 'TestLib',
    categoryId: 'CSC-001',
    categoryName: 'Cryptographic Libraries',
    infrastructureLayer: 'Libraries',
    cisaCategory: 'Other / Unclassified',
    pqcSupport: 'Yes (ML-KEM, ML-DSA)',
    pqcCapabilityDescription: 'Supports ML-KEM key exchange and ML-DSA signatures',
    licenseType: 'Open Source',
    license: 'Apache-2.0',
    latestVersion: '3.0',
    releaseDate: '2026-01-15',
    fipsValidated: 'Yes (FIPS 140-3)',
    pqcMigrationPriority: 'Critical',
    primaryPlatforms: 'Linux',
    targetIndustries: 'All',
    authoritativeSource: 'https://example.com',
    repositoryUrl: 'https://github.com/test/lib',
    productBrief: 'A test crypto library',
    sourceType: 'Vendor',
    verificationStatus: 'Verified',
    lastVerifiedDate: '2026-01-15',
    migrationPhases: 'assess',
    learningModules: '',
    vendorId: 'VND-001',
    ...overrides,
  } as SoftwareItem
}

describe('filterProducts — productIds exact-match mode (leader-detail deep link)', () => {
  it('matches only the given product ids, ignoring the text query', () => {
    const items = [
      item({ productId: 'botan', softwareName: 'Botan' }),
      item({ productId: 'openssl', softwareName: 'OpenSSL' }),
      item({ productId: 'liboqs', softwareName: 'liboqs' }),
    ]
    const got = filterProducts(items, 'this text is ignored', ['botan', 'openssl'])
    expect(got.map((p) => p.productId).sort()).toEqual(['botan', 'openssl'])
  })

  it('falls back to text search when productIds is empty or omitted', () => {
    const items = [
      item({ productId: 'botan', softwareName: 'Botan' }),
      item({ productId: 'openssl', softwareName: 'OpenSSL' }),
    ]
    expect(filterProducts(items, 'botan')).toHaveLength(1)
    expect(filterProducts(items, 'botan', [])).toHaveLength(1)
  })

  it('an exact productId also matches via the plain text query path', () => {
    const items = [
      item({ productId: 'liboqs-rust-oqs-crate', softwareName: 'liboqs-rust (oqs crate)' }),
    ]
    expect(filterProducts(items, 'liboqs-rust-oqs-crate')).toHaveLength(1)
  })
})

describe('filterProducts — existing free-text behavior is unchanged', () => {
  it('matches by software name, category, or vendor id substring', () => {
    const items = [item({ productId: 'a', softwareName: 'Foo Bar' })]
    expect(filterProducts(items, 'foo')).toHaveLength(1)
    expect(filterProducts(items, 'cryptographic')).toHaveLength(1)
    expect(filterProducts(items, 'vnd-001')).toHaveLength(1)
    expect(filterProducts(items, 'nomatch')).toHaveLength(0)
  })

  it('returns everything for an empty query', () => {
    const items = [item({ productId: 'a' }), item({ productId: 'b' })]
    expect(filterProducts(items, '')).toHaveLength(2)
  })
})

// searchProducts runs against the real, module-level catalog index (same
// data AssetList's top-level search box actually queries) rather than an
// injectable list — pinning it against a real, known product is the only way
// to catch a regression of the bug this closes: that box used to match ONLY
// the ~18 asset/category labels, so a real product name like "Qinsight"
// always returned zero results even though the product is in the catalog.
describe('searchProducts — catalog-wide product/vendor search (AssetList top search box)', () => {
  it('finds a real product by name, across whatever domain it is classified into', () => {
    const hits = searchProducts('qinsight')
    expect(hits.length).toBeGreaterThan(0)
    expect(
      hits.some((h) => h.product.productId === 'Qinsight-Atlas-Cryptographic-Discovery-P')
    ).toBe(true)
  })

  it('finds a product by its vendor display name, not just its raw vendorId code', () => {
    // Qinsight Atlas's vendorId is VND-557 — searching the human vendor name
    // ("Qinsight"), not that code, is the case the old label-only search broke.
    const hits = searchProducts('qinsight')
    const hit = hits.find((h) => h.product.productId === 'Qinsight-Atlas-Cryptographic-Discovery-P')
    expect(hit?.vendorName).toBe('Qinsight')
  })

  it('returns nothing for an empty query (never dumps the whole catalog)', () => {
    expect(searchProducts('')).toHaveLength(0)
    expect(searchProducts('   ')).toHaveLength(0)
  })

  it('returns nothing for a query matching no product', () => {
    expect(searchProducts('zzz-nonexistent-product-zzz')).toHaveLength(0)
  })

  it('caps results at the given limit', () => {
    // 'a' matches a huge fraction of the ~1000-product catalog by name or
    // vendor — the cap is what keeps the sidebar a quick jump-to.
    expect(searchProducts('a', 3)).toHaveLength(3)
  })
})

describe('applyProductFacets', () => {
  const items = [
    { productId: 'a', pqcStatusCanonical: 'available', cataloguePopulation: 'pqc_relevant' },
    { productId: 'b', pqcStatusCanonical: 'roadmap', cataloguePopulation: 'pqc_relevant' },
    { productId: 'c', pqcStatusCanonical: 'none', cataloguePopulation: 'migration_baseline' },
    { productId: 'd', pqcStatusCanonical: 'pending', cataloguePopulation: 'migration_baseline' },
  ] as SoftwareItem[]
  const certified = new Set(['a', 'c'])
  const ids = (xs: SoftwareItem[]) => xs.map((x) => x.productId)
  const run = (f: Partial<ProductFacets>) =>
    ids(applyProductFacets(items, { ...NO_FACETS, ...f }, (p) => certified.has(p.productId)))

  it('returns everything with no facet set', () => {
    expect(run({})).toEqual(['a', 'b', 'c', 'd'])
  })
  it('filters by population, folded PQC status and certification link', () => {
    expect(run({ population: 'migration_baseline' })).toEqual(['c', 'd'])
    expect(run({ pqc: 'planned' })).toEqual(['b'])
    expect(run({ pqc: 'unknown' })).toEqual(['d'])
    expect(run({ certified: 'none' })).toEqual(['b', 'd'])
    expect(run({ population: 'pqc_relevant', certified: 'linked' })).toEqual(['a'])
  })
})
