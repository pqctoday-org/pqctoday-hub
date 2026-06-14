// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'

const renderPage = () =>
  render(
    <MemoryRouter>
      <SimulationView />
    </MemoryRouter>
  )

beforeEach(() => useSimulationStore.getState().reset())

describe('SimulationView (Mission Control)', () => {
  it('renders the console shell, setup dials and KPI ribbon', () => {
    renderPage()
    expect(screen.getByText('Migration Simulation')).toBeInTheDocument()
    expect(screen.getByText('Mission Control')).toBeInTheDocument()
    expect(screen.getByText('ORG ⟳')).toBeInTheDocument()
    expect(screen.getByText('SEAT ⟳')).toBeInTheDocument()
    expect(screen.getByText(/Mosca/)).toBeInTheDocument()
    expect(screen.getByText('Phases cleared')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /End Quarter/ })).toBeInTheDocument()
    // exit affordance back to the hub
    expect(screen.getByRole('link', { name: /Exit to hub/i })).toHaveAttribute('href', '/')
  })

  it('clicking a phase in the journey switches the active phase ops', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pilots/i })) // P5
    expect(screen.getByText(/PHASE 5/)).toBeInTheDocument()
  })

  it('a decision move reveals a context-aware verdict', () => {
    renderPage()
    expect(screen.getByText('Next move — choose your play')).toBeInTheDocument()
    // default phase p3 — pick the sound play
    fireEvent.click(screen.getByRole('button', { name: /Score Tier-1/i }))
    expect(screen.getByText('✓ Sound move')).toBeInTheDocument()
  })

  it('the P5 "go pure" play is a compliance FAIL under the DE hybrid mandate', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pilots/i })) // go to P5
    fireEvent.click(screen.getByRole('button', { name: /Cut straight to PURE/i }))
    expect(screen.getByText('✕ This leads to failure')).toBeInTheDocument()
    expect(screen.getByText(/Compliance FAIL/)).toBeInTheDocument()
  })

  it('End Quarter advances the turn and opens the Quarter Report', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
    expect(screen.getByText('Quarter Report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
  })
})
