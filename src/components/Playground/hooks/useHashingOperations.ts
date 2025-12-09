import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
import { sha3_256, keccak_256 } from '@noble/hashes/sha3.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

export interface HashMethod {
  id: string
  name: string
  description: string
  outputSize: string
  outputBits: number
  useCases: string
}

export const HASH_METHODS: HashMethod[] = [
  {
    id: 'SHA-256',
    name: 'SHA-256',
    description: 'Secure Hash Algorithm 256-bit (SHA-2 family)',
    outputSize: '32 bytes',
    outputBits: 256,
    useCases: 'Bitcoin, Ethereum, Digital ID, General Purpose',
  },
  {
    id: 'SHA-384',
    name: 'SHA-384',
    description: 'Secure Hash Algorithm 384-bit (SHA-2 family)',
    outputSize: '48 bytes',
    outputBits: 384,
    useCases: 'High Security Applications, Digital Signatures',
  },
  {
    id: 'SHA-512',
    name: 'SHA-512',
    description: 'Secure Hash Algorithm 512-bit (SHA-2 family)',
    outputSize: '64 bytes',
    outputBits: 512,
    useCases: 'Solana, HD Wallets, High Security',
  },
  {
    id: 'SHA3-256',
    name: 'SHA3-256',
    description: 'SHA-3 (Keccak) 256-bit - NIST Standard',
    outputSize: '32 bytes',
    outputBits: 256,
    useCases: 'Modern Applications, NIST Compliance',
  },
  {
    id: 'Keccak-256',
    name: 'Keccak-256',
    description: 'Original Keccak 256-bit (pre-NIST)',
    outputSize: '32 bytes',
    outputBits: 256,
    useCases: 'Ethereum Address Generation, Smart Contracts',
  },
  {
    id: 'RIPEMD-160',
    name: 'RIPEMD-160',
    description: 'RACE Integrity Primitives Evaluation Message Digest',
    outputSize: '20 bytes',
    outputBits: 160,
    useCases: 'Bitcoin Hash160, Legacy Applications',
  },
  {
    id: 'BLAKE2b-256',
    name: 'BLAKE2b-256',
    description: 'BLAKE2b with 256-bit output',
    outputSize: '32 bytes',
    outputBits: 256,
    useCases: 'Modern Alternative to SHA-2, High Performance',
  },
  {
    id: 'BLAKE2b-512',
    name: 'BLAKE2b-512',
    description: 'BLAKE2b with 512-bit output',
    outputSize: '64 bytes',
    outputBits: 512,
    useCases: 'Modern Alternative to SHA-512, High Performance',
  },
]

/**
 * Custom hook for hashing operations using @noble/hashes
 * Supports all major hash algorithms used across learn modules
 */
export const useHashingOperations = () => {
  /**
   * Perform hash operation on input data
   * @param algorithm - Hash algorithm identifier
   * @param data - Input data as Uint8Array
   * @returns Hash output as Uint8Array
   */
  const performHash = (algorithm: string, data: Uint8Array): Uint8Array => {
    switch (algorithm) {
      case 'SHA-256':
        return sha256(data)
      case 'SHA-384':
        return sha384(data)
      case 'SHA-512':
        return sha512(data)
      case 'SHA3-256':
        return sha3_256(data)
      case 'Keccak-256':
        return keccak_256(data)
      case 'RIPEMD-160':
        return ripemd160(data)
      case 'BLAKE2b-256':
        return blake2b(data, { dkLen: 32 })
      case 'BLAKE2b-512':
        return blake2b(data, { dkLen: 64 })
      default:
        throw new Error(`Unsupported hash algorithm: ${algorithm}`)
    }
  }

  /**
   * Hash data and return hex string
   * @param algorithm - Hash algorithm identifier
   * @param input - Input string (hex or ASCII)
   * @param inputType - 'hex' or 'ascii'
   * @returns Hash output as hex string
   */
  const hashData = (
    algorithm: string,
    input: string,
    inputType: 'hex' | 'ascii' = 'ascii'
  ): string => {
    if (!input) {
      throw new Error('Input data is required')
    }

    let inputBytes: Uint8Array

    if (inputType === 'hex') {
      // Remove spaces and validate hex
      const cleanHex = input.replace(/\s/g, '')
      if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
        throw new Error('Invalid hex input')
      }
      inputBytes = hexToBytes(cleanHex)
    } else {
      // ASCII input
      inputBytes = new TextEncoder().encode(input)
    }

    const hashBytes = performHash(algorithm, inputBytes)
    return bytesToHex(hashBytes)
  }

  /**
   * Get hash method details by ID
   */
  const getHashMethod = (id: string): HashMethod | undefined => {
    return HASH_METHODS.find((method) => method.id === id)
  }

  return {
    performHash,
    hashData,
    getHashMethod,
    HASH_METHODS,
  }
}
