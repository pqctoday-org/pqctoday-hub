// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProtocolComparisonTable } from './ProtocolComparisonTable'
describe('measured SSH comparison', () => {
  it('keeps table, chart and the expanded packet accounting consistent', () => {
    render(<ProtocolComparisonTable />)
    fireEvent.click(screen.getByRole('button', { name: 'SSH' }))
    const table = screen.getByRole('table', { name: 'Protocol size comparison' })
    for (const value of ['766 B', '3,038 B', '8,134 B'])
      expect(within(table).getByRole('cell', { name: value })).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'SSH ML-KEM · ML-DSA-65 auth: 8134 handshake bytes' })
    ).toBeVisible()
    const region = screen.getByRole('region', { name: 'Measured SSH transport examples' })
    expect(within(region).getByText(/Client login, application data and TCP\/IP/)).toBeVisible()
    const summary = within(region).getByText('ML-KEM · ML-DSA-65 auth: 8,134 B')
    fireEvent.click(summary)
    const detail = summary.closest('details')!
    const packets = within(detail).getByRole('table', { name: 'Captured SSH transport bytes' })
    expect(within(packets).getAllByRole('row')).toHaveLength(10)
    expect(within(packets).getByRole('cell', { name: '6,416' })).toBeVisible()
    expect(within(packets).getByRole('cell', { name: '8,134' })).toBeVisible()
    expect(within(detail).getByText(/3,309 B raw, 3,329 B/)).toBeVisible()
  })
  it('sorts both directions and respects protocol and mode filters', () => {
    render(<ProtocolComparisonTable />)
    fireEvent.click(screen.getByRole('button', { name: 'SSH' }))
    const table = screen.getByRole('table', { name: 'Protocol size comparison' })
    const totals = () =>
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((r) => within(r).getAllByRole('cell')[3].textContent)
    fireEvent.click(screen.getByRole('button', { name: /^Handshake/ }))
    expect(totals()).toEqual(['766 B', '3,038 B', '8,134 B'])
    fireEvent.click(screen.getByRole('button', { name: /^Handshake/ }))
    expect(totals()).toEqual(['8,134 B', '3,038 B', '766 B'])
    fireEvent.click(screen.getByRole('button', { name: 'Pure PQC' }))
    expect(totals()).toEqual(['8,134 B'])
    expect(screen.queryByText('X25519 · Ed25519 auth: 766 B')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'TLS 1.3' }))
    expect(
      screen.queryByRole('region', { name: 'Measured SSH transport examples' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '16,944 B' })).toBeVisible()
  })
})
