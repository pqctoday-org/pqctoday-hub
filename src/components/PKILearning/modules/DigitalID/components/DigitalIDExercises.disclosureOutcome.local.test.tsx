// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, generateKeyPairSync } from 'node:crypto'
import { encode } from 'cborg'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DigitalIDExercises } from './DigitalIDExercises'
import { RelyingPartyComponent } from './RelyingParty/RelyingPartyComponent'
import { createSDJWT } from '../utils/sdjwt-utils'
import type { CryptoKey, WalletInstance, IssuerSignedItem } from '../types'
import type { CryptoProvider } from '../utils/crypto-provider'
import type { UseHSMResult } from '@/hooks/useHSM'

const calls = vi.hoisted(() => ({ sign: vi.fn(), verify: vi.fn(), hash: vi.fn() }))
vi.mock('../utils/openssl-crypto-provider', () => ({
  OpenSSLCryptoProvider: class {
    signData = calls.sign
    verifySignature = calls.verify
    sha256Hash = calls.hash
  },
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
const hash = (data: string | Uint8Array) => createHash('sha256').update(data).digest('base64url')
const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const key: CryptoKey = {
  id: 'fictional-holder',
  type: 'P-256',
  algorithm: 'ES256',
  curve: 'P-256',
  publicKey: btoa(pair.publicKey.export({ type: 'spki', format: 'pem' }).toString()),
  created: '2026-01-01T00:00:00Z',
  usage: 'SIGN',
  status: 'ACTIVE',
}
const hsm = {
  isReady: false,
  moduleRef: { current: null },
  hSessionRef: { current: 0 },
} as unknown as UseHSMResult
let wallet: WalletInstance
async function createWallet() {
  const provider = {
    signData: calls.sign,
    verifySignature: calls.verify,
    sha256Hash: calls.hash,
  } as unknown as CryptoProvider
  const diploma = await createSDJWT(
    [{ name: 'degree', value: 'Sample degree', type: 'sd' }],
    key,
    key,
    provider,
    'https://issuer.example',
    'sample'
  )
  const items: IssuerSignedItem[] = [
    { digestID: 0, random: 'AQID', elementIdentifier: 'given_name', elementValue: 'Sample' },
    { digestID: 1, random: 'BAUG', elementIdentifier: 'family_name', elementValue: 'Learner' },
    { digestID: 2, random: 'BwgJ', elementIdentifier: 'age_over_18', elementValue: true },
    { digestID: 3, random: 'CgsM', elementIdentifier: 'birth_date', elementValue: '1990-01-01' },
  ]
  const digests = Object.fromEntries(
    items.map((item) => [
      String(item.digestID),
      // createMdoc stores the digest mirror as base64, not provider base64url.
      createHash('sha256')
        .update(
          encode(
            new Map<string, unknown>([
              ['digestID', item.digestID],
              ['random', Uint8Array.from(atob(item.random), (c) => c.charCodeAt(0))],
              ['elementIdentifier', item.elementIdentifier],
              ['elementValue', item.elementValue],
            ])
          )
        )
        .digest('base64'),
    ])
  )
  return {
    id: 'fictional-wallet',
    owner: {
      legalName: 'Sample Learner',
      birthDate: '1990-01-01',
      nationality: 'ES',
      address: 'Fictional address',
    },
    keys: [key],
    history: [],
    credentials: [
      {
        id: 'fictional-diploma',
        type: ['UniversityDegreeCredential'],
        issuer: 'Sample issuer',
        issuanceDate: '2026-01-01',
        credentialSubject: {},
        format: 'dc+sd-jwt',
        raw: JSON.stringify(diploma),
      },
      {
        id: 'fictional-pid',
        type: ['PersonIdentificationData'],
        issuer: 'Sample issuer',
        issuanceDate: '2026-01-01',
        credentialSubject: {},
        format: 'mso_mdoc',
        raw: JSON.stringify({
          docType: 'sample',
          issuerSignedItems: items,
          mobileSecurityObject: { valueDigests: { sample: digests } },
          issuerSignature: 'unverified-sample-issuer-signature',
        }),
      },
    ],
  } satisfies WalletInstance
}
function show() {
  render(
    <MemoryRouter>
      <DigitalIDExercises onNavigateToWorkshop={vi.fn()} />
      <RelyingPartyComponent wallet={wallet} hsm={hsm} onBack={vi.fn()} />
    </MemoryRouter>
  )
}
async function consent(withholdAge = false) {
  fireEvent.click(screen.getByRole('button', { name: 'Login with Wallet' }))
  if (withholdAge) fireEvent.click(screen.getByRole('checkbox', { name: 'age_over_18' }))
  fireEvent.click(screen.getByRole('button', { name: 'Consent & Share' }))
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}
async function verify() {
  fireEvent.click(screen.getByRole('button', { name: 'Check Verification Result' }))
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}
function expectExerciseBoundaries() {
  expect(
    screen.getByText(/The sample checks disclosure digests against its saved credential data/)
  ).toHaveTextContent('verifies the holder proof and its challenge bindings')
  expect(
    screen.getByText(/The sample checks disclosure digests against its saved credential data/)
  ).toHaveTextContent('Issuer-chain trust and revocation/status remain simulated assumptions')
  expect(
    screen.getByText(/The sample checks disclosure digests against its saved credential data/)
  ).toHaveTextContent('changing one signature algorithm alone does not establish a complete fix')
}
beforeEach(async () => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  calls.sign.mockReset().mockResolvedValue('controlled-signature')
  calls.verify.mockReset().mockResolvedValue(true)
  calls.hash.mockReset().mockImplementation(async (data: string | Uint8Array) => hash(data))
  wallet = await createWallet()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('selective-disclosure exercise claims match actual sample outcomes', () => {
  it('executes holder/disclosure checks before acceptance while keeping issuer trust and status simulated', async () => {
    show()
    expectExerciseBoundaries()
    await consent()
    await verify()
    expect(screen.getByText('Sample account opening accepted')).toBeVisible()
    expect(calls.verify).toHaveBeenCalledTimes(1)
    expect(calls.verify).toHaveBeenCalledWith(
      key,
      'controlled-signature',
      expect.any(String),
      expect.any(Function)
    )
    const verification = calls.verify.mock.calls[0]
    const holderSigningInput = calls.sign.mock.calls[0][1] as string
    expect(verification[2]).toBe(holderSigningInput)
    expect(
      JSON.parse(Buffer.from(holderSigningInput.split('.')[0], 'base64url').toString())
    ).toEqual({ typ: 'kb+jwt', alg: 'ES256' })
    expect(calls.hash).toHaveBeenCalled()
    expect(
      screen.getByText(/Sample proof checks passed. Identity approval, issuer trust, status checks/)
    ).toHaveTextContent('remain simulated')
    expect(
      screen.getByText(
        /Sample holder signature, saved key confirmation, nonce\/audience and disclosure digest bindings passed/
      )
    ).toBeInTheDocument()
    expectExerciseBoundaries()
  })

  it('refuses withheld requested age even when holder proof verifies, without calling it a signature failure', async () => {
    show()
    await consent(true)
    await verify()
    expect(calls.verify).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The sample request is missing: age_over_18.'
    )
    expect(screen.getByText('Account Opening Refused')).toBeVisible()
    expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
    expectExerciseBoundaries()
  })

  it('refuses a changed disclosed PID element against the saved digest before completion', async () => {
    const pid = JSON.parse(wallet.credentials[1].raw!)
    pid.issuerSignedItems[2].elementValue = false
    wallet.credentials[1].raw = JSON.stringify(pid)
    show()
    await consent()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sample PID disclosure digest verification failed.'
    )
    expect(
      screen.queryByRole('button', { name: 'Check Verification Result' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
    expectExerciseBoundaries()
  })

  it('refuses a changed SD-JWT disclosure even with successful controlled holder verification', async () => {
    const diploma = JSON.parse(wallet.credentials[0].raw!)
    diploma.disclosures[0].encoded = Buffer.from(
      JSON.stringify(['changed-salt', 'degree', 'altered degree'])
    ).toString('base64url')
    wallet.credentials[0].raw = JSON.stringify(diploma)
    show()
    await consent()
    await verify()
    expect(calls.verify).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Sample disclosure digest does not match')
    expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
    expectExerciseBoundaries()
  })

  it.each(['false', 'error'] as const)(
    'withholds completion on holder verification %s and permits a valid retry',
    async (outcome) => {
      if (outcome === 'false') calls.verify.mockResolvedValueOnce(false)
      else calls.verify.mockRejectedValueOnce(new Error('Controlled verifier failure'))
      show()
      await consent()
      await verify()
      expect(screen.getByRole('alert')).not.toBeEmptyDOMElement()
      expect(screen.getByText('Account Opening Refused')).toBeVisible()
      expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Choose again' }))
      fireEvent.click(screen.getByRole('button', { name: 'Consent & Share' }))
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      await verify()
      expect(screen.getByText('Sample account opening accepted')).toBeVisible()
      expectExerciseBoundaries()
    }
  )
})
