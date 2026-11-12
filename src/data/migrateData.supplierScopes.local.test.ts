// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { softwareData, softwareMetadata, vendorMap } from '@/data/migrateData'
import { vendorMetadata } from '@/data/vendorData'
import { getTrustedSource } from '@/data/trustedSourcesData'
import { getAuthoritativeSource } from '@/data/authoritativeSourcesData'
import { getCertsForProduct } from '@/data/certificationXrefData'
import { applyProductFacets, NO_FACETS } from '@/components/Migrate/Workbench/workbenchCatalog'
import { productFipsBadge } from '@/components/Migrate/Workbench/productStatus'
import { classifyFips } from '@/utils/fipsStatus'
import { proofFreshness } from '@/components/Migrate/Workbench/proofFreshness'
import { loadLatestCSV } from '@/data/csvUtils'
const rawCatalogues = import.meta.glob('./pqc_product_catalog_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const expected = [
  {
    id: 'ankatech-ankasecure',
    vendor: 'VND-566',
    name: 'ANKATech Solutions Inc.',
    domain: 'https://www.ankatech.co',
    source: 'ankatech-solutions-inc',
  },
  {
    id: 'exequantum',
    vendor: 'VND-512',
    name: 'ExeQuantum',
    domain: 'https://exequantum.com',
    source: 'exequantum',
  },
  {
    id: 'american-binary-ambit-client',
    vendor: 'VND-359',
    name: 'American Binary',
    domain: 'https://www.ambit.inc',
    source: 'american-binary',
  },
  {
    id: 'patero-pqc-gateway',
    vendor: 'VND-567',
    name: 'Patero Inc.',
    domain: 'https://www.patero.io',
    source: 'patero-inc',
  },
] as const
function item(id: string) {
  const matches = softwareData.filter((p) => p.productId === id)
  expect(matches).toHaveLength(1)
  return matches[0]
}
const products = expected.map((x) => item(x.id))
const softwareFile = softwareMetadata?.filename,
  vendorFile = vendorMetadata?.filename
if (!softwareFile || !vendorFile) throw new Error('Expected current catalogue and vendor snapshots')
interface RawAssociation {
  product_id: string
  trusted_source_id: string
  vendor_name_original: string
}
const associationRows = loadLatestCSV<RawAssociation, RawAssociation>(
  rawCatalogues,
  /pqc_product_catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => row
).data

describe('applied four-product capability and supplier joins through current loaders', () => {
  it('loads the applied revisions and four distinct supplier identities', () => {
    expect(softwareFile).toMatch(/^pqc_product_catalog_\d{8}(?:_r\d+)?\.csv$/)
    expect(vendorFile).toMatch(/^vendors_\d{8}(?:_r\d+)?\.csv$/)
    expect(new Set(products.map((p) => p.vendorId)).size).toBe(4)
  })
  it.each(expected)('$id resolves the actual correct supplier rather than BIS/Prestige', (e) => {
    const p = item(e.id)
    expect(p.vendorId).toBe(e.vendor)
    const vendor = vendorMap.get(p.vendorId ?? '')
    expect(vendor?.vendorName).toBe(e.name)
    expect(vendor?.vendorDisplayName).toBe(e.name)
    expect(vendor?.website).toBe(e.domain)
    expect(vendor?.trustedSourceId).toBe(e.source)
    expect(vendor?.vendorName).not.toMatch(/Bank for International Settlements|Prestige Systems/)
  })
  it.each(expected.filter((x) => x.id !== 'exequantum'))(
    '$id has an official source chain eligible for Migrate',
    (e) => {
      const trusted = getTrustedSource(e.source),
        authoritative = getAuthoritativeSource(e.source)
      expect(trusted?.primaryUrl).toBe(e.domain)
      expect(authoritative?.primaryUrl).toBe(e.domain)
      expect(trusted?.migrateCsv).toBe(true)
      expect(authoritative?.migrateCsv).toBe(true)
      const raw = associationRows.find((r) => r.product_id === e.id)
      expect(raw?.trusted_source_id).toBe(e.source)
    }
  )
  it('does not leave the revised ExeQuantum vendor claim joined to PKI Consortium', () => {
    // Revised vendor claims must resolve to the vendor source, rather than a historical membership source.
    expect(associationRows.find((r) => r.product_id === 'exequantum')?.trusted_source_id).toBe(
      'exequantum'
    )
  })
  it('keeps all six current Anka algorithm families positive and the older boundary explicit', () => {
    const p = item('ankatech-ankasecure')
    for (const a of ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'FALCON', 'XMSS', 'LMS']) {
      expect(p.pqcSupport).toContain(a)
      expect(p.pqcCapabilityDescription).toContain(a)
    }
    expect(p.pqcSupport).toContain('current vendor platform')
    expect(p.pqcSupport).not.toContain('earlier-version')
    expect(p.proofRelevantInfo).toContain('earlier-version')
    expect(p.proofRelevantInfo).toContain('KEK')
    expect(p.proofRelevantInfo).toContain('outside that boundary')
    expect(classifyFips(p.fipsValidated)).toBe('none')
    expect(p.proofUrl).toBe(
      'https://bootstrap.ankatech.co/04-security/compliance/fips-140-3-boundary/'
    )
    expect(p.proofPublicationDate).toBeUndefined()
    expect(proofFreshness(p).ageMonths).toBeNull()
  })
  it('retains CipherForge operations while separating formal-subroutine and ISMS claims', () => {
    const p = item('exequantum')
    for (const s of [
      'key generation',
      'encapsulation',
      'sign/verify',
      'Jasmin',
      'REST/native',
      'not validation of every deployed build',
    ])
      expect(p.pqcCapabilityDescription).toContain(s)
    expect(p.proofRelevantInfo).toContain('management-system')
    expect(p.proofRelevantInfo).toContain('not by themselves validate')
    expect(p.proofUrl).toBe('https://www.exequantum.com/en/trust')
    expect(p.productBriefUrl).toBe('https://www.exequantum.com/en/products/cipherforge')
  })
  it('keeps the signature-free Ambit primitive profile and month-precision source date', () => {
    const p = item('american-binary-ambit-client')
    expect(p.pqcSupport).toContain('ML-KEM-1024')
    expect(p.pqcSupport).toContain('signature-free')
    expect(p.pqcCapabilityDescription).not.toContain('ML-DSA-87')
    for (const s of [
      'v2.0.0',
      'June 2026',
      'HMAC-SHA512/256',
      'HKDF-SHA512/256',
      'not as its handshake signature',
    ])
      expect(p.proofRelevantInfo).toContain(s)
    expect(p.proofPublicationDate).toBe('2026-06')
    expect(p.proofUrl).toContain('edge.ambit.inc/whitepapers/')
    const vendor = vendorMap.get(p.vendorId ?? '')!
    expect(vendor.leiCode).toBeUndefined()
    expect(vendor.gleifUrl).toBeUndefined()
    expect(vendor.leiCoverageFlag).toBe('no_lei')
  })
  it('preserves Patero useful historical OCI example with its actual scope and source', () => {
    const p = item('patero-pqc-gateway')
    for (const s of [
      'copyright 2024',
      'ARM/x86',
      'CRYSTALS-Kyber 768/1024',
      'Classic McEliece',
      'below 1 ms',
      'bandwidth 99%',
      'CPU load below 5%',
      'MTU',
      'not a fully specified measured test environment',
    ])
      expect(p.proofRelevantInfo).toContain(s)
    expect(p.pqcCapabilityDescription).toContain('industrial-control')
    expect(p.pqcCapabilityDescription).not.toMatch(/1.?2%/)
    expect(p.proofPublicationDate).toBeUndefined()
    expect(proofFreshness(p).ageMonths).toBeNull()
    expect(p.proofUrl).toBe(
      'https://www.patero.io/_files/ugd/9ad49e_a5e7b595c093446c88036cce74e58092.pdf'
    )
  })
  it('does not inherit unrelated supplier certificates or turn ISO claims into module validation', () => {
    for (const p of products) {
      expect(productFipsBadge(p)).toBeNull()
      expect(getCertsForProduct(p.productId, p.softwareName)).toHaveLength(0)
    }
    const linked = (p: (typeof products)[number]) =>
      getCertsForProduct(p.productId, p.softwareName).length > 0
    expect(
      applyProductFacets(products, { ...NO_FACETS, certified: 'linked' }, linked)
    ).toHaveLength(0)
    expect(applyProductFacets(products, { ...NO_FACETS, certified: 'none' }, linked)).toHaveLength(
      4
    )
  })
})
