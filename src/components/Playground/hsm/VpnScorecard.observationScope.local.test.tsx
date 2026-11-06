// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { VpnScorecard } from './VpnScorecard'
import { useVpnPacketStore } from '@/store/useVpnPacketStore'
import { EXCHANGE_TYPE } from '@/utils/isakmp'

const props = {
  tunnelEstablished: true,
  keMode: 'hybrid' as const,
  authAlg: 'ML-DSA-65',
  fragmentationEnabled: true,
  mtu: 576,
}
function packet(nextPayload: number, size = 28, exchangeType: number = EXCHANGE_TYPE.IKE_SA_INIT) {
  const bytes = new Uint8Array(size)
  bytes.fill(1, 0, 16)
  bytes[16] = nextPayload
  bytes[17] = 0x20
  bytes[18] = exchangeType
  new DataView(bytes.buffer).setUint32(24, size, false)
  useVpnPacketStore
    .getState()
    .addPacket({ srcIp: '192.0.2.1', destIp: '192.0.2.2', srcPort: 500, destPort: 500, bytes })
}
function indicator(label: string) {
  return within(screen.getByText(label).closest('div')!)
}
describe('VPN retained-header observation scope', () => {
  beforeEach(() => useVpnPacketStore.getState().clear())
  it('keeps existing final-phase visibility gating and does not claim an empty measurement', () => {
    const { rerender } = render(<VpnScorecard {...props} tunnelEstablished={false} />)
    expect(screen.queryByTestId('vpn-scorecard')).not.toBeInTheDocument()
    rerender(<VpnScorecard {...props} />)
    expect(screen.getByText('No retained capture; comparison not assessed')).toBeInTheDocument()
    expect(screen.queryByText(/-100%/)).not.toBeInTheDocument()
    expect(screen.queryByText('Tunnel Established')).not.toBeInTheDocument()
  })
  it('does not infer fragmentation from an oversized packet plus an enabled preference', () => {
    packet(33, 1600)
    render(<VpnScorecard {...props} />)
    expect(
      indicator('SKF header (Next Payload 53)').getByText('Not observed in retained capture')
    ).toBeInTheDocument()
    expect(screen.getByText('Enabled; peer support not assessed')).toBeInTheDocument()
    expect(screen.getByText('Retained UDP payload bytes')).toBeInTheDocument()
    expect(within(screen.getByTestId('vpn-scorecard')).getByText('1,600')).toBeInTheDocument()
    expect(screen.queryByText('RFC 9370 (Multiple KE)')).not.toBeInTheDocument()
  })
  it('reports header 53 despite a disabled current preference without validating its absent fragment body', () => {
    packet(53, 28, EXCHANGE_TYPE.IKE_AUTH)
    render(<VpnScorecard {...props} fragmentationEnabled={false} />)
    expect(
      indicator('SKF header (Next Payload 53)').getByText(
        'Observed; fragment validity and reassembly not assessed'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText('Observed; peer authentication not assessed')).toBeInTheDocument()
  })
  it('distinguishes requested hybrid/ML-DSA selections from an absent INTERMEDIATE header and unassessed peer outcomes', () => {
    packet(33)
    render(<VpnScorecard {...props} />)
    expect(screen.getByText('hybrid: ML-KEM-768')).toBeInTheDocument()
    expect(screen.getByText('ML-DSA-65')).toBeInTheDocument()
    expect(
      indicator('IKE_INTERMEDIATE header').getByText('Not observed in retained capture')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Current selections are requests, not negotiated outcomes/)
    ).toBeInTheDocument()
    expect(screen.queryByText('PQC authentication')).not.toBeInTheDocument()
  })
})
