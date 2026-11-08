// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  indexPurlXrefs,
  indexRelatedResources,
  purlXrefFromRow,
  purlXrefs,
  relatedResourceByProduct,
} from './purlXrefData'
import { sameResourceAddress } from './relatedResources'

// Fixture rows in the shape of the package-identifier file. The shipped file is
// generated and may or may not carry the related-resource columns yet.
const BASE = {
  software_name: 'Fixture HSM',
  product_id: 'fixture-hsm',
  purl: '',
  purl_type: '',
  purl_namespace: '',
  purl_name: '',
  match_confidence: '',
  status: 'not_found',
  registry_url: '',
  last_verified_date: '2026-11-01',
}

describe('purlXrefFromRow related resource columns', () => {
  it('reads the address and kind, and leaves the package identifier blank', () => {
    const x = purlXrefFromRow({
      ...BASE,
      related_resource_url: 'https://github.com/Yubico/yubihsm-shell',
      related_resource_kind: 'sdk',
    })!
    expect(x.relatedResourceUrl).toBe('https://github.com/Yubico/yubihsm-shell')
    expect(x.relatedResourceKind).toBe('sdk')
    expect(x.purl).toBe('')
    expect(x.registryUrl).toBe('')
    expect(x.status).toBe('not_found')
  })

  it('reads the issue tracker kind', () => {
    expect(
      purlXrefFromRow({
        ...BASE,
        related_resource_url: 'https://github.com/FusionAuth/fusionauth-issues',
        related_resource_kind: 'issue_tracker',
      })!.relatedResourceKind
    ).toBe('issue_tracker')
  })

  it('loads a file written before the columns existed, with no related fields at all', () => {
    const x = purlXrefFromRow(BASE)!
    expect('relatedResourceUrl' in x).toBe(false)
    expect('relatedResourceKind' in x).toBe(false)
  })

  it('treats blank columns as absent', () => {
    const x = purlXrefFromRow({ ...BASE, related_resource_url: '', related_resource_kind: '' })!
    expect(x.relatedResourceUrl).toBeUndefined()
    expect(x.relatedResourceKind).toBeUndefined()
  })

  it('drops an address that is not http or https, and an unknown kind', () => {
    expect(
      purlXrefFromRow({
        ...BASE,
        related_resource_url: 'javascript:alert(1)',
        related_resource_kind: 'sdk',
      })!.relatedResourceUrl
    ).toBeUndefined()
    const x = purlXrefFromRow({
      ...BASE,
      related_resource_url: 'https://example.com/x',
      related_resource_kind: 'mailing_list',
    })!
    expect(x.relatedResourceUrl).toBe('https://example.com/x')
    expect(x.relatedResourceKind).toBeUndefined()
  })

  it('still skips a retired row', () => {
    expect(
      purlXrefFromRow({
        ...BASE,
        deprecated_at: '2026-11-01',
        related_resource_url: 'https://example.com/x',
        related_resource_kind: 'sdk',
      })
    ).toBeNull()
  })
})

describe('related resources are kept apart from the package identifier', () => {
  const withBoth = purlXrefFromRow({
    ...BASE,
    product_id: 'with-both',
    software_name: 'With Both',
    purl: 'pkg:npm/with-both',
    purl_type: 'npm',
    purl_name: 'with-both',
    status: 'matched',
    registry_url: 'https://www.npmjs.com/package/with-both',
    related_resource_url: 'https://github.com/example/with-both-tests',
    related_resource_kind: 'test_suite',
  })!
  const onlyRelated = purlXrefFromRow({
    ...BASE,
    related_resource_url: 'https://github.com/Yubico/yubihsm-shell',
    related_resource_kind: 'sdk',
  })!
  const plain = purlXrefFromRow({
    ...BASE,
    product_id: 'plain',
    software_name: 'Plain',
    purl: 'pkg:npm/plain',
    purl_type: 'npm',
    status: 'matched',
    registry_url: 'https://www.npmjs.com/package/plain',
  })!
  const rows = [withBoth, onlyRelated, plain]

  it('a related resource never becomes the package identifier or its address', () => {
    const purls = indexPurlXrefs(rows)
    expect(purls.get('fixture-hsm')?.purl).toBe('')
    expect(purls.get('fixture-hsm')?.registryUrl).toBe('')
    expect(purls.get('fixture-hsm')?.status).not.toBe('matched')
    expect(purls.get('with-both')?.purl).toBe('pkg:npm/with-both')
    expect(purls.get('with-both')?.registryUrl).toBe('https://www.npmjs.com/package/with-both')
  })

  it('a product with only a related resource still has one', () => {
    const related = indexRelatedResources(rows)
    expect(related.get('fixture-hsm')).toMatchObject({
      url: 'https://github.com/Yubico/yubihsm-shell',
      kind: 'sdk',
      kindLabel: 'SDK',
      name: 'Yubico/yubihsm-shell',
    })
    expect(related.get('Fixture HSM')).toBe(related.get('fixture-hsm'))
    expect(related.get('with-both')?.kind).toBe('test_suite')
  })

  it('a product with no related resource has none, and never borrows its registry address', () => {
    const related = indexRelatedResources(rows)
    expect(related.has('plain')).toBe(false)
    expect(related.has('Plain')).toBe(false)
  })

  it('an empty column set indexes nothing', () => {
    expect(indexRelatedResources([purlXrefFromRow(BASE)!, plain]).size).toBe(0)
  })
})

describe('related resources on the shipped file', () => {
  it('every related resource has a usable address, and none is the row own package address', () => {
    for (const x of purlXrefs) {
      if (!x.relatedResourceUrl) {
        expect(
          x.relatedResourceKind,
          `${x.softwareName}: a kind without an address`
        ).toBeUndefined()
        continue
      }
      expect(x.relatedResourceUrl).toMatch(/^https?:\/\//)
      expect(
        sameResourceAddress(x.relatedResourceUrl, x.registryUrl),
        `${x.softwareName}: the related resource is also its package identifier`
      ).toBe(false)
    }
  })

  it('the lookup holds exactly the rows that carry an address', () => {
    const withAddress = new Set(
      purlXrefs.filter((x) => x.relatedResourceUrl).flatMap((x) => [x.productId, x.softwareName])
    )
    withAddress.delete('')
    for (const key of relatedResourceByProduct.keys()) expect(withAddress.has(key)).toBe(true)
  })
})
