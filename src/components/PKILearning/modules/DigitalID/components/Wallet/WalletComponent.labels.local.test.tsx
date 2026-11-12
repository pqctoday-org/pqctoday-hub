// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WalletComponent } from './WalletComponent'
import type { VerifiableCredential, WalletInstance } from '../../types'
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
// Encoded shape fixture, not an assertion that a fabricated signature verifies.
function rawToken(exp: number = 0) {
  const issuerJwt = `${b64({ typ: 'dc+sd-jwt', alg: 'ES256' })}.${b64({ iat: 1, exp })}.${Buffer.from(new Uint8Array(64).fill(3)).toString('base64url')}`
  return JSON.stringify({ issuerJwt, disclosures: [], raw: issuerJwt + '~' })
}
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
      format: 'dc+sd-jwt',
      raw: rawToken(),
      ...credential,
    },
  ],
})
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())
describe('wallet inspects actual encoded/stored fields without conflating parsing and verification', () => {
  it('uses the already-expired stored and encoded dates rather than issuance plus365', () => {
    render(<WalletComponent wallet={wallet()} onAddCredential={vi.fn()} />)
    expect(screen.getByText('2026-11-02T00:00:00Z')).toBeInTheDocument()
    expect(screen.getAllByText('Expiration date has passed')).toHaveLength(2)
    expect(screen.getByText('0', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('Sample timer not elapsed')).not.toBeInTheDocument()
    expect(screen.queryByText('Valid', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText(/not a credential validity result/)).toBeInTheDocument()
  })
  it('shows exact encoded token separately from decoded fields and the stored wrapper', () => {
    const raw = rawToken()
    render(<WalletComponent wallet={wallet({ raw })} onAddCredential={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect encoded sample' }))
    expect(screen.getByText(JSON.parse(raw).raw, { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Encoded SD-JWT issuer token and disclosures')).toBeInTheDocument()
    expect(
      screen.getByText('Stored wrapper / raw field — separate representation')
    ).toBeInTheDocument()
    expect(screen.getByText(raw, { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/not signature verification or full profile/)).toBeInTheDocument()
  })
  it.each(['mso_mdoc', 'dc+sd-jwt'] as const)(
    'rejects a malformed %s wrapper instead of claiming its wire format',
    (format) => {
      render(
        <WalletComponent
          wallet={wallet({ format, raw: '{"sampleWrapper":true}' })}
          onAddCredential={vi.fn()}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Inspect encoded sample' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Inspection incomplete')
      expect(screen.queryByText(/Encoded sample structure parsed/)).not.toBeInTheDocument()
      expect(screen.getByText('{"sampleWrapper":true}')).toBeInTheDocument()
    }
  )
  it('keeps missing/invalid expiration specifically unknown and never invents a one-year deadline', () => {
    render(
      <WalletComponent
        wallet={wallet({ expirationDate: undefined, raw: undefined })}
        onAddCredential={vi.fn()}
      />
    )
    expect(screen.getByText('Unknown — Field not recorded')).toBeInTheDocument()
    expect(
      screen.queryByText('Expiration date is ahead of this device’s clock')
    ).not.toBeInTheDocument()
  })
  it('updates an actual expiration boundary while open and cleans up its local clock', () => {
    const expires = Math.floor(Date.now() / 1000) + 1
    const view = render(
      <WalletComponent
        wallet={wallet({ expirationDate: undefined, raw: rawToken(expires) })}
        onAddCredential={vi.fn()}
      />
    )
    expect(screen.getByText('Expiration date is ahead of this device’s clock')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('Expiration date has passed')).toBeInTheDocument()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('recomputes changed stored input instead of retaining a previous decoded token', () => {
    const view = render(<WalletComponent wallet={wallet()} onAddCredential={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect encoded sample' }))
    view.rerender(
      <WalletComponent wallet={wallet({ raw: '{"raw":"broken"}' })} onAddCredential={vi.fn()} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Inspection incomplete')
    expect(
      screen.queryByText('Encoded SD-JWT issuer token and disclosures')
    ).not.toBeInTheDocument()
  })
})
