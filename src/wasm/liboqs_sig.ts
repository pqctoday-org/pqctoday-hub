// SPDX-License-Identifier: GPL-3.0-only
// Wrapper for Falcon (FN-DSA), SLH-DSA, MAYO, CROSS, OV, and SNOVA using @oqs/liboqs-js
/* eslint-disable */
import {
  // Falcon (FN-DSA) — FIPS 206
  createFalcon512,
  createFalcon1024,
  createFalconPadded512,
  createFalconPadded1024,
  // SLH-DSA SHA2 — FIPS 205
  createSlhDsaSha2128f,
  createSlhDsaSha2128s,
  createSlhDsaSha2192f,
  createSlhDsaSha2192s,
  createSlhDsaSha2256f,
  createSlhDsaSha2256s,
  // SLH-DSA SHAKE — FIPS 205
  createSlhDsaShake128f,
  createSlhDsaShake128s,
  createSlhDsaShake192f,
  createSlhDsaShake192s,
  createSlhDsaShake256f,
  createSlhDsaShake256s,
  // MAYO — NIST Additional Signatures Round 2
  createMAYO1,
  createMAYO2,
  createMAYO3,
  createMAYO5,
  // CROSS — NIST Additional Signatures Round 2
  createCrossRsdp128Balanced,
  createCrossRsdp192Balanced,
  createCrossRsdp256Balanced,
  createCrossRsdpg128Balanced,
  createCrossRsdpg192Balanced,
  createCrossRsdpg256Balanced,
  // OV (UOV) — NIST Additional Signatures Round 2
  createOVIp,
  createOVIs,
  createOVIII,
  createOVV,
  // SNOVA — NIST Additional Signatures Round 2
  createSnova2454,
  createSnova2965,
  createSnova49113,
} from '@oqs/liboqs-js/sig'
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
      // Falcon (FN-DSA) — FIPS 206, maps from NIST naming convention
      case 'FN-DSA-512':
      case 'Falcon-512':
        createAlgo = createFalcon512
        break
      case 'FN-DSA-1024':
      case 'Falcon-1024':
        createAlgo = createFalcon1024
        break
      // Falcon padded — constant-time signing (no timing side-channel)
      case 'FN-DSA-padded-512':
      case 'Falcon-padded-512':
        createAlgo = createFalconPadded512
        break
      case 'FN-DSA-padded-1024':
      case 'Falcon-padded-1024':
        createAlgo = createFalconPadded1024
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
      // MAYO — MQ-based, small public keys (Round 2 NIST Additional Signatures)
      case 'MAYO-1':
        createAlgo = createMAYO1
        break
      case 'MAYO-2':
        createAlgo = createMAYO2
        break
      case 'MAYO-3':
        createAlgo = createMAYO3
        break
      case 'MAYO-5':
        createAlgo = createMAYO5
        break
      // CROSS — code-based (Round 2 NIST Additional Signatures)
      case 'CROSS-RSDP-128-balanced':
        createAlgo = createCrossRsdp128Balanced
        break
      case 'CROSS-RSDP-192-balanced':
        createAlgo = createCrossRsdp192Balanced
        break
      case 'CROSS-RSDP-256-balanced':
        createAlgo = createCrossRsdp256Balanced
        break
      case 'CROSS-RSDPg-128-balanced':
        createAlgo = createCrossRsdpg128Balanced
        break
      case 'CROSS-RSDPg-192-balanced':
        createAlgo = createCrossRsdpg192Balanced
        break
      case 'CROSS-RSDPg-256-balanced':
        createAlgo = createCrossRsdpg256Balanced
        break
      // OV (UOV) — multivariate (Round 2 NIST Additional Signatures)
      case 'OV-Ip':
        createAlgo = createOVIp
        break
      case 'OV-Is':
        createAlgo = createOVIs
        break
      case 'OV-III':
        createAlgo = createOVIII
        break
      case 'OV-V':
        createAlgo = createOVV
        break
      // SNOVA — structured MQ (Round 2 NIST Additional Signatures)
      case 'SNOVA-24-5-4':
        createAlgo = createSnova2454
        break
      case 'SNOVA-29-6-5':
        createAlgo = createSnova2965
        break
      case 'SNOVA-49-11-3':
        createAlgo = createSnova49113
        break
      default:
        throw new Error(`Unknown signature algorithm: ${algorithmName}`)
    }

    const promise = createAlgo().catch((error: unknown) => {
      // Remove from cache so the next call retries instead of getting a stale rejection
      instanceCache.delete(algorithmName)
      throw error
    })
    instanceCache.set(algorithmName, promise)
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
    instancePromise
      .then((instance) => {
        if (instance.destroy) {
          instance.destroy()
        }
      })
      .catch(() => {
        // Instance creation already failed — nothing to clean up
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
export const FALCON_ALGORITHMS = [
  'FN-DSA-512',
  'FN-DSA-1024',
  'FN-DSA-padded-512',
  'FN-DSA-padded-1024',
] as const
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
export const MAYO_ALGORITHMS = ['MAYO-1', 'MAYO-2', 'MAYO-3', 'MAYO-5'] as const
export const CROSS_ALGORITHMS = [
  'CROSS-RSDP-128-balanced',
  'CROSS-RSDP-192-balanced',
  'CROSS-RSDP-256-balanced',
  'CROSS-RSDPg-128-balanced',
  'CROSS-RSDPg-192-balanced',
  'CROSS-RSDPg-256-balanced',
] as const
export const OV_ALGORITHMS = ['OV-Ip', 'OV-Is', 'OV-III', 'OV-V'] as const
export const SNOVA_ALGORITHMS = ['SNOVA-24-5-4', 'SNOVA-29-6-5', 'SNOVA-49-11-3'] as const

export type FalconAlgorithm = (typeof FALCON_ALGORITHMS)[number]
export type SlhDsaAlgorithm = (typeof SLH_DSA_ALGORITHMS)[number]
export type MayoAlgorithm = (typeof MAYO_ALGORITHMS)[number]
export type CrossAlgorithm = (typeof CROSS_ALGORITHMS)[number]
export type OvAlgorithm = (typeof OV_ALGORITHMS)[number]
export type SnovaAlgorithm = (typeof SNOVA_ALGORITHMS)[number]
