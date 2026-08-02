// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ExecutiveWalkthrough } from './ExecutiveWalkthrough'
import { useCommandCenterOnboardingStore } from '@/store/useCommandCenterOnboardingStore'

function renderWalkthrough() {
  return render(
    <MemoryRouter>
      <ExecutiveWalkthrough />
    </MemoryRouter>
  )
}

describe('ExecutiveWalkthrough', () => {
  beforeEach(() => {
    useCommandCenterOnboardingStore.setState({ hasSeenExecWalkthrough: false })
  })

  it('renders the three real registry tools in order, as steps 1-3', () => {
    renderWalkthrough()
    expect(screen.getByText('Board pack in 3 steps')).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/business/tools/board-pitch')
    expect(links[1]).toHaveAttribute('href', '/business/tools/roi-calculator')
    expect(links[2]).toHaveAttribute('href', '/business/tools/policy-generator')
  })

  it('marks the walkthrough seen when dismissed', () => {
    renderWalkthrough()
    fireEvent.click(screen.getByRole('button', { name: /dismiss walkthrough/i }))
    expect(useCommandCenterOnboardingStore.getState().hasSeenExecWalkthrough).toBe(true)
  })

  it('marks the walkthrough seen when a step is clicked', () => {
    renderWalkthrough()
    fireEvent.click(screen.getAllByRole('link')[0])
    expect(useCommandCenterOnboardingStore.getState().hasSeenExecWalkthrough).toBe(true)
  })
})
