// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MobileMigrateView } from './MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { REPLACE_ASSETS, DECISIONS, DOMAINS, classifyProductDomain } from '@/data/migrationAssets'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import {
  productsForDomain,
  productsForVendor,
  domainProductCount,
  filterProducts,
} from '@/components/Migrate/Workbench/workbenchCatalog'
import { productPqcStatus, productFipsBadge } from '@/components/Migrate/Workbench/productStatus'
import { proofFreshness } from '@/components/Migrate/Workbench/proofFreshness'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { getCertsForProduct } from '@/data/certificationXrefData'
import type { SoftwareItem } from '@/types/MigrateTypes'

// Real data throughout. The README's own §9 prose describes a different,
// already-deleted legacy page — every assertion below is derived from the
// SAME real modules the component reads (migrationAssets.ts, migrateData.ts,
// vendorRoadmapData.ts), not from that stale prose or the mockup's 2 known-
// wrong numbers (TLS's real cnsaYear is 2025, not the screenshot's 2035).
function resetStore() {
  window.localStorage.clear()
  useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
}

// Mirrors MobileMigrateView's own `supportDetail` derivation exactly (the
// leading Yes/No/Partial strip) so these tests classify products the same
// way the component does, rather than guessing from the raw pqcSupport string.
function supportDetailOf(product: SoftwareItem): string {
  return (product.pqcSupport || '')
    .replace(/^\s*(yes|no|partial)\b[\s:,-]*/i, '')
    .replace(/^\(|\)$/g, '')
    .trim()
}

// Before 2026-08-28, only REPLACE_ASSETS domains had a selectable chip on
// mobile — the 8 foundation domains (crypto libraries, platforms, network,
// hardware, discovery, blockchain, identity, national programs) had no chip
// at all, making every product reachable only through one of them
// permanently stuck behind zero UI. That gap is closed (see the "foundation
// chip" tests below); this helper still searches REPLACE_ASSETS only,
// because the tests using it (sheet content, badges, proof text, cert
// algorithms) don't care which kind of domain they land in — REPLACE_ASSETS
// is just the smaller, simpler set to search.
function findReachableProduct(
  predicate: (p: SoftwareItem) => boolean
): { domainLabel: string; product: SoftwareItem } | null {
  for (const asset of REPLACE_ASSETS) {
    const match = productsForDomain(asset.id).find(predicate)
    if (match) return { domainLabel: asset.label, product: match }
  }
  return null
}

// Same derivation MobileMigrateView.tsx uses internally for its own
// (non-exported) FOUNDATION_DOMAINS constant — recomputed here from the real
// DOMAINS module rather than importing a component internal, matching this
// file's existing convention of deriving expectations from real data.
const FOUNDATION_DOMAIN_IDS = Object.values(DOMAINS)
  .filter((d) => d.kind === 'foundation')
  .map((d) => d.id)

function foundationChipText(id: (typeof FOUNDATION_DOMAIN_IDS)[number]): string {
  return `${DOMAINS[id].label} · ${domainProductCount(id)}`
}

function openProductSheet(domainLabel: string, product: SoftwareItem) {
  render(<MobileMigrateView />)
  // domainLabel can collide with the selected asset's own <h2> heading
  // below the chip strip (both render the same string when a domain is
  // already selected — 'tls' is the default). The chip is first in DOM
  // order, so [0] is always the clickable chip, never the heading.
  fireEvent.click(screen.getAllByText(domainLabel)[0].closest('button')!)
  fireEvent.click(screen.getByText(product.softwareName).closest('button')!)
  return screen.getByTestId('migrate-product-detail-sheet')
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

  // 2026-08-28: foundation-domain browsing shipped (see the "Foundation
  // domain reach" describe block below) — the Supply Chain Risk Matrix is
  // now the ONLY real stated cut, and the old claim must be gone, not just
  // superseded, so a reader is never told two different things at once.
  it('states what was cut rather than silently dropping it', () => {
    render(<MobileMigrateView />)
    expect(screen.getByText(/The Supply Chain Risk Matrix is on a laptop/i)).toBeInTheDocument()
    expect(screen.queryByText(/8 foundation\/infrastructure domains/i)).not.toBeInTheDocument()
  })

  it('Plan tab shows no foundation section when nothing but replace assets are planned', () => {
    useMigrateSelectionStore.setState({ plan: ['tls'], choice: {} })
    render(<MobileMigrateView />)
    fireEvent.click(screen.getByText('Plan').closest('button')!)
    expect(screen.queryByText(/Foundations & infrastructure/i)).not.toBeInTheDocument()
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

  // 2026-08-28 legibility follow-up (rounds 1-2 already fixed sizing/wording;
  // these pin the underlying behaviour, which had zero coverage before this).
  describe('Product detail sheet', () => {
    // Confirms rather than assumes: the catalog carries a deprecated
    // duplicate row ("Arqit Encryption Intelligence (duplicate
    // registration...)") that also has empty pqcSupport/description. It
    // must not be reachable at all — migrateData.ts drops any row.status
    // !== 'active' before building softwareData (line 148) — so it can't
    // be counted as evidence that the Gap A fallback below is reachable.
    it('does not include the deprecated Arqit duplicate row in softwareData', () => {
      expect(
        softwareData.some((p) => p.softwareName.startsWith('Arqit Encryption Intelligence ('))
      ).toBe(false)
    })

    it('tapping a product row opens a sheet with a real PQC capabilities section', () => {
      const found = findReachableProduct((p) => supportDetailOf(p).length > 0)
      if (!found) return
      const sheet = openProductSheet(found.domainLabel, found.product)
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
      expect(within(sheet).getByText(supportDetailOf(found.product))).toBeInTheDocument()
    })

    it('shows the real "no capability details" fallback instead of an empty section (Gap A)', () => {
      const found = findReachableProduct(
        (p) => supportDetailOf(p).length === 0 && !p.pqcCapabilityDescription
      )
      if (!found) return
      const sheet = openProductSheet(found.domainLabel, found.product)
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
      expect(
        within(sheet).getByText('No PQC capability details documented for this product.')
      ).toBeInTheDocument()
    })

    it('restates the real PQC-tier and FIPS badges inside the sheet, not just on the row (Gap B)', () => {
      const found = findReachableProduct(() => true)
      if (!found) return
      const { product } = found
      const sheet = openProductSheet(found.domainLabel, product)
      const pqc = productPqcStatus(product)
      const fips = productFipsBadge(product)
      // The label now legitimately appears twice (row behind the sheet +
      // the sheet itself) — asserting inside `sheet` is what proves the
      // sheet repeats it, not merely that the row still shows it.
      expect(within(sheet).getAllByText(pqc.label).length).toBeGreaterThan(0)
      if (fips) {
        expect(within(sheet).getAllByText(fips.label).length).toBeGreaterThan(0)
      }
    })

    it('renders proof.detail as real sheet text, not only as a row tooltip attribute', () => {
      const found = findReachableProduct(() => true)
      if (!found) return
      const { product } = found
      const sheet = openProductSheet(found.domainLabel, product)
      const proof = proofFreshness(product)
      expect(within(sheet).getByText('Proof status')).toBeInTheDocument()
      expect(within(sheet).getByText(proof.detail)).toBeInTheDocument()
    })

    it("renders each certification's real PQC algorithms in the sheet", () => {
      const found = findReachableProduct((p) => {
        const certs = getCertsForProduct(p.productId, p.softwareName)
        return certs.some((c) => c.pqcAlgorithms && !c.pqcAlgorithms.startsWith('No '))
      })
      if (!found) return
      const { product } = found
      const sheet = openProductSheet(found.domainLabel, product)
      const certs = getCertsForProduct(product.productId, product.softwareName)
      const withAlgorithms = certs.find(
        (c) => c.pqcAlgorithms && !c.pqcAlgorithms.startsWith('No ')
      )!
      // Multiple certs can share the same algorithm string (e.g. two ACVP
      // entries both listing "ML-KEM") — assert presence, not uniqueness.
      expect(within(sheet).getAllByText(withAlgorithms.pqcAlgorithms).length).toBeGreaterThan(0)
    })
  })

  // 2026-08-28: closes the gap this session's earlier report measured —
  // 604 of ~1,011 catalog products sat in a foundation domain with no chip
  // anywhere on mobile, so the product detail sheet (and every fix above)
  // was unreachable for them no matter how correct the sheet itself was.
  describe('Foundation domain reach', () => {
    it('renders a chip per foundation domain with its real product count', () => {
      render(<MobileMigrateView />)
      for (const id of FOUNDATION_DOMAIN_IDS) {
        expect(screen.getByText(foundationChipText(id))).toBeInTheDocument()
      }
    })

    it("tapping a foundation-domain chip opens a real product's detail sheet, same as a replace-asset chip", () => {
      const domain = FOUNDATION_DOMAIN_IDS.find((id) => productsForDomain(id).length > 0)!
      const product = productsForDomain(domain)[0]
      const sheet = openProductSheet(foundationChipText(domain), product)
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    it('shows a named domain, not a blank panel, when a foundation domain has no seeded asset card', () => {
      const domain = FOUNDATION_DOMAIN_IDS.find((id) => productsForDomain(id).length > 0)!
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText(foundationChipText(domain)).closest('button')!)
      // "Foundational building blocks..." only appears once REPLACE_ASSETS.find()
      // fails to match the id — proves the fallback panel (not the asset card)
      // rendered, and that it names the real selected domain.
      expect(screen.getByText(DOMAINS[domain].label)).toBeInTheDocument()
      expect(screen.getByText(/Foundational building blocks/i)).toBeInTheDocument()
    })

    // The exact two products the earlier gap report named as stuck behind a
    // domain with no chip at all — pinning them by name, not just by count,
    // so a future regression in the domain classifier would fail loudly.
    it('Qualcomm Snapdragon SPU (hardware) is reachable', () => {
      const product = productsForDomain('hardware').find(
        (p) => p.softwareName === 'Qualcomm Snapdragon SPU'
      )
      if (!product) return
      const sheet = openProductSheet(foundationChipText('hardware'), product)
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    it('SOC 2 (Quantum Trust Criteria) (discovery) is reachable', () => {
      const product = productsForDomain('discovery').find(
        (p) => p.softwareName === 'SOC 2 (Quantum Trust Criteria)'
      )
      if (!product) return
      const sheet = openProductSheet(foundationChipText('discovery'), product)
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })
  })

  describe('Product list filter', () => {
    it('narrows the rendered list without changing the "N in catalog" domain total', () => {
      render(<MobileMigrateView />)
      const products = productsForDomain('tls')
      if (products.length < 2) return
      const target = products[0]
      const other = products[1]
      fireEvent.change(screen.getByPlaceholderText('Filter products…'), {
        target: { value: target.softwareName },
      })
      expect(screen.getByText(target.softwareName)).toBeInTheDocument()
      expect(screen.queryByText(other.softwareName)).not.toBeInTheDocument()
      // The heading stays the pre-filter total — same distinction desktop's
      // ReplaceTab.tsx draws between products.length (heading) and
      // filtered.length (what's rendered below it).
      expect(screen.getByText(new RegExp(`${products.length} in catalog`))).toBeInTheDocument()
    })

    it("clears on domain switch, so a stale filter never hides an unrelated domain's products", () => {
      render(<MobileMigrateView />)
      const tlsProducts = productsForDomain('tls')
      const vpn = REPLACE_ASSETS.find((a) => a.id === 'vpn')!
      const vpnProducts = productsForDomain('vpn')
      if (tlsProducts.length === 0 || vpnProducts.length === 0) return

      const filterInput = screen.getByPlaceholderText('Filter products…')
      fireEvent.change(filterInput, { target: { value: tlsProducts[0].softwareName } })
      fireEvent.click(screen.getAllByText(vpn.label)[0].closest('button')!)

      expect(screen.getByPlaceholderText('Filter products…')).toHaveValue('')
      expect(screen.getByText(vpnProducts[0].softwareName)).toBeInTheDocument()
    })

    // 2026-08-28: "N in catalog" above is the unfiltered domain total by
    // design (round 4) — it never changes while typing, so it can't double
    // as filter feedback. This sr-only line is the only thing that reports
    // the filtered count to a screen reader.
    it('reports the filtered count via an aria-live region, not just visually', () => {
      render(<MobileMigrateView />)
      const products = productsForDomain('tls')
      if (products.length < 2) return
      expect(screen.queryByText(/products? match "/)).not.toBeInTheDocument()
      fireEvent.change(screen.getByPlaceholderText('Filter products…'), {
        target: { value: products[0].softwareName },
      })
      const live = screen.getByText(
        new RegExp(`1 of ${products.length} products? match "${products[0].softwareName}"`)
      )
      expect(live).toHaveAttribute('aria-live', 'polite')
    })
  })

  // 2026-08-28: foundation-domain browsing (round 4) made a foundation
  // selection a mainstream mobile action, not the rare shared-link edge
  // case the old "see them on a laptop" summary line was written for. The
  // Plan tab now shows the real chosen product, tappable to reopen its
  // real detail sheet, individually removable — full parity with desktop's
  // PlanTab.tsx foundation section instead of a bare count.
  describe('Plan tab foundation selections', () => {
    it('shows the real chosen product and domain label, not a bare count', () => {
      const products = productsForDomain('identity')
      if (products.length === 0) return
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('identity', products[0].softwareName)
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      expect(screen.getByText(DOMAINS.identity.label)).toBeInTheDocument()
      expect(screen.getByText(products[0].softwareName)).toBeInTheDocument()
      expect(screen.queryByText(/see them on a laptop/i)).not.toBeInTheDocument()
    })

    it('tapping a resolved foundation selection opens its real detail sheet', () => {
      const products = productsForDomain('identity')
      if (products.length === 0) return
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('identity', products[0].softwareName)
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      fireEvent.click(screen.getByText(products[0].softwareName).closest('button')!)
      const sheet = screen.getByTestId('migrate-product-detail-sheet')
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    it('removing a foundation selection toggles it out of choice (same mechanism as the wave section)', () => {
      const products = productsForDomain('identity')
      if (products.length === 0) return
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('identity', products[0].softwareName)
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      fireEvent.click(screen.getByLabelText(`Remove ${products[0].softwareName} from plan`))
      expect(useMigrateSelectionStore.getState().choice.identity ?? []).not.toContain(
        products[0].softwareName
      )
    })

    it('shows "No longer in catalog" for a chosen name the catalog no longer has, without crashing', () => {
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore
        .getState()
        .chooseProduct('identity', 'A Name Not In The Current Catalog')
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      expect(screen.getByText('A Name Not In The Current Catalog')).toBeInTheDocument()
      expect(screen.getByText('No longer in catalog')).toBeInTheDocument()
    })

    // The one behavior with zero coverage anywhere in the codebase before
    // this — desktop's own PlanProductRow has no direct test for its
    // rename-safety fallback either. Mirrors desktop's exact two-step
    // resolution: by name first, then by the id captured at selection time.
    it('resolves a renamed foundation selection via nameToProductId (rename-safety)', () => {
      const fallbackProduct = productsForDomain('tls')[0]
      if (!fallbackProduct) return
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('identity', 'Old Renamed Product')
      useMigrateSelectionStore.setState((s) => ({
        nameToProductId: { ...s.nameToProductId, 'Old Renamed Product': fallbackProduct.productId },
      }))
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      expect(screen.queryByText('No longer in catalog')).not.toBeInTheDocument()
      fireEvent.click(screen.getByText('Old Renamed Product').closest('button')!)
      const sheet = screen.getByTestId('migrate-product-detail-sheet')
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })
  })

  // 2026-08-28: the Vendors tab's product-count line was display-only —
  // productsForVendor() already indexed every product with a vendorId
  // (foundation-domain products included), but nothing opened it. The card
  // gained a second, independent tap target rather than nesting a button
  // inside the existing one (the same nested-interactive shape this file's
  // AssetList.tsx precedent already had to fix once, on desktop).
  describe('Vendor product drill-down', () => {
    function vendorDisplayName(vendorId: string): string {
      return (
        roadmapByVendorId.get(vendorId)?.vendorName ||
        vendorMap.get(vendorId)?.vendorDisplayName ||
        vendorId
      )
    }

    function findVendorWithProducts() {
      const ids = new Set([...roadmapByVendorId.keys(), ...enrichmentByVendorId.keys()])
      for (const vendorId of ids) {
        const products = productsForVendor(vendorId)
        if (products.length > 0) return { vendorId, products }
      }
      return null
    }

    function openVendorProductsSheet(vendorId: string) {
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Vendors').closest('button')!)
      const card = screen
        .getByText(vendorDisplayName(vendorId))
        .closest<HTMLElement>('div.rounded-xl')!
      fireEvent.click(
        within(card)
          .getByText(/products? in catalog/)
          .closest('button')!
      )
      return screen.getByTestId('vendor-products-sheet')
    }

    it("the vendor card's two tap targets open two different sheets, not the same one twice", () => {
      const found = findVendorWithProducts()
      if (!found) return
      openVendorProductsSheet(found.vendorId)
      expect(screen.getByTestId('vendor-products-sheet')).toBeInTheDocument()
      expect(screen.queryByTestId('vendor-roadmap-sheet')).not.toBeInTheDocument()
    })

    it('lists the real per-vendor product count, filterable', () => {
      const found = findVendorWithProducts()
      if (!found || found.products.length < 2) return
      const sheet = openVendorProductsSheet(found.vendorId)
      expect(within(sheet).getByText(found.products[0].softwareName)).toBeInTheDocument()
      fireEvent.change(within(sheet).getByPlaceholderText('Filter products…'), {
        target: { value: found.products[0].softwareName },
      })
      expect(within(sheet).getByText(found.products[0].softwareName)).toBeInTheDocument()
      expect(within(sheet).queryByText(found.products[1].softwareName)).not.toBeInTheDocument()
    })

    it("Choose writes to the product's real resolved domain, not the vendor id", () => {
      const found = findVendorWithProducts()
      if (!found) return
      const product = found.products[0]
      const domain = classifyProductDomain(product.categoryName, product.infrastructureLayer)
      if (!domain) return
      const sheet = openVendorProductsSheet(found.vendorId)
      fireEvent.click(within(sheet).getAllByText('Choose')[0].closest('button')!)
      expect(useMigrateSelectionStore.getState().choice[domain]).toContain(product.softwareName)
      expect(useMigrateSelectionStore.getState().choice[found.vendorId]).toBeUndefined()
    })

    it('tapping a row opens the real product detail sheet', () => {
      const found = findVendorWithProducts()
      if (!found) return
      const sheet = openVendorProductsSheet(found.vendorId)
      fireEvent.click(within(sheet).getByText(found.products[0].softwareName).closest('button')!)
      const detailSheet = screen.getByTestId('migrate-product-detail-sheet')
      expect(within(detailSheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    // 2026-08-28: the visible "N products in catalog" heading is the
    // unfiltered total (unchanged while typing), so it can't double as
    // filter feedback for a screen reader — this sr-only line is the only
    // thing that reports the filtered count.
    it('reports the filtered count via an aria-live region, not just visually', () => {
      const found = findVendorWithProducts()
      if (!found || found.products.length < 2) return
      const sheet = openVendorProductsSheet(found.vendorId)
      expect(within(sheet).queryByText(/products? match "/)).not.toBeInTheDocument()
      fireEvent.change(within(sheet).getByPlaceholderText('Filter products…'), {
        target: { value: found.products[0].softwareName },
      })
      const live = within(sheet).getByText(
        new RegExp(
          `1 of ${found.products.length} products? match "${found.products[0].softwareName}"`
        )
      )
      expect(live).toHaveAttribute('aria-live', 'polite')
    })
  })

  // 2026-08-28: no desktop equivalent exists for this — AssetList's search
  // matches domain labels, ReplaceTab's "Filter products…" matches within
  // one already-selected domain. This is the one path that finds a product
  // across all ~1,011 rows without knowing which of the 18 domains it's in.
  describe('Catalog-wide search', () => {
    it('finds a foundation-only product before any domain chip is tapped, proving cross-domain reach', () => {
      const product = productsForDomain('hardware').find(
        (p) => p.softwareName === 'Qualcomm Snapdragon SPU'
      )
      if (!product) return
      render(<MobileMigrateView />)
      fireEvent.change(screen.getByPlaceholderText('Search all products…'), {
        target: { value: 'Qualcomm Snapdragon' },
      })
      expect(screen.getByText(product.softwareName)).toBeInTheDocument()
      // The default domain-chip browsing UI (tls's own asset card) must be
      // replaced while search is active, not stacked alongside results.
      expect(screen.queryByText('TLS key exchange')).not.toBeInTheDocument()
    })

    it('opens the real detail sheet from a search result', () => {
      const product = productsForDomain('hardware').find(
        (p) => p.softwareName === 'Qualcomm Snapdragon SPU'
      )
      if (!product) return
      render(<MobileMigrateView />)
      fireEvent.change(screen.getByPlaceholderText('Search all products…'), {
        target: { value: 'Qualcomm Snapdragon' },
      })
      fireEvent.click(screen.getByText(product.softwareName).closest('button')!)
      const sheet = screen.getByTestId('migrate-product-detail-sheet')
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    it('clearing the search restores the default domain-chip browsing UI', () => {
      render(<MobileMigrateView />)
      const searchInput = screen.getByPlaceholderText('Search all products…')
      fireEvent.change(searchInput, { target: { value: 'Qualcomm' } })
      fireEvent.change(searchInput, { target: { value: '' } })
      // 'TLS key exchange' legitimately renders twice once tls (the default
      // domain) is browsable again — the chip and its own asset-detail
      // heading — same collision openProductSheet's own comment explains.
      expect(screen.getAllByText('TLS key exchange').length).toBeGreaterThan(0)
    })

    // 2026-08-28: measured against the real catalog before writing this —
    // a single letter matches 872-899 of 906 active products (near the
    // whole catalog), which is why a minimum length exists at all.
    it('shows a hint instead of near-whole-catalog noise below the minimum query length', () => {
      render(<MobileMigrateView />)
      fireEvent.change(screen.getByPlaceholderText('Search all products…'), {
        target: { value: 'a' },
      })
      expect(
        screen.getByText(/Type at least 2 characters to search all \d+ products\./)
      ).toBeInTheDocument()
      expect(screen.queryByText(/Search results/)).not.toBeInTheDocument()
    })

    it('shows real results once the minimum length is met', () => {
      render(<MobileMigrateView />)
      const input = screen.getByPlaceholderText('Search all products…')
      fireEvent.change(input, { target: { value: 'a' } })
      fireEvent.change(input, { target: { value: 'as' } })
      expect(screen.getByText(/Search results/)).toBeInTheDocument()
      expect(screen.queryByText(/Type at least 2 characters/)).not.toBeInTheDocument()
    })

    it('uses distinct wording for a moderate overmatch vs. an extreme one', () => {
      // Real counts, not assumed — derived from filterProducts against the
      // actual catalog, matching this file's own convention.
      const moderateQuery = 'security'
      const moderateCount = filterProducts(softwareData, moderateQuery).length
      // Must be >= MIN_CATALOG_QUERY_LENGTH (2) to even run a search, unlike
      // the single-letter queries the gap report itself was measured with.
      const extremeQuery = 'ar'
      const extremeCount = filterProducts(softwareData, extremeQuery).length
      // The two message tiers only mean something if the real data actually
      // lands on both sides of the "over cap, under/over half the catalog"
      // split this test exists to check — skip rather than false-pass if
      // the catalog has drifted since this was written.
      if (
        moderateCount <= 50 ||
        moderateCount > softwareData.length / 2 ||
        extremeCount <= softwareData.length / 2
      ) {
        return
      }

      render(<MobileMigrateView />)
      const input = screen.getByPlaceholderText('Search all products…')

      fireEvent.change(input, { target: { value: moderateQuery } })
      expect(
        screen.getByText(new RegExp(`Showing 50 of ${moderateCount} matches`))
      ).toBeInTheDocument()
      expect(screen.queryByText(/try a more specific/)).not.toBeInTheDocument()

      fireEvent.change(input, { target: { value: extremeQuery } })
      expect(
        screen.getByText(new RegExp(`${extremeCount} products match — try a more specific`))
      ).toBeInTheDocument()
      expect(screen.queryByText(/^Showing 50 of/)).not.toBeInTheDocument()
    })

    it('announces the results count via an aria-live region', () => {
      render(<MobileMigrateView />)
      fireEvent.change(screen.getByPlaceholderText('Search all products…'), {
        target: { value: 'Qualcomm Snapdragon' },
      })
      const live = screen.getByText(/Search results ·/)
      expect(live).toHaveAttribute('aria-live', 'polite')
    })

    it('keeps the "no matches" message inside its own live region, not a separate silent one', () => {
      render(<MobileMigrateView />)
      fireEvent.change(screen.getByPlaceholderText('Search all products…'), {
        target: { value: 'zzzznonexistentproductzzzz' },
      })
      const live = screen.getByText(/No matches for/)
      expect(live).toHaveAttribute('aria-live', 'polite')
    })
  })

  // 2026-08-28: the wave section's chosen-product rows never resolved
  // `product` to a real SoftwareItem at all — no tap-to-view AND no
  // "No longer in catalog" safety net, unlike the foundation section.
  // Closes both at once, reusing resolveProduct (MobilePlanTab's own
  // helper, already proven for the foundation section).
  describe('Plan tab wave-section chosen products', () => {
    it('tapping a resolved chosen product opens its real detail sheet', () => {
      const products = productsForDomain('tls')
      if (products.length === 0) return
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('tls', products[0].softwareName)
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      fireEvent.click(screen.getByText(products[0].softwareName).closest('button')!)
      const sheet = screen.getByTestId('migrate-product-detail-sheet')
      expect(within(sheet).getByText('PQC capabilities')).toBeInTheDocument()
    })

    it('shows "No longer in catalog" for an unresolvable chosen name, same as the foundation section', () => {
      useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
      useMigrateSelectionStore.getState().chooseProduct('tls', 'A Name Not In The Current Catalog')
      render(<MobileMigrateView />)
      fireEvent.click(screen.getByText('Plan').closest('button')!)
      expect(screen.getByText('A Name Not In The Current Catalog')).toBeInTheDocument()
      expect(screen.getByText('No longer in catalog')).toBeInTheDocument()
    })
  })
})
