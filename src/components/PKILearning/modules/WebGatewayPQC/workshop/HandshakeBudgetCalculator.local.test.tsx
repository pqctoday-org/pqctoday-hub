// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HandshakeBudgetCalculator } from './HandshakeBudgetCalculator'

describe('actual measured comparison controls and export', () => {
  it('changes profile, certificate alternative and explicit traffic rate while preserving seven rows', () => {
    render(<HandshakeBudgetCalculator />)
    expect(screen.getByTestId('captured-total')).toHaveTextContent('2,233 B')
    fireEvent.click(screen.getByRole('button', { name: /^Captured profile/ }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-KEM-768 + ML-DSA-65' }))
    expect(screen.getByTestId('captured-total')).toHaveTextContent('16,944 B')
    fireEvent.click(screen.getByRole('checkbox', { name: /Certificate compression/ }))
    expect(screen.getByTestId('variant-total')).toHaveTextContent('16,769 B')
    expect(screen.getByTestId('handshake-savings')).toHaveTextContent(
      '175 B saved; 7 B negotiation included'
    )
    fireEvent.click(screen.getByRole('button', { name: /^New handshakes/ }))
    fireEvent.click(screen.getByRole('option', { name: '1,000 / sec' }))
    expect(screen.getByTestId('handshake-bandwidth')).toHaveTextContent('16,769,000 B/s')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Consider QUIC transport' }))
    expect(screen.getByTestId('variant-total')).toHaveTextContent('16,769 B')
    const link = screen.getByRole('link', { name: 'Export comparison JSON' })
    const exported = JSON.parse(decodeURIComponent(link.getAttribute('href')!.split(',')[1]))
    expect(exported.adjustedBytes).toBe(16769)
    expect(exported.messages).toHaveLength(7)
    expect(exported.messages[4].bytes).toBe(3317)
    expect(exported.messages[5].bytes).toBe(36)
    expect(exported.messages[6].bytes).toBe(36)
    expect(exported.scope).toMatch(/not negotiated captures/)
    expect(exported.newConnectionsPerSecond).toBe(1000)
  })
  it('shows the same-key alternative and refuses an unmeasured combination without false savings', () => {
    render(<HandshakeBudgetCalculator />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Raw public key alternative/ }))
    expect(screen.getByTestId('variant-total')).toHaveTextContent('909 B')
    expect(screen.getByText(/external identity-to-key trust binding/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: /Certificate compression/ }))
    expect(screen.getByRole('status')).toHaveTextContent('No compressed-SPKI measurement')
    expect(screen.getByTestId('variant-total')).toHaveTextContent('Unavailable')
    expect(screen.queryByTestId('handshake-savings')).not.toBeInTheDocument()
    const data = JSON.parse(
      decodeURIComponent(
        screen
          .getByRole('link', { name: 'Export comparison JSON' })
          .getAttribute('href')!
          .split(',')[1]
      )
    )
    expect(data.adjustedBytes).toBeNull()
    expect(data.unsupportedReason).toMatch(/choose compression or raw public key/)
  })
})
