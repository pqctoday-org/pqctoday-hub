// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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
    // Player migrated an estate link — a real run is underway — and opened the
    // console this session, so the persisted-run fallback is live.
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    sessionStorage.setItem('sim:opened', '1')
    renderBar()
    expect(screen.getByRole('link', { name: /Resume Simulation/i })).toHaveAttribute(
      'href',
      '/simulation'
    )
  })

  it('stays hidden for a run left in localStorage when the sim was not opened this session', () => {
    // Saved progress survives in localStorage across sessions; without opening
    // the console this session there is no live run, so the strip must not show.
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    renderBar()
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })

  it('stays hidden once dismissed, even with a run in progress', () => {
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    sessionStorage.setItem('sim:opened', '1')
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }))
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })

  it('stays hidden after the player quits via the HUB button (even mid-run)', () => {
    // Active run, but the player chose to leave the sim via "← HUB".
    useSimulationStore.getState().setEdgeDecision('lb-app1-mTLS', 'hybrid')
    sessionStorage.setItem('sim:opened', '1')
    sessionStorage.setItem('sim:exited', '1')
    renderBar()
    expect(screen.queryByText(/Resume Simulation/i)).not.toBeInTheDocument()
  })
})
