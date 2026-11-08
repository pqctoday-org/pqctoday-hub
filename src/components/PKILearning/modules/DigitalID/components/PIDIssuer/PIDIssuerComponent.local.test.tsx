// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { PIDIssuerComponent } from './PIDIssuerComponent'

import type { CryptoKey, WalletInstance } from '../../types'
import type { UseHSMResult } from '@/hooks/useHSM'
const state = vi.hoisted(() => ({
  generate: vi.fn(),
  sign: vi.fn(),
  certificate: vi.fn(),
  mdoc: vi.fn(),
  provider: vi.fn(),
}))
vi.mock('../../utils/openssl-crypto-provider', () => ({
  OpenSSLCryptoProvider: class {
    constructor() {
      state.provider()
    }
    generateKeyPair = state.generate
    signData = state.sign
  },
}))
vi.mock('../../utils/x509-utils', () => ({
  generateX509Certificate: (...args: unknown[]) => state.certificate(...args),
}))
vi.mock('../../utils/mdoc-utils', () => ({
  createMdoc: (...args: unknown[]) => state.mdoc(...args),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
const hsm = {
  isReady: false,
  moduleRef: { current: null },
  hSessionRef: { current: 0 },
} as unknown as UseHSMResult
const key: CryptoKey = {
  id: 'sample-holder',
  algorithm: 'ES256',
  curve: 'P-256',
  type: 'P-256',
  publicKey: btoa('sample test key'),
  privateKey: 'sample',
  created: 'sample',
  usage: 'SIGN',
  status: 'ACTIVE',
}
const sampleWallet: WalletInstance = {
  id: 'sample-wallet',
  owner: {
    legalName: 'Sample Learner',
    birthDate: '1990-01-01',
    nationality: 'ES',
    address: 'Sample address',
  },
  keys: [],
  credentials: [],
  history: [],
}
const issued = vi.fn()
const show = () => {
  const wallet = structuredClone(sampleWallet)
  render(
    <MemoryRouter>
      <PIDIssuerComponent wallet={wallet} hsm={hsm} onCredentialIssued={issued} onBack={vi.fn()} />
    </MemoryRouter>
  )
  return wallet
}
const start = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Start Issuance Flow' }))
  fireEvent.click(screen.getByRole('button', { name: 'Proceed with Authentication' }))
}
const finish = async () => {
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  state.generate.mockReset().mockResolvedValue(key)
  state.sign.mockReset().mockResolvedValue('sample-signature')
  state.certificate.mockReset().mockResolvedValue('sample certificate')
  state.mdoc.mockReset().mockResolvedValue({ docType: 'eu.europa.ec.eudi.pid.1', sample: true })
})
afterEach(() => {
  vi.useRealTimers()
})
describe('PID sample issuance failure recovery', () => {
  it.each(['wallet key', 'proof signing', 'issuer key', 'certificate', 'credential'] as const)(
    'stops after %s failure without issuing, then retries from authorization',
    async (stage) => {
      if (stage === 'wallet key')
        state.generate.mockRejectedValueOnce(new Error('sample key failure'))
      if (stage === 'proof signing')
        state.sign.mockRejectedValueOnce(new Error('sample proof failure'))
      if (stage === 'issuer key')
        state.generate
          .mockResolvedValueOnce(key)
          .mockRejectedValueOnce(new Error('sample issuer failure'))
      if (stage === 'certificate')
        state.certificate.mockRejectedValueOnce(new Error('sample certificate failure'))
      if (stage === 'credential')
        state.mdoc.mockRejectedValueOnce(new Error('sample credential failure'))
      const wallet = show()
      start()
      await finish()
      expect(screen.getByRole('alert')).toHaveTextContent('Sample issuance stopped during')
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
      expect(issued).not.toHaveBeenCalled()
      expect(wallet).toEqual(sampleWallet)
      const retry = screen.getByRole('button', { name: 'Retry from authorization' })
      expect(retry).toBeEnabled()
      if (stage === 'wallet key' || stage === 'proof signing')
        expect(state.certificate).not.toHaveBeenCalled()
      if (stage !== 'credential') expect(state.mdoc).not.toHaveBeenCalled()
      fireEvent.click(retry)
      await finish()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(issued).toHaveBeenCalledTimes(1)
      expect(state.provider).toHaveBeenCalledTimes(2)
    }
  )
  it.each(['malformed', 'mismatched'] as const)(
    'preserves actual certificate rejection of a %s public key',
    async (kind) => {
      const actual =
        await vi.importActual<typeof import('../../utils/x509-utils')>('../../utils/x509-utils')
      state.certificate.mockImplementation(actual.generateX509Certificate)
      const pair = generateKeyPairSync('ed25519')
      state.generate.mockResolvedValueOnce(key).mockResolvedValueOnce({
        ...key,
        publicKey:
          kind === 'malformed'
            ? btoa('not a PEM public key')
            : btoa(pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()),
      })
      show()
      start()
      await finish()
      expect(screen.getByRole('alert')).toHaveTextContent('Sample certificate construction')
      expect(issued).not.toHaveBeenCalled()
      expect(state.mdoc).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Retry from authorization' })).toBeEnabled()
    }
  )
  it('guards repeated activation throughout the pending flow and commits once', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Start Issuance Flow' }))
    const button = screen.getByRole('button', { name: 'Proceed with Authentication' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button).toBeDisabled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(screen.getByRole('status')).toHaveTextContent('in progress')
    expect(issued).not.toHaveBeenCalled()
    await finish()
    expect(issued).toHaveBeenCalledTimes(1)
    expect(state.generate).toHaveBeenCalledTimes(2)
    expect(state.provider).toHaveBeenCalledTimes(1)
  })
  it('does not commit an unrepresentable credential result', async () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    state.mdoc.mockResolvedValueOnce(cyclic)
    show()
    start()
    await finish()
    expect(screen.getByRole('alert')).toHaveTextContent('Sample credential construction')
    expect(issued).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
