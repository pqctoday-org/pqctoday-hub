// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FirmwareSigningSimulator } from './FirmwareSigningSimulator'
const m = vi.hoisted(() => ({
  gen: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  genHss: vi.fn(),
  signHss: vi.fn(),
  verifyHss: vi.fn(),
  module: {},
  session: 7,
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: m.module },
    hSessionRef: { current: m.session },
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateMLDSAKeyPair: m.gen,
  hsm_signBytesMLDSA: m.sign,
  hsm_verifyBytes: m.verify,
  hsm_generateHSSKeyPair: m.genHss,
  hsm_statefulSignBytes: m.signHss,
  hsm_statefulVerifyBytes: m.verifyHss,
  hsm_getKeysRemaining: () => 1023,
  hsm_extractKeyValue: () => new Uint8Array(56),
}))
beforeEach(() => {
  vi.clearAllMocks()
  m.gen.mockReturnValue({ pubHandle: 11, privHandle: 12 })
  m.genHss.mockReturnValue({ pubHandle: 21, privHandle: 22 })
  m.sign.mockReturnValue(new Uint8Array(2420))
  m.signHss.mockReturnValue(new Uint8Array(2500))
  m.verify.mockReturnValueOnce(true).mockReturnValueOnce(false)
  m.verifyHss.mockReturnValueOnce(0).mockReturnValueOnce(1)
  vi.stubGlobal('crypto', {
    subtle: { digest: vi.fn(async () => new Uint8Array(32).fill(9).buffer) },
  })
})
afterEach(() => vi.unstubAllGlobals())
describe('JSON-manifest primitive signature scope', () => {
  it.each(['ml-dsa-44', 'lms'])(
    'preserves exact JSON and tamper bytes for %s without a COSE result claim',
    async (algId) => {
      render(<FirmwareSigningSimulator initial={{ algId }} />)
      fireEvent.click(screen.getByRole('button', { name: 'Sign and verify the manifest' }))
      expect(
        await screen.findByText(/Primitive signature check over these JSON bytes: valid/)
      ).toBeInTheDocument()
      const signCall = (algId === 'lms' ? m.signHss : m.sign).mock.calls[0]
      const input = signCall.at(-1) as Uint8Array
      const raw = new TextDecoder().decode(input)
      expect(JSON.parse(raw)['image-digest']).toEqual(['sha-256', '09'.repeat(32)])
      expect(raw).toBe(JSON.stringify(JSON.parse(raw), null, 1))
      const verifyCalls = (algId === 'lms' ? m.verifyHss : m.verify).mock.calls
      expect(verifyCalls[0].at(-2)).toEqual(input)
      const altered = input.slice()
      altered[altered.length - 2] ^= 1
      expect(verifyCalls[1].at(-2)).toEqual(altered)
      expect(screen.getByText(/Conceptual COSE\/SUIT envelope sketch/)).toBeInTheDocument()
      expect(
        screen.getByText(/No COSE Sig_structure or SUIT encoding is built/)
      ).toBeInTheDocument()
    }
  )
  it('retains a failed primitive result and does not call it a valid envelope', async () => {
    m.verify.mockReset().mockReturnValue(false)
    render(<FirmwareSigningSimulator />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign and verify the manifest' }))
    expect(
      await screen.findByText(/Primitive signature check over these JSON bytes: INVALID/)
    ).toBeInTheDocument()
  })
  it('keeps size-only mode outside signature verification', async () => {
    render(<FirmwareSigningSimulator initial={{ algId: 'xmss' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Build the manifest (sizes only)' }))
    expect(
      await screen.findByText(/Simulated — sizes per RFC 8391, no signature computed/)
    ).toBeInTheDocument()
    expect(m.sign).not.toHaveBeenCalled()
    expect(m.signHss).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/Primitive signature check over these JSON bytes:/)
    ).not.toBeInTheDocument()
  })
})
