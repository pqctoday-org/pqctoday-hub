import { describe, it, expect, vi } from 'vitest'
import { extractKeyFromOpenSSLOutput } from './cryptoUtils'
import { openSSLService } from '../services/crypto/OpenSSLService'

// Mock OpenSSLService
vi.mock('../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn(),
  },
}))

describe('cryptoUtils', () => {
  describe('extractKeyFromOpenSSLOutput', () => {
    it('extracts private key from OpenSSL text output', async () => {
      const mockOutput = `
Some header info
priv:
    01:02:03:04:
    05:06
pub:
    0a:0b
ASN1 dump...
`
      vi.mocked(openSSLService.execute).mockResolvedValueOnce({
        stdout: mockOutput,
        stderr: '',
        files: [],
      })

      const key = await extractKeyFromOpenSSLOutput('key.pem', 'private')
      expect(key).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })

    it('extracts public key from OpenSSL text output', async () => {
      const mockOutput = `
Header
pub:
    aa:bb:cc
ASN1
`
      vi.mocked(openSSLService.execute).mockResolvedValueOnce({
        stdout: mockOutput,
        stderr: '',
        files: [],
      })

      const key = await extractKeyFromOpenSSLOutput('key.pem', 'public')
      expect(key).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]))
    })

    it('throws error if parsing fails to find key', async () => {
      vi.mocked(openSSLService.execute).mockResolvedValueOnce({
        stdout: 'Garbage output',
        stderr: '',
        files: [],
      })

      await expect(extractKeyFromOpenSSLOutput('key.pem', 'private')).rejects.toThrow(
        'Could not find private key'
      )
    })

    it('throws error if OpenSSL execution failed', async () => {
      vi.mocked(openSSLService.execute).mockResolvedValueOnce({
        stdout: '',
        stderr: 'Algorithm Ed25519 not found',
        files: [],
        error: 'Command failed',
      })

      await expect(extractKeyFromOpenSSLOutput('key.pem', 'private')).rejects.toThrow(
        'Command failed'
      )
    })
  })
})
