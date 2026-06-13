// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildCycloneDxCbom, extractPqcAlgorithms } from './cbomExport'
import type { SoftwareItem, CertificationXref } from '../../types/MigrateTypes'

const baseItem: SoftwareItem = {
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
}

describe('extractPqcAlgorithms', () => {
  it('lifts distinct canonical PQC algorithms from product + cert fields', () => {
    const certs: CertificationXref[] = [
      {
        productId: 'testlib',
        softwareName: 'TestLib',
        certType: 'FIPS 140-3',
        certId: '4567',
        certVendor: 'Test',
        certProduct: 'TestLib',
        pqcAlgorithms: 'SLH-DSA',
        certificationLevel: 'Level 1',
        status: 'Active',
        certDate: '2026-01-01',
        certLink: 'https://example.com/cert',
      },
    ]
    const algos = extractPqcAlgorithms(baseItem, certs)
    const names = algos.map((a) => a.canonical)
    expect(names).toContain('ML-KEM')
    expect(names).toContain('ML-DSA')
    expect(names).toContain('SLH-DSA')
  })

  it('returns an empty list for a product with no PQC algorithms', () => {
    const noAlgo = { ...baseItem, pqcSupport: 'No', pqcCapabilityDescription: 'Classical only' }
    expect(extractPqcAlgorithms(noAlgo, [])).toEqual([])
  })
})

describe('buildCycloneDxCbom', () => {
  it('produces a valid CycloneDX 1.6 envelope with product + crypto-asset components', () => {
    const { json, componentCount, cryptoAssetCount } = buildCycloneDxCbom([baseItem])
    const doc = JSON.parse(json)

    expect(doc.bomFormat).toBe('CycloneDX')
    expect(doc.specVersion).toBe('1.6')
    expect(doc.serialNumber).toMatch(/^urn:uuid:/)
    expect(componentCount).toBe(1)
    // ML-KEM + ML-DSA → 2 crypto-asset components
    expect(cryptoAssetCount).toBe(2)

    const lib = doc.components.find((c: { type: string }) => c.type === 'library')
    expect(lib.name).toBe('TestLib')
    expect(lib['bom-ref']).toBe('pkg:testlib')

    const cryptoAssets = doc.components.filter(
      (c: { type: string }) => c.type === 'cryptographic-asset'
    )
    expect(cryptoAssets).toHaveLength(2)
    expect(cryptoAssets[0].cryptoProperties.assetType).toBe('algorithm')
  })

  it('emits an empty components array for no products', () => {
    const { json, componentCount } = buildCycloneDxCbom([])
    const doc = JSON.parse(json)
    expect(doc.components).toEqual([])
    expect(componentCount).toBe(0)
  })
})
