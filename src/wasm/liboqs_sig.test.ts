// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInstance, mockFactory } = vi.hoisted(() => {
  const mockInstance = {
    generateKeyPair: vi.fn().mockReturnValue({
      publicKey: new Uint8Array([1, 2, 3]),
      secretKey: new Uint8Array([4, 5, 6]),
    }),
    sign: vi.fn().mockReturnValue(new Uint8Array([7, 8, 9])),
    verify: vi.fn().mockReturnValue(true),
    destroy: vi.fn(),
  }
  const mockFactory = vi.fn().mockResolvedValue(mockInstance)
  return { mockInstance, mockFactory }
})

vi.mock('@oqs/liboqs-js/sig', () => ({
  createFalcon512: mockFactory,
  createFalcon1024: mockFactory,
  createSlhDsaSha2128f: mockFactory,
  createSlhDsaSha2128s: mockFactory,
  createSlhDsaSha2192f: mockFactory,
  createSlhDsaSha2192s: mockFactory,
  createSlhDsaSha2256f: mockFactory,
  createSlhDsaSha2256s: mockFactory,
  createSlhDsaShake128f: mockFactory,
  createSlhDsaShake128s: mockFactory,
  createSlhDsaShake192f: mockFactory,
  createSlhDsaShake192s: mockFactory,
  createSlhDsaShake256f: mockFactory,
  createSlhDsaShake256s: mockFactory,
}))

import {
  generateKey,
  sign,
  verify,
  clearInstanceCache,
  load,
  SLH_DSA_ALGORITHMS,
  FALCON_ALGORITHMS,
} from './liboqs_sig'

describe('liboqs_sig', () => {
  beforeEach(() => {
    clearInstanceCache()
    vi.clearAllMocks()
  })

  describe('load', () => {
    it('returns true', async () => {
      expect(await load()).toBe(true)
    })
  })

  describe('algorithm constants', () => {
    it('exports all 12 SLH-DSA variants', () => {
      expect(SLH_DSA_ALGORITHMS).toHaveLength(12)
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-128f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-128s')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-192f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-192s')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-256f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHA2-256s')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-128f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-128s')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-192f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-192s')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-256f')
      expect(SLH_DSA_ALGORITHMS).toContain('SLH-DSA-SHAKE-256s')
    })

    it('exports both Falcon variants', () => {
      expect(FALCON_ALGORITHMS).toHaveLength(2)
      expect(FALCON_ALGORITHMS).toContain('FN-DSA-512')
      expect(FALCON_ALGORITHMS).toContain('FN-DSA-1024')
    })
  })

  describe('generateKey', () => {
    it.each([...SLH_DSA_ALGORITHMS, ...FALCON_ALGORITHMS])(
      'generates key pair for %s',
      async (algo) => {
        const result = await generateKey({ name: algo })
        expect(result.publicKey).toBeInstanceOf(Uint8Array)
        expect(result.secretKey).toBeInstanceOf(Uint8Array)
        expect(mockFactory).toHaveBeenCalled()
        expect(mockInstance.generateKeyPair).toHaveBeenCalled()
      }
    )

    it('accepts Falcon legacy names', async () => {
      const result = await generateKey({ name: 'Falcon-512' })
      expect(result.publicKey).toBeInstanceOf(Uint8Array)

      clearInstanceCache()
      vi.clearAllMocks()

      const result2 = await generateKey({ name: 'Falcon-1024' })
      expect(result2.publicKey).toBeInstanceOf(Uint8Array)
    })

    it('throws for unknown algorithm', async () => {
      await expect(generateKey({ name: 'UNKNOWN-ALG' })).rejects.toThrow(
        'Unknown signature algorithm: UNKNOWN-ALG'
      )
    })
  })

  describe('sign', () => {
    it.each([...SLH_DSA_ALGORITHMS])('signs a message with %s', async (algo) => {
      const message = new Uint8Array([10, 20, 30])
      const secretKey = new Uint8Array([4, 5, 6])
      const signature = await sign(message, secretKey, algo)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(mockInstance.sign).toHaveBeenCalledWith(message, secretKey)
    })
  })

  describe('verify', () => {
    it.each([...SLH_DSA_ALGORITHMS])('verifies a signature with %s', async (algo) => {
      const signature = new Uint8Array([7, 8, 9])
      const message = new Uint8Array([10, 20, 30])
      const publicKey = new Uint8Array([1, 2, 3])
      const result = await verify(signature, message, publicKey, algo)
      expect(result).toBe(true)
      expect(mockInstance.verify).toHaveBeenCalledWith(message, signature, publicKey)
    })
  })

  describe('full sign/verify cycle', () => {
    it.each([...SLH_DSA_ALGORITHMS, ...FALCON_ALGORITHMS])(
      'keygen → sign → verify for %s',
      async (algo) => {
        const { publicKey, secretKey } = await generateKey({ name: algo })
        const message = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
        const signature = await sign(message, secretKey, algo)
        const valid = await verify(signature, message, publicKey, algo)
        expect(valid).toBe(true)
      }
    )
  })

  describe('instance caching', () => {
    it('reuses cached instance on second call', async () => {
      await generateKey({ name: 'SLH-DSA-SHA2-256f' })
      await generateKey({ name: 'SLH-DSA-SHA2-256f' })
      // Factory should only be called once
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })

    it('creates separate instances for different algorithms', async () => {
      await generateKey({ name: 'SLH-DSA-SHA2-128f' })
      await generateKey({ name: 'SLH-DSA-SHAKE-256s' })
      expect(mockFactory).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearInstanceCache', () => {
    it('clears all cached instances', async () => {
      await generateKey({ name: 'SLH-DSA-SHA2-192f' })
      clearInstanceCache()
      expect(mockInstance.destroy).toHaveBeenCalled()
      // After clearing, next call should create a new instance
      vi.clearAllMocks()
      await generateKey({ name: 'SLH-DSA-SHA2-192f' })
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('propagates factory creation errors', async () => {
      mockFactory.mockRejectedValueOnce(new Error('WASM load failed'))
      await expect(generateKey({ name: 'SLH-DSA-SHA2-128f' })).rejects.toThrow('WASM load failed')
    })

    it('retries after a factory failure (cache eviction on error)', async () => {
      mockFactory.mockRejectedValueOnce(new Error('transient'))
      await expect(generateKey({ name: 'SLH-DSA-SHAKE-192f' })).rejects.toThrow('transient')

      // Second call should retry (not return cached rejection)
      mockFactory.mockResolvedValueOnce(mockInstance)
      const result = await generateKey({ name: 'SLH-DSA-SHAKE-192f' })
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
    })
  })
})
