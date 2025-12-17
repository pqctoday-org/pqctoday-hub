// Wrapper for Falcon (FN-DSA) and SLH-DSA using @openforge-sh/liboqs
/* eslint-disable */
import {
  // Falcon (FN-DSA)
  createFalcon512,
  createFalcon1024,
  // SLH-DSA SHA2
  createSlhDsaSha2128f,
  createSlhDsaSha2128s,
  createSlhDsaSha2192f,
  createSlhDsaSha2192s,
  createSlhDsaSha2256f,
  createSlhDsaSha2256s,
  // SLH-DSA SHAKE
  createSlhDsaShake128f,
  createSlhDsaShake128s,
  createSlhDsaShake192f,
  createSlhDsaShake192s,
  createSlhDsaShake256f,
  createSlhDsaShake256s,
} from '@openforge-sh/liboqs/sig'
import { createLogger } from '../utils/logger'

const logger = createLogger('liboqs_sig')

// Instance cache to avoid creating/destroying WASM instances repeatedly
type SigInstance = {
  generateKeyPair: () => { publicKey: Uint8Array; secretKey: Uint8Array }
  sign: (message: Uint8Array, secretKey: Uint8Array) => Uint8Array
  verify: (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => boolean
  destroy?: () => void
}

const instanceCache: Map<string, Promise<SigInstance>> = new Map()

/**
 * Get or create a cached instance for the specified algorithm
 */
const getInstance = async (algorithmName: string): Promise<SigInstance> => {
  if (!instanceCache.has(algorithmName)) {
    logger.debug(`Creating new WASM instance for ${algorithmName}`)

    let createAlgo
    switch (algorithmName) {
      // Falcon (FN-DSA) - maps from NIST naming convention
      case 'FN-DSA-512':
      case 'Falcon-512':
        createAlgo = createFalcon512
        break
      case 'FN-DSA-1024':
      case 'Falcon-1024':
        createAlgo = createFalcon1024
        break
      // SLH-DSA SHA2 variants
      case 'SLH-DSA-SHA2-128f':
        createAlgo = createSlhDsaSha2128f
        break
      case 'SLH-DSA-SHA2-128s':
        createAlgo = createSlhDsaSha2128s
        break
      case 'SLH-DSA-SHA2-192f':
        createAlgo = createSlhDsaSha2192f
        break
      case 'SLH-DSA-SHA2-192s':
        createAlgo = createSlhDsaSha2192s
        break
      case 'SLH-DSA-SHA2-256f':
        createAlgo = createSlhDsaSha2256f
        break
      case 'SLH-DSA-SHA2-256s':
        createAlgo = createSlhDsaSha2256s
        break
      // SLH-DSA SHAKE variants
      case 'SLH-DSA-SHAKE-128f':
        createAlgo = createSlhDsaShake128f
        break
      case 'SLH-DSA-SHAKE-128s':
        createAlgo = createSlhDsaShake128s
        break
      case 'SLH-DSA-SHAKE-192f':
        createAlgo = createSlhDsaShake192f
        break
      case 'SLH-DSA-SHAKE-192s':
        createAlgo = createSlhDsaShake192s
        break
      case 'SLH-DSA-SHAKE-256f':
        createAlgo = createSlhDsaShake256f
        break
      case 'SLH-DSA-SHAKE-256s':
        createAlgo = createSlhDsaShake256s
        break
      default:
        throw new Error(`Unknown signature algorithm: ${algorithmName}`)
    }

    instanceCache.set(algorithmName, createAlgo())
  } else {
    logger.debug(`Reusing cached WASM instance for ${algorithmName}`)
  }

  return instanceCache.get(algorithmName)!
}

/**
 * Clear the instance cache (useful for cleanup or testing)
 */
export const clearInstanceCache = () => {
  logger.debug('Clearing signature WASM instance cache')
  instanceCache.forEach((instancePromise) => {
    instancePromise.then((instance) => {
      if (instance.destroy) {
        instance.destroy()
      }
    })
  })
  instanceCache.clear()
}

export const load = async () => {
  // Factories handle init - no explicit load needed
  return true
}

/**
 * Generates a new Falcon or SLH-DSA key pair.
 */
export const generateKey = async (
  params: { name: string },
  _exportPublic = true,
  _ops?: string[]
) => {
  const instance = await getInstance(params.name)
  const keypair = instance.generateKeyPair()
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  }
}

/**
 * Signs a message using a private key.
 */
export const sign = async (
  message: Uint8Array,
  secretKey: Uint8Array,
  algorithm: string
): Promise<Uint8Array> => {
  const instance = await getInstance(algorithm)
  return instance.sign(message, secretKey)
}

/**
 * Verifies a signature against a message and public key.
 */
export const verify = async (
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
  algorithm: string
): Promise<boolean> => {
  const instance = await getInstance(algorithm)
  return instance.verify(message, signature, publicKey)
}

// Algorithm metadata for UI
export const FALCON_ALGORITHMS = ['FN-DSA-512', 'FN-DSA-1024'] as const
export const SLH_DSA_ALGORITHMS = [
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-256f',
  'SLH-DSA-SHAKE-256s',
] as const

export type FalconAlgorithm = (typeof FALCON_ALGORITHMS)[number]
export type SlhDsaAlgorithm = (typeof SLH_DSA_ALGORITHMS)[number]
