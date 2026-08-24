// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MigrationWorkbench } from './MigrationWorkbench'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { productsForDomain } from './workbenchCatalog'

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
function renderStandaloneAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MigrationWorkbench />
    </MemoryRouter>
  )
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
  // nowhere (the workbench only read ?share= and ?tab=).
  it('?product= deep link switches to Replace and pre-fills the domain filter (regression)', () => {
    const [sample] = productsForDomain('tls')
    expect(sample).toBeDefined()
    renderStandaloneAt(`/migrate?product=${encodeURIComponent(sample.softwareName)}`)
    // The Replace tab's filter input only renders when that tab is active —
    // finding it with the right value proves both the tab switch and the
    // filter pre-fill happened.
    expect(screen.getByLabelText(/Filter products/i)).toHaveValue(sample.softwareName)
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
