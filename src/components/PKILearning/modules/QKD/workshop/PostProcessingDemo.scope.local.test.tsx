// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PostProcessingDemo } from './PostProcessingDemo'

const sample = vi.hoisted(() => ({
  bits: [1, 0, 0, 0, 0, 0, 0, 1],
  digest: vi.fn(),
  importKey: vi.fn(),
  deriveBits: vi.fn(),
}))
vi.mock('../services/BB84Service', async (original) => ({
  ...(await original<typeof import('../services/BB84Service')>()),
  runFullProtocol: () => ({ qber: 0.2 }),
  getFinalKey: () => [...sample.bits],
}))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  vi.clearAllMocks()
  sample.digest.mockResolvedValue(new Uint8Array(32).buffer)
  sample.importKey.mockResolvedValue({})
  sample.deriveBits.mockResolvedValue(new Uint8Array(32).buffer)
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0x55),
      subtle: { digest: sample.digest, importKey: sample.importKey, deriveBits: sample.deriveBits },
    },
  })
})
afterEach(() => {
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})

describe('QKD post-processing teaching scope', () => {
  it('does not turn a displayed QBER into a secure-key verdict', () => {
    render(<PostProcessingDemo />)
    fireEvent.click(screen.getByRole('button', { name: /Generate Sifted Key/ }))
    expect(screen.getByText('20.0%')).toBeInTheDocument()
    expect(screen.getByText('Sample statistic only')).toBeInTheDocument()
    expect(screen.queryByText(/^Secure/)).not.toBeInTheDocument()
  })
  it('shows the unchanged bits actually hashed and identifies placeholder HKDF input', async () => {
    render(<PostProcessingDemo />)
    fireEvent.click(screen.getByRole('button', { name: /Generate Sifted Key/ }))
    fireEvent.click(screen.getByRole('button', { name: /Continue to Parity/ }))
    fireEvent.click(screen.getByRole('button', { name: /Count Parities and Copy/ }))
    expect(
      screen.getByText(/counted 2 odd-parity blocks and copied the sample unchanged/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Sample Digest' }))
    await screen.findByRole('button', { name: 'Derive Sample HKDF Output' })
    const hashInput = sample.digest.mock.calls[0][1] as Uint8Array
    expect(Array.from(hashInput)).toEqual([0x81])
    expect(sample.digest.mock.calls[0][0]).toBe('SHA-256')
    fireEvent.click(screen.getByRole('button', { name: 'Derive Sample HKDF Output' }))
    await screen.findByText('Sample HKDF Output Calculated')
    const combined = sample.importKey.mock.calls[0][1] as Uint8Array
    expect(Array.from(combined.slice(0, 32))).toEqual(Array(32).fill(0))
    expect(Array.from(combined.slice(32))).toEqual(Array(32).fill(0x55))
    expect(screen.getByRole('note')).toHaveTextContent('does not reconcile')
    expect(screen.getByRole('note')).toHaveTextContent('execute ML-KEM')
    expect(screen.queryByText('Hybrid Key Derived Successfully')).not.toBeInTheDocument()
  })
})
