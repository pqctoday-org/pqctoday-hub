// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VpnScorecard } from './VpnScorecard'
import { useVpnPacketStore } from '@/store/useVpnPacketStore'
import { EXCHANGE_TYPE, ISAKMP_HEADER_BYTES } from '@/utils/isakmp'

/** Build a valid ISAKMP packet with a given exchange type / message ID / total size. */
function buildIsakmpPacket(exchangeType: number, messageId: number, totalBytes?: number) {
  const size = Math.max(totalBytes ?? ISAKMP_HEADER_BYTES, ISAKMP_HEADER_BYTES)
  const bytes = new Uint8Array(size)
  for (let i = 0; i < 16; i++) bytes[i] = i + 1 // SPIs
  bytes[16] = 33 // next payload
  bytes[17] = 0x20 // IKEv2
  bytes[18] = exchangeType
  bytes[19] = 0x08 // initiator flag
  const dv = new DataView(bytes.buffer)
  dv.setUint32(20, messageId, false)
  dv.setUint32(24, size, false)
  return bytes
}

function addPacket(exchangeType: number, messageId: number, totalBytes?: number) {
  useVpnPacketStore.getState().addPacket({
    srcIp: '192.168.0.1',
    destIp: '192.168.0.2',
    srcPort: 500,
    destPort: 500,
    bytes: buildIsakmpPacket(exchangeType, messageId, totalBytes),
  })
}

const defaultProps = {
  tunnelEstablished: true,
  keMode: 'classical' as const,
  authAlg: 'RSA-2048',
  fragmentationEnabled: false,
  mtu: 1500,
}

describe('VpnScorecard', () => {
  beforeEach(() => {
    useVpnPacketStore.getState().clear()
  })

  it('renders nothing until the tunnel is established', () => {
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0)
    render(<VpnScorecard {...defaultProps} tunnelEstablished={false} />)
    expect(screen.queryByTestId('vpn-scorecard')).toBeNull()
  })

  it('renders the scorecard once the tunnel is established', () => {
    render(<VpnScorecard {...defaultProps} />)
    expect(screen.getByTestId('vpn-scorecard')).toBeInTheDocument()
    expect(screen.getByText('Tunnel Established')).toBeInTheDocument()
  })

  it('counts one round trip per distinct (exchangeType, messageId) pair', () => {
    // IKE_SA_INIT request + response share messageId 0 → one round trip.
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0)
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0)
    // IKE_AUTH request + response share messageId 1 → second round trip.
    addPacket(EXCHANGE_TYPE.IKE_AUTH, 1)
    addPacket(EXCHANGE_TYPE.IKE_AUTH, 1)
    render(<VpnScorecard {...defaultProps} />)
    const label = screen.getByText('Round trips')
    expect(label.parentElement?.textContent).toContain('2')
  })

  it('counts multiple IKE_INTERMEDIATE rounds as distinct round trips', () => {
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0)
    addPacket(EXCHANGE_TYPE.IKE_INTERMEDIATE, 1)
    addPacket(EXCHANGE_TYPE.IKE_INTERMEDIATE, 2)
    addPacket(EXCHANGE_TYPE.IKE_AUTH, 3)
    render(<VpnScorecard {...defaultProps} keMode="hybrid" />)
    const label = screen.getByText('Round trips')
    expect(label.parentElement?.textContent).toContain('4')
  })

  it('excludes INFORMATIONAL exchanges from the round-trip count', () => {
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0)
    addPacket(EXCHANGE_TYPE.INFORMATIONAL, 5)
    addPacket(EXCHANGE_TYPE.INFORMATIONAL, 6)
    render(<VpnScorecard {...defaultProps} />)
    const label = screen.getByText('Round trips')
    // Only the IKE_SA_INIT pair counts; INFORMATIONAL msgIds 5/6 are ignored.
    expect(label.parentElement?.textContent).toContain('1')
    expect(label.parentElement?.textContent).not.toContain('3')
  })

  it('computes overhead % against the 1,784-byte classical baseline', () => {
    // Two packets totalling 3,568 bytes = exactly 2× the 1,784 B baseline → +100%.
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0, 1784)
    addPacket(EXCHANGE_TYPE.IKE_AUTH, 1, 1784)
    render(<VpnScorecard {...defaultProps} keMode="pure-pqc" />)
    const card = screen.getByTestId('vpn-scorecard')
    expect(card.textContent).toContain('3,568')
    expect(card.textContent).toContain('1,784')
    expect(card.textContent).toContain('+100%')
  })

  it('shows 0% overhead when total bytes equal the classical baseline', () => {
    addPacket(EXCHANGE_TYPE.IKE_SA_INIT, 0, 892)
    addPacket(EXCHANGE_TYPE.IKE_AUTH, 1, 892)
    render(<VpnScorecard {...defaultProps} />)
    expect(screen.getByTestId('vpn-scorecard').textContent).toContain('+0%')
  })

  it('turns the PQC authentication indicator on for ML-DSA-65', () => {
    render(<VpnScorecard {...defaultProps} keMode="pure-pqc" authAlg="ML-DSA-65" />)
    const label = screen.getByText('PQC authentication')
    expect(label.className).toContain('text-foreground')
    // Subtitle echoes the uppercase auth algorithm.
    expect(screen.getByText('ML-DSA-65')).toBeInTheDocument()
  })

  it('keeps the PQC authentication indicator off for RSA auth', () => {
    render(<VpnScorecard {...defaultProps} authAlg="RSA-2048" />)
    const label = screen.getByText('PQC authentication')
    expect(label.className).toContain('text-muted-foreground')
  })

  it('turns the PQC key exchange indicator off in classical mode', () => {
    render(<VpnScorecard {...defaultProps} keMode="classical" />)
    const label = screen.getByText('PQC key exchange')
    expect(label.className).toContain('text-muted-foreground')
  })

  it('displays the active MTU', () => {
    render(<VpnScorecard {...defaultProps} mtu={1400} />)
    expect(screen.getByText('1400 B')).toBeInTheDocument()
  })
})
