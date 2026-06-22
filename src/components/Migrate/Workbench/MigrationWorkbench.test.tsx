// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { MigrationWorkbench } from './MigrationWorkbench'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

function renderWorkbench() {
  return render(
    <MemoryRouter>
      <MigrationWorkbench embedded />
    </MemoryRouter>
  )
}

describe('MigrationWorkbench (integration)', () => {
  beforeEach(() => {
    useMigrateSelectionStore.setState({ plan: [], choice: {}, tab: 'replace' })
  })

  it('renders the asset list + posture', () => {
    renderWorkbench()
    expect(screen.getByText('What you run — pick to see replacements')).toBeInTheDocument()
    expect(screen.getByText('Your readiness')).toBeInTheDocument()
    // 0% with empty plan
    expect(screen.getByText('0%')).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: /Plan & sequence/i }))
    expect(screen.getByText('Foundations & infrastructure')).toBeInTheDocument()
    // category shown as the row caption, with a per-product remove button
    expect(screen.getByText('Crypto libraries & frameworks')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Remove .* from plan/i }).length).toBeGreaterThan(
      0
    )
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
    fireEvent.click(screen.getByRole('button', { name: /Plan & sequence/i }))
    // two distinct product rows, each removable
    expect(
      screen.getAllByRole('button', { name: /Remove .* from plan/i }).length
    ).toBeGreaterThanOrEqual(2)
  })

  it('plan tab shows waves once an asset is planned', () => {
    useMigrateSelectionStore.setState({ plan: ['tls'], tab: 'plan' })
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Plan & sequence/i }))
    expect(screen.getByText('External-facing live traffic')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export plan \+ CBOM/i })).toBeInTheDocument()
  })

  it('vendor roadmaps tab lists vendors with roadmaps', () => {
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Vendor roadmaps/i }))
    expect(screen.getByText(/vendors with a published\s+PQC roadmap/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Filter vendor roadmaps')).toBeInTheDocument()
    // at least one vendor card links to its products
    expect(screen.getAllByRole('button', { name: /View \d+ products?/i }).length).toBeGreaterThan(0)
  })

  it('empty plan tab prompts to add assets', () => {
    useMigrateSelectionStore.setState({ plan: [], tab: 'plan' })
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Plan & sequence/i }))
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
})
