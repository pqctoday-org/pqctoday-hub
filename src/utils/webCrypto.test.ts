import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateRSAKeyPair,
  generateECDSAKeyPair,
  generateEd25519KeyPair,
  generateECDHKeyPair,
  generateX25519KeyPair,
  signRSA,
  verifyRSA,
  signECDSA,
  verifyECDSA,
  signEd25519,
  verifyEd25519,
  deriveSharedSecret,
  generateAESKey,
  encryptAES,
  decryptAES,
  hash,
  hkdfExtract,
  hkdfExpand,
  arrayBufferToHex,
  hexToUint8Array,
  getRandomBytes,
  isWebCryptoSupported,
  isAlgorithmSupported,
} from './webCrypto'

describe('webCrypto', () => {
  const mockSubtle = {
    generateKey: vi.fn(),
    exportKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    digest: vi.fn(),
    deriveBits: vi.fn(),
    deriveKey: vi.fn(),
    importKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: mockSubtle,
        getRandomValues: vi.fn((arr) => {
          for (let i = 0; i < arr.length; i++) arr[i] = i
          return arr
        }),
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
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(3))

      const result = await generateRSAKeyPair(2048)
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RSA-PSS', modulusLength: 2048 }),
        true,
        ['sign', 'verify']
      )
      expect(result.publicKey).toBe(mockKeyPair.publicKey)
      expect(result.publicKeyHex).toBe('000000')
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

    it('verifies RSA signature', async () => {
      mockSubtle.verify.mockResolvedValue(true)
      const key = {} as CryptoKey
      const data = new Uint8Array([1])
      const sig = new Uint8Array([2])
      const isValid = await verifyRSA(key, sig, data)
      expect(mockSubtle.verify).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RSA-PSS' }),
        key,
        sig,
        data
      )
      expect(isValid).toBe(true)
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

    it('signs data with ECDSA', async () => {
      mockSubtle.sign.mockResolvedValue(new ArrayBuffer(10))
      const key = {} as CryptoKey
      const data = new Uint8Array([1, 2, 3])
      const sig = await signECDSA(key, data)
      expect(mockSubtle.sign).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ECDSA' }),
        key,
        data
      )
      expect(sig).toHaveLength(10)
    })

    it('verifies ECDSA signature', async () => {
      mockSubtle.verify.mockResolvedValue(true)
      const key = {} as CryptoKey
      const data = new Uint8Array([1])
      const sig = new Uint8Array([2])
      const isValid = await verifyECDSA(key, sig, data)
      expect(mockSubtle.verify).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ECDSA' }),
        key,
        sig,
        data
      )
      expect(isValid).toBe(true)
    })
  })

  describe('Ed25519 Operations', () => {
    it('generates Ed25519 key pair', async () => {
      const mockKeyPair = { publicKey: {}, privateKey: {} }
      mockSubtle.generateKey.mockResolvedValue(mockKeyPair)
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(2))
      await generateEd25519KeyPair()
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ed25519' }),
        true,
        ['sign', 'verify']
      )
    })

    it('signs data with Ed25519', async () => {
      mockSubtle.sign.mockResolvedValue(new ArrayBuffer(10))
      const key = {} as CryptoKey
      const data = new Uint8Array([1, 2, 3])
      const sig = await signEd25519(key, data)
      expect(mockSubtle.sign).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ed25519' }),
        key,
        data
      )
      expect(sig).toHaveLength(10)
    })

    it('verifies Ed25519 signature', async () => {
      mockSubtle.verify.mockResolvedValue(true)
      const key = {} as CryptoKey
      const data = new Uint8Array([1])
      const sig = new Uint8Array([2])
      const isValid = await verifyEd25519(key, sig, data)
      expect(mockSubtle.verify).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ed25519' }),
        key,
        sig,
        data
      )
      expect(isValid).toBe(true)
    })
  })

  describe('ECDH / X25519 Operations', () => {
    it('generates ECDH key pair', async () => {
      const mockKeyPair = { publicKey: {}, privateKey: {} }
      mockSubtle.generateKey.mockResolvedValue(mockKeyPair)
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(2))
      await generateECDHKeyPair()
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ECDH', namedCurve: 'P-256' }),
        true,
        ['deriveKey', 'deriveBits']
      )
    })

    it('generates X25519 key pair', async () => {
      const mockKeyPair = { publicKey: {}, privateKey: {} }
      mockSubtle.generateKey.mockResolvedValue(mockKeyPair)
      mockSubtle.exportKey.mockResolvedValue(new ArrayBuffer(2))
      await generateX25519KeyPair()
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'X25519' }),
        true,
        ['deriveKey', 'deriveBits']
      )
    })

    it('derives shared secret', async () => {
      mockSubtle.deriveBits.mockResolvedValue(new ArrayBuffer(32))
      const privKey = { algorithm: { name: 'ECDH' } } as CryptoKey
      const pubKey = {} as CryptoKey
      const secret = await deriveSharedSecret(privKey, pubKey)
      expect(mockSubtle.deriveBits).toHaveBeenCalledWith(
        { name: 'ECDH', public: pubKey },
        privKey,
        256
      )
      expect(secret).toHaveLength(32)
    })
  })

  describe('AES-GCM Operations', () => {
    it('generates AES key', async () => {
      const mockKey = {} as CryptoKey
      mockSubtle.generateKey.mockResolvedValue(mockKey)
      const res = await generateAESKey(256)
      expect(mockSubtle.generateKey).toHaveBeenCalledWith({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
      ])
      expect(res).toBe(mockKey)
    })

    it('encrypts data', async () => {
      mockSubtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      const key = {} as CryptoKey
      const data = new Uint8Array([1])
      const iv = new Uint8Array([2])
      const res = await encryptAES(key, data, iv)
      expect(mockSubtle.encrypt).toHaveBeenCalledWith({ name: 'AES-GCM', iv }, key, data)
      expect(res).toHaveLength(16)
    })

    it('decrypts data', async () => {
      mockSubtle.decrypt.mockResolvedValue(new ArrayBuffer(16))
      const key = {} as CryptoKey
      const encrypted = new Uint8Array([1])
      const iv = new Uint8Array([2])
      const res = await decryptAES(key, encrypted, iv)
      expect(mockSubtle.decrypt).toHaveBeenCalledWith({ name: 'AES-GCM', iv }, key, encrypted)
      expect(res).toHaveLength(16)
    })
  })

  describe('Hash Operations', () => {
    it('hashes data', async () => {
      mockSubtle.digest.mockResolvedValue(new ArrayBuffer(32))
      const data = new Uint8Array([1])
      const res = await hash('SHA-256', data)
      expect(mockSubtle.digest).toHaveBeenCalledWith('SHA-256', data)
      expect(res).toHaveLength(32)
    })
  })

  describe('HKDF Operations', () => {
    it('extracts HKDF', async () => {
      mockSubtle.importKey.mockResolvedValue({} as CryptoKey)
      mockSubtle.sign.mockResolvedValue(new ArrayBuffer(32))
      const salt = new Uint8Array([1])
      const ikm = new Uint8Array([2])
      const res = await hkdfExtract(salt, ikm, 'SHA-256')
      expect(mockSubtle.importKey).toHaveBeenCalled()
      expect(mockSubtle.sign).toHaveBeenCalled()
      expect(res).toHaveLength(32)
    })

    it('extracts HKDF with empty salt', async () => {
      mockSubtle.importKey.mockResolvedValue({} as CryptoKey)
      mockSubtle.sign.mockResolvedValue(new ArrayBuffer(32))
      const salt = new Uint8Array(0)
      const ikm = new Uint8Array([2])
      const res = await hkdfExtract(salt, ikm, 'SHA-384')
      expect(mockSubtle.importKey).toHaveBeenCalled()
      expect(mockSubtle.sign).toHaveBeenCalled()
      expect(res).toHaveLength(32)
    })

    it('expands HKDF', async () => {
      mockSubtle.importKey.mockResolvedValue({} as CryptoKey)
      mockSubtle.sign.mockResolvedValue(new Uint8Array(32).buffer)
      const prk = new Uint8Array([1])
      const info = new Uint8Array([2])
      const res = await hkdfExpand(prk, info, 48, 'SHA-256') // 48 bytes = 2 signatures of 32 bytes
      expect(mockSubtle.importKey).toHaveBeenCalled()
      expect(mockSubtle.sign).toHaveBeenCalledTimes(2)
      expect(res).toHaveLength(48)
    })

    it('throws when expanded key is too long', async () => {
      const prk = new Uint8Array([1])
      const info = new Uint8Array([2])
      await expect(hkdfExpand(prk, info, 256 * 32 + 1, 'SHA-256')).rejects.toThrow(
        'HKDF-Expand: Derived key too long'
      )
    })
  })

  describe('Utility Functions', () => {
    it('converts ArrayBuffer to Hex', () => {
      const buf = new Uint8Array([0, 15, 255]).buffer
      expect(arrayBufferToHex(buf)).toBe('000fff')
    })

    it('converts Hex to Uint8Array', () => {
      const hex = '000fff'
      const buf = hexToUint8Array(hex)
      expect(buf).toEqual(new Uint8Array([0, 15, 255]))
    })

    it('gets random bytes', () => {
      const arr = getRandomBytes(3)
      expect(arr.length).toBe(3)
      expect(arr).toEqual(new Uint8Array([0, 1, 2])) // Using mock values
    })

    describe('isAlgorithmSupported', () => {
      it('returns true on success for Ed25519', async () => {
        mockSubtle.generateKey.mockResolvedValue({})
        expect(await isAlgorithmSupported('Ed25519')).toBe(true)
      })
      it('returns true on success for X25519', async () => {
        mockSubtle.generateKey.mockResolvedValue({})
        expect(await isAlgorithmSupported('X25519')).toBe(true)
      })
      it('returns true for other algorithms', async () => {
        expect(await isAlgorithmSupported('RSA')).toBe(true)
      })
      it('returns false when error is thrown', async () => {
        mockSubtle.generateKey.mockRejectedValue(new Error())
        expect(await isAlgorithmSupported('Ed25519')).toBe(false)
      })
    })
  })
})
