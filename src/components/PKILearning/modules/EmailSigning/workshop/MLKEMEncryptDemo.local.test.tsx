// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import fixtures from '../services/cmsEnvelope.local.fixtures.json'
import { MLKEMEncryptDemo } from './MLKEMEncryptDemo'
const state = vi.hoisted(() => ({
  genKey: vi.fn(),
  mkCert: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}))
vi.mock('../services/CMSSigningService', () => ({
  isKemOnlyAlg: (alg: string) => alg !== 'RSA',
  CMSSigningService: class {
    dispose() {}
    genKey = state.genKey
    mkCert = state.mkCert
    encrypt = state.encrypt
    decrypt = state.decrypt
  },
}))
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    selectedId,
    onSelect,
  }: {
    items: string[]
    selectedId: string
    onSelect: (id: string) => void
  }) => (
    // Test double for component result attribution; actual controls checked in browser.
    // eslint-disable-next-line no-restricted-syntax
    <select
      aria-label={items.includes('RSA') ? 'Recipient algorithm' : 'Cipher'}
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
    >
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  ),
}))
const sample = (name: keyof typeof fixtures.samples) =>
  Uint8Array.from(atob(fixtures.samples[name]), (c) => c.charCodeAt(0))
const run = () => fireEvent.click(screen.getByRole('button', { name: 'Encrypt + Decrypt' }))
const rsa = () =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Recipient algorithm' }), {
    target: { value: 'RSA' },
  })
beforeEach(() => {
  vi.clearAllMocks()
  state.genKey.mockResolvedValue({ keyPem: 'sample key' })
  state.mkCert.mockResolvedValue({ certPem: 'sample certificate' })
  state.encrypt.mockResolvedValue({ enveloped: sample('native-oaep') })
  state.decrypt.mockImplementation(async () => ({
    ok: true,
    payload: new TextEncoder().encode(
      (screen.getByLabelText('Payload') as HTMLTextAreaElement).value
    ),
  }))
})
describe('CMS sample outcome and input attribution', () => {
  it('requests explicit OAEP and shows parsed output metadata', async () => {
    render(<MLKEMEncryptDemo providerReady={false} />)
    rsa()
    run()
    await screen.findByText('Sample plaintext recovered and matched')
    expect(state.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({ rsaOaep: true, cipher: 'aes-256-gcm' })
    )
    expect(screen.getByText('CMS AuthEnvelopedData (.p7m)')).toBeInTheDocument()
    expect(screen.getByText('RSA-OAEP')).toBeInTheDocument()
  })
  it('accepts the inspected AES-128 ML-KEM wrapping profile', async () => {
    state.encrypt.mockResolvedValue({ enveloped: sample('ML-KEM-768-aes-128-gcm') })
    render(<MLKEMEncryptDemo providerReady={false} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Cipher' }), {
      target: { value: 'aes-128-gcm' },
    })
    run()
    await screen.findByText('Sample plaintext recovered and matched')
    expect(screen.getByText('2.16.840.1.101.3.4.1.5')).toBeInTheDocument()
  })
  it('uses fresh existing-interface key identifiers for each run', async () => {
    render(<MLKEMEncryptDemo providerReady />)
    rsa()
    run()
    await screen.findByText('Sample plaintext recovered and matched')
    const firstId = state.genKey.mock.calls[0][1]
    run()
    await waitFor(() => expect(state.genKey).toHaveBeenCalledTimes(2))
    await screen.findByText('Sample plaintext recovered and matched')
    const secondId = state.genKey.mock.calls[1][1]
    expect(secondId).not.toBe(firstId)
    expect(state.mkCert.mock.calls[1][0].keyId).toBe(secondId)
    expect(state.decrypt.mock.calls[1][0].recipientKeyId).toBe(secondId)
  })
  it('retains original algorithm, mode and MIME metadata after edits', async () => {
    render(<MLKEMEncryptDemo providerReady={false} />)
    rsa()
    run()
    await screen.findByText('Sample plaintext recovered and matched')
    fireEvent.change(screen.getByRole('combobox', { name: 'Recipient algorithm' }), {
      target: { value: 'ML-KEM-512' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Cipher' }), {
      target: { value: 'aes-256-cbc' },
    })
    fireEvent.change(screen.getByLabelText('Payload'), { target: { value: 'new text' } })
    expect(screen.getByRole('status')).toHaveTextContent('Inputs changed—run again')
    expect(screen.getByText('CMS AuthEnvelopedData (.p7m)')).toBeInTheDocument()
    expect(screen.getByText("Bob's self-signed cert")).toBeInTheDocument()
    expect(screen.queryByText('Issuer CA key (ML-DSA-65)')).not.toBeInTheDocument()
    expect(screen.getByText(/smime-type=authEnveloped-data/)).toBeInTheDocument()
    expect(state.encrypt).toHaveBeenCalledTimes(1)
  })
  it('does not relabel a retained HSM run as software after mode changes', async () => {
    render(<MLKEMEncryptDemo providerReady />)
    rsa()
    run()
    await screen.findByText('Sample plaintext recovered and matched')
    fireEvent.click(screen.getByRole('checkbox', { name: /Use HSM key/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Inputs changed')
    expect(screen.getByText('HSM (pkcs11:)')).toBeInTheDocument()
    expect(screen.getByText(/Plaintext recovered via HSM key/)).toBeInTheDocument()
  })
  it('blocks an old RSA transport profile even when encryption returns bytes', async () => {
    state.encrypt.mockResolvedValue({ enveloped: sample('RSA-aes-256-gcm') })
    render(<MLKEMEncryptDemo providerReady={false} />)
    rsa()
    run()
    await screen.findAllByText(/CMS output does not match the explicit OAEP/)
    expect(state.decrypt).not.toHaveBeenCalled()
    expect(screen.queryByText('Sample plaintext recovered and matched')).not.toBeInTheDocument()
  })
  it('rejects a container inconsistent with the selected cipher', async () => {
    state.encrypt.mockResolvedValue({ enveloped: sample('RSA-aes-256-cbc') })
    render(<MLKEMEncryptDemo providerReady={false} />)
    rsa()
    run()
    await screen.findAllByText(/CMS output does not match the selected content/)
    expect(state.decrypt).not.toHaveBeenCalled()
  })
  it.each(['failed', 'mismatched', 'error'])('keeps %s decryption incomplete', async (outcome) => {
    if (outcome === 'error') state.decrypt.mockRejectedValue(new Error('Sample operation failed'))
    else
      state.decrypt.mockResolvedValue({
        ok: outcome !== 'failed',
        payload: new Uint8Array([0]),
        stderrTail: 'Sample decryption failed',
      })
    render(<MLKEMEncryptDemo providerReady={false} />)
    rsa()
    run()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled())
    expect(screen.queryByText('Sample plaintext recovered and matched')).not.toBeInTheDocument()
    expect(screen.queryByText(/Plaintext recovered via/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encrypt + Decrypt' })).toBeEnabled()
  })
  it('labels an unsupported cipher before attempting key generation', async () => {
    render(<MLKEMEncryptDemo providerReady={false} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Cipher' }), {
      target: { value: 'chacha20-poly1305' },
    })
    run()
    await screen.findAllByText(/ChaCha20-Poly1305 CMS encryption is unavailable/)
    expect(state.genKey).not.toHaveBeenCalled()
  })
})
