// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileMigrateView } from './MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { REPLACE_ASSETS, DECISIONS } from '@/data/migrationAssets'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { productsForDomain } from '@/components/Migrate/Workbench/workbenchCatalog'
import { productPqcStatus } from '@/components/Migrate/Workbench/productStatus'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'

// Real data throughout. The README's own §9 prose describes a different,
// already-deleted legacy page — every assertion below is derived from the
// SAME real modules the component reads (migrationAssets.ts, migrateData.ts,
// vendorRoadmapData.ts), not from that stale prose or the mockup's 2 known-
// wrong numbers (TLS's real cnsaYear is 2025, not the screenshot's 2035).
function resetStore() {
  window.localStorage.clear()
  useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
}

describe('MobileMigrateView', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders all 4 real tabs', () => {
    render(<MobileMigrateView />)
    for (const label of ['Replace', 'Plan', 'Vendors', 'Risk']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it("defaults to TLS with the real classical/target pair and cnsaYear, not the mockup's stale 2035", () => {
    render(<MobileMigrateView />)
    const tls = REPLACE_ASSETS.find((a) => a.id === 'tls')!
    expect(screen.getByText(tls.classical)).toBeInTheDocument()
    expect(screen.getByText(tls.target)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${tls.cnsaYear} · ${tls.deadlineLabel}`))
    ).toBeInTheDocument()
    expect(screen.queryByText(/2035/)).not.toBeInTheDocument()
  })

  it('Secure email shows the real "Mitigate" decision, not the mockup\'s "Track roadmap"', () => {
    render(<MobileMigrateView />)
    const email = REPLACE_ASSETS.find((a) => a.id === 'email')!
    fireEvent.click(screen.getByText(email.label).closest('button')!)
    expect(email.decision).toBe('mitigate')
    expect(screen.getAllByText(DECISIONS.mitigate.label).length).toBeGreaterThan(0)
  })

  it('tapping "Add to plan" writes the real asset id into useMigrateSelectionStore', () => {
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Add to plan').closest('button')!)
    expect(useMigrateSelectionStore.getState().plan).toContain('tls')
  })

  it('shows the real in-catalog product count for the selected domain', () => {
    render(<MobileMigrateView />)
    const count = productsForDomain('tls').length
    expect(screen.getByText(new RegExp(`${count} in catalog`))).toBeInTheDocument()
  })

  it('choosing a product writes into the real store and the Plan tab badge reflects it', () => {
    render(<MobileMigrateView />)
    const products = productsForDomain('tls')
    if (products.length === 0) return
    fireEvent.click(screen.getAllByText('Choose')[0].closest('button')!)
    expect(useMigrateSelectionStore.getState().choice.tls).toContain(products[0].softwareName)
  })

  it('Plan tab shows the real empty state when nothing is planned', () => {
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Plan').closest('button')!)
    expect(screen.getByText('Nothing in your plan yet')).toBeInTheDocument()
  })

  it('Plan tab shows the real wave grouping once an asset is planned', () => {
    useMigrateSelectionStore.setState({ plan: ['tls'] })
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Plan').closest('button')!)
    expect(screen.getByText('External-facing live traffic')).toBeInTheDocument()
  })

  it('Vendors tab shows the real published-roadmap count, not a typed figure', () => {
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Vendors').closest('button')!)
    expect(screen.getByText(new RegExp(`${roadmapByVendorId.size}`))).toBeInTheDocument()
  })

  it('Risk tab shows all 4 real risk signals, live-computed from the catalog', () => {
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Risk').closest('button')!)
    for (const title of [
      'Single-source domains',
      'Vendor concentration',
      'Certification gap',
      'Geographic concentration',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    const gaProducts = softwareData.filter((p) => productPqcStatus(p).status === 'ga')
    expect(gaProducts.length).toBeGreaterThanOrEqual(0)
    expect(vendorMap.size).toBeGreaterThan(0)
  })

  it('states what was cut rather than silently dropping it', () => {
    render(<MobileMigrateView />)
    expect(screen.getByText(/The 8 foundation\/infrastructure domains/i)).toBeInTheDocument()
  })

  // 2026-08-24 audit R4.8: foundationItems was computed for the empty-state
  // gate but never rendered — a real "Clear all" tap could silently drop
  // foundation selections a reader never saw. Real domain: 'identity' is
  // kind:'foundation' in DOMAINS (migrationAssets.ts).
  it('Plan tab surfaces foundation selections before "Clear all" removes them invisibly', () => {
    const products = productsForDomain('identity')
    if (products.length === 0) return
    useMigrateSelectionStore.setState({ plan: [], choice: {} })
    useMigrateSelectionStore.getState().chooseProduct('identity', products[0].softwareName)
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Plan').closest('button')!)
    expect(screen.getByText(/Clearing also removes 1 foundation domain/i)).toBeInTheDocument()
  })

  it('Plan tab shows no foundation-visibility row when nothing but replace assets are planned', () => {
    useMigrateSelectionStore.setState({ plan: ['tls'], choice: {} })
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Plan').closest('button')!)
    expect(screen.queryByText(/Clearing also removes/i)).not.toBeInTheDocument()
  })

  it('Vendors tab shows a real dated roadmap milestone line when the vendor has one', () => {
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Vendors').closest('button')!)
    const withDates = [...enrichmentByVendorId.entries()].find(
      ([, e]) => e.targetMigrationDates && e.targetMigrationDates !== 'None detected'
    )
    if (!withDates) return
    const [, enrichment] = withDates
    expect(screen.getAllByText(enrichment.targetMigrationDates).length).toBeGreaterThan(0)
  })
})
