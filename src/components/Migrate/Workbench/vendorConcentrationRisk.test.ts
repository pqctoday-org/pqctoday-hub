// SPDX-License-Identifier: GPL-3.0-only
//
// Drift guard (2026-08-24 audit R1.2): pins the 4 severity thresholds at
// their exact boundary values. VendorConcentrationRiskPanel (desktop) and
// MobileVendorRiskTab (mobile) both call this single hook — there is no
// second copy of these numbers left to drift — but a future edit to a
// threshold here should still have to justify itself against an explicit
// assertion rather than silently reshading what "severe" means on both
// surfaces at once.
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVendorConcentrationRisks } from './vendorConcentrationRisk'

function softwareItem(id: string, vendorId: string, fips: 'Yes' | 'No') {
  return {
    productId: id,
    softwareName: id,
    categoryId: 'c',
    categoryName: '',
    infrastructureLayer: '',
    cisaCategory: '',
    pqcSupport: '',
    pqcStatusCanonical: 'available',
    pqcCapabilityDescription: '',
    licenseType: '',
    license: '',
    latestVersion: '',
    releaseDate: '',
    fipsValidated: fips,
    pqcMigrationPriority: '',
    primaryPlatforms: '',
    targetIndustries: '',
    authoritativeSource: '',
    repositoryUrl: '',
    productBrief: '',
    sourceType: '',
    verificationStatus: '',
    lastVerifiedDate: '',
    migrationPhases: '',
    learningModules: '',
    vendorId,
  }
}

function vendor(id: string, hqCountry: string, productCount: number) {
  return {
    vendorId: id,
    vendorName: id,
    vendorDisplayName: id,
    website: '',
    vendorType: '',
    entityCategory: 'Commercial Vendor',
    hqCountry,
    pqcCommitment: 'Active',
    lastVerifiedDate: '',
    productCount,
  }
}

vi.mock('@/data/migrationAssets', () => ({ REPLACE_ASSETS: [] }))
vi.mock('./workbenchCatalog', () => ({ productsForDomain: () => [] }))

function severeOf(key: string, cards: ReturnType<typeof useVendorConcentrationRisks>) {
  return cards.find((c) => c.key === key)?.severe
}

describe('useVendorConcentrationRisks — threshold boundaries', () => {
  it('vendor concentration: severe at exactly the 40% threshold', async () => {
    // 2 of 5 GA products from one vendor = 40%.
    vi.resetModules()
    vi.doMock('@/data/migrateData', () => ({
      softwareData: [
        softwareItem('p1', 'v1', 'Yes'),
        softwareItem('p2', 'v1', 'Yes'),
        softwareItem('p3', 'v2', 'Yes'),
        softwareItem('p4', 'v3', 'Yes'),
        softwareItem('p5', 'v4', 'Yes'),
      ],
      vendorMap: new Map([
        ['v1', vendor('v1', 'US', 2)],
        ['v2', vendor('v2', 'US', 1)],
        ['v3', vendor('v3', 'US', 1)],
        ['v4', vendor('v4', 'US', 1)],
      ]),
    }))
    const { useVendorConcentrationRisks: hookAt40 } = await import('./vendorConcentrationRisk')
    const { result } = renderHook(() => hookAt40())
    const share = result.current.find((c) => c.key === 'vendor-concentration')?.headline
    expect(share).toBe('40%')
    expect(severeOf('vendor-concentration', result.current)).toBe(true)
  })

  it('certification gap: severe at exactly the 30% threshold', async () => {
    vi.resetModules()
    // 3 of 10 GA products missing FIPS = 30%.
    const items = [
      ...Array.from({ length: 3 }, (_, i) => softwareItem(`gap${i}`, `v${i}`, 'No')),
      ...Array.from({ length: 7 }, (_, i) => softwareItem(`ok${i}`, `v${i + 3}`, 'Yes')),
    ]
    vi.doMock('@/data/migrateData', () => ({
      softwareData: items,
      vendorMap: new Map(items.map((it) => [it.vendorId, vendor(it.vendorId, 'US', 1)])),
    }))
    const { useVendorConcentrationRisks: hookAt30 } = await import('./vendorConcentrationRisk')
    const { result } = renderHook(() => hookAt30())
    expect(result.current.find((c) => c.key === 'cert-gap')?.headline).toBe('30%')
    expect(severeOf('cert-gap', result.current)).toBe(true)
  })

  it('geographic concentration: severe at exactly the 50% threshold', async () => {
    vi.resetModules()
    // 2 of 4 used vendors HQ'd in the same country = 50%.
    vi.doMock('@/data/migrateData', () => ({
      softwareData: [],
      vendorMap: new Map([
        ['v1', vendor('v1', 'United States', 1)],
        ['v2', vendor('v2', 'United States', 1)],
        ['v3', vendor('v3', 'Germany', 1)],
        ['v4', vendor('v4', 'Japan', 1)],
      ]),
    }))
    const { useVendorConcentrationRisks: hookAt50 } = await import('./vendorConcentrationRisk')
    const { result } = renderHook(() => hookAt50())
    expect(result.current.find((c) => c.key === 'geographic')?.headline).toBe('50%')
    expect(severeOf('geographic', result.current)).toBe(true)
  })

  it('single-source: severe whenever at least one domain has exactly one GA product', async () => {
    vi.resetModules()
    vi.doMock('@/data/migrateData', () => ({ softwareData: [], vendorMap: new Map() }))
    vi.doMock('@/data/migrationAssets', () => ({
      REPLACE_ASSETS: [{ id: 'tls', label: 'TLS key exchange' }],
    }))
    vi.doMock('./workbenchCatalog', () => ({
      productsForDomain: (id: string) =>
        id === 'tls' ? [{ pqcStatusCanonical: 'available', pqcSupport: '' }] : [],
    }))
    const { useVendorConcentrationRisks: hookSingle } = await import('./vendorConcentrationRisk')
    const { result } = renderHook(() => hookSingle())
    expect(severeOf('single-source', result.current)).toBe(true)
  })
})
