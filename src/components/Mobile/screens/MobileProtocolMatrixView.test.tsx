// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { MobileProtocolMatrixView } from './MobileProtocolMatrixView'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import {
  passesAvailabilityFilter,
  passesStatusFilter,
  sortProtocolRows,
} from '@/components/Algorithms/protocolMatrixState'

// Real data throughout — every assertion derives from the SAME PROTOCOL_MATRIX
// PQCProtocolMatrix.tsx (desktop) renders from, not invented counts.
function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
function GoTo({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      {`go ${to}`}
    </Button>
  )
}
const renderAt = (entry = '/algorithms?tab=support', links: string[] = []) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <MobileProtocolMatrixView />
      <Probe />
      {links.map((to) => (
        <GoTo key={to} to={to} />
      ))}
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

describe('MobileProtocolMatrixView — desktop matrix* URL state', () => {
  const visibleRows = PROTOCOL_MATRIX.filter((r) => !r.historical)
  const searchBox = () => screen.getByPlaceholderText('Search protocols') as HTMLInputElement
  const countLine = (n: number) => `${n} of ${visibleRows.length} protocols`

  it('?matrixQ seeds the search box and filters the list', () => {
    const target = visibleRows.find((r) => r.name.toLowerCase().includes('ssh'))!
    renderAt('/algorithms?tab=support&matrixQ=ssh')
    expect(searchBox().value).toBe('ssh')
    expect(screen.getByText(target.name)).toBeInTheDocument()
  })

  it('?matrixStatus (multi, OR) presses every listed chip and filters like desktop', () => {
    renderAt('/algorithms?tab=support&matrixStatus=rfc,experimental')
    const expected = visibleRows.filter((r) => passesStatusFilter(r, ['rfc', 'experimental']))
    expect(screen.getByText(countLine(expected.length))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '✓ RFC' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '⚠ Experimental' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: '⊳ Draft' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('?matrixAvailability + ?matrixSort apply, show a from-link chip, and clear', () => {
    renderAt('/algorithms?tab=support&matrixAvailability=has-oss&matrixSort=name:desc')
    const expected = sortProtocolRows(
      visibleRows.filter((r) => passesAvailabilityFilter(r, 'has-oss')),
      'name',
      'desc'
    )
    expect(screen.getByText(countLine(expected.length))).toBeInTheDocument()
    expect(screen.getByTestId('matrix-link-filters')).toHaveTextContent(
      'Has OSS · Sorted by Name (descending)'
    )
    const names = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((t) => expected.some((r) => t.startsWith(r.name)))
    expect(names[0].startsWith(expected[0].name)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Clear link filter and sort' }))
    expect(urlSearch()).not.toContain('matrixAvailability')
    expect(urlSearch()).not.toContain('matrixSort')
    expect(screen.getByText(countLine(visibleRows.length))).toBeInTheDocument()
  })

  it('typing and chip taps mirror to ?matrixQ / ?matrixStatus (replace)', () => {
    renderAt()
    fireEvent.change(searchBox(), { target: { value: 'tls' } })
    expect(urlSearch()).toContain('matrixQ=tls')
    fireEvent.click(screen.getByRole('button', { name: '⊳ Draft' }))
    fireEvent.click(screen.getByRole('button', { name: '✓ RFC' }))
    expect(urlSearch()).toContain('matrixStatus=draft%2Crfc')
    fireEvent.click(screen.getByRole('button', { name: '⊳ Draft' }))
    expect(urlSearch()).toContain('matrixStatus=rfc')
    expect(urlSearch()).not.toContain('draft')
  })

  it('follows a second link while mounted', () => {
    const next = '/algorithms?tab=support&matrixQ=ssh'
    renderAt('/algorithms?tab=support&matrixQ=tls', [next])
    expect(searchBox().value).toBe('tls')
    fireEvent.click(screen.getByRole('button', { name: `go ${next}` }))
    expect(searchBox().value).toBe('ssh')
  })
})
