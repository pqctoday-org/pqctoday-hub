// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { PostProcessingDemo } from './PostProcessingDemo'

const sample = vi.hoisted(() => ({
  bits: [1, 0, 0, 0, 0, 0, 0, 1],
  digest: vi.fn(),
  importKey: vi.fn(),
  deriveBits: vi.fn(),
}))
vi.mock('../services/BB84Service', async (original) => ({
  ...(await original<typeof import('../services/BB84Service')>()),
  // Deliberately controlled generator boundary: the UI must not infer a
  // secrecy verdict merely from the displayed statistic or this return value.
  runFullProtocol: () => ({
    qber: 0.2,
    sampleSize: 0,
    siftedKeyAlice: [...sample.bits],
    siftedKeyBob: [...sample.bits],
  }),
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
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sifted Key' }))
    expect(screen.getByText(/Original prefix QBER: 20.0%/)).toBeInTheDocument()
    expect(screen.getByText(/This sample statistic does not establish secrecy/)).toBeInTheDocument()
    expect(screen.queryByText(/^Secure/)).not.toBeInTheDocument()
  })
  it('keeps exact retained-bit hashing and the unchanged separate placeholder HKDF contract', async () => {
    render(<PostProcessingDemo />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sifted Key' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to paired comparison' }))
    fireEvent.click(screen.getByRole('button', { name: 'Compare both retained samples' }))
    fireEvent.click(screen.getByRole('button', { name: 'Compute bounded sample output' }))
    expect(screen.getByRole('region', { name: 'Bounded extraction result' })).toHaveTextContent(
      'L=min(N,max(0,H−P−R))=0 bits'
    )
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
    expect(sample.importKey).toHaveBeenCalledWith('raw', expect.any(Uint8Array), 'HKDF', false, [
      'deriveBits',
    ])
    const params = sample.deriveBits.mock.calls[0][0] as HkdfParams
    expect(params.name).toBe('HKDF')
    expect(params.hash).toBe('SHA-256')
    expect(Array.from(params.salt as Uint8Array)).toEqual(Array(32).fill(0))
    expect(Array.from(params.info as Uint8Array)).toEqual(
      Array.from(new TextEncoder().encode('qkd-hybrid-key'))
    )
    expect(sample.deriveBits.mock.calls[0][2]).toBe(256)
    expect(screen.getByRole('note')).toHaveTextContent(
      'not a secrecy proof, error-correction protocol'
    )
    expect(screen.getByText(/No ML-KEM operation executes/)).toBeInTheDocument()
    expect(screen.queryByText('Hybrid Key Derived Successfully')).not.toBeInTheDocument()
  })
  it('lists the processing stages as a labelled list and marks only the current one', () => {
    render(<PostProcessingDemo />)
    const list = screen.getByRole('list', { name: 'Postprocessing stages' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(7)
    expect(items.filter((item) => item.getAttribute('aria-current') === 'step')).toHaveLength(1)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).toHaveTextContent('1. Paired inputs')
  })
})
