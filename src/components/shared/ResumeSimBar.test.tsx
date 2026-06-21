// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResumeSimBar } from './ResumeSimBar'
import { useSimulationStore } from '@/store/useSimulationStore'

const renderBar = () =>
  render(
    <MemoryRouter>
      <ResumeSimBar />
    </MemoryRouter>
  )

beforeEach(() => {
  sessionStorage.clear()
  // Start every case from a fresh run (no progress) so visibility is driven
  // only by what each test sets up.
  useSimulationStore.getState().reset()
})

describe('ResumeSimBar', () => {
  it('renders nothing when the resume flag is not set', () => {
    renderBar()
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })

  it('shows a return link to /simulation when the flag is set', () => {
    sessionStorage.setItem('sim:resume', '1')
    renderBar()
    expect(screen.getByRole('link', { name: /Resume Simulation/i })).toHaveAttribute(
      'href',
      '/simulation'
    )
  })

  it('can be dismissed (clears the flag)', () => {
    sessionStorage.setItem('sim:resume', '1')
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
    expect(sessionStorage.getItem('sim:resume')).toBeNull()
  })

  it('shows when a run is in progress even without the resume flag', () => {
    // Player advanced a phase maturity level — a real run is underway.
    useSimulationStore.getState().setLevel('inventory', 1)
    renderBar()
    expect(screen.getByRole('link', { name: /Resume Simulation/i })).toHaveAttribute(
      'href',
      '/simulation'
    )
  })

  it('stays hidden once dismissed, even with a run in progress', () => {
    useSimulationStore.getState().setLevel('inventory', 1)
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })
})
