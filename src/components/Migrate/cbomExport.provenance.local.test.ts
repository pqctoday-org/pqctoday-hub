// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CertificationXref, CpeXref, PurlXref, SoftwareItem } from '@/types/MigrateTypes'
import { buildCycloneDxCbom, extractPqcAlgorithms, softwareItemToCbomInput } from './cbomExport'

const sources = vi.hoisted(() => ({
  cpe: new Map<string, CpeXref>(),
  purl: new Map<string, PurlXref>(),
  certs: new Map<string, CertificationXref[]>(),
}))
vi.mock('@/data/cpeXrefData', () => ({
  cpeByProduct: sources.cpe,
  cpeXrefMetadata: { filename: 'sample-cpe.csv', lastUpdate: new Date('2026-01-02Z') },
}))
vi.mock('@/data/purlXrefData', () => ({
  purlByProduct: sources.purl,
  purlXrefMetadata: null,
}))
vi.mock('@/data/certificationXrefData', () => ({
  certsByProduct: sources.certs,
  xrefMetadata: { filename: 'sample-certs.csv', lastUpdate: new Date('2026-01-03Z') },
  getCertsForProduct: (id: string, name: string) =>
    sources.certs.get(id) ?? sources.certs.get(name) ?? [],
}))

// Deliberately fictional catalogue records, never vendor validation evidence.
const item = {
  productId: 'sample-id',
  softwareName: 'Sample "library", 雪\nline',
  latestVersion: 'catalogue-2',
  pqcSupport: 'ML-KEM',
  pqcCapabilityDescription: 'ML-DSA',
} as SoftwareItem
const cpe: CpeXref = Object.freeze({
  productId: item.productId,
  softwareName: item.softwareName,
  cpeUri: 'cpe:2.3:a:sample:family:*:*:*:*:*:*:*:*',
  cpeVendor: 'sample',
  cpeProduct: 'family',
  matchConfidence: 'partial',
  status: 'partial',
  nvdUrl: 'https://example.invalid/sample',
  lastVerifiedDate: '2025-12-01',
})
const purl: PurlXref = Object.freeze({
  productId: '',
  softwareName: item.softwareName,
  purl: '',
  purlType: '',
  purlNamespace: '',
  purlName: '',
  matchConfidence: '',
  status: 'not_found',
  registryUrl: '',
  lastVerifiedDate: '',
})
const cert = (extra: Partial<CertificationXref>): CertificationXref =>
  Object.freeze({
    productId: item.productId,
    softwareName: item.softwareName,
    certType: 'FIPS 140-3',
    certId: 'same-id',
    certVendor: 'Sample',
    certProduct: 'Sample module "A", 雪\nconfig',
    pqcAlgorithms: 'No PQC mechanisms detected',
    certificationLevel: 'sample level',
    status: 'Active',
    certDate: '2025-11-01',
    certLink: '',
    classicalOnly: true,
    ...extra,
  })
const property = (input: ReturnType<typeof softwareItemToCbomInput>, name: string) =>
  JSON.parse(input.properties!.find((p) => p.name === `pqctoday:${name}`)!.value)

beforeEach(() => {
  sources.cpe.clear()
  sources.purl.clear()
  sources.certs.clear()
})
describe('catalogue CBOM source association preservation', () => {
  it('retains partial/blank qualifiers and per-certificate scope without source mutation', () => {
    const records = Object.freeze([
      cert({}),
      cert({ certType: 'ACVP', classicalOnly: false, pqcAlgorithms: 'ML-DSA' }),
      cert({ certType: 'ACVP', classicalOnly: false, pqcAlgorithms: 'ML-DSA' }),
    ])
    sources.cpe.set(item.productId, cpe)
    sources.purl.set(item.softwareName, purl)
    sources.certs.set(item.productId, records as unknown as CertificationXref[])
    const before = JSON.stringify({ cpe, purl, records, item })
    const input = softwareItemToCbomInput(item, [{ name: 'cswp39:assetClass', value: 'sample' }])
    expect(input.cpe).toBe(cpe.cpeUri)
    expect(input.purl).toBe('')
    expect(property(input, 'cpeAssociation')).toEqual({
      recordPresent: true,
      lookupBasis: 'product-id',
      record: cpe,
      sourceFile: { filename: 'sample-cpe.csv', fileDate: '2026-01-02T00:00:00.000Z' },
    })
    expect(property(input, 'purlAssociation')).toEqual({
      recordPresent: true,
      lookupBasis: 'legacy-name',
      record: purl,
      sourceFile: null,
    })
    expect(property(input, 'certificateAssociations')).toEqual({
      lookupBasis: 'product-id',
      records,
      sourceFile: { filename: 'sample-certs.csv', fileDate: '2026-01-03T00:00:00.000Z' },
    })
    expect(property(input, 'certificateAssociations').records).toHaveLength(3)
    expect(input.algorithms).toEqual(extractPqcAlgorithms(item, [...records]))
    expect(input.properties).toContainEqual({ name: 'cswp39:assetClass', value: 'sample' })
    expect(property(input, 'catalogueRecord').basis).toBe(
      'catalogue-record-not-installed-observation'
    )
    expect(JSON.stringify({ cpe, purl, records, item })).toBe(before)
  })

  it('preserves manual nonempty PURL and exact source strings independently of native identifiers', () => {
    const manual = Object.freeze({
      ...purl,
      status: 'matched' as const,
      matchConfidence: 'manual' as const,
      purl: 'pkg:generic/sample@2',
      registryUrl: 'https://example.invalid/registry',
      lastVerifiedDate: '2025-10-02',
    })
    sources.purl.set(item.productId, manual)
    const input = softwareItemToCbomInput(item)
    expect(input.purl).toBe('pkg:generic/sample@2')
    expect(property(input, 'purlAssociation')).toEqual({
      recordPresent: true,
      lookupBasis: 'product-id',
      record: manual,
      sourceFile: null,
    })
  })

  it('preserves stable-ID preference, exact selected scope/order and missing versus blank associations', () => {
    sources.cpe.set(item.productId, cpe)
    sources.cpe.set(item.softwareName, { ...cpe, cpeUri: 'different-name-candidate' })
    sources.certs.set(item.softwareName, [cert({})])
    const missing = { ...item, productId: 'unassociated', softwareName: 'Missing' }
    const doc = JSON.parse(buildCycloneDxCbom([missing, item]).json)
    const parents = doc.components.filter((c: { type: string }) => c.type === 'library')
    expect(parents.map((p: { 'bom-ref': string }) => p['bom-ref'])).toEqual([
      'pkg:unassociated',
      'pkg:sample-id',
    ])
    expect(parents[1].cpe).toBe(cpe.cpeUri)
    const missingInput = softwareItemToCbomInput(missing)
    expect(property(missingInput, 'cpeAssociation').record).toBeNull()
    expect(property(missingInput, 'purlAssociation').recordPresent).toBe(false)
    expect(property(missingInput, 'certificateAssociations').records).toEqual([])
    expect(property(softwareItemToCbomInput(item), 'certificateAssociations').lookupBasis).toBe(
      'legacy-name'
    )
    expect(doc.components.every((c: { evidence?: unknown }) => !c.evidence)).toBe(true)
  })
})
