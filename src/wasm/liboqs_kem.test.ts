// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInstance, mockFactory } = vi.hoisted(() => {
  const mockInstance = {
    generateKeyPair: vi.fn().mockReturnValue({
      publicKey: new Uint8Array([1, 2, 3]),
      secretKey: new Uint8Array([4, 5, 6]),
    }),
    encapsulate: vi.fn().mockReturnValue({
      ciphertext: new Uint8Array([10, 11, 12]),
      sharedSecret: new Uint8Array([20, 21, 22]),
    }),
    decapsulate: vi.fn().mockReturnValue(new Uint8Array([20, 21, 22])),
    destroy: vi.fn(),
  }
  const mockFactory = vi.fn().mockResolvedValue(mockInstance)
  return { mockInstance, mockFactory }
})

vi.mock('@oqs/liboqs-js', () => ({
  createMLKEM512: mockFactory,
  createMLKEM768: mockFactory,
  createMLKEM1024: mockFactory,
  createHQC128: mockFactory,
  createHQC192: mockFactory,
  createHQC256: mockFactory,
  createFrodoKEM640AES: mockFactory,
  createFrodoKEM976AES: mockFactory,
  createFrodoKEM1344AES: mockFactory,
  createClassicMcEliece348864: mockFactory,
  createClassicMcEliece460896: mockFactory,
  createClassicMcEliece6688128: mockFactory,
  createClassicMcEliece6960119: mockFactory,
  createClassicMcEliece8192128: mockFactory,
}))

import {
  generateKey,
  encapsulateBits,
  decapsulateBits,
  clearInstanceCache,
  load,
} from './liboqs_kem'

const ALL_KEM_ALGORITHMS = [
  'ML-KEM-512',
  'ML-KEM-768',
  'ML-KEM-1024',
  'HQC-128',
  'HQC-192',
  'HQC-256',
  'FrodoKEM-640-AES',
  'FrodoKEM-976-AES',
  'FrodoKEM-1344-AES',
  'FrodoKEM-640',
  'FrodoKEM-976',
  'FrodoKEM-1344',
  'Classic-McEliece-348864',
  'Classic-McEliece-460896',
  'Classic-McEliece-6688128',
  'Classic-McEliece-6960119',
  'Classic-McEliece-8192128',
] as const

describe('liboqs_kem', () => {
  beforeEach(() => {
    clearInstanceCache()
    vi.clearAllMocks()
  })

  describe('load', () => {
    it('returns true', async () => {
      expect(await load()).toBe(true)
    })
  })

  describe('generateKey', () => {
    it.each(ALL_KEM_ALGORITHMS)('generates key pair for %s', async (algo) => {
      const result = await generateKey({ name: algo })
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.secretKey).toBeInstanceOf(Uint8Array)
      expect(mockFactory).toHaveBeenCalled()
      expect(mockInstance.generateKeyPair).toHaveBeenCalled()
    })

    it('throws for unknown algorithm', async () => {
      await expect(generateKey({ name: 'UNKNOWN-KEM' })).rejects.toThrow(
        'Unknown algorithm: UNKNOWN-KEM'
      )
    })
  })

  describe('encapsulateBits', () => {
    it.each(ALL_KEM_ALGORITHMS)('encapsulates with %s', async (algo) => {
      const publicKey = new Uint8Array([1, 2, 3])
      const result = await encapsulateBits({ name: algo }, publicKey)
      expect(result.ciphertext).toBeInstanceOf(Uint8Array)
      expect(result.sharedKey).toBeInstanceOf(Uint8Array)
      expect(mockInstance.encapsulate).toHaveBeenCalledWith(publicKey)
    })
  })

  describe('decapsulateBits', () => {
    it.each(ALL_KEM_ALGORITHMS)('decapsulates with %s', async (algo) => {
      const secretKey = new Uint8Array([4, 5, 6])
      const ciphertext = new Uint8Array([10, 11, 12])
      const result = await decapsulateBits({ name: algo }, secretKey, ciphertext)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(mockInstance.decapsulate).toHaveBeenCalledWith(ciphertext, secretKey)
    })
  })

  describe('full KEM cycle', () => {
    it.each(ALL_KEM_ALGORITHMS)('keygen → encapsulate → decapsulate for %s', async (algo) => {
      const { publicKey, secretKey } = await generateKey({ name: algo })
      const { ciphertext, sharedKey } = await encapsulateBits({ name: algo }, publicKey)
      const recovered = await decapsulateBits({ name: algo }, secretKey, ciphertext)
      // In mock mode both return the same Uint8Array values
      expect(sharedKey).toEqual(recovered)
    })
  })

  describe('instance caching', () => {
    it('reuses cached instance on second call', async () => {
      await generateKey({ name: 'ML-KEM-768' })
      await generateKey({ name: 'ML-KEM-768' })
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })

    it('creates separate instances for different algorithms', async () => {
      await generateKey({ name: 'ML-KEM-512' })
      await generateKey({ name: 'HQC-128' })
      expect(mockFactory).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearInstanceCache', () => {
    it('clears all cached instances and calls destroy', async () => {
      await generateKey({ name: 'ML-KEM-768' })
      clearInstanceCache()
      expect(mockInstance.destroy).toHaveBeenCalled()
      vi.clearAllMocks()
      await generateKey({ name: 'ML-KEM-768' })
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('propagates factory creation errors', async () => {
      mockFactory.mockRejectedValueOnce(new Error('WASM init failed'))
      await expect(generateKey({ name: 'ML-KEM-512' })).rejects.toThrow('WASM init failed')
    })

    it('retries after a factory failure (cache eviction on error)', async () => {
      mockFactory.mockRejectedValueOnce(new Error('transient'))
      await expect(generateKey({ name: 'HQC-256' })).rejects.toThrow('transient')

      mockFactory.mockResolvedValueOnce(mockInstance)
      const result = await generateKey({ name: 'HQC-256' })
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
    })
  })
})
