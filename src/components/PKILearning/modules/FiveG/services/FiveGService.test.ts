// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FiveGService } from './FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import * as ProvisionOps from './ops/ProvisionOps'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

// Mock window.crypto.getRandomValues and subtle for consistent branch testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => arr.fill(0xaa),
    subtle: {
      importKey: vi.fn(),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
    },
  },
})

describe('FiveGService', () => {
  let service: FiveGService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FiveGService()

    // Default openSSL mock response
    vi.mocked(openSSLService.execute).mockResolvedValue({
      stdout: 'mock_stdout',
      stderr: '',
      files: [{ name: 'mock.der', data: new Uint8Array([1, 2, 3]) }],
    })
  })

  describe('cleanup', () => {
    it('clears tracked files using openSSLService.deleteFile', async () => {
      // Intentionally track a file via injectKey to test cleanup
      await service['trackFile']('test.key')
      await service.cleanup()
      expect(openSSLService.deleteFile).toHaveBeenCalledWith('test.key')
    })
  })

  describe('generateNetworkKey', () => {
    it('generates Profile A keys correctly', async () => {
      const result = await service.generateNetworkKey('A')
      expect(result.pubKeyFile).toContain('5g_hn_pub')
      expect(result.privKeyFile).toContain('5g_hn_priv')
      expect(openSSLService.execute).toHaveBeenCalledWith(expect.stringContaining('x25519'))
    })

    it('generates Profile B keys correctly', async () => {
      const result = await service.generateNetworkKey('B')
      expect(result.pubKeyFile).toContain('5g_hn_pub')
      expect(openSSLService.execute).toHaveBeenCalledWith(expect.stringContaining('P-256'))
    })

    it('generates Profile C keys in hybrid mode', async () => {
      const result = await service.generateNetworkKey('C', 'hybrid')
      // Hybrid mode joins the ECC and PQC filenames using pipe
      expect(result.pubKeyFile).toContain('|')
      expect(result.privKeyFile).toContain('|')
    })

    it('generates Profile C keys in pure mode', async () => {
      const result = await service.generateNetworkKey('C', 'pure')
      expect(result.pubKeyFile).not.toContain('|')
    })

    it('falls back if generateNetworkKey fails', async () => {
      vi.mocked(openSSLService.execute).mockRejectedValueOnce(new Error('Simulated failure'))
      const result = await service.generateNetworkKey('A')
      expect(result.pubKeyFile).toContain('fallback')
    })
  })

  describe('provisionUSIM', () => {
    it('returns fast-path output if pubKeyFile indicates fallback or pqc', async () => {
      const res = await service.provisionUSIM('fallback_key.key')
      expect(res).toContain('USIM Initialized')
    })

    it('returns parsed output for regular keys', async () => {
      const res = await service.provisionUSIM('regular_key.key')
      expect(res).toContain('Writing to EF_SUCI_Calc_Info')
    })
  })

  describe('retrieveKey', () => {
    it('retrieves the key from USIM simulation output', async () => {
      const res = await service.retrieveKey('mykey.key', 'A')
      expect(res).toContain('Key Loaded into Memory')
    })
  })

  describe('generateEphemeralKey', () => {
    it('generates ephemeral key for Profile A', async () => {
      const res = await service.generateEphemeralKey('A')
      expect(res.output).toContain('Ephemeral Key Pair Ready')
    })

    it('handles test vectors properly for Profile A', async () => {
      service.enableTestMode({ profileA: { hnPriv: '123', ephPriv: '456' } })
      const res = await service.generateEphemeralKey('A')
      expect(res.output).toContain('Ephemeral Key Pair Ready')
    })

    it('generates ephemeral key for Profile C in hybrid mode', async () => {
      const res = await service.generateEphemeralKey('C', 'hybrid')
      expect(res.output).toContain('Ephemeral ECC Key Pair Ready')
    })

    it('returns dummy output for Profile C in pure pqc mode', async () => {
      const res = await service.generateEphemeralKey('C', 'pure')
      expect(res.output).toContain('Pure PQC Mode')
      expect(res.privKey).toBe('N/A')
    })
  })

  describe('computeSharedSecret', () => {
    it('rejects malformed shared-secret output for Profile C (pure PQC)', async () => {
      // Force base64 read bypass mock
      vi.mocked(openSSLService.execute).mockResolvedValue({
        stdout: Buffer.from('mockdata').toString('base64'),
        stderr: '',
        files: [],
      })
      await expect(service.computeSharedSecret('C', 'priv.key', 'pub.key', 'pure')).rejects.toThrow(
        /32 bytes/
      )
    })
  })

  describe('deriveKeys', () => {
    it('rejects key derivation without an established shared secret', async () => {
      await expect(service.deriveKeys('A')).rejects.toThrow(/Shared-secret derivation failed/)
    })
  })

  describe('encryptMSIN', () => {
    it('rejects encryption without a derived key', async () => {
      await expect(service.encryptMSIN()).rejects.toThrow(/No key derived/)
    })
  })

  describe('computeMAC', () => {
    it('computes mac when skipped due to missing keys', async () => {
      const res = await service.computeMAC()
      expect(res).toBeDefined()
    })
  })

  describe('Milenge / 5G AKA operations', () => {
    it('generateSubKey', async () => {
      const res = await service.generateSubKey()
      expect(res).toBeDefined()
    })

    it('assembleSUCI', async () => {
      const res = await service.assembleSUCI('A')
      expect(res).toBeDefined()
    })

    it('retrieveCredentials', async () => {
      const res = await service.retrieveCredentials()
      expect(res).toBeDefined()
    })

    it('generateRAND', async () => {
      const res = await service.generateRAND()
      expect(res).toBeDefined()
    })

    it('computeAUTN', async () => {
      const res = await service.computeAUTN()
      expect(res).toBeDefined()
    })

    it('visualizeStructure', async () => {
      const res = await service.visualizeStructure()
      expect(res).toBeDefined()
    })

    it('runMilenage', async () => {
      const res = await service.runMilenage()
      expect(res).toBeDefined()
    })

    it('computeOPc', async () => {
      const res = await service.computeOPc('01'.repeat(16))
      expect(res).toBeDefined()
    })

    it('personalizeUSIM', async () => {
      const res = await service.personalizeUSIM('dummy_ki', 'dummy_opc')
      expect(res).toBeDefined()
    })

    it('importAtUDM delegates the exact envelope/key/expected identity without serializing the key', async () => {
      const key = { type: 'secret' } as CryptoKey
      const result = {
        record: { imsi: '310260123456789', k: '01'.repeat(16), opc: '02'.repeat(16) },
        checks: { identity: 'fixture' },
      }
      const delegate = vi.spyOn(ProvisionOps, 'importAtUDM').mockResolvedValueOnce(result)
      try {
        expect(await service.importAtUDM('serialized-envelope', key, result.record.imsi)).toBe(
          result
        )
        expect(delegate).toHaveBeenCalledWith(
          service,
          'serialized-envelope',
          key,
          result.record.imsi
        )
      } finally {
        delegate.mockRestore()
      }
    })

    it('encryptTransport delegates to the single authenticated implementation', async () => {
      const key = { type: 'secret' } as CryptoKey
      const result = {
        envelope: {
          format: 'pqctoday-provisioning-batch' as const,
          version: 1 as const,
          algorithm: 'AES-128-GCM' as const,
          ivHex: '00'.repeat(12),
          ciphertextHex: '11'.repeat(16),
        },
        transportKey: key,
      }
      const delegate = vi.spyOn(ProvisionOps, 'encryptTransport').mockResolvedValueOnce(result)
      try {
        expect(await service.encryptTransport('01'.repeat(16), '02'.repeat(16))).toBe(result)
        expect(delegate).toHaveBeenCalledWith(service, '01'.repeat(16), '02'.repeat(16))
      } finally {
        delegate.mockRestore()
      }
    })
  })
})
