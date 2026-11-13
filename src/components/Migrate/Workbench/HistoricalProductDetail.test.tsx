// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MigrationWorkbench } from './MigrationWorkbench'
import { MobileMigrateView } from '@/components/Mobile/screens/MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { softwareData, findHistoricalProductById } from '@/data/migrateData'
import {
  resolveProductRef,
  resolveProductLink,
  applyProductFacets,
  NO_FACETS,
  filterProducts,
} from './workbenchCatalog'
import { isPqcReady, pqcReadinessTier } from '@/data/kpiCatalog'

const id = 'Microsoft-Research-Post-Quantum-TLS'
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions: [], isLoading: false, error: null }),
  byRecord: () => [],
}))
// Candidate data remains unapplied. This fixture models its reviewed retirement while
// retaining real active rows, the actual lookup implementation and all consumer logic.
vi.mock('@/data/migrateData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/migrateData')>()
  const modules = import.meta.glob('@/data/pqc_product_catalog_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
  const { loadLatestCSV } = await import('@/data/csvUtils')
  type Row = Parameters<typeof actual.buildProductSnapshot>[0][number]
  const rows = loadLatestCSV<Row, Row>(
    modules,
    /catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (row) => row
  ).data
  const reviewedValues = {
    pqc_support: 'Yes (legacy research prototype; upstream OpenSSL 1.1.1 fork discontinued)',
    pqc_capability_description:
      'Historical Microsoft research project describing TLS 1.2/1.3 experiments through an OpenSSL 1.1.1 fork using liboqs, with hybrid and post-quantum key exchange and authentication. The project page names FrodoKEM, SIKE, Picnic and qTESLA as research integrations for prototyping, experimentation and evaluation, not a current production deployment recommendation.',
    product_brief:
      'Microsoft warns that SIDH and SIKE were proven insecure and must not be used in production; its SIDH library is retained for historical reasons.',
    proof_relevant_info:
      'The historical Microsoft project page describes an OpenSSL 1.1.1/liboqs prototype for TLS 1.2/1.3, hybrid and post-quantum key exchange and authentication, and experimental FrodoKEM/SIKE/Picnic/qTESLA integrations. Retain its actual 2019 publication date; upstream lifecycle and SIKE security warnings are separate primary evidence.',
    last_verified_date: '2026-11-12',
    status: 'deprecated',
    deprecated_reason:
      'Historical research prototype; upstream OQS-OpenSSL 1.1.1 development discontinued and repository archived. Retain this source record for historical study; not a current deployment option. Upstream lifecycle source: https://github.com/open-quantum-safe/openssl',
    product_brief_url: 'https://github.com/microsoft/PQCrypto-SIDH',
  }
  const snapshot = actual.buildProductSnapshot(
    rows.map((r) =>
      r.product_id === 'Microsoft-Research-Post-Quantum-TLS' ? { ...r, ...reviewedValues } : r
    )
  )
  return {
    ...actual,
    softwareData: snapshot.active,
    findHistoricalProductById: (key: string) => snapshot.historical.get(key.trim().toLowerCase()),
  }
})

beforeEach(() => {
  window.localStorage.clear()
  useMigrateSelectionStore.setState({
    myProducts: [id],
    plan: ['tls'],
    choice: { tls: ['Microsoft Research Post-Quantum TLS'] },
    nameToProductId: { 'Microsoft Research Post-Quantum TLS': id },
    tab: 'replace',
  })
})
function savedWork() {
  const { myProducts, plan, choice, nameToProductId } = useMigrateSelectionStore.getState()
  return { myProducts, plan, choice, nameToProductId }
}
describe('Retired same-ID detail is read-only, with real consumer contrast', () => {
  it('keeps active resolver, facets, search and executive readiness independent of history', () => {
    expect(findHistoricalProductById(id)).toBeDefined()
    expect(resolveProductRef(id)).toBeNull()
    expect(resolveProductLink(id, null).products).toHaveLength(0)
    expect(filterProducts(softwareData, id)).toHaveLength(0)
    expect(
      applyProductFacets(softwareData, { ...NO_FACETS, pqc: 'available' }, () => false).some(
        (p) => p.productId === id
      )
    ).toBe(false)
    const { result } = renderHook(() => useExecutiveModuleData())
    expect(result.current.myProductIds).toContain(id)
    expect(result.current.myProducts.some((p) => p.productId === id)).toBe(false)
    expect(result.current.totalProducts).toBe(softwareData.length)
    expect(result.current.pqcReadyCount).toBe(softwareData.filter(isPqcReady).length)
    expect(result.current.vendorReadinessWeighted).toBeCloseTo(
      softwareData.reduce((sum, p) => sum + pqcReadinessTier(p), 0) / softwareData.length
    )
  })
  it.each(['desktop', 'phone'])(
    'opens useful historical detail by existing product URL on %s without changing saved work',
    async (layout) => {
      const before = savedWork()
      render(
        <MemoryRouter initialEntries={[`/migrate?product=${id}`]}>
          {layout === 'desktop' ? <MigrationWorkbench /> : <MobileMigrateView />}
        </MemoryRouter>
      )
      const detail = await screen.findByRole('region', { name: 'Historical product record' })
      expect(
        within(detail).getByText('Historical record — not a current deployment option')
      ).toBeVisible()
      expect(detail).toHaveTextContent('OpenSSL 1.1.1')
      expect(detail).toHaveTextContent('2019-08-06')
      expect(detail).toHaveTextContent('SIDH and SIKE were proven insecure')
      expect(
        within(detail).getByRole('link', { name: 'Upstream lifecycle source' })
      ).toHaveAttribute('href', 'https://github.com/open-quantum-safe/openssl')
      expect(within(detail).getByRole('link', { name: /Product brief/i })).toHaveAttribute(
        'href',
        'https://github.com/microsoft/PQCrypto-SIDH'
      )
      expect(within(detail).getByRole('link', { name: /Historical source/ })).toHaveAttribute(
        'href',
        findHistoricalProductById(id)!.product.proofUrl
      )
      expect(within(detail).queryByText('Available', { exact: true })).not.toBeInTheDocument()
      expect(
        within(detail).queryByRole('button', { name: /Choose|Add|Endorse/ })
      ).not.toBeInTheDocument()
      expect(screen.queryByText(/No product matches/)).not.toBeInTheDocument()
      expect(savedWork()).toEqual(before)
      if (layout === 'desktop')
        fireEvent.click(screen.getByRole('button', { name: 'Close historical record' }))
      expect(savedWork()).toEqual(before)
    }
  )
})
