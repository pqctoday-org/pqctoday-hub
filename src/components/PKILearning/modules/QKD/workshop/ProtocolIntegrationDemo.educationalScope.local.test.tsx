// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ProtocolIntegrationDemo } from './ProtocolIntegrationDemo'
const sample = vi.hoisted(() => ({ importKey: vi.fn(), deriveBits: vi.fn(), random: vi.fn() }))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  vi.clearAllMocks()
  sample.importKey.mockResolvedValue({})
  sample.deriveBits.mockResolvedValue(new Uint8Array(32).fill(0xab).buffer)
  sample.random.mockImplementation((bytes: Uint8Array) => bytes.fill(0x55))
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: sample.random,
      randomUUID: () => 'sample-key-id',
      subtle: { importKey: sample.importKey, deriveBits: sample.deriveBits },
    },
  })
})
afterEach(() => {
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})

describe('Protocol context is separate from local sample operations', () => {
  it('TLS displays source bytes, not an executed importer or handshake', async () => {
    render(<ProtocolIntegrationDemo />)
    expect(screen.getByText(/does not execute|do not execute/)).toBeInTheDocument()
    expect(screen.getByText(/enc_keys/)).toBeInTheDocument()
    expect(screen.getByText(/compatibility alone does not/)).toHaveTextContent(
      /guarantee PSK selection or TLS handshake success/
    )
    expect(screen.queryByText(/if and only if/)).not.toBeInTheDocument()
    expect(screen.getByText(/dec_keys/)).toHaveTextContent(/Mutual TLS/)
    fireEvent.click(screen.getByRole('button', { name: 'Show Sample Source Key' }))
    await screen.findByText('Local sample source key — not an imported TLS PSK')
    expect(sample.importKey).not.toHaveBeenCalled()
    expect(sample.deriveBits).not.toHaveBeenCalled()
    expect(screen.getByText('55'.repeat(32))).toBeInTheDocument()
    expect(screen.queryByText(/independently retrieved/)).not.toBeInTheDocument()
  })

  it.each([
    ['ikev2', 'Run Local IKE-Context HKDF Example', 'SKEYSEED', 96],
    ['macsec', 'Run Local MACsec-Context HKDF Example', `MACsec SAK v1 ${'55'.repeat(8)}`, 32],
    ['ssh', 'Run Local SSH-Context HKDF Example', 'SSH session-id', 64],
  ] as const)(
    'preserves actual HKDF inputs while limiting %s output claims',
    async (protocol, label, info, length) => {
      render(<ProtocolIntegrationDemo initialProtocol={protocol} />)
      fireEvent.click(screen.getByRole('button', { name: label }))
      await screen.findByText('Local sample operation only — no protocol validation')
      expect(sample.importKey.mock.calls[0][0]).toBe('raw')
      expect(Array.from(sample.importKey.mock.calls[0][1] as Uint8Array)).toEqual(
        Array(length).fill(0x55)
      )
      const options = sample.deriveBits.mock.calls[0][0] as HkdfParams
      expect(options.hash).toBe('SHA-256')
      expect(Array.from(new Uint8Array(options.salt as ArrayBuffer))).toEqual(Array(32).fill(0))
      expect(new TextDecoder().decode(options.info)).toBe(info)
      expect(sample.deriveBits.mock.calls[0][2]).toBe(256)
      expect(screen.getByText('ab'.repeat(32))).toBeInTheDocument()
      expect(screen.queryByText(/making.*information-theoretically/)).not.toBeInTheDocument()
    }
  )

  it('failed derivation clears the old output, shows an error and allows retry', async () => {
    render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    const button = screen.getByRole('button', { name: 'Run Local IKE-Context HKDF Example' })
    fireEvent.click(button)
    await screen.findByText('Local sample operation only — no protocol validation')
    sample.deriveBits.mockRejectedValueOnce(new Error('sample derive failed'))
    fireEvent.click(button)
    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent('sample derive failed')
    expect(
      screen.queryByText('Local sample operation only — no protocol validation')
    ).not.toBeInTheDocument()
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await screen.findByText('Local sample operation only — no protocol validation')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('key import rejection cannot produce an HKDF result', async () => {
    sample.importKey.mockRejectedValueOnce(new Error('sample import failed'))
    render(<ProtocolIntegrationDemo initialProtocol="ssh" />)
    fireEvent.click(screen.getByRole('button', { name: 'Run Local SSH-Context HKDF Example' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('sample import failed')
    expect(sample.deriveBits).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Local sample operation only — no protocol validation')
    ).not.toBeInTheDocument()
  })

  it('a late operation from an unmounted panel cannot attach a result to the next panel', async () => {
    let finish!: (value: ArrayBuffer) => void
    sample.deriveBits.mockReturnValueOnce(
      new Promise<ArrayBuffer>((resolve) => {
        finish = resolve
      })
    )
    const view = render(<ProtocolIntegrationDemo initialProtocol="ikev2" />)
    fireEvent.click(screen.getByRole('button', { name: 'Run Local IKE-Context HKDF Example' }))
    await act(async () => {
      await Promise.resolve()
    })
    view.unmount()
    render(<ProtocolIntegrationDemo initialProtocol="ssh" />)
    await act(async () => {
      finish(new Uint8Array(32).fill(0xee).buffer)
    })
    expect(screen.queryByText('ee'.repeat(32))).not.toBeInTheDocument()
    expect(
      screen.queryByText('Local sample operation only — no protocol validation')
    ).not.toBeInTheDocument()
  })
})
