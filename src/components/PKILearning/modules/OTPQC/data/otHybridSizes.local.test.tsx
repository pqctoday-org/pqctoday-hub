// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OT_PROTOCOLS } from './otProtocolData'
import { ProtocolSecurityAnalyzer } from '../workshop/ProtocolSecurityAnalyzer'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

const examples = [
  ['iec61850-mms', 32, 1120, 'X25519MLKEM768', 1216],
  ['iec60870-5-104', 32, 1120, 'X25519MLKEM768', 1216],
  ['iccp-tase2', 32, 1120, 'X25519MLKEM768', 1216],
  ['modbus-tcp-security', 32, 1120, 'X25519MLKEM768', 1216],
  ['bacnet-sc', 32, 1120, 'X25519MLKEM768', 1216],
  ['ieee-2030-5', 65, 1153, 'SecP256r1MLKEM768', 1249],
] as const

describe('directional TLS hybrid teaching sizes', () => {
  // RFC 10024 sections 4.1/4.2; FIPS 203 Table 3 supplies the ML-KEM component lengths.
  it.each(examples)(
    '%s names the example group, direction and excluded traffic',
    (id, classical, server, group, client) => {
      const layer = OT_PROTOCOLS.find((p) => p.id === id)!.cryptoLayers[0]
      expect(layer.classicalBytes).toBe(classical)
      expect(layer.pqcBytes).toBe(server)
      expect(server).toBe(1088 + classical)
      expect(client).toBe(1184 + classical)
      expect(layer.sizeBasis).toContain(
        `${group} server key_exchange ${server.toLocaleString('en-US')} B`
      )
      expect(layer.sizeBasis).toContain(`client ${client.toLocaleString('en-US')} B (RFC 10024)`)
      expect(layer.notes).toContain(
        'not a sector-standard requirement or a claim of endpoint support'
      )
      expect(layer.notes).toContain(
        'Sizes exclude TLS framing, certificates and the rest of the handshake'
      )
    }
  )

  it('does not apply the TLS example to the ICCP IKEv2 option', () => {
    expect(OT_PROTOCOLS.find((p) => p.id === 'iccp-tase2')!.cryptoLayers[0].notes).toContain(
      'for TLS only, not IKEv2'
    )
  })

  it('renders both group examples and preserves selected protocol state on collapse', () => {
    render(
      <ProtocolSecurityAnalyzer
        onComplete={vi.fn()}
        initialSelected={['iec61850-mms', 'ieee-2030-5']}
      />
    )
    expect(screen.getByText(/X25519MLKEM768 server key_exchange 1,120 B/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /IEEE 2030.5 \(DER\)/ }))
    expect(screen.getByText(/SecP256r1MLKEM768 server key_exchange 1,153 B/)).toBeVisible()
    expect(screen.getByText(/client 1,249 B/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /IEEE 2030.5 \(DER\)/ }))
    expect(screen.queryByText(/SecP256r1MLKEM768 server key_exchange/)).not.toBeInTheDocument()
    expect(screen.getByText('2 protocols selected')).toBeVisible()
  })
})
