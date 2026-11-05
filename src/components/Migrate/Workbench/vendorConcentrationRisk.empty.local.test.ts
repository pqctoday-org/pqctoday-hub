// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVendorConcentrationRisks } from './vendorConcentrationRisk'
type Item = { productId: string; vendorId: string; available?: boolean; fips: boolean }
const scope = vi.hoisted(() => ({
  items: [] as Item[],
  assets: [] as { id: string; label: string }[],
  domains: {} as Record<string, Item[]>,
  selected: [] as string[],
  vendors: new Map(),
}))
vi.mock('@/data/migrateData', () => ({ softwareData: scope.items, vendorMap: scope.vendors }))
vi.mock('@/data/migrationAssets', () => ({ REPLACE_ASSETS: scope.assets }))
vi.mock('@/store/useMigrateSelectionStore', () => ({ useSelectedProductIds: () => scope.selected }))
vi.mock('./workbenchCatalog', () => ({
  productsForDomain: (id: string) => scope.domains[id] ?? [],
}))
vi.mock('./productStatus', () => ({
  productPqcStatus: (item: Item) => ({
    status: item.available === true ? 'ga' : item.available === false ? 'none' : 'unknown',
  }),
  productFipsBadge: (item: Item) => (item.fips ? { label: 'FIPS sample record' } : null),
}))
const item = (productId: string, available = true, fips = true): Item => ({
  productId,
  vendorId: 'sample-vendor',
  available,
  fips,
})
const cards = () => renderHook(() => useVendorConcentrationRisks()).result.current
const card = (key: string) => cards().find((value) => value.key === key)!
beforeEach(() => {
  scope.items.splice(0)
  scope.assets.splice(
    0,
    scope.assets.length,
    { id: 'a', label: 'Portal connection' },
    { id: 'b', label: 'Records service' }
  )
  scope.domains = {}
  scope.selected = []
  scope.vendors.clear()
})
describe('catalog coverage with no eligible denominator', () => {
  it('does not turn an empty catalog into universal coverage or validation', () => {
    const result = cards(),
      coverage = result.find((x) => x.key === 'single-source')!,
      fips = result.find((x) => x.key === 'cert-gap')!
    expect(coverage.headline).toBe('No data')
    expect(coverage.detail).toContain('coverage has not been established')
    expect(fips.headline).toBe('Not assessed')
    expect(fips.detail).toContain('no available catalog products are recorded')
    expect(result.map((x) => x.detail).join(' ')).not.toMatch(/Every mapped domain|Every available/)
  })
  it('does not borrow catalog records for an unmatched selection', () => {
    const existing = item('catalog-only')
    scope.items.push(existing)
    scope.domains = { a: [existing], b: [existing] }
    scope.selected = ['not-recorded']
    expect(card('single-source').headline).toBe('No data')
    expect(card('cert-gap').headline).toBe('Not assessed')
    expect(card('cert-gap').detail).toContain('selected products')
  })
  it('keeps unknown PQC evidence distinct from a confirmed no-PQC input', () => {
    scope.items.push({ ...item('unknown'), available: undefined })
    const unknown = card('cert-gap')
    expect(unknown.headline).toBe('Not assessed')
    expect(unknown.detail).not.toContain('No PQC')
    scope.items.splice(0, 1, item('known-none', false))
    expect(card('cert-gap').headline).toBe('Not assessed')
    expect(scope.items[0].available).toBe(false)
  })
  it('handles an undefined domain set without claiming every domain is covered', () => {
    scope.assets.splice(0)
    scope.items.push(item('known-product'))
    expect(card('single-source')).toMatchObject({
      headline: 'No data',
      detail: 'No domains are defined for catalog coverage; coverage is not assessed.',
    })
    expect(card('cert-gap').headline).toBe('0%')
  })
  it('reports the uncovered domain alongside a domain with multiple recorded products', () => {
    const a = item('first'),
      b = item('second')
    scope.items.push(a, b)
    scope.domains = { a: [a, b], b: [] }
    expect(card('single-source').detail).toContain(
      'No available catalog product is recorded for: Records service.'
    )
    expect(card('single-source').detail).not.toContain('Every mapped domain')
  })
  it('keeps single-source coverage and missing coverage visible together', () => {
    const a = item('first')
    scope.items.push(a)
    scope.domains = { a: [a], b: [] }
    expect(card('single-source')).toMatchObject({ headline: '1 of 2', severe: true })
    expect(card('single-source').detail).toContain(
      'Only one available catalog product is currently mapped to: Portal connection.'
    )
    expect(card('single-source').detail).toContain('Records service')
  })
  it('preserves the complete nonempty coverage and validation result', () => {
    const a = item('first'),
      b = item('second')
    scope.items.push(a, b)
    scope.domains = { a: [a, b], b: [a, b] }
    expect(card('single-source')).toMatchObject({
      headline: '0 of 2',
      detail: 'Every mapped domain has more than one available catalog product recorded.',
      severe: false,
    })
    expect(card('cert-gap')).toMatchObject({
      headline: '0%',
      detail: 'Every available catalog product has a linked FIPS 140-3 validation record.',
      severe: false,
    })
  })
  it('preserves nonempty certification-gap arithmetic and its threshold', () => {
    scope.items.push(item('has-record'), item('no-record', true, false))
    const result = card('cert-gap')
    expect(result.headline).toBe('50%')
    expect(result.detail).toContain('1 of 2')
    expect(result.severe).toBe(true)
  })
})
