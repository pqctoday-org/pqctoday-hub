// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PlaygroundWorkshop } from './PlaygroundWorkshop'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { isEnvironmentTool } from './cryptoLabTaxonomy'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSandboxStore } from '@/store/useSandboxStore'

// Tools shown in the grid exclude the marquee "environment" cards.
const GRID_COUNT = WORKSHOP_TOOLS.filter((t) => !isEnvironmentTool(t.id)).length

const renderWorkbench = (path = '/playground') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PlaygroundWorkshop />
    </MemoryRouter>
  )

/**
 * The run-context filter defaults to 'browser' (WS6a-bis) so a visitor's first
 * view holds only tools they can actually execute. Docker sandbox scenarios are
 * one click away behind the "Show them" affordance — click it, the way a user
 * would, before asserting anything about sandbox cards.
 */
const revealSandboxScenarios = () => {
  fireEvent.click(screen.getByRole('button', { name: /^Show (them|it)$/i }))
}

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null })
  useBookmarkStore.setState({ myPlaygroundTools: [], showOnlyPlaygroundTools: false })
  // 'offline' (not 'idle') so the component's mount probe stays put and the
  // sandbox-locked presentation is deterministic.
  useSandboxStore.setState({ status: 'offline', lastChecked: 1, error: 'stub', baseUrl: '' })
})

describe('Crypto Lab Workbench', () => {
  it('renders the Overview with the brand, tool count and four full-playground cards', () => {
    renderWorkbench()
    expect(screen.getByText('Crypto Lab')).toBeInTheDocument()
    expect(screen.getByText(`${GRID_COUNT} tools · runs in-browser`)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Run real cryptography in your browser/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Interactive Playground')).toBeInTheDocument()
    expect(screen.getByText('PKCS#11 HSM')).toBeInTheDocument()
    expect(screen.getByText('Developer Sandbox')).toBeInTheDocument()
    // "KMIP Control Plane" is the one consistent name used both on the feature card
    // and on the "Featured" banner further down this same Overview (playground.md
    // item 3) — expect both, not a single unique match.
    expect(screen.getAllByText('KMIP Control Plane').length).toBe(2)
  })

  it('the featured playground cards link to the special playground routes', () => {
    renderWorkbench()
    expect(screen.getByText('Interactive Playground').closest('a')).toHaveAttribute(
      'href',
      '/playground/interactive'
    )
    // First match is the feature card; both it and the banner link to /playground/cacp.
    expect(screen.getAllByText('KMIP Control Plane')[0].closest('a')).toHaveAttribute(
      'href',
      '/playground/cacp'
    )
    expect(screen.getByText('Developer Sandbox').closest('a')).toHaveAttribute(
      'href',
      '/playground/docker'
    )
  })

  it('has no page-local persona control and defaults to the no-role Overview heading', () => {
    renderWorkbench()
    // No page-local persona control (Phase 0.2 — the top-bar switcher is the
    // only write path into the shared persona store).
    expect(screen.queryByRole('button', { name: /Viewing as/i })).toBeNull()
    expect(screen.getByText('Good places to start')).toBeInTheDocument()
  })

  it('re-titles Recommended when the global persona store already has a role', () => {
    // The page still READS the shared store — it never writes to it locally.
    // Simulate the global top-bar switcher having set a role.
    usePersonaStore.setState({ selectedPersona: 'developer' })
    renderWorkbench()
    expect(screen.getByText('Recommended for Developer')).toBeInTheDocument()
  })

  it('caps the "Start here" row at 3 tools (playground.md Phase 9.2)', () => {
    // The developer role has well over 3 eligible non-sandbox tools in the
    // real registry, so this genuinely exercises the cap rather than
    // coincidentally landing on 3.
    usePersonaStore.setState({ selectedPersona: 'developer' })
    renderWorkbench()
    expect(screen.getByText('3 tools matched to your role')).toBeInTheDocument()
  })

  it('searches across all categories and shows a flat result list', () => {
    renderWorkbench()
    fireEvent.change(screen.getByRole('searchbox', { name: /search tools/i }), {
      target: { value: 'bitcoin' },
    })
    expect(screen.getByRole('heading', { name: /Results for/i })).toBeInTheDocument()
    expect(screen.getByText('Bitcoin Transaction')).toBeInTheDocument()
  })

  it('opens the tool-detail modal with an "Open tool" action and run-context explainer', () => {
    renderWorkbench('/playground?cat=Blockchain%20%26%20Digital%20Assets')
    fireEvent.click(screen.getByText('Bitcoin Transaction'))
    const dialog = screen.getByRole('dialog', { name: 'Bitcoin Transaction' })
    expect(within(dialog).getByRole('button', { name: /Open tool/i })).toBeInTheDocument()
    expect(within(dialog).getByText('Algorithms')).toBeInTheDocument()
    // Browser tool → explains it runs instantly in-browser via WASM.
    expect(within(dialog).getByText(/Runs instantly in your browser/i)).toBeInTheDocument()
  })

  it('defaults to the browser catalogue and keeps the hidden container count visible', () => {
    // WS6a-bis: WORKSHOP_TOOLS carries 24 Docker scenarios, so an 'all' default
    // meant ~41% of the cards on screen could not run in the browser at all.
    renderWorkbench('/playground?cat=Protocol%20Simulations')
    expect(screen.queryByText('OpenSSL TLS 1.3 + Composite Cert')).toBeNull()
    // Breadth is never concealed: the count is on screen and one click reveals.
    expect(screen.getByText(/Docker scenarios? in this category/i)).toBeInTheDocument()
    revealSandboxScenarios()
    expect(screen.getByText('OpenSSL TLS 1.3 + Composite Cert')).toBeInTheDocument()
  })

  it('dims (not hides) Docker-sandbox scenarios when the runtime is offline, with a Connect hint', () => {
    // OpenSSL TLS 1.3 sandbox scenario is re-homed to Protocol Simulations.
    renderWorkbench('/playground?cat=Protocol%20Simulations')
    revealSandboxScenarios()
    // Offline (beforeEach): once revealed, the sandbox demo stays in the grid,
    // dimmed/locked (Phase 9.4) — never removed from the list entirely.
    const card = screen.getByText('OpenSSL TLS 1.3 + Composite Cert').closest('[role="button"]')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText('Sandbox')).toBeInTheDocument()
    expect(card).toHaveClass('opacity-60')

    // The category also surfaces a hint with a Connect-runtime CTA.
    expect(screen.getByRole('button', { name: /Connect runtime/i })).toBeInTheDocument()

    // Clicking the locked card opens the detail modal but gates it behind
    // "Start sandbox runtime" rather than navigating into a broken tool.
    fireEvent.click(card as HTMLElement)
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: /Start sandbox runtime/i })
    ).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /^Open tool/i })).toBeNull()
  })

  it('shows Docker-sandbox scenarios with a Sandbox badge when the runtime is online', () => {
    useSandboxStore.setState({ status: 'online' })
    renderWorkbench('/playground?cat=Protocol%20Simulations')
    revealSandboxScenarios()
    const card = screen.getByText('OpenSSL TLS 1.3 + Composite Cert').closest('[role="button"]')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText('Sandbox')).toBeInTheDocument()

    // Online → opening it offers "Open tool", not a runtime prompt.
    fireEvent.click(card as HTMLElement)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: /Open tool/i })).toBeInTheDocument()
  })

  it('opens the command palette with ⌘/Ctrl-K and runs a tool from it', () => {
    renderWorkbench()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const palette = screen.getByRole('dialog', { name: /command palette/i })
    fireEvent.change(within(palette).getByRole('textbox', { name: /search the crypto lab/i }), {
      target: { value: 'bitcoin' },
    })
    fireEvent.click(within(palette).getByText('Bitcoin Transaction'))
    // Picking a tool closes the palette and opens its detail modal.
    expect(screen.getByRole('dialog', { name: 'Bitcoin Transaction' })).toBeInTheDocument()
  })

  it('navigates from an overview "I want to…" verb chip into the intent view', () => {
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Sign \/ verify/i }))
    expect(screen.getByRole('heading', { name: /tools to sign/i })).toBeInTheDocument()
  })

  it('renders the intent view for ?verb= across categories', () => {
    renderWorkbench('/playground?verb=sign')
    expect(screen.getByRole('heading', { name: /tools to sign/i })).toBeInTheDocument()
    // Bitcoin Transaction is tagged with the "sign" verb.
    expect(screen.getByText('Bitcoin Transaction')).toBeInTheDocument()
  })

  it('toggles a bookmark into the My tools view', () => {
    renderWorkbench('/playground?cat=Blockchain%20%26%20Digital%20Assets')
    const card = screen.getByText('Bitcoin Transaction').closest('[role="button"]')
      ?.parentElement as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: /Add to My tools/i }))
    expect(useBookmarkStore.getState().myPlaygroundTools).toContain('bitcoin-flow')
  })

  it('turns the runtime off when the sidebar toggle is clicked while online', () => {
    useSandboxStore.setState({ status: 'online' })
    renderWorkbench()
    expect(screen.getByText(/Runtime active/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sandbox runtime/i }))
    expect(useSandboxStore.getState().status).toBe('idle')
  })

  it('probes and reveals the access panel when the sidebar toggle is clicked offline', () => {
    const probe = vi.fn().mockResolvedValue('offline')
    useSandboxStore.setState({ probe, status: 'offline' })
    renderWorkbench()
    fireEvent.click(screen.getByRole('button', { name: /Sandbox runtime/i }))
    expect(probe).toHaveBeenCalled()
    // Clicking while offline always produces a visible, explanatory response.
    expect(screen.getByRole('dialog', { name: /Sandbox access/i })).toBeInTheDocument()
    expect(screen.getByText('Container access required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry probe/i })).toBeInTheDocument()
  })
})
