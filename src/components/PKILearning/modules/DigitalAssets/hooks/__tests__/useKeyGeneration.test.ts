import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyGeneration } from '../useKeyGeneration'
import { openSSLService } from '../../../../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../../../../../OpenSSLStudio/store'
import { extractKeyFromOpenSSLOutput } from '../../../../../../utils/cryptoUtils'

// Mocks
vi.mock('../../../../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn(),
  },
}))

vi.mock('../../../../../OpenSSLStudio/store', () => ({
  useOpenSSLStore: vi.fn(),
}))

vi.mock('../../../../../../utils/cryptoUtils', () => ({
  extractKeyFromOpenSSLOutput: vi.fn(),
}))

vi.mock('../../constants', () => ({
  DIGITAL_ASSETS_CONSTANTS: {
    COMMANDS: {
      BITCOIN: {
        GEN_KEY: (f: string) => `gen-btc-key ${f}`,
        EXTRACT_PUB: (f: string, out: string) => `extract-btc-pub ${f} ${out}`,
      },
      ETHEREUM: {
        GEN_KEY: (f: string) => `gen-eth-key ${f}`,
        EXTRACT_PUB: (f: string, out: string) => `extract-eth-pub ${f} ${out}`,
      },
      SOLANA: {
        GEN_KEY: (f: string) => `gen-sol-key ${f}`,
        EXTRACT_PUB: (f: string, out: string) => `extract-sol-pub ${f} ${out}`,
      },
    },
  },
}))

describe('useKeyGeneration', () => {
  const addFileMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useOpenSSLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addFile: addFileMock,
    })
  })

  it('should generate Bitcoin keys successfully', async () => {
    const { result } = renderHook(() => useKeyGeneration('bitcoin'))

    // Mock OpenSSL responses
    const mockExecute = openSSLService.execute as unknown as ReturnType<typeof vi.fn>
    // Step 1: Gen Key
    mockExecute.mockResolvedValueOnce({
      error: null,
      files: [{ name: 'priv.pem', data: new Uint8Array([1, 2, 3]) }],
    })
    // Step 3: Extract Pub
    mockExecute.mockResolvedValueOnce({
      error: null,
      files: [{ name: 'pub.pem', data: new Uint8Array([4, 5, 6]) }],
    })

    // Mock Crypto Utils
    const mockExtract = extractKeyFromOpenSSLOutput as unknown as ReturnType<typeof vi.fn>
    // Private Key
    mockExtract.mockResolvedValueOnce(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
    // Public Key
    mockExtract.mockResolvedValueOnce(new Uint8Array([0xca, 0xfe, 0xba, 0xbe]))

    let output
    await act(async () => {
      output = await result.current.generateKeyPair('priv.pem', 'pub.pem')
    })

    expect(output).toBeDefined()
    expect(result.current.privateKeyHex).toBe('deadbeef')
    expect(result.current.publicKeyHex).toBe('cafebabe')
    expect(addFileMock).toHaveBeenCalledTimes(2) // Once for priv file, once for pub file
    expect(mockExecute).toHaveBeenCalledTimes(2)
  })

  it('should handle Solana key generation with JS fallback when OpenSSL fails', async () => {
    const { result } = renderHook(() => useKeyGeneration('solana'))

    // Mock OpenSSL keygen failure for Ed25519
    const mockExecute = openSSLService.execute as unknown as ReturnType<typeof vi.fn>
    mockExecute.mockResolvedValueOnce({
      error: 'Algorithm Ed25519 not found',
      stderr: 'Algorithm Ed25519 not found',
      files: [],
    })

    // Mock JS Fallback extraction (for public key)
    // The hook will call execute again for pub key extraction, likely fail again or succeed if we mock it
    // But in fallback mode, it might use JS completely if the first step failed?
    // Let's check the implementation:
    // If Step 1 fails with specific error, it sets fallback=true and generates priv key via JS.
    // Then Step 3 (derive pub key) checks fallback flag.

    let output
    await act(async () => {
      output = await result.current.generateKeyPair('sol_priv.pem', 'sol_pub.pem')
    })

    expect(output).toBeDefined()
    expect(result.current.usingFallback).toBe(true)
    expect(result.current.privateKeyHex).toBeDefined()
    expect(result.current.publicKeyHex).toBeDefined()
    expect(addFileMock).toHaveBeenCalled() // Should save keys to store
  })

  it('should throw error generic OpenSSL failure', async () => {
    const { result } = renderHook(() => useKeyGeneration('ethereum'))

    const mockExecute = openSSLService.execute as unknown as ReturnType<typeof vi.fn>
    mockExecute.mockResolvedValueOnce({
      error: 'Random OpenSSL Error',
      stderr: 'Some stderr',
      files: [],
    })

    await expect(result.current.generateKeyPair('eth_priv.pem', 'eth_pub.pem')).rejects.toThrow(
      'Random OpenSSL Error'
    )
  })
})
