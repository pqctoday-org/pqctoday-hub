// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  applyProductFacets,
  filterProducts,
  NO_FACETS,
  searchProducts,
  resolveProductLink,
  productLinkNoticeMessage,
  resolveDomainRef,
  resolveTaxonomyRef,
  resolveVendorRef,
  resolveMigrateLink,
  migrateLinkKey,
  productsForDomain,
  vendorHasRoadmapCard,
  type ProductFacets,
} from './workbenchCatalog'
import type { SoftwareItem } from '../../../types/MigrateTypes'
import { softwareData, vendorMap, retiredProductSuccessors } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'

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

describe('resolveProductLink (deep-link remediation PR 1)', () => {
  const real = softwareData.find((p) => p.productId && p.softwareName)!
  const renamed = softwareData.find((p) => (p.formerNames ?? []).length > 0)

  it('resolves by product_id, by exact name in any case, and de-duplicates', () => {
    const res = resolveProductLink(real.softwareName.toUpperCase(), real.productId)
    expect(res.products.map((p) => p.productId)).toEqual([real.productId])
    expect(res.missing).toEqual([])
    expect(productLinkNoticeMessage(res)).toBeNull()
  })

  it('never splits ?product= on commas; splits ?productIds= on commas', () => {
    const res = resolveProductLink('a, b', `${real.productId}, nope-1`)
    expect(res.missing).toEqual(['a, b', 'nope-1'])
    expect(res.products).toHaveLength(1)
    expect(productLinkNoticeMessage(res)).toMatch(/2 linked products/)
  })

  it('reports unknown tokens with a not-found message', () => {
    const res = resolveProductLink('no-such-product-xyz', null)
    expect(res.products).toEqual([])
    expect(productLinkNoticeMessage(res)).toMatch(/No product matching “no-such-product-xyz”/)
  })

  it('a former name resolves to its successor and says so', () => {
    if (!renamed) return // catalog currently has no former names
    const former = renamed.formerNames![0]
    const res = resolveProductLink(former, null)
    expect(res.products[0].productId).toBe(renamed.productId)
    expect(productLinkNoticeMessage(res)).toContain(renamed.softwareName)
  })

  it('does not substring-match (a prefix of a name is not a hit)', () => {
    const res = resolveProductLink(real.softwareName.slice(0, 3), null)
    expect(res.products.every((p) => p.softwareName.length === 3 || p.productId.length === 3)).toBe(
      true
    )
  })
})

describe('retired product ids (deep-link PR 2)', () => {
  const [retiredId, successorId] = [...retiredProductSuccessors][0] ?? []

  it('maps retired ids only to active successors, never to an active id', () => {
    const active = new Set(softwareData.map((p) => p.productId.toLowerCase()))
    expect(retiredProductSuccessors.size).toBeGreaterThan(0)
    for (const [retired, successor] of retiredProductSuccessors) {
      expect(active.has(retired)).toBe(false)
      expect(softwareData.some((p) => p.productId === successor)).toBe(true)
    }
  })

  it('a retired id resolves to its successor with a "replaced by" notice', () => {
    const res = resolveProductLink(retiredId, null)
    expect(res.products.map((p) => p.productId)).toEqual([successorId])
    const successor = softwareData.find((p) => p.productId === successorId)!
    expect(productLinkNoticeMessage(res)).toBe(
      `“${retiredId}” was retired from the catalog — replaced by ${successor.softwareName}.`
    )
  })
})

describe('migrate link params (deep-link PR 2)', () => {
  const link = (o: Record<string, string>) =>
    resolveMigrateLink((k) => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : null))
  const [tls] = productsForDomain('tls')
  const [hsmA, hsmB] = productsForDomain('hsm')
  const roadmapVendorId = [...roadmapByVendorId.keys()][0]
  const roadmapVendorName = roadmapByVendorId.get(roadmapVendorId)![0].vendorName

  it('resolveDomainRef accepts a domain id or label in any case, else null', () => {
    expect(resolveDomainRef('HSM')).toBe('hsm')
    expect(resolveDomainRef('crypto libraries & frameworks')).toBe('foundations')
    expect(resolveDomainRef('not-a-domain')).toBeNull()
  })

  it('resolveTaxonomyRef maps layers, category names and domain ids', () => {
    expect(resolveTaxonomyRef('hsm')).toBe('hsm')
    expect(resolveTaxonomyRef('Libraries')).toBe('foundations')
    expect(resolveTaxonomyRef('Hardware')).toBe('hardware')
    // mixed layer with no majority → migrationAssets' curated layer fallback
    expect(resolveTaxonomyRef('AppServers')).toBe('platform')
    expect(resolveTaxonomyRef('Hardware Security Modules')).toBe('hsm')
    expect(resolveTaxonomyRef('Cryptographic Discovery Platforms')).toBe('discovery')
    expect(resolveTaxonomyRef('SASE & Zero Trust')).toBe('network')
    expect(resolveTaxonomyRef('zzz-nope')).toBeNull()
  })

  it('resolveVendorRef accepts a VND id or a vendor name, any case', () => {
    expect(resolveVendorRef(roadmapVendorId.toLowerCase())).toBe(roadmapVendorId)
    expect(resolveVendorRef(roadmapVendorName.toUpperCase())).toBe(roadmapVendorId)
    expect(resolveVendorRef('no such vendor zz')).toBeNull()
  })

  it('?q= naming one product behaves like ?product= (all three aliases)', () => {
    for (const k of ['q', 'search', 'highlight']) {
      const r = link({ [k]: tls.softwareName })
      expect(r).toMatchObject({ tab: 'replace', domain: 'tls', expandId: tls.productId })
      expect(r.productIds).toEqual([tls.productId])
      expect(r.notice).toBeNull()
    }
  })

  it('?q= free text picks the domain with the most matches and pre-fills the filter', () => {
    const r = link({ q: 'IBM' })
    expect(r.tab).toBe('replace')
    expect(r.filter).toBe('IBM')
    expect(r.domain).toBeTruthy()
    expect(r.expandId).toBeUndefined()
  })

  it('?q= plus a taxonomy param uses the taxonomy domain and the text as filter', () => {
    expect(link({ layer: 'Hardware', q: 'Thales' })).toMatchObject({
      tab: 'replace',
      domain: 'hardware',
      filter: 'Thales',
      notice: null,
    })
  })

  it('?layer= / ?cat= / ?category= / ?subcat= each land on Replace with a domain', () => {
    expect(link({ layer: 'hsm' })).toMatchObject({ tab: 'replace', domain: 'hsm' })
    expect(link({ cat: 'SASE & Zero Trust' })).toMatchObject({ domain: 'network' })
    expect(link({ category: 'Hardware Security Modules' })).toMatchObject({ domain: 'hsm' })
    expect(link({ subcat: 'Libraries' })).toMatchObject({ domain: 'foundations' })
  })

  it('unknown values give a not-found notice, never a silent TLS default', () => {
    const tax = link({ layer: 'zzz-nope' })
    expect(tax.domain).toBeUndefined()
    expect(tax.notice).toMatch(/zzz-nope/)
    const q = link({ q: 'zzqqxx-no-match' })
    expect(q.domain).toBeUndefined()
    expect(q.notice).toMatch(/zzqqxx-no-match/)
    expect(link({ domain: 'bogus' }).notice).toMatch(/bogus/)
  })

  it('?domain= alone lands on Replace, not on the tab the reader last used', () => {
    const r = link({ domain: 'kms' })
    expect(r.domain).toBe('kms')
    expect(r.tab).toBe('replace')
    expect(r.notice).toBeNull()
  })

  it('?domain= riding along with an explicit tab keeps that tab', () => {
    // The page writes ?domain= while the reader is on Plan/Roadmaps too; a
    // reload of such a URL must not bounce them to Replace.
    const r = link({ domain: 'kms', tab: 'plan' })
    expect(r.domain).toBe('kms')
    expect(r.tab).toBeUndefined()
  })

  it('?industry= is ignored gracefully but still lands on Replace', () => {
    expect(link({ industry: 'Finance' })).toEqual({ tab: 'replace', elsewhere: [], notice: null })
  })

  it('?vendor= opens Roadmaps for a vendor with a card; others get a notice', () => {
    expect(link({ vendor: roadmapVendorName })).toMatchObject({
      tab: 'roadmaps',
      vendorId: roadmapVendorId,
      notice: null,
    })
    expect(link({ vendor: 'no such vendor zz' })).toMatchObject({ tab: 'roadmaps' })
    expect(link({ vendor: 'no such vendor zz' }).notice).toMatch(/no such vendor zz/)
    const noCard = [...vendorMap.keys()].find((id) => !vendorHasRoadmapCard(id))
    if (noCard) {
      const r = link({ vendor: noCard })
      expect(r.vendorId).toBeUndefined()
      expect(r.notice).toMatch(/no published PQC roadmap/)
    }
  })

  it('?productIds= spanning domains keeps the first domain and groups the rest', () => {
    const r = link({ productIds: `${tls.productId},${hsmA.productId},${hsmB.productId}` })
    expect(r.domain).toBe('tls')
    expect(r.productIds).toEqual([tls.productId])
    expect(r.expandId).toBeUndefined()
    expect(r.elsewhere.map((g) => [g.domain, g.products.map((p) => p.productId)])).toEqual([
      ['hsm', [hsmA.productId, hsmB.productId]],
    ])
  })

  it('migrateLinkKey is order-independent and ignores unrelated params', () => {
    const a = new URLSearchParams('q=x&domain=tls&tab=plan')
    const b = new URLSearchParams('domain=tls&q=x&share=zz')
    expect(migrateLinkKey((k) => a.get(k))).toBe(migrateLinkKey((k) => b.get(k)))
  })
})
