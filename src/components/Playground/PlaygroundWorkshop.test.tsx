// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlaygroundWorkshop } from './PlaygroundWorkshop'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSandboxStore } from '@/store/useSandboxStore'

const renderWorkbench = (path = '/playground') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PlaygroundWorkshop />
    </MemoryRouter>
  )

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null })
  useBookmarkStore.setState({ myPlaygroundTools: [], showOnlyPlaygroundTools: false })
  // 'offline' (not 'idle') so the component's mount probe stays put and the
  // sandbox-locked presentation is deterministic.
  useSandboxStore.setState({ status: 'offline', lastChecked: 1, error: 'stub', baseUrl: '' })
})

describe('Crypto Lab Workbench', () => {
  it('renders the Overview with the brand, tool count and three full-playground cards', () => {
    renderWorkbench()
    expect(screen.getByText('Crypto Lab')).toBeInTheDocument()
    expect(screen.getByText(`${WORKSHOP_TOOLS.length} tools · runs in-browser`)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Run real cryptography in your browser/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Interactive Playground')).toBeInTheDocument()
    expect(screen.getByText('PKCS#11 HSM')).toBeInTheDocument()
    expect(screen.getByText('KMIP Control Plane')).toBeInTheDocument()
  })

  it('the featured playground cards link to the special playground routes', () => {
    renderWorkbench()
    expect(screen.getByText('Interactive Playground').closest('a')).toHaveAttribute(
      'href',
      '/playground/interactive'
    )
    expect(screen.getByText('KMIP Control Plane').closest('a')).toHaveAttribute(
      'href',
      '/playground/cacp'
    )
  })

  it('defaults to "Everyone" and re-titles Recommended when a role is picked', () => {
    renderWorkbench()
    // Role selector reads "Everyone"; Overview shows the no-role heading.
    expect(screen.getByText('Everyone')).toBeInTheDocument()
    expect(screen.getByText('Good places to start')).toBeInTheDocument()

    // Open the role dropdown and choose Developer.
    fireEvent.click(screen.getByRole('button', { name: /Viewing as/i }))
    fireEvent.click(screen.getByRole('option', { name: 'Developer' }))

    expect(screen.getByText('Recommended for Developer')).toBeInTheDocument()
    expect(usePersonaStore.getState().selectedPersona).toBe('developer')
  })

  it('searches across all categories and shows a flat result list', () => {
    renderWorkbench()
    fireEvent.change(screen.getByRole('searchbox', { name: /search tools/i }), {
      target: { value: 'bitcoin' },
    })
    expect(screen.getByRole('heading', { name: /Results for/i })).toBeInTheDocument()
    expect(screen.getByText('Bitcoin Transaction')).toBeInTheDocument()
  })

  it('opens the tool-detail modal with an "Open tool" action for an unlocked tool', () => {
    renderWorkbench('/playground?cat=Blockchain%20%26%20Digital%20Assets')
    fireEvent.click(screen.getByText('Bitcoin Transaction'))
    const dialog = screen.getByRole('dialog', { name: 'Bitcoin Transaction' })
    expect(within(dialog).getByRole('button', { name: /Open tool/i })).toBeInTheDocument()
    expect(within(dialog).getByText('Algorithms')).toBeInTheDocument()
  })

  it('marks a Docker-sandbox scenario with a Sandbox badge and locks it when the runtime is offline', () => {
    // OpenSSL TLS 1.3 sandbox scenario is re-homed to Protocol Simulations.
    renderWorkbench('/playground?cat=Protocol%20Simulations')
    const card = screen.getByText('OpenSSL TLS 1.3 + Composite Cert').closest('[role="button"]')
    expect(card).not.toBeNull()
    expect(within(card as HTMLElement).getByText('Sandbox')).toBeInTheDocument()
    expect(within(card as HTMLElement).getByText('needs runtime')).toBeInTheDocument()

    // Its modal offers to start the runtime rather than open the tool.
    fireEvent.click(card as HTMLElement)
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: /Start sandbox runtime/i })
    ).toBeInTheDocument()
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
