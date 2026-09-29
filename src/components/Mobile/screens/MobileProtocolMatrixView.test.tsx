// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { MobileProtocolMatrixView } from './MobileProtocolMatrixView'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'

// Real data throughout — every assertion derives from the SAME PROTOCOL_MATRIX
// PQCProtocolMatrix.tsx (desktop) renders from, not invented counts.
function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const renderAt = (entry = '/algorithms?tab=support') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <MobileProtocolMatrixView />
      <Probe />
    </MemoryRouter>
  )
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''

describe('MobileProtocolMatrixView', () => {
  const visibleRows = PROTOCOL_MATRIX.filter((r) => !r.historical)

  it('shows the real default-visible protocol count, historical rows hidden', () => {
    renderAt()
    expect(
      screen.getByText(`${visibleRows.length} of ${visibleRows.length} protocols`)
    ).toBeInTheDocument()
    const historical = PROTOCOL_MATRIX.find((r) => r.historical)
    if (historical) {
      expect(screen.queryByText(historical.name)).not.toBeInTheDocument()
    }
  })

  it('renders a real protocol row with its real name', () => {
    renderAt()
    expect(screen.getByText(visibleRows[0].name)).toBeInTheDocument()
  })

  it('search filters to matching protocols only', () => {
    renderAt()
    const target = visibleRows.find((r) => r.name.toLowerCase().includes('tls'))
    expect(target).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Search protocols'), {
      target: { value: target!.name },
    })
    expect(screen.getByText(target!.name)).toBeInTheDocument()
    const nonMatch = visibleRows.find(
      (r) => !r.name.toLowerCase().includes(target!.name.toLowerCase().slice(0, 3))
    )
    if (nonMatch) {
      expect(screen.queryByText(nonMatch.name)).not.toBeInTheDocument()
    }
  })

  it('tapping a row opens the detail sheet with the real description and dimensions', () => {
    renderAt()
    const row = visibleRows[0]
    fireEvent.click(screen.getByText(row.name).closest('button')!)
    expect(screen.getByText(row.description)).toBeInTheDocument()
    expect(screen.getByText('Pure KEM')).toBeInTheDocument()
    expect(screen.getByText('Hybrid Sig')).toBeInTheDocument()
  })

  it('states the real desktop-only cuts honestly', () => {
    renderAt()
    expect(
      screen.getByText(/Availability and sort filters, the heatmap-table view/i)
    ).toBeInTheDocument()
  })

  it('opens the detail sheet for ?protocol=<id> on load (same param as desktop)', () => {
    const row = visibleRows[0]
    renderAt(`/algorithms?tab=support&protocol=${row.id}`)
    expect(screen.getByText(row.description)).toBeInTheDocument()
  })

  it('writes ?protocol=<id> when a row is tapped', () => {
    const row = visibleRows[0]
    renderAt()
    fireEvent.click(screen.getByText(row.name).closest('button')!)
    expect(urlSearch()).toContain(`protocol=${row.id}`)
  })

  it('shows a not-found notice for an unknown ?protocol id', () => {
    renderAt('/algorithms?tab=support&protocol=no-such-protocol')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-protocol')
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(urlSearch()).not.toContain('protocol=')
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })
})
