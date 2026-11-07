// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildPlanCbom, type CbomProductRef } from './cbomExport'
const timestamp = '2026-01-01T00:00:00Z'
const name = 'Fictional selected label'
const original: CbomProductRef = {
  productId: 'sample-original',
  softwareName: 'Fictional renamed library',
  latestVersion: '2.0',
  releaseDate: '2026-01-02',
}
const reused: CbomProductRef = {
  productId: 'sample-new',
  softwareName: name,
  latestVersion: '9.0',
  releaseDate: '2026-02-01',
}
type Example = {
  name: string
  recordedProductIdHint?: unknown
  resolutionStatus?: string
  productId?: string
  catalogVersion?: string
  catalogReleaseDate?: string
  catalogueMetadataContext?: string
  currentCatalogueCandidates?: {
    byName: Array<{ productId: string; catalogVersion?: string }>
    byRecordedId: Array<{ productId: string; catalogVersion?: string }>
  }
}
function run(products: CbomProductRef[], capturedProductIds?: Record<string, string>) {
  const doc = buildPlanCbom({
    planIds: ['foundations'],
    choice: { foundations: [name] },
    products,
    capturedProductIds,
    timestamp,
  })
  return {
    doc,
    example: (doc.items as Array<{ selectedCatalogExamples: Example[] }>)[0]
      .selectedCatalogExamples[0],
  }
}
function expectInactive(example: Example) {
  expect(example).not.toHaveProperty('productId')
  expect(example).not.toHaveProperty('catalogVersion')
  expect(example).not.toHaveProperty('catalogReleaseDate')
}
describe('recorded identity hints are distinct from current catalogue lookup', () => {
  it('keeps the omitted-map 1.0 golden JSON and optional-undefined output exactly unchanged', () => {
    const products = [{ ...original, softwareName: name }]
    const expected = {
      format: 'pqctoday-migration-planning-draft',
      formatVersion: '1.0',
      generatedAt: timestamp,
      disclaimer:
        'Educational planning draft only. It is not a discovered inventory, CBOM, readiness assessment, product recommendation or compliance determination.',
      sources: {
        nistIr8547Status: 'Final (October 2026)',
        cnsaScope: 'CNSA 2.0 applies primarily to U.S. National Security Systems',
      },
      itemCount: 1,
      items: [
        {
          id: 'foundations',
          name: 'Crypto libraries & frameworks',
          kind: 'foundation',
          selectedCatalogExamples: [
            {
              name,
              productId: 'sample-original',
              catalogVersion: '2.0',
              catalogReleaseDate: '2026-01-02',
            },
          ],
        },
      ],
    }
    const omitted = buildPlanCbom({
      planIds: ['foundations'],
      choice: { foundations: [name] },
      products,
      timestamp,
    })
    expect(JSON.stringify(omitted)).toBe(JSON.stringify(expected))
    expect(JSON.stringify(run(products, undefined).doc)).toBe(JSON.stringify(expected))
  })
  it('preserves a renamed label and exact recorded ID while explicitly labelling metadata current, not historical', () => {
    const { doc, example } = run([original], { [name]: original.productId })
    expect(doc.formatVersion).toBe('1.1')
    expect(example).toMatchObject({
      name,
      recordedProductIdHint: 'sample-original',
      resolutionStatus: 'recorded-id-match',
      productId: 'sample-original',
      catalogVersion: '2.0',
      catalogReleaseDate: '2026-01-02',
    })
    expect(example.currentCatalogueCandidates?.byName).toEqual([])
    expect(example.currentCatalogueCandidates?.byRecordedId).toHaveLength(1)
    expect(example.catalogueMetadataContext).toContain(
      'Current supplied catalogue snapshot; not installed or selection-time versions'
    )
  })
  it('retains every current/former-name candidate without silently taking the last Map winner', () => {
    const alias = {
      productId: 'sample-alias',
      softwareName: 'Fictional other library',
      formerNames: [name],
    }
    const { example } = run([original, reused, alias], { [name]: original.productId })
    expect(example.resolutionStatus).toBe('identity-conflict')
    expect(example.recordedProductIdHint).toBe('sample-original')
    expect(
      example.currentCatalogueCandidates?.byName.map((candidate) => candidate.productId)
    ).toEqual(['sample-new', 'sample-alias'])
    expect(
      example.currentCatalogueCandidates?.byRecordedId.map((candidate) => candidate.productId)
    ).toEqual(['sample-original'])
    expectInactive(example)
  })
  it('keeps a missing recorded target unresolved even if its old label now belongs to a current product', () => {
    const { example } = run([reused], { [name]: original.productId })
    expect(example.resolutionStatus).toBe('recorded-id-unresolved')
    expect(example.recordedProductIdHint).toBe('sample-original')
    expect(example.currentCatalogueCandidates?.byName[0].productId).toBe('sample-new')
    expect(example.currentCatalogueCandidates?.byRecordedId).toEqual([])
    expectInactive(example)
  })
  it('distinguishes missing, empty and invalid raw hints without inferring active identity from name', () => {
    const missing = run([reused], {}).example
    const empty = run([reused], { [name]: '' }).example
    const invalid = run([reused], { [name]: null } as unknown as Record<string, string>).example
    expect(missing.resolutionStatus).toBe('recorded-id-missing')
    expect(missing).not.toHaveProperty('recordedProductIdHint')
    expect(empty).toMatchObject({
      resolutionStatus: 'recorded-id-empty',
      recordedProductIdHint: '',
    })
    expect(invalid).toMatchObject({
      resolutionStatus: 'recorded-id-invalid',
      recordedProductIdHint: null,
    })
    for (const example of [missing, empty, invalid]) {
      expect(example.currentCatalogueCandidates?.byName[0].productId).toBe('sample-new')
      expectInactive(example)
    }
  })
  it('does not silently choose one of multiple rows for the same recorded ID', () => {
    const { example } = run([original, { ...original, latestVersion: '3.0' }], {
      [name]: original.productId,
    })
    expect(example.resolutionStatus).toBe('identity-conflict')
    expect(
      example.currentCatalogueCandidates?.byRecordedId.map((candidate) => candidate.catalogVersion)
    ).toEqual(['2.0', '3.0'])
    expectInactive(example)
  })
  it('preserves selected scope, unknown versions and all original input/cache bytes', () => {
    const products = [
      {
        productId: 'sample-original',
        softwareName: 'Fictional current label',
        formerNames: [name],
      },
    ]
    const input = {
      planIds: ['foundations'],
      choice: { foundations: [name], identity: ['Fictional unselected choice'] },
      products,
      capturedProductIds: { [name]: 'sample-original' },
      timestamp,
    }
    const before = JSON.stringify(input)
    const doc = buildPlanCbom(input)
    const example = (doc.items as Array<{ selectedCatalogExamples: Example[] }>)[0]
      .selectedCatalogExamples[0]
    expect(example.resolutionStatus).toBe('recorded-id-match')
    expect(example.productId).toBe('sample-original')
    expect(example).not.toHaveProperty('catalogVersion')
    expect(example).not.toHaveProperty('catalogReleaseDate')
    expect(JSON.stringify(doc)).not.toContain('Fictional unselected choice')
    expect(doc.itemCount).toBe(1)
    expect(JSON.stringify(input)).toBe(before)
  })
})
