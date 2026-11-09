// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
const { runBenchmark } = vi.hoisted(() => ({ runBenchmark: vi.fn() }))
vi.mock('@/services/crypto/algorithmEngineResolver', () => ({
  resolveEngine: () => 'softhsm',
  getEngineLabel: () => 'SoftHSM',
  getBenchmarkUnavailableReason: () => null,
  runBenchmark,
}))
import { AlgorithmCheckButton } from './AlgorithmCheckButton'
import type { AlgorithmDetail } from '@/data/pqcAlgorithmsData'
const algo = (name: string, pub: number, sig: number) =>
  ({ name, publicKeySize: pub, signatureCiphertextSize: sig }) as AlgorithmDetail
const timings = {
  engine: 'softhsm',
  keyGenMs: 1,
  signEncapsMs: 2,
  verifyDecapsMs: 3,
  sharedSecretBytes: null,
}
describe('Algorithm check size provenance', () => {
  beforeEach(() => {
    runBenchmark.mockReset()
  })
  it.each([
    [2048, 270],
    [3072, 398],
    [4096, 526],
  ])(
    'does not compare RSA-%s modulus bytes with %s catalogue container bytes',
    async (bits, catalogue) => {
      runBenchmark.mockResolvedValue({
        ...timings,
        publicKeyBytes: null,
        privateKeyBytes: null,
        sigCiphertextBytes: bits / 8,
        keySizeEstimates: { rsaModulusBytes: bits / 8, rsaPrivateHeuristicBytes: (bits / 8) * 2 },
      })
      render(<AlgorithmCheckButton algorithm={algo(`RSA-${bits}`, catalogue, bits / 8)} />)
      fireEvent.click(screen.getByRole('button'))
      await screen.findByText(/Serialized RSA key sizes not measured/)
      expect(screen.getByText(/modulus-derived/)).toHaveTextContent(`${bits / 8} B`)
      expect(screen.queryByText(/^pk:/)).not.toBeInTheDocument()
      expect(screen.getByText(`sig:${bits / 8}B ✓`)).toBeInTheDocument()
    }
  )
  it('does not infer measured provenance from legacy numeric RSA fields or an accidental catalogue match', async () => {
    runBenchmark.mockResolvedValue({
      ...timings,
      publicKeyBytes: 270,
      privateKeyBytes: 1190,
      sigCiphertextBytes: 256,
    })
    render(<AlgorithmCheckButton algorithm={algo('RSA-2048', 270, 256)} />)
    fireEvent.click(screen.getByRole('button'))
    await screen.findByText(/size provenance not recorded/)
    expect(screen.queryByText(/^pk:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/modulus-derived/)).not.toBeInTheDocument()
  })
  it.each([
    [2048, 270, 1191],
    [3072, 398, 1767],
    [4096, 526, 2349],
  ])(
    'shows actual RSA-%s public/private PKCS#1 bytes without a guessed catalogue match',
    async (bits, publicBytes, privateBytes) => {
      runBenchmark.mockResolvedValue({
        ...timings,
        publicKeyBytes: publicBytes,
        privateKeyBytes: privateBytes,
        sigCiphertextBytes: bits / 8,
        rsaKeyEncoding: 'pkcs1-der',
      })
      render(<AlgorithmCheckButton algorithm={algo(`RSA-${bits}`, publicBytes, bits / 8)} />)
      fireEvent.click(screen.getByRole('button'))
      await screen.findByText(`RSA public: ${publicBytes} B · PKCS#1 RSAPublicKey DER`)
      expect(
        screen.getByText(
          `RSA private: ${privateBytes} B · PKCS#1 RSAPrivateKey DER (serialized from generated sample attributes)`
        )
      ).toBeInTheDocument()
      expect(screen.queryByText(/^pk:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Serialized RSA key sizes not measured/)).not.toBeInTheDocument()
      expect(screen.getByText(`sig:${bits / 8}B ✓`)).toBeInTheDocument()
    }
  )
  it('preserves the existing non-RSA output badge and timing display', async () => {
    runBenchmark.mockResolvedValue({
      ...timings,
      publicKeyBytes: 1952,
      privateKeyBytes: 4032,
      sigCiphertextBytes: 3309,
    })
    render(<AlgorithmCheckButton algorithm={algo('ML-DSA-65', 1952, 3309)} />)
    fireEvent.click(screen.getByRole('button'))
    await screen.findByText('pk:1952B ✓')
    expect(screen.getByText('1.0ms')).toBeInTheDocument()
    expect(screen.queryByText(/Serialized RSA/)).not.toBeInTheDocument()
  })
})
