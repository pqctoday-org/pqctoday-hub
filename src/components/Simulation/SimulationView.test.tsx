// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimulationView } from './SimulationView'
import { useModuleStore } from '@/store/useModuleStore'

const renderPage = () =>
  render(
    <MemoryRouter>
      <SimulationView />
    </MemoryRouter>
  )

beforeEach(() => {
  // start each test with no saved artifacts
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})

describe('SimulationView (skeleton)', () => {
  it('renders the page, setup dials and the phase journey', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Simulation', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Organisation size')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Sector')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /migration phases/i })).toBeInTheDocument()
  })

  it('renders the Mosca clock with a verdict', () => {
    renderPage()
    expect(screen.getByText(/Mosca clock/)).toBeInTheDocument()
    expect(screen.getByText(/At risk|On track/)).toBeInTheDocument()
  })

  it('shows the active phase panel with the three resource legs', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /^Learn/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Activities/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Reference/ })).toBeInTheDocument()
  })

  it('switching to Phase 1 surfaces its content-verified discovery modules', () => {
    renderPage()
    // P1 used to look empty by tag; the map makes Crypto Management Modernization appear here.
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    expect(
      screen.getByRole('link', { name: /Cryptographic Management Modernization/i })
    ).toBeInTheDocument()
  })

  it('earns levels cumulatively: L2 is locked until L1, then clears the phase', () => {
    renderPage()
    // Default phase p0: ladder + goal visible, nothing cleared yet.
    expect(screen.getByText('Maturity — earn each level')).toBeInTheDocument()
    expect(screen.getByText(/Phases cleared:/)).toHaveTextContent('Phases cleared: 0/8')

    // Level 2 is locked until Level 1 is earned.
    const l2 = screen.getByRole('checkbox', { name: /Level 2 — Initiated/i })
    expect(l2).toBeDisabled()

    // Earn Level 1, then Level 2 → phase clears.
    fireEvent.click(screen.getByRole('checkbox', { name: /Level 1 — Aware/i }))
    expect(screen.getByRole('checkbox', { name: /Level 2 — Initiated/i })).toBeEnabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Level 2 — Initiated/i }))

    expect(screen.getByText(/Phase cleared \(Level 2\+\)/)).toBeInTheDocument()
    expect(screen.getByText(/Phases cleared:/)).toHaveTextContent('Phases cleared: 1/8')
  })

  it('auto-detects a real CBOM artifact and clears Phase 2 without manual ticks', () => {
    // Player built a real CycloneDX CBOM in the Command Center.
    useModuleStore.getState().addExecutiveDocument({
      id: 'doc-cbom-1',
      moduleId: 'business',
      type: 'crypto-cbom',
      title: 'My CBOM',
      data: '# cbom',
      createdAt: 1,
    })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /CBOM/i }))
    // Levels prove themselves (L2 evidence implies L1) — auto-detected, no clicks.
    expect(screen.getAllByText('✓ auto-detected').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Phase cleared \(Level 2\+\)/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Level 2 — Initiated/i })).toBeDisabled()
  })
})
