// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { PROTOCOL_SIZE_DATA } from './protocolSizeComparisons'
import {
  buildIkeV2Exchange,
  IKE_AUTH_SK_BYTES,
  KEM_PUBKEY_BYTES,
  KEM_CIPHERTEXT_BYTES,
} from './ikev2Constants'
import { ProtocolComparisonTable } from '../simulate/ProtocolComparisonTable'

const ike = () =>
  PROTOCOL_SIZE_DATA.find((row) => row.protocol === 'IKEv2' && row.mode === 'pure-pqc')!
afterEach(() => vi.unstubAllGlobals())
describe('selected IKE ML-KEM-768 / ML-DSA-65 rounded model', () => {
  it('counts the existing complete two-direction model, replacing both PSK SK payloads', () => {
    const base = buildIkeV2Exchange('pure-pqc', 768)
    const auth = [base.ikeAuth.initiator, base.ikeAuth.responder]
    const pskSk = auth
      .flatMap((m) => m.payloads)
      .filter((p) => p.abbreviation === 'SK')
      .reduce((sum, p) => sum + p.sizeBytes, 0)
    expect(base.totalBytes).toBe(3544)
    expect(pskSk).toBe(960)
    expect(ike().handshakeBytes).toBe(base.totalBytes - pskSk + 2 * IKE_AUTH_SK_BYTES['ML-DSA-65'])
    expect(ike().handshakeBytes).toBe(20584)
    expect(ike().handshakeBytes).not.toBe(base.totalBytes - 480 + IKE_AUTH_SK_BYTES['ML-DSA-65'])
    expect(ike().handshakeBytes).toBeGreaterThan(2 * (1952 + 3309 + 3309))
  })
  it('retains the selected raw KEX parameter sizes, authentication and existing two RTTs', () => {
    expect(ike().publicKeyBytes).toBe(KEM_PUBKEY_BYTES[768])
    expect(ike().ciphertextBytes).toBe(KEM_CIPHERTEXT_BYTES[768])
    expect(ike().roundTrips).toBe(2)
    expect(ike().authAlgorithm).toBe('ML-DSA-65')
    expect(ike().modeLabel).toMatch(/rounded model/)
    expect(ike().notes).toMatch(/not measured/i)
    expect(ike().notes).toMatch(/9,000/)
  })
  it.each([1440, 390])(
    'renders the corrected selected row and chart from the same model at width%s',
    (width) => {
      vi.stubGlobal('innerWidth', width)
      render(<ProtocolComparisonTable />)
      fireEvent.click(screen.getByRole('button', { name: 'IKEv2' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pure PQC' }))
      const row = screen.getByRole('row', { name: /ML-KEM-768/ })
      expect(within(row).getByText('20,584 B')).toBeInTheDocument()
      expect(screen.getAllByText('20,584 B')).toHaveLength(2)
      expect(
        screen.getAllByText(/ML-KEM-768.*ML-DSA-65.*rounded model/).length
      ).toBeGreaterThanOrEqual(2)
      expect(screen.queryByText('3,544 B')).not.toBeInTheDocument()
    }
  )
})
