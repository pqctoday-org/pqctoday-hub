// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CmpKemKeyUpdate } from './CmpKemKeyUpdate'
import { CompositeEnroll } from './CompositeEnroll'
import { WORKSHOP_STEPS } from '../constants'

const mocks = vi.hoisted(() => ({ execute: vi.fn(), simulateCmp: vi.fn(), ensureMockCA: vi.fn() }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: mocks }))
vi.mock('../mock-ca/mockCA', () => ({ ensureMockCA: mocks.ensureMockCA }))
const bytes = (text: string) => new TextEncoder().encode(text)
let mismatch = false

beforeEach(() => {
  mismatch = false
  mocks.ensureMockCA.mockResolvedValue({ certPem: bytes('sample CA'), keyPem: bytes('sample key') })
  mocks.simulateCmp.mockResolvedValue({ ok: true, certPem: bytes('sample leaf') })
  mocks.execute.mockImplementation(async (cmd: string) => {
    const files: { name: string; data: Uint8Array }[] = []
    const add = (name: string, text: string) => files.push({ name, data: bytes(text) })
    if (cmd.includes('genpkey -algorithm ML-KEM')) add('ee-mlkem.key.pem', 'kem key')
    else if (cmd.includes('genpkey -algorithm EC')) add('ee-ecdsa.key.pem', 'ec key')
    else if (cmd.startsWith('openssl pkey ')) add('ee-mlkem.pub.pem', 'kem public')
    else if (cmd.includes(' -encap ')) {
      add('kem.ct.bin', 'ciphertext')
      add('secret_ca.bin', 'sample secret')
    } else if (cmd.includes(' -decap '))
      add('secret_ee.bin', mismatch ? 'different' : 'sample secret')
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
      'enrollment and ML-KEM round trip'
    )
    expect(WORKSHOP_STEPS.find((s) => s.id === 'composite')?.title).toContain(
      'Parallel certificate issuance'
    )
  })

  it.each([false, true])(
    'reports sample agreement without claiming KUR POP, mismatch=%s',
    async (different) => {
      mismatch = different
      render(<CmpKemKeyUpdate />)
      expect(screen.getByText(/It does not send a KUR/)).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'Run sample enrollment and KEM round trip' })
      )
      expect(
        await screen.findByText(
          different ? /Sample shared secrets differ/ : 'Sample shared secrets match.'
        )
      ).toBeInTheDocument()
      expect(screen.queryByText(/encrCert POP successful/)).not.toBeInTheDocument()
      expect(mocks.simulateCmp).toHaveBeenCalledWith(
        expect.objectContaining({
          eeKeyPath: '/ee-mlkem.key.pem',
          outCertPath: '/ee-mlkem.cert.pem',
        })
      )
      expect(mocks.execute.mock.calls.map(([cmd]) => cmd)).toEqual([
        'openssl genpkey -algorithm ML-KEM-768 -out /ee-mlkem.key.pem',
        'openssl pkey -in /ee-mlkem.key.pem -pubout -out /ee-mlkem.pub.pem',
        'openssl x509 -in /ee-mlkem.cert.pem -text -noout',
        'openssl pkeyutl -encap -inkey /ee-mlkem.pub.pem -pubin -out /kem.ct.bin -secret /secret_ca.bin',
        'openssl pkeyutl -decap -inkey /ee-mlkem.key.pem -in /kem.ct.bin -out /secret_ee.bin',
      ])
    }
  )

  it('retains the existing error and retry path without a protocol success message', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('sample engine unavailable'))
    render(<CmpKemKeyUpdate />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Run sample enrollment and KEM round trip' })
    )
    expect(await screen.findByText('sample engine unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
    expect(screen.queryByText('Sample shared secrets match.')).not.toBeInTheDocument()
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
