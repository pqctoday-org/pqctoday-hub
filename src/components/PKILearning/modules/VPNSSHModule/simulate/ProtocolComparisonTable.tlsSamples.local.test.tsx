// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProtocolComparisonTable } from './ProtocolComparisonTable'

describe('measured TLS comparison', () => {
  it('keeps table, chart and disclosed message totals consistent', () => {
    render(<ProtocolComparisonTable />)
    fireEvent.click(screen.getByRole('button', { name: 'TLS 1.3' }))
    const table = screen.getByRole('table', { name: 'Protocol size comparison' })
    for (const total of ['2,233 B', '4,499 B', '16,944 B'])
      expect(within(table).getByRole('cell', { name: total })).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'TLS 1.3 X25519 · RSA-2048 auth: 2233 handshake bytes' })
    ).toBeVisible()
    expect(
      screen.getByRole('img', {
        name: 'TLS 1.3 X25519MLKEM768 · RSA-2048 auth: 4499 handshake bytes',
      })
    ).toBeVisible()
    expect(
      screen.getByRole('img', { name: 'TLS 1.3 MLKEM768 · ML-DSA-65 auth: 16944 handshake bytes' })
    ).toBeVisible()
    const region = screen.getByRole('region', { name: 'Measured TLS handshake examples' })
    expect(within(region).getByText(/TLS_AES_128_GCM_SHA256/)).toBeVisible()
    expect(within(region).getByText(/draft-ietf-tls-mldsa-06/)).toBeVisible()
    fireEvent.click(within(region).getByText('MLKEM768 · ML-DSA-65 auth: 16,944 B'))
    const messages = within(region)
      .getByText('MLKEM768 · ML-DSA-65 auth: 16,944 B')
      .closest('details')!
      .querySelector('table')!
    expect(within(messages).getAllByRole('row')).toHaveLength(9) // header + 7 messages + total
    expect(within(messages).getByRole('cell', { name: '3,317' })).toBeVisible()
    expect(within(messages).getByRole('cell', { name: '11,100' })).toBeVisible()
    expect(within(messages).getByRole('cell', { name: '16,944' })).toBeVisible()
    expect(within(region).getByText(/3,309 B CertificateVerify signature/)).toBeVisible()
  })

  it('sorts by measured bytes in both directions and scopes the breakdown with filters', () => {
    render(<ProtocolComparisonTable />)
    fireEvent.click(screen.getByRole('button', { name: 'TLS 1.3' }))
    const table = screen.getByRole('table', { name: 'Protocol size comparison' })
    const totals = () =>
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[3].textContent)
    fireEvent.click(screen.getByRole('button', { name: /^Handshake/ }))
    expect(totals()).toEqual(['2,233 B', '4,499 B', '16,944 B'])
    fireEvent.click(screen.getByRole('button', { name: /^Handshake/ }))
    expect(totals()).toEqual(['16,944 B', '4,499 B', '2,233 B'])
    fireEvent.click(screen.getByRole('button', { name: 'Pure PQC' }))
    expect(totals()).toEqual(['16,944 B'])
    const region = screen.getByRole('region', { name: 'Measured TLS handshake examples' })
    expect(within(region).queryByText('X25519 · RSA-2048 auth: 2,233 B')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'SSH' }))
    expect(
      screen.queryByRole('region', { name: 'Measured TLS handshake examples' })
    ).not.toBeInTheDocument()
  })
})
