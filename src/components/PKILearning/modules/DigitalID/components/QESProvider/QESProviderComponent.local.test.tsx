// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QESProviderComponent } from './QESProviderComponent'
import type { WalletInstance, CryptoKey } from '../../types'
import type { UseHSMResult } from '@/hooks/useHSM'
const control = vi.hoisted(() => ({
  generate: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
  hash: vi.fn(),
}))
vi.mock('../../utils/hsm-crypto-provider', () => ({
  SoftHSMCryptoProvider: class {
    generateKeyPair = control.generate
    signData = control.sign
    verifySignature = control.verify
    sha256Hash = control.hash
  },
  isHsmBackedKey: () => false,
}))
vi.mock('../../utils/openssl-crypto-provider', () => ({ OpenSSLCryptoProvider: class {} }))
vi.mock('../../utils/dual-crypto-provider', () => ({
  DualCryptoProvider: class {
    generateKeyPair = control.generate
    signData = control.sign
    verifySignature = control.verify
    sha256Hash = control.hash
  },
}))
vi.mock('../../utils/x509-utils', () => ({
  generateX509Certificate: async () => 'sample certificate',
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
const hsm = {
  isReady: true,
  moduleRef: { current: {} },
  hSessionRef: { current: 1 },
  addKey: vi.fn(),
  addStepLog: vi.fn(),
  keys: [],
  log: [],
} as unknown as UseHSMResult
const wallet = {
  keys: [],
  credentials: [
    { type: ['PersonIdentificationData'], credentialSubject: { family_name: 'Sample' } },
  ],
} as unknown as WalletInstance
beforeEach(() => {
  vi.clearAllMocks()
  control.generate.mockImplementation(
    async (algorithm, curve) =>
      ({
        id: 'sample',
        algorithm,
        curve,
        type: curve,
        publicKey: 'sample',
        created: 'sample',
        usage: 'SIGN',
        status: 'ACTIVE',
      }) as CryptoKey
  )
  control.sign.mockResolvedValue('sample-signature')
  control.verify.mockResolvedValue(true)
  control.hash.mockResolvedValue('sample-hash')
})
async function prepare() {
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Sign' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Authorize Access' }))
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1050))
  })
  return screen.getByRole('button', { name: 'Sign Document' })
}
describe('Digital ID QES caller results', () => {
  it('generates and verifies the selected Ed25519 sample before completion', async () => {
    render(<QESProviderComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'ES384 (P-384)' }))
    fireEvent.click(screen.getByRole('option', { name: 'EdDSA (Ed25519)' }))
    fireEvent.click(await prepare())
    expect(await screen.findByText('Sample Signature Checked')).toBeTruthy()
    expect(control.generate).toHaveBeenCalledWith('EdDSA', 'Ed25519', expect.any(Function))
    expect(control.verify).toHaveBeenCalledWith(
      expect.objectContaining({ algorithm: 'EdDSA', curve: 'Ed25519' }),
      'sample-signature',
      'sample-hash',
      expect.any(Function)
    )
  })
  it.each(['generation', 'verification-false', 'verification-error'])(
    'keeps %s failure incomplete and retryable',
    async (failure) => {
      if (failure === 'generation')
        control.generate.mockRejectedValue(new Error('key generation failed'))
      if (failure === 'verification-false') control.verify.mockResolvedValue(false)
      if (failure === 'verification-error')
        control.verify.mockRejectedValue(new Error('verifier operation error'))
      render(<QESProviderComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />)
      fireEvent.click(await prepare())
      expect(await screen.findByRole('alert')).toHaveTextContent(/Sample signing incomplete/)
      expect(screen.queryByText('Sample Signature Checked')).toBeNull()
      expect(screen.getByRole('button', { name: 'Sign Document' })).toBeEnabled()
    }
  )
  it('does not accept a generated key with a different algorithm', async () => {
    control.generate.mockResolvedValue({ algorithm: 'ES256', curve: 'P-256' })
    render(<QESProviderComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />)
    fireEvent.click(await prepare())
    expect(await screen.findByRole('alert')).toHaveTextContent('does not match')
    expect(control.sign).not.toHaveBeenCalled()
  })
  it('clears the completed sample when the provider changes', async () => {
    const view = render(<QESProviderComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />)
    fireEvent.click(await prepare())
    await screen.findByText('Sample Signature Checked')
    view.rerender(
      <QESProviderComponent wallet={wallet} hsm={{ ...hsm, isReady: false }} onBack={vi.fn()} />
    )
    expect(await screen.findByRole('button', { name: 'Proceed to Sign' })).toBeTruthy()
    expect(screen.queryByText('Sample Signature Checked')).toBeNull()
    expect(screen.queryByText(/Sample test passed:/)).toBeNull()
  })
  it('prevents duplicate signing and discards a result abandoned by changing the provider', async () => {
    let complete!: (value: string) => void
    control.sign.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          complete = resolve
        })
    )
    const view = render(<QESProviderComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />)
    const button = await prepare()
    fireEvent.click(button)
    fireEvent.click(button)
    await waitFor(() => expect(control.sign).toHaveBeenCalledOnce())
    view.rerender(
      <QESProviderComponent wallet={wallet} hsm={{ ...hsm, isReady: false }} onBack={vi.fn()} />
    )
    await act(async () => complete('late signature'))
    expect(control.verify).not.toHaveBeenCalled()
    expect(screen.queryByText('Sample Signature Checked')).toBeNull()
  })
  it('reports the unsupported OpenSSL-only Ed25519 path instead of substituting ECDSA', async () => {
    render(
      <QESProviderComponent wallet={wallet} hsm={{ ...hsm, isReady: false }} onBack={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'ES384 (P-384)' }))
    fireEvent.click(screen.getByRole('option', { name: 'EdDSA (Ed25519)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Sign' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enable Live HSM')
    expect(control.generate).not.toHaveBeenCalled()
  })
})
