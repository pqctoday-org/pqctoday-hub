// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CmpKemKeyUpdate } from './CmpKemKeyUpdate'
import { CompositeEnroll } from './CompositeEnroll'
import { WORKSHOP_STEPS } from '../constants'

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  simulateCmp: vi.fn(),
  executeCmpSignedKeyUpdate: vi.fn(),
  ensureMockCA: vi.fn(),
  generateCaRoot: vi.fn(),
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: mocks }))
vi.mock('../mock-ca/mockCA', () => ({ ensureMockCA: mocks.ensureMockCA }))
const bytes = (text: string) => new TextEncoder().encode(text)

beforeEach(() => {
  mocks.ensureMockCA.mockResolvedValue({ certPem: bytes('sample CA'), keyPem: bytes('sample key') })
  mocks.generateCaRoot.mockResolvedValue({
    ok: true,
    certPem: bytes('sample CA'),
    keyPem: bytes('sample key'),
  })
  mocks.simulateCmp.mockResolvedValue({ ok: true, certPem: bytes('sample leaf') })
  mocks.executeCmpSignedKeyUpdate.mockResolvedValue({
    ok: true,
    operation: 'KUR',
    proofVerified: true,
    confirmationAccepted: true,
    certPem: bytes('renewed sample'),
    transcript: [],
  })
  mocks.execute.mockImplementation(async (cmd: string) => {
    const files: { name: string; data: Uint8Array }[] = []
    const add = (name: string, text: string) => files.push({ name, data: bytes(text) })
    if (cmd.includes('genpkey -algorithm ML-KEM') || cmd.includes('genpkey -algorithm ML-DSA'))
      add(cmd.split(' -out ')[1].replace(/^\//, ''), 'kem key')
    else if (cmd.includes('-out /cmp-signer.cert.pem'))
      add('cmp-signer.cert.pem', 'signing certificate')
    else if (cmd.includes('genpkey -algorithm EC')) add('ee-ecdsa.key.pem', 'ec key')
    else if (cmd.startsWith('openssl pkey '))
      add(cmd.includes('cmp-new') ? 'cmp-new.pub.pem' : 'ee-mlkem.pub.pem', 'kem public')
    else if (cmd.includes(' -encap ')) {
      add('kem.ct.bin', 'ciphertext')
      add('secret_ca.bin', 'sample secret')
    } else if (cmd.includes(' -decap ')) add('secret_ee.bin', 'sample secret')
    return {
      files,
      stdout: cmd.includes('verify') ? 'sample verification output' : 'sample cert text',
      stderr: '',
    }
  })
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('enrollment sample scope labels', () => {
  it('keeps saved step IDs while describing the actual operations', () => {
    expect(WORKSHOP_STEPS.find((s) => s.id === 'cmp-kur')?.title).toContain(
      'ML-KEM certificate key update'
    )
    expect(WORKSHOP_STEPS.find((s) => s.id === 'composite')?.title).toContain(
      'Parallel certificate issuance'
    )
  })

  it('runs the separate key update and clears its result after scenario changes', async () => {
    render(<CmpKemKeyUpdate />)
    fireEvent.click(screen.getByRole('button', { name: 'Run key update' }))
    expect(
      await screen.findByText(
        'New-key possession and explicit confirmation verified for this sample.'
      )
    ).toBeInTheDocument()
    expect(mocks.executeCmpSignedKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        oldCertPath: '/cmp-request-prior.pem',
        authorizedPriorPath: '/cmp-authorized-prior.pem',
        eeKeyPath: '/cmp-new.key.pem',
        signerCertPath: '/cmp-signer.cert.pem',
        authorizedSignerPath: '/cmp-authorized-signer.pem',
        profile: 'MLKEM768-MLDSA65-explicit-confirm-v1',
      })
    )
    expect(mocks.simulateCmp).toHaveBeenCalledTimes(2)
    expect(mocks.execute.mock.calls.some(([command]) => command.includes(' -encap '))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /Sample prior-certificate authorization/ }))
    fireEvent.click(
      screen.getByRole('option', { name: 'Different prior enrollment — expect rejection' })
    )
    expect(
      screen.queryByText('New-key possession and explicit confirmation verified for this sample.')
    ).not.toBeInTheDocument()
  })

  it.each(['proof', 'confirmation', 'engine error'])(
    'keeps the lesson incomplete after missing %s',
    async (fault) => {
      mocks.executeCmpSignedKeyUpdate.mockResolvedValue({
        ok: fault !== 'engine error',
        operation: 'KUR',
        proofVerified: fault !== 'proof',
        confirmationAccepted: fault !== 'confirmation',
        certPem: bytes('sample leaf'),
        transcript: [],
        error: fault === 'engine error' ? 'sample check failed' : undefined,
      })
      render(<CmpKemKeyUpdate />)
      fireEvent.click(screen.getByRole('button', { name: 'Run key update' }))
      expect(
        await screen.findByText(
          fault === 'engine error'
            ? 'sample check failed'
            : 'Key update did not complete explicit confirmation'
        )
      ).toBeInTheDocument()
      expect(
        screen.queryByText('New-key possession and explicit confirmation verified for this sample.')
      ).not.toBeInTheDocument()
      expect(
        mocks.execute.mock.calls.some(([command]) =>
          command.includes('x509 -in /cmp-renewed.cert.pem')
        )
      ).toBe(false)
    }
  )

  it('retains the error and retry path', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('sample engine unavailable'))
    render(<CmpKemKeyUpdate />)
    fireEvent.click(screen.getByRole('button', { name: 'Run key update' }))
    expect(await screen.findByText('sample engine unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
    expect(mocks.executeCmpSignedKeyUpdate).not.toHaveBeenCalled()
  })

  it.each([null, bytes('previous ML-DSA leaf')])(
    'keeps separate outputs and missing-leaf behavior, prior leaf=%s',
    async (prior) => {
      render(<CompositeEnroll eeMlDsaCertPem={prior} />)
      expect(screen.getByText(/It does not create a composite certificate/)).toBeInTheDocument()
      expect(screen.getByText(/classical-only validator/)).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'Issue parallel ECDSA-P256 cert (CMP IR)' })
      )
      expect(await screen.findByText('Separate certificate output.')).toBeInTheDocument()
      expect(screen.getByText(/ECDSA-P256 subject/)).toBeInTheDocument()
      expect(screen.getByText(/ML-DSA-65 subject/)).toBeInTheDocument()
      if (!prior)
        expect(
          screen.getByText('Not run yet — complete Step 2 to populate this side.')
        ).toBeInTheDocument()
      expect(
        mocks.execute.mock.calls.filter(([cmd]) => cmd.startsWith('openssl verify'))
      ).toHaveLength(prior ? 2 : 1)
      expect(screen.queryByText(/Hybrid pair issued/)).not.toBeInTheDocument()
    }
  )
})
