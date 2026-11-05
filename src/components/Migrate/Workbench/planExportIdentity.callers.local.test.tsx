// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PlanTab } from './PlanTab'
import { computePosture } from './useMigrationPlan'
import { productsForDomain } from './workbenchCatalog'
import { MobileMigrateView } from '@/components/Mobile/screens/MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareMetadata } from '@/data/migrateData'
const blobs: Blob[] = []
beforeEach(() => {
  blobs.length = 0
  useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:sample-identity-plan'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
function renderCaller(mode: 'phone' | 'desktop') {
  const { plan, choice } = useMigrateSelectionStore.getState()
  return render(
    <MemoryRouter initialEntries={['/migrate?tab=plan']}>
      {mode === 'phone' ? (
        <MobileMigrateView />
      ) : (
        <PlanTab posture={computePosture(plan, choice)} onGoToReplace={() => {}} />
      )}
    </MemoryRouter>
  )
}
async function download() {
  fireEvent.click(screen.getByRole('button', { name: 'Export planning draft (JSON)' }))
  return JSON.parse(await blobs.at(-1)!.text())
}
function inputs() {
  const { plan, choice, nameToProductId } = useMigrateSelectionStore.getState()
  return JSON.stringify({ plan, choice, nameToProductId })
}
describe.each(['phone', 'desktop'] as const)(
  '%s planning caller exports saved identity provenance',
  (mode) => {
    it('passes a recorded ID for a fictional old label without mutating stored inputs', async () => {
      const product = productsForDomain('foundations').find(
        (row) => row.latestVersion && row.releaseDate
      )!
      expect(product).toBeDefined()
      const label = 'Fictional old sample selection label'
      useMigrateSelectionStore.setState({
        plan: ['foundations'],
        choice: { foundations: [label] },
        nameToProductId: { [label]: product.productId },
      })
      const before = inputs()
      renderCaller(mode)
      expect(screen.getByText(label)).toBeVisible()
      const doc = await download()
      expect(doc.formatVersion).toBe('1.1')
      expect(doc.sources.catalogSnapshot).toBe(softwareMetadata?.filename)
      expect(doc.items[0].selectedCatalogExamples[0]).toMatchObject({
        name: label,
        recordedProductIdHint: product.productId,
        resolutionStatus: 'recorded-id-match',
        productId: product.productId,
        catalogVersion: product.latestVersion,
        catalogReleaseDate: product.releaseDate,
      })
      expect(doc.items[0].selectedCatalogExamples[0].catalogueMetadataContext).toContain(
        'not installed or selection-time versions'
      )
      expect(inputs()).toBe(before)
    })
    it('does not export a reused name candidate as the active version for a different recorded ID', async () => {
      const [original, reused] = productsForDomain('foundations')
      expect(original.productId).not.toBe(reused.productId)
      useMigrateSelectionStore.setState({
        plan: ['foundations'],
        choice: { foundations: [reused.softwareName] },
        nameToProductId: { [reused.softwareName]: original.productId },
      })
      const before = inputs()
      renderCaller(mode)
      const doc = await download(),
        selected = doc.items[0].selectedCatalogExamples[0]
      expect(selected.resolutionStatus).toBe('identity-conflict')
      expect(selected.recordedProductIdHint).toBe(original.productId)
      expect(
        selected.currentCatalogueCandidates.byName.map(
          (candidate: { productId: string }) => candidate.productId
        )
      ).toContain(reused.productId)
      expect(
        selected.currentCatalogueCandidates.byRecordedId.map(
          (candidate: { productId: string }) => candidate.productId
        )
      ).toEqual([original.productId])
      expect(selected).not.toHaveProperty('productId')
      expect(selected).not.toHaveProperty('catalogVersion')
      expect(selected).not.toHaveProperty('catalogReleaseDate')
      expect(inputs()).toBe(before)
    })
  }
)
