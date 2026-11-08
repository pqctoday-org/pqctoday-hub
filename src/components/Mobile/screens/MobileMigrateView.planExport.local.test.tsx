// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMigrateView } from './MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData, softwareMetadata } from '@/data/migrateData'
import { productsForDomain } from '@/components/Migrate/Workbench/workbenchCatalog'
import { buildPlanCbom } from '@/components/Migrate/Workbench/cbomExport'

const blobs: Blob[] = []
beforeEach(() => {
  blobs.length = 0
  useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:sample-plan'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
const renderPlan = () =>
  render(
    <MemoryRouter initialEntries={['/migrate?tab=plan']}>
      <MobileMigrateView />
    </MemoryRouter>
  )
async function download() {
  fireEvent.click(screen.getByRole('button', { name: 'Export planning draft (JSON)' }))
  return JSON.parse(await blobs.at(-1)!.text())
}
const sample = () => {
  const product = productsForDomain('foundations').find(
    (product) => product.latestVersion && product.releaseDate
  )
  expect(product).toBeDefined()
  return product!
}
describe('phone planning draft preserves its selected input scope', () => {
  it('downloads the visible foundation-only selection with recorded catalogue ID, version, release and snapshot', async () => {
    const product = sample()
    useMigrateSelectionStore.getState().chooseProduct('foundations', product.softwareName)
    renderPlan()
    expect(screen.getByText(product.softwareName)).toBeVisible()
    const doc = await download()
    expect(doc.format).toBe('pqctoday-migration-planning-draft')
    expect(doc.formatVersion).toBe('1.1')
    expect(doc.itemCount).toBe(1)
    expect(doc.items[0]).toMatchObject({
      id: 'foundations',
      kind: 'foundation',
      selectedCatalogExamples: [
        {
          name: product.softwareName,
          productId: product.productId,
          catalogVersion: product.latestVersion,
          catalogReleaseDate: product.releaseDate,
        },
      ],
    })
    expect(doc.sources.catalogSnapshot).toBe(softwareMetadata?.filename)
    expect(doc.disclaimer).toContain('not a discovered inventory, CBOM')
    expect(doc).not.toHaveProperty('bomFormat')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:sample-plan')
  })
  it('keeps mixed selected domains and unknown names, excluding unselected choice keys, using the desktop export contract', async () => {
    const product = sample(),
      plan = ['tls', 'foundations']
    const choice = {
      tls: ['Fictional unresolved TLS selection'],
      foundations: [product.softwareName, 'Fictional removed library'],
      identity: ['Fictional unselected identity choice'],
    }
    useMigrateSelectionStore.setState({ plan, choice })
    renderPlan()
    expect(screen.getByText('Fictional removed library')).toBeVisible()
    const doc = await download()
    expect(doc.items.map((item: { id: string }) => item.id)).toEqual(['tls', 'foundations'])
    expect(doc.items[0].selectedCatalogExamples).toMatchObject([
      { name: 'Fictional unresolved TLS selection' },
    ])
    expect(doc.items[1].selectedCatalogExamples[1]).toMatchObject({
      name: 'Fictional removed library',
    })
    expect(JSON.stringify(doc)).not.toContain('Fictional unselected identity choice')
    const desktop = buildPlanCbom({
      planIds: plan,
      choice,
      products: softwareData,
      catalogSnapshot: softwareMetadata?.filename,
      timestamp: doc.generatedAt,
      capturedProductIds: useMigrateSelectionStore.getState().nameToProductId,
    })
    expect(doc).toEqual(desktop)
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('Nothing in your plan yet')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Export planning draft (JSON)' })
    ).not.toBeInTheDocument()
  })
  it('retains the existing former-name lookup and missing-version unknowns without inventing evidence', () => {
    const doc = buildPlanCbom({
      planIds: ['foundations'],
      choice: { foundations: ['Fictional former name', 'Fictional missing product'] },
      timestamp: '2026-01-01T00:00:00Z',
      products: [
        {
          softwareName: 'Fictional current name',
          formerNames: ['Fictional former name'],
          productId: 'fictional-identity-1',
        },
      ],
    })
    const items = doc.items as Array<{ selectedCatalogExamples: unknown[] }>
    expect(items[0].selectedCatalogExamples).toEqual([
      { name: 'Fictional former name', productId: 'fictional-identity-1' },
      { name: 'Fictional missing product' },
    ])
    expect(JSON.stringify(doc)).not.toContain('catalogVersion')
    expect(JSON.stringify(doc)).not.toContain('catalogReleaseDate')
  })
})
