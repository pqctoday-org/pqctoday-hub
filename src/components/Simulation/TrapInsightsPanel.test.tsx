// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TrapInsightsPanel } from './TrapInsightsPanel'
import { recordTrapPick, clearTrapTally } from './simTrapTally'

function renderPanel() {
  render(
    <MemoryRouter>
      <TrapInsightsPanel />
    </MemoryRouter>
  )
}

describe('TrapInsightsPanel (PR-5)', () => {
  beforeEach(() => clearTrapTally())

  it('shows an empty state when nothing has been recorded', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /Show/ }))
    expect(screen.getByText(/No misconceptions recorded yet/i)).toBeInTheDocument()
  })

  it('ranks misconceptions most-fallen-for first and deep-links to the fixing lesson', () => {
    recordTrapPick('p0', 'Frame it as an IT-only compliance task')
    recordTrapPick('p5', 'Skip the library-readiness check')
    recordTrapPick('p0', 'Frame it as an IT-only compliance task')
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /Show/ }))

    const rows = within(screen.getByTestId('trap-insights-list')).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Frame it as an IT-only compliance task')
    expect(rows[0]).toHaveTextContent('2×')
    expect(rows[1]).toHaveTextContent('Skip the library-readiness check')

    // p0 has Learn modules → each row deep-links to /learn/<module>
    const links = screen.getAllByTestId('trap-remediation-link')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0].getAttribute('href')).toMatch(/^\/learn\//)
  })

  it('Clear empties the tally', () => {
    recordTrapPick('p0', 'x')
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /Show/ }))
    fireEvent.click(screen.getByRole('button', { name: /Clear tally/ }))
    expect(screen.getByText(/No misconceptions recorded yet/i)).toBeInTheDocument()
  })
})
