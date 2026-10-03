// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { MigrationWorkbench } from './MigrationWorkbench'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { productsForDomain, productsForVendor } from './workbenchCatalog'
import { Button } from '../../ui/button'
import { retiredProductSuccessors, softwareData } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { usePageActionsStore } from '@/store/usePageActionsStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

function renderWorkbench() {
  return render(
    <MemoryRouter>
      <MigrationWorkbench embedded />
    </MemoryRouter>
  )
}

/** Standalone (non-embedded) render at a given path — the ?product= deep
 *  link only hydrates when standalone (embedded skips it deliberately). */
function LinkButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      follow link
    </Button>
  )
}

function BackButton() {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(-1)}>
      go back
    </Button>
  )
}

function LocationProbe() {
  const loc = useLocation()
  return <output data-testid="location-search">{loc.search}</output>
}

function renderStandaloneAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MigrationWorkbench />
      <LocationProbe />
    </MemoryRouter>
  )
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

describe('MigrationWorkbench (integration)', () => {
  beforeEach(() => {
    useMigrateSelectionStore.setState({ plan: [], choice: {}, tab: 'replace' })
  })

  it('renders the asset list; posture shows an empty-state invitation until something is planned', () => {
    renderWorkbench()
    expect(screen.getByText('What you run — pick to see replacements')).toBeInTheDocument()
    // An empty plan is an unstarted task, not a bad "0%" score.
    expect(screen.getByText('Build your migration plan')).toBeInTheDocument()
    expect(screen.queryByText('Your readiness')).not.toBeInTheDocument()
  })

  it('adding an asset to the plan updates readiness + plan count', () => {
    renderWorkbench()
    // TLS is the default selected asset → its detail "Add to plan" button shows
    fireEvent.click(screen.getByRole('button', { name: /Add TLS key exchange to plan/i }))
    // readiness now 100% (tls is drop-in / ready) and 1 in plan
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(useMigrateSelectionStore.getState().plan).toContain('tls')
  })

  it('selecting a different asset swaps the contextual catalog', () => {
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /IPsec \/ IKEv2 VPN/i }))
    // the VPN asset detail card heading appears
    expect(screen.getByRole('heading', { name: 'IPsec / IKEv2 VPN' })).toBeInTheDocument()
  })

  it('email asset shows the mitigate gap card (no GA product)', () => {
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Secure email/i }))
    expect(screen.getByText(/No GA quantum-safe product for this yet/i)).toBeInTheDocument()
  })

  it('foundation domains are reachable (catalog not orphaned)', () => {
    renderWorkbench()
    // the Foundations section lists the crypto-libraries bucket
    expect(screen.getByText('Crypto libraries & frameworks')).toBeInTheDocument()
  })

  it('Choose records a product in foundation/infrastructure domains (regression)', () => {
    // Regression: these domains have no ReplaceAsset, so the Choose button used
    // to be gated on a null `asset` and did nothing. It must now record the
    // choice keyed on the domain id.
    renderWorkbench()
    fireEvent.click(screen.getByText('Crypto libraries & frameworks'))
    const chooseButtons = screen.getAllByRole('button', { name: /^Choose / })
    expect(chooseButtons.length).toBeGreaterThan(0)
    fireEvent.click(chooseButtons[0])
    expect(useMigrateSelectionStore.getState().choice.foundations).toBeTruthy()
  })

  it('a chosen foundation product shows in the Plan tab under its own section', () => {
    renderWorkbench()
    fireEvent.click(screen.getByText('Crypto libraries & frameworks'))
    fireEvent.click(screen.getAllByRole('button', { name: /^Choose / })[0])
    // switch to the Plan tab — the foundation choice must surface (it was
    // previously dropped because the plan only understood replace-assets)
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    expect(screen.getByText('Foundations & infrastructure')).toBeInTheDocument()
    // category shown as the row caption, with a per-product remove button
    expect(screen.getByText('Crypto libraries & frameworks')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Remove .* from plan/i }).length).toBeGreaterThan(
      0
    )
  })

  // Regression: migrate-process remediation Phase 5 (U4, scoped) — a chosen
  // product whose name no longer matches the catalog (renamed/deprecated
  // since it was chosen) used to render with no explanation at all, just a
  // missing expander. Simulates the orphan by planting a name that was
  // never real, same effect as a rename.
  it('an orphaned plan entry (name no longer in the catalog) shows an honest notice', () => {
    useMigrateSelectionStore.setState({
      plan: ['foundations'],
      choice: { foundations: ['A Product That No Longer Exists'] },
      nameToProductId: {},
      tab: 'plan',
    })
    renderWorkbench()
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    expect(screen.getByText('A Product That No Longer Exists')).toBeInTheDocument()
    expect(screen.getByText('No longer in catalog')).toBeInTheDocument()
  })

  // U4, extended further: when the renamed name IS in the resolution cache
  // (captured back when it was originally chosen), full detail is restored
  // instead of the bare notice — the row becomes expandable again.
  it('a renamed plan entry resolves via the nameToProductId cache and stays fully expandable', () => {
    const [real] = productsForDomain('foundations' as never)
    expect(real).toBeDefined()
    useMigrateSelectionStore.setState({
      plan: ['foundations'],
      choice: { foundations: ['A Renamed Product'] },
      nameToProductId: { 'A Renamed Product': real.productId },
      tab: 'plan',
    })
    renderWorkbench()
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    expect(screen.getByText('A Renamed Product')).toBeInTheDocument()
    expect(screen.queryByText('No longer in catalog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Show details for A Renamed Product/i })
    ).toBeInTheDocument()
  })

  it('keeps multiple chosen products in a category, each as its own plan row', () => {
    renderWorkbench()
    fireEvent.click(screen.getByText('Crypto libraries & frameworks'))
    const chooseButtons = screen.getAllByRole('button', { name: /^Choose / })
    fireEvent.click(chooseButtons[0])
    // the first pick must NOT revert when a second product is chosen
    fireEvent.click(screen.getAllByRole('button', { name: /^Choose / })[0])
    const inPlan = useMigrateSelectionStore.getState().choice.foundations ?? []
    expect(inPlan.length).toBe(2)
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    // two distinct product rows, each removable
    expect(
      screen.getAllByRole('button', { name: /Remove .* from plan/i }).length
    ).toBeGreaterThanOrEqual(2)
  })

  it('plan tab shows waves once an asset is planned', () => {
    useMigrateSelectionStore.setState({ plan: ['tls'], tab: 'plan' })
    renderWorkbench()
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    expect(screen.getByText('External-facing live traffic')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export plan \+ CBOM/i })).toBeInTheDocument()
  })

  it('vendor roadmaps tab lists vendors with roadmaps', () => {
    renderWorkbench()
    fireEvent.click(screen.getByRole('tab', { name: /Vendor roadmaps/i }))
    expect(screen.getByText(/vendors with a published\s+PQC roadmap/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Filter vendor roadmaps')).toBeInTheDocument()
    // at least one vendor card links to its products
    expect(screen.getAllByRole('button', { name: /View \d+ products?/i }).length).toBeGreaterThan(0)
  })

  it('empty plan tab prompts to add assets', () => {
    useMigrateSelectionStore.setState({ plan: [], tab: 'plan' })
    renderWorkbench()
    fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
    expect(screen.getByText('Nothing in your plan yet')).toBeInTheDocument()
  })

  it('contextual catalog renders product rows for the selected asset', () => {
    renderWorkbench()
    // default tls selected → "Products that replace this" header + at least one Choose button
    expect(screen.getByText(/Products that replace this/i)).toBeInTheDocument()
    const chooseButtons = screen.getAllByRole('button', { name: /^Choose / })
    expect(chooseButtons.length).toBeGreaterThan(0)
    // choosing records the choice + plans the asset
    fireEvent.click(
      within(chooseButtons[0].closest('div')!).getByRole('button', { name: /^Choose / })
    )
    expect(useMigrateSelectionStore.getState().plan).toContain('tls')
  })

  // Regression: migrate-process remediation Phase 5 (U8) — ProductDetail's
  // Endorse/Flag buttons emit /migrate?product=<name>, which used to land
  // nowhere (the workbench only read ?share= and ?tab=). Deep-link
  // remediation PR 1: it now filters by EXACT id (not a substring name
  // filter), auto-expands the row and keeps the param in the URL.
  describe('product deep links', () => {
    const [sample] = productsForDomain('tls')
    const search = () => screen.getByTestId('location-search').textContent ?? ''
    const rowToggle = (name: string) =>
      screen.getByRole('button', { name: new RegExp(`details for ${escapeRe(name)}$`) })

    it('?product=<name> switches to Replace, shows only that product, expanded', () => {
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.softwareName)}`)
      // filter box stays empty — exact-id filtering, not a substring pre-fill
      expect(screen.getByLabelText(/Filter products/i)).toHaveValue('')
      expect(screen.getAllByRole('button', { name: /details for / })).toHaveLength(1)
      expect(rowToggle(sample.softwareName)).toHaveAttribute('aria-expanded', 'true')
      expect(document.querySelector(`[data-deeplink-id="${sample.productId}"]`)).toBeInTheDocument()
      expect(search()).toContain('product=')
      expect(search()).toContain('tab=replace')
    })

    it('?product=<product_id> resolves the same product', () => {
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.productId)}`)
      expect(rowToggle(sample.softwareName)).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapsing the linked row drops ?product= from the URL', () => {
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.productId)}`)
      fireEvent.click(rowToggle(sample.softwareName))
      expect(search()).not.toContain('product=')
    })

    it('an unknown product shows a not-found notice', () => {
      renderStandaloneAt('/migrate?product=no-such-product-xyz')
      expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
        'no-such-product-xyz'
      )
    })

    it('?productIds=a,b filters to exactly those ids with nothing auto-expanded', () => {
      const [a, b] = productsForDomain('tls')
      renderStandaloneAt(`/migrate?productIds=${a.productId},${b.productId}`)
      expect(screen.getAllByRole('button', { name: /details for / })).toHaveLength(2)
      expect(rowToggle(a.softwareName)).toHaveAttribute('aria-expanded', 'false')
      expect(search()).toContain('productIds=')
    })

    it('a second link while mounted re-hydrates, widening facets that hide it (with Undo)', () => {
      const target = productsForDomain('tls').find(
        (p) => (p.pqcStatusCanonical || '').toLowerCase() !== 'available'
      )!
      expect(target).toBeDefined()
      render(
        <MemoryRouter initialEntries={['/migrate']}>
          <MigrationWorkbench />
          <LinkButton to={`/migrate?product=${encodeURIComponent(target.productId)}`} />
          <LocationProbe />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Filter by PQC status' }))
      fireEvent.click(screen.getByRole('option', { name: 'Available' }))
      expect(screen.queryByText(target.softwareName)).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'follow link' }))
      expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
      expect(rowToggle(target.softwareName)).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
      expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
      expect(screen.queryByText(target.softwareName)).not.toBeInTheDocument()
    })
  })

  describe('deep links (PR 2)', () => {
    const search = () => screen.getByTestId('location-search').textContent ?? ''
    const rowToggle = (name: string) =>
      screen.getByRole('button', { name: new RegExp(`details for ${escapeRe(name)}$`) })

    describe('?domain=', () => {
      it('selects the Replace-tab domain on load and pins the Replace tab', () => {
        // A returning reader's stored tab (Plan, Roadmaps…) must not win over
        // an inbound domain link.
        useMigrateSelectionStore.setState({ tab: 'plan' })
        renderStandaloneAt('/migrate?domain=hsm')
        expect(screen.getByRole('heading', { name: 'HSM-protected keys' })).toBeInTheDocument()
        expect(search()).toContain('tab=replace')
      })

      it('follows a second ?domain= link while mounted', () => {
        render(
          <MemoryRouter initialEntries={['/migrate?domain=hsm']}>
            <MigrationWorkbench />
            <LinkButton to="/migrate?domain=vpn" />
            <LocationProbe />
          </MemoryRouter>
        )
        fireEvent.click(screen.getByRole('button', { name: 'follow link' }))
        expect(screen.getByRole('heading', { name: 'IPsec / IKEv2 VPN' })).toBeInTheDocument()
      })

      it('is written when the reader picks a domain', () => {
        renderStandaloneAt('/migrate')
        fireEvent.click(screen.getAllByRole('button', { name: /IPsec \/ IKEv2 VPN/i })[0])
        expect(search()).toContain('domain=vpn')
      })

      it('survives a tab switch (Replace remounts on the same domain)', () => {
        renderStandaloneAt('/migrate?domain=hsm')
        fireEvent.click(screen.getByRole('tab', { name: /Plan & sequence/i }))
        expect(search()).toContain('domain=hsm')
        fireEvent.click(screen.getByRole('tab', { name: /Replace what you own/i }))
        expect(screen.getByRole('heading', { name: 'HSM-protected keys' })).toBeInTheDocument()
      })

      it('is cleared by Clear (reset to the default domain)', () => {
        renderStandaloneAt('/migrate?domain=hsm')
        fireEvent.click(screen.getByText('Clear'))
        expect(search()).not.toContain('domain=')
        expect(screen.getByRole('heading', { name: 'TLS key exchange' })).toBeInTheDocument()
      })

      it('an unknown domain shows a not-found notice', () => {
        renderStandaloneAt('/migrate?domain=bogus')
        expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('bogus')
      })
    })

    describe('emitted aliases (?q=, ?layer=, ?cat=, ?industry=)', () => {
      const [hsmProduct] = productsForDomain('hsm')

      it('?q=<exact product name> opens that product like ?product=', () => {
        renderStandaloneAt(`/migrate?tab=plan&q=${encodeURIComponent(hsmProduct.softwareName)}`)
        expect(rowToggle(hsmProduct.softwareName)).toHaveAttribute('aria-expanded', 'true')
        expect(search()).toContain('tab=replace')
      })

      it('?search= / ?highlight= are aliases of ?q=', () => {
        renderStandaloneAt(`/migrate?highlight=${encodeURIComponent(hsmProduct.productId)}`)
        expect(rowToggle(hsmProduct.softwareName)).toHaveAttribute('aria-expanded', 'true')
      })

      it('?q=<free text> pre-fills the Replace filter in the best-matching domain', () => {
        renderStandaloneAt('/migrate?q=IBM')
        expect(screen.getByLabelText(/Filter products/i)).toHaveValue('IBM')
      })

      it('?layer= picks the mapped domain; with ?q= the text becomes the filter', () => {
        renderStandaloneAt('/migrate?layer=Libraries&q=open')
        expect(
          screen.getByRole('heading', { name: 'Crypto libraries & frameworks' })
        ).toBeInTheDocument()
        expect(screen.getByLabelText(/Filter products/i)).toHaveValue('open')
      })

      it('?cat=<category name> picks the mapped domain', () => {
        renderStandaloneAt('/migrate?cat=Hardware%20Security%20Modules')
        expect(screen.getByRole('heading', { name: 'HSM-protected keys' })).toBeInTheDocument()
      })

      it('?industry= is ignored gracefully and lands on Replace', () => {
        renderStandaloneAt('/migrate?tab=plan&industry=Finance')
        expect(screen.getByRole('tab', { name: /Replace what you own/i })).toHaveAttribute(
          'aria-selected',
          'true'
        )
        expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
      })

      it('an unknown ?q= / ?layer= shows a not-found notice', () => {
        renderStandaloneAt('/migrate?layer=zzz-nope')
        expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('zzz-nope')
      })

      it('typing in the filter drops the link params but records the domain', () => {
        renderStandaloneAt('/migrate?layer=Libraries')
        fireEvent.change(screen.getByLabelText(/Filter products/i), { target: { value: 'x' } })
        expect(search()).not.toContain('layer=')
        expect(search()).toContain('domain=foundations')
      })
    })

    describe('row expand writes ?product=', () => {
      const [a, b] = productsForDomain('tls')

      it('expanding pushes ?product=<id>; collapsing clears it', () => {
        renderStandaloneAt('/migrate')
        fireEvent.click(rowToggle(a.softwareName))
        expect(search()).toContain(`product=${encodeURIComponent(a.productId)}`)
        // our own write does not re-hydrate as a link (the list is not narrowed)
        expect(screen.getAllByRole('button', { name: /details for / }).length).toBeGreaterThan(1)
        fireEvent.click(rowToggle(a.softwareName))
        expect(search()).not.toContain('product=')
      })

      it('Back closes the row that was opened', () => {
        render(
          <MemoryRouter initialEntries={['/migrate']}>
            <MigrationWorkbench />
            <BackButton />
            <LocationProbe />
          </MemoryRouter>
        )
        fireEvent.click(rowToggle(b.softwareName))
        expect(rowToggle(b.softwareName)).toHaveAttribute('aria-expanded', 'true')
        fireEvent.click(screen.getByRole('button', { name: 'go back' }))
        expect(search()).not.toContain('product=')
        expect(rowToggle(b.softwareName)).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('a retired product id opens its successor with a "replaced by" notice', () => {
      const [retiredId, successorId] = [...retiredProductSuccessors][0]
      const successor = softwareData.find((p) => p.productId === successorId)!
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(retiredId)}`)
      expect(rowToggle(successor.softwareName)).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
        `replaced by ${successor.softwareName}`
      )
    })

    it('?productIds= spanning domains lists the other domains with links', () => {
      const [tls] = productsForDomain('tls')
      const [hsm] = productsForDomain('hsm')
      renderStandaloneAt(`/migrate?productIds=${tls.productId},${hsm.productId}`)
      expect(screen.getAllByRole('button', { name: /details for / })).toHaveLength(1)
      const note = screen.getByTestId('deeplink-elsewhere')
      expect(note).toHaveTextContent(hsm.softwareName)
      expect(within(note).getByRole('link', { name: 'HSM-protected keys' })).toHaveAttribute(
        'href',
        `/migrate?tab=replace&productIds=${hsm.productId}`
      )
    })

    describe('?vendor=', () => {
      const vendorId = [...roadmapByVendorId.keys()].find((id) => productsForVendor(id).length > 0)!
      const vendorName = roadmapByVendorId.get(vendorId)![0].vendorName
      const card = () => document.querySelector(`[data-deeplink-id="${vendorId}"]`)!

      it('opens Roadmaps filtered to that vendor with its card expanded', () => {
        renderStandaloneAt(`/migrate?vendor=${encodeURIComponent(vendorName)}`)
        expect(screen.getByRole('tab', { name: /Vendor roadmaps/i })).toHaveAttribute(
          'aria-selected',
          'true'
        )
        expect(screen.getByLabelText('Filter vendor roadmaps')).toHaveValue(vendorName)
        expect(
          within(card() as HTMLElement).getByRole('button', { name: /^Hide \d+ products?/ })
        ).toBeInTheDocument()
        expect(search()).toContain('tab=roadmaps')
      })

      it('an unknown vendor shows a not-found notice', () => {
        renderStandaloneAt('/migrate?vendor=no-such-vendor-zz')
        expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
          'no-such-vendor-zz'
        )
      })

      it("opening a vendor card's products writes ?vendor=; closing clears it", () => {
        renderStandaloneAt('/migrate?tab=roadmaps')
        fireEvent.change(screen.getByLabelText('Filter vendor roadmaps'), {
          target: { value: vendorName },
        })
        fireEvent.click(
          within(card() as HTMLElement).getByRole('button', { name: /^View \d+ products?/ })
        )
        expect(search()).toContain(`vendor=${vendorId}`)
        fireEvent.click(
          within(card() as HTMLElement).getByRole('button', { name: /^Hide \d+ products?/ })
        )
        expect(search()).not.toContain('vendor=')
      })
    })

    describe('?open= on Plan / Vendor risk', () => {
      const [lib] = productsForDomain('foundations')

      it('Plan: expands the planned product; collapsing clears ?open=', () => {
        useMigrateSelectionStore.setState({
          plan: ['foundations'],
          choice: { foundations: [lib.softwareName] },
        })
        renderStandaloneAt(`/migrate?tab=plan&open=${encodeURIComponent(lib.productId)}`)
        const toggle = screen.getByRole('button', {
          name: new RegExp(`Hide details for ${escapeRe(lib.softwareName)}`),
        })
        expect(toggle).toHaveAttribute('aria-expanded', 'true')
        fireEvent.click(toggle)
        expect(search()).not.toContain('open=')
      })

      it('Plan: expanding a row by hand writes ?open=<productId>', () => {
        useMigrateSelectionStore.setState({
          plan: ['foundations'],
          choice: { foundations: [lib.softwareName] },
        })
        renderStandaloneAt('/migrate?tab=plan')
        fireEvent.click(
          screen.getByRole('button', {
            name: new RegExp(`Show details for ${escapeRe(lib.softwareName)}`),
          })
        )
        expect(search()).toContain(`open=${encodeURIComponent(lib.productId)}`)
      })

      it('Plan: a product not in the plan gets a notice', () => {
        renderStandaloneAt(`/migrate?tab=plan&open=${encodeURIComponent(lib.productId)}`)
        expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent(
          'isn’t in your plan'
        )
      })

      it('Vendor risk: an unknown ref gets a notice', () => {
        renderStandaloneAt('/migrate?tab=vendorrisk&open=zz-nope')
        expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('zz-nope')
      })
    })
  })

  // PR 4 (2026-09-29): with a plan/choice in the store the workbench used to
  // register the plan ?share=<token> URL with the top bar unconditionally —
  // so a reader looking at one product row / vendor card shared their whole
  // plan instead of the item. While an item is open the top bar now shares
  // the current item view (no url override); with nothing open, the plan.
  describe('top-bar share URL vs. an open item', () => {
    const [sample] = productsForDomain('tls')
    const shareUrl = () => usePageActionsStore.getState().current?.url
    beforeEach(() => {
      useMigrateSelectionStore.setState({ plan: ['tls'], choice: {}, tab: 'replace' })
    })
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('shares the plan token when no item is open', () => {
      renderStandaloneAt('/migrate?tab=plan')
      expect(shareUrl()).toMatch(/\?share=/)
    })

    it('does not override the share URL while a ?product= row is open', () => {
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.productId)}`)
      expect(usePageActionsStore.getState().current?.title).toBe('PQC Migration Workbench')
      expect(shareUrl()).toBeUndefined()
    })

    it('does not override the share URL while a ?vendor= card is open', () => {
      const [vendorId] = [...roadmapByVendorId.keys()]
      renderStandaloneAt(`/migrate?tab=roadmaps&vendor=${encodeURIComponent(vendorId)}`)
      expect(shareUrl()).toBeUndefined()
    })

    it('restores the plan share once the linked row is collapsed', () => {
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.productId)}`)
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(`details for ${escapeRe(sample.softwareName)}$`),
        })
      )
      expect(shareUrl()).toMatch(/\?share=/)
    })

    it('phone shell: an open ?product= sheet is not overridden by the plan token', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.productId)}`)
      expect(shareUrl()).toBeUndefined()
    })

    it('phone shell: with nothing open the plan token is still shared', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      renderStandaloneAt('/migrate')
      expect(shareUrl()).toMatch(/\?share=/)
    })
  })

  // Mobile UX layer (Phase 8). MigrateWorkbenchEmbed.tsx renders this same
  // component inside the simulation at whatever viewport the player is on
  // (embedded prop — this page's own equivalent of simEmbed) — embedded
  // must win over isMobileShell regardless of viewport width, same as
  // Threats/Library/Compliance.
  describe('mobile shell guard', () => {
    afterEach(() => {
      mockUseIsMobileShell.mockReturnValue(false)
    })

    it('renders the mobile screen when isMobileShell is true and not embedded', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <MigrationWorkbench />
        </MemoryRouter>
      )
      expect(screen.getByText('Migrate')).toBeInTheDocument()
      expect(screen.queryByText('What you run — pick to see replacements')).not.toBeInTheDocument()
    })

    it('still renders the full desktop view when embedded is true, even if isMobileShell is true', () => {
      mockUseIsMobileShell.mockReturnValue(true)
      render(
        <MemoryRouter>
          <MigrationWorkbench embedded />
        </MemoryRouter>
      )
      expect(screen.getByText('What you run — pick to see replacements')).toBeInTheDocument()
    })
  })
})
