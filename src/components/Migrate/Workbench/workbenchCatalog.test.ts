// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { filterProducts } from './workbenchCatalog'
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
