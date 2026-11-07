// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CSWP39AgilityExplorer } from './CSWP39AgilityExplorer'
vi.mock('../MaturityEvidenceGrid', () => ({ MaturityEvidenceGrid: () => null }))
describe('tier navigation is exploration', () => {
  it('does not present the default tier as achieved', () => {
    render(
      <MemoryRouter>
        <CSWP39AgilityExplorer params={{ cswpview: 'maturity' }} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Explore maturity tiers' }))
    expect(screen.getByRole('heading', { name: /Exploring tier 2/ })).toBeInTheDocument()
    expect(screen.getByText(/does not assess or establish/)).toBeInTheDocument()
    expect(screen.queryByText(/You are here/)).not.toBeInTheDocument()
  })
  it('clicking the highest tier changes only the explored example', () => {
    render(
      <MemoryRouter>
        <CSWP39AgilityExplorer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Explore maturity tiers' }))
    fireEvent.click(screen.getByRole('button', { name: /Tier 4/ }))
    expect(
      screen.getByRole('heading', { name: 'Highest tier in this overview' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Top tier reached')).not.toBeInTheDocument()
  })
})
