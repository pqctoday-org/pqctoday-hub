// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LearnRedesignView } from './LearnRedesignView'
import { usePersonaStore } from '@/store/usePersonaStore'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  usePersonaStore.getState().setPersona(null)
})

function renderLearn() {
  return render(
    <MemoryRouter initialEntries={['/learn']}>
      <LearnRedesignView />
    </MemoryRouter>
  )
}

describe('LearnRedesignView — mobile UX layer wiring', () => {
  it('flag off: renders the desktop redesign — its My Path / Browse all / Guided routing row', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderLearn()
    expect(screen.getAllByText(/Browse all \d+/).length).toBeGreaterThan(0)
  })

  it('flag on: renders MobileLearnScreen instead — its own compact mode tabs', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLearn()
    expect(screen.getByRole('tab', { name: 'My Path' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Browse all' })).toBeInTheDocument()
    expect(screen.queryByText(/Browse all \d+/)).not.toBeInTheDocument()
  })

  it('flag on: real persona data flows through to the mobile My Path body', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    renderLearn()
    expect(screen.getByText(/My path · Executive \/ GRC/)).toBeInTheDocument()
  })
})
