// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WalletComponent } from './WalletComponent'
import type { VerifiableCredential, WalletInstance } from '../../types'

const wallet = (credential: Partial<VerifiableCredential> = {}): WalletInstance => ({
  id: 'fictional-wallet',
  owner: {
    legalName: 'Fictional learner',
    birthDate: '1990-01-01',
    nationality: 'US',
    address: 'Sample',
  },
  keys: [],
  history: [],
  credentials: [
    {
      id: 'sample-credential',
      type: ['PersonIdentificationData'],
      issuer: 'Fictional issuer',
      issuanceDate: '2026-11-01T00:00:00Z',
      expirationDate: '2026-11-02T00:00:00Z',
      credentialSubject: { sample: true },
      format: 'mso_mdoc',
      raw: '{"sampleWrapper":true}',
      ...credential,
    },
  ],
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())
describe('wallet display does not equate sample timer or format label with verification', () => {
  it('keeps the existing timer calculation but disclaims validity for an already-expired credential field', () => {
    render(<WalletComponent wallet={wallet()} onAddCredential={vi.fn()} />)
    expect(screen.getByText('Sample timer not elapsed')).toBeInTheDocument()
    expect(
      screen.getByText(
        /does not check the credential expiration field, signature, issuer trust or status/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Valid')).not.toBeInTheDocument()
    expect(screen.getByText(/It is not a credential validity result/)).toBeInTheDocument()
  })
  it.each(['mso_mdoc', 'dc+sd-jwt'] as const)(
    'prints the unchanged %s sample wrapper without asserting its wire encoding',
    (format) => {
      const raw = JSON.stringify({ format, sampleWrapper: 'not a verified wire object' })
      render(<WalletComponent wallet={wallet({ format, raw })} onAddCredential={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Inspect stored sample' }))
      expect(screen.getByText(raw)).toBeInTheDocument()
      expect(
        screen.getByText('Stored sample representation — encoding not checked')
      ).toBeInTheDocument()
      expect(
        screen.getByText(/declared format does not establish wire-format compatibility/)
      ).toBeInTheDocument()
      expect(screen.queryByText('BASE64 CBOR COSE_Sign1')).not.toBeInTheDocument()
      expect(screen.queryByText('SD-JWT VC (~ DELIMITED)')).not.toBeInTheDocument()
    }
  )
  it('labels an elapsed demonstration timer without claiming a failed cryptographic verification', () => {
    render(
      <WalletComponent
        wallet={wallet({ issuanceDate: '2020-01-01T00:00:00Z' })}
        onAddCredential={vi.fn()}
      />
    )
    expect(screen.getByText('Sample timer elapsed')).toBeInTheDocument()
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
    expect(screen.getByText(/production wallet and verifier tools/)).toBeInTheDocument()
  })
})
