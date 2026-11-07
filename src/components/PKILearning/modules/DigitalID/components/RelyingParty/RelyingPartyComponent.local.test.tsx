// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RelyingPartyComponent } from './RelyingPartyComponent'
import type { WalletInstance } from '../../types'
import type { UseHSMResult } from '@/hooks/useHSM'

const crypto = vi.hoisted(() => ({ sign: vi.fn(), verify: vi.fn(), hash: vi.fn() }))
vi.mock('../../utils/openssl-crypto-provider', () => ({
  OpenSSLCryptoProvider: class {
    signData = crypto.sign
    verifySignature = crypto.verify
    sha256Hash = crypto.hash
  },
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
const hsm = {
  isReady: false,
  moduleRef: { current: null },
  hSessionRef: { current: 0 },
} as unknown as UseHSMResult
const wallet = (tamperedDigest = false) =>
  ({
    keys: [
      { id: 'holder', usage: 'SIGN', algorithm: 'ES256', curve: 'P-256', publicKey: 'sample key' },
    ],
    credentials: [
      {
        id: 'pid',
        type: ['PersonIdentificationData'],
        format: 'mso_mdoc',
        raw: JSON.stringify({
          docType: 'sample',
          issuerSignedItems: [
            {
              digestID: 0,
              random: 'AQID',
              elementIdentifier: 'given_name',
              elementValue: 'Sample',
            },
          ],
          mobileSecurityObject: {
            valueDigests: { sample: { '0': tamperedDigest ? 'AAAA' : 'AQID' } },
          },
        }),
      },
    ],
  }) as unknown as WalletInstance
const show = (tampered = false) =>
  render(
    <MemoryRouter>
      <RelyingPartyComponent wallet={wallet(tampered)} hsm={hsm} onBack={vi.fn()} />
    </MemoryRouter>
  )
async function consent() {
  fireEvent.click(screen.getByRole('button', { name: /Login with Wallet/ }))
  fireEvent.click(await screen.findByRole('button', { name: 'Consent & Share' }))
}
beforeEach(() => {
  vi.clearAllMocks()
  crypto.sign.mockResolvedValue('sample-signature')
  crypto.verify.mockResolvedValue(true)
  crypto.hash.mockResolvedValue('AQID')
})
describe('relying-party sample result gates', () => {
  it('rejects a failed holder signature without reaching the complete result', async () => {
    crypto.verify.mockResolvedValue(false)
    show()
    await consent()
    fireEvent.click(await screen.findByRole('button', { name: 'Check Verification Result' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('signature check did not pass')
    expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
    expect(screen.queryByText(/Your proof was cryptographically valid/)).not.toBeInTheDocument()
  })
  it('rejects an altered PID digest before offering verification completion', async () => {
    show(true)
    await consent()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'disclosure digest verification failed'
    )
    expect(
      screen.queryByRole('button', { name: 'Check Verification Result' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Sample account opening accepted')).not.toBeInTheDocument()
  })
  it('labels only successful sample proof checks, with identity approval still simulated', async () => {
    show()
    await consent()
    fireEvent.click(await screen.findByRole('button', { name: 'Check Verification Result' }))
    expect(await screen.findByText('Sample account opening accepted')).toBeInTheDocument()
    expect(screen.getByText(/Identity approval, issuer trust, status checks/)).toHaveTextContent(
      'remain simulated'
    )
  })
})
