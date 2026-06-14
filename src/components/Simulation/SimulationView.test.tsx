// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('the tree drives the next move; the right call links to the resource', () => {
    renderPage()
    expect(screen.getByText('Next move — pick the right play')).toBeInTheDocument()
    // default phase p3, fresh state → first unlocked step is 3.1 Learn: PQC Risk Management
    fireEvent.click(screen.getByRole('button', { name: /Learn: PQC Risk Management/ }))
    expect(screen.getByText(/Right call/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open →/i })).toHaveAttribute(
      'href',
      '/learn/pqc-risk-management'
    )
  })

  it('a wrong move surfaces a framework Common Failure', () => {
    renderPage()
    const correctBtn = screen.getByRole('button', { name: /Learn: PQC Risk Management/ })
    const grid = correctBtn.parentElement as HTMLElement
    const wrong = within(grid)
      .getAllByRole('button')
      .find((b) => !/PQC Risk Management/.test(b.textContent ?? ''))
    fireEvent.click(wrong!)
    expect(screen.getByText('✕ Common failure')).toBeInTheDocument()
  })

  it('right column shows phase artifacts and gates the architecture view by phase', () => {
    renderPage()
    // p3 (Risk Scoring) produces artifacts but is not an architecture phase
    expect(screen.getByText(/Risk Scoring artifacts/)).toBeInTheDocument()
    expect(screen.queryByText(/Your architecture/)).not.toBeInTheDocument()
    // P1 (Discovery) acts on the estate → architecture view appears
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    expect(screen.getByText(/Your architecture/)).toBeInTheDocument()
  })

  it('End Quarter advances the turn and opens the Quarter Report', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
    expect(screen.getByText('Quarter Report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
  })
})
