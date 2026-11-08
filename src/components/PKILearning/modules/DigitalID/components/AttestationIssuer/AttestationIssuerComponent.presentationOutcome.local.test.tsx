// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AttestationIssuerComponent } from './AttestationIssuerComponent'
import type { CryptoKey, WalletInstance } from '../../types'
import type { UseHSMResult } from '@/hooks/useHSM'

const state = vi.hoisted(() => ({
  sign: vi.fn(),
  verify: vi.fn(),
  generate: vi.fn(),
  certificate: vi.fn(),
  sdJwt: vi.fn(),
}))
vi.mock('../../utils/openssl-crypto-provider', () => ({
  OpenSSLCryptoProvider: class {
    signData = state.sign
    verifySignature = state.verify
    generateKeyPair = state.generate
  },
}))
vi.mock('../../utils/x509-utils', () => ({
  generateX509Certificate: (...args: unknown[]) => state.certificate(...args),
}))
vi.mock('../../utils/sdjwt-utils', () => ({
  createSDJWT: (...args: unknown[]) => state.sdJwt(...args),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

const key: CryptoKey = {
  id: 'fictional-pid-holder',
  algorithm: 'ES256',
  curve: 'P-256',
  type: 'P-256',
  publicKey: 'controlled-public-key',
  privateKey: 'controlled-private-key',
  created: '2026-01-01T00:00:00Z',
  usage: 'SIGN',
  status: 'ACTIVE',
}
const issuerKey: CryptoKey = {
  ...key,
  id: 'fictional-university-issuer',
  type: 'P-384',
  algorithm: 'ES384',
  curve: 'P-384',
}
const holderKey: CryptoKey = { ...issuerKey, id: 'fictional-diploma-holder' }
const wallet: WalletInstance = {
  id: 'fictional-wallet',
  owner: {
    legalName: 'Sample Learner',
    birthDate: '1990-01-01',
    nationality: 'ES',
    address: 'Fictional address',
  },
  keys: [key],
  credentials: [
    {
      id: 'fictional-pid',
      type: ['VerifiableCredential', 'PersonIdentificationData'],
      issuer: 'Fictional PID issuer',
      issuanceDate: '2026-01-01T00:00:00Z',
      credentialSubject: {},
    },
  ],
  history: [],
}
const hsm = {
  isReady: false,
  moduleRef: { current: null },
  hSessionRef: { current: 0 },
} as unknown as UseHSMResult
const issued = vi.fn()
const flushFlow = async () => {
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}
const startPresentation = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Share PID Data' }))
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  state.sign.mockReset().mockResolvedValue('controlled-holder-signature')
  state.verify.mockReset().mockResolvedValue(true)
  state.generate.mockReset().mockResolvedValueOnce(holderKey).mockResolvedValue(issuerKey)
  state.certificate.mockReset().mockResolvedValue('controlled-certificate')
  state.sdJwt
    .mockReset()
    .mockResolvedValue({ issuerJwt: 'header.payload.signature', disclosures: [] })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('university sample presentation completion guard', () => {
  it.each([
    'signing error',
    'missing signature',
    'verification false',
    'verification error',
  ] as const)(
    'withholds verified identity and diploma after %s, then permits a verified retry',
    async (failure) => {
      if (failure === 'signing error')
        state.sign.mockRejectedValueOnce(new Error('Controlled holder signing failure'))
      if (failure === 'missing signature') state.sign.mockResolvedValueOnce('')
      if (failure === 'verification false') state.verify.mockResolvedValueOnce(false)
      if (failure === 'verification error')
        state.verify.mockRejectedValueOnce(new Error('Controlled holder verification failure'))
      const initialWallet = structuredClone(wallet)
      render(
        <MemoryRouter>
          <AttestationIssuerComponent
            wallet={wallet}
            hsm={hsm}
            onCredentialIssued={issued}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Login to Student Portal' }))
      startPresentation()
      await flushFlow()

      expect(screen.getByRole('alert')).not.toBeEmptyDOMElement()
      expect(screen.queryByText('Sample key binding verified')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Issue Diploma' })).not.toBeInTheDocument()
      expect(screen.queryByText('Diploma Added!')).not.toBeInTheDocument()
      expect(
        screen.queryByText(
          'Sample key-binding signature verified. PID issuer trust and identity checks are simulated.'
        )
      ).not.toBeInTheDocument()
      expect(state.generate).not.toHaveBeenCalled()
      expect(state.certificate).not.toHaveBeenCalled()
      expect(state.sdJwt).not.toHaveBeenCalled()
      expect(issued).not.toHaveBeenCalled()
      expect(wallet).toEqual(initialWallet)
      expect(screen.getByRole('button', { name: 'Share PID Data' })).toBeEnabled()
      if (failure === 'signing error' || failure === 'missing signature')
        expect(state.verify).not.toHaveBeenCalled()

      startPresentation()
      await flushFlow()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByText('Sample key binding verified')).toBeVisible()
      const signCalls = state.sign.mock.calls
      const retryPayload = signCalls.at(-1)![1] as string
      expect(JSON.parse(retryPayload)).toEqual({ nonce: expect.any(String), aud: 'university' })
      expect(JSON.parse(retryPayload).nonce).not.toBe(JSON.parse(signCalls[0][1]).nonce)
      expect(state.verify).toHaveBeenLastCalledWith(
        key,
        'controlled-holder-signature',
        retryPayload,
        expect.any(Function)
      )
      expect(issued).not.toHaveBeenCalled()
      const issue = screen.getByRole('button', { name: 'Issue Diploma' })
      expect(issue).toBeEnabled()
      fireEvent.click(issue)
      await flushFlow()
      expect(state.verify).toHaveBeenLastCalledWith(
        issuerKey,
        'signature',
        'header.payload',
        expect.any(Function)
      )
      expect(issued).toHaveBeenCalledTimes(1)
      expect(issued).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ['VerifiableCredential', 'UniversityDegreeCredential'],
          format: 'dc+sd-jwt',
        }),
        holderKey
      )
      expect(screen.getByText('Diploma Added!')).toBeVisible()
    }
  )
})
