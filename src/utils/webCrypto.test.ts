import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateRSAKeyPair,
  generateECDSAKeyPair,
  signRSA,
  isWebCryptoSupported,
} from './webCrypto'

describe('webCrypto', () => {
  const mockSubtle = {
    generateKey: vi.fn(),
    exportKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    digest: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    // Mock global crypto
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: mockSubtle,
        getRandomValues: vi.fn((arr) => arr),
      },
      writable: true,
    })
  })

  it('checks for web crypto support', () => {
    expect(isWebCryptoSupported()).toBe(true)
  })

  describe('RSA Operations', () => {
    it('generates RSA key pair correctly', async () => {
      const mockKeyPair = { publicKey: {}, privateKey: {} }
      mockSubtle.generateKey.mockResolvedValue(mockKeyPair)
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(3)) // Returns bytes

      const result = await generateRSAKeyPair(2048)

      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RSA-PSS', modulusLength: 2048 }),
        true,
        ['sign', 'verify']
      )
      expect(result.publicKey).toBe(mockKeyPair.publicKey)
      expect(result.publicKeyHex).toBe('000000') // 3 bytes of 0
    })

    it('signs data with RSA', async () => {
      mockSubtle.sign.mockResolvedValue(new ArrayBuffer(10))

      const key = {} as CryptoKey
      const data = new Uint8Array([1, 2, 3])
      const sig = await signRSA(key, data)

      expect(mockSubtle.sign).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RSA-PSS' }),
        key,
        data
      )
      expect(sig).toHaveLength(10)
    })
  })

  describe('ECDSA Operations', () => {
    it('generates ECDSA key pair', async () => {
      const mockKeyPair = { publicKey: {}, privateKey: {} }
      mockSubtle.generateKey.mockResolvedValue(mockKeyPair)
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(2))

      await generateECDSAKeyPair()

      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ECDSA', namedCurve: 'P-256' }),
        true,
        ['sign', 'verify']
      )
    })
  })
})
