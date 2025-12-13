// Wrapper for @openforge-sh/liboqs (ML-KEM)
/* eslint-disable */
import {
  createMLKEM512,
  createMLKEM768,
  createMLKEM1024,
  createHQC128,
  createHQC192,
  createHQC256,
  createFrodoKEM640AES,
  createFrodoKEM976AES,
  createFrodoKEM1344AES,
  createClassicMcEliece348864,
  createClassicMcEliece460896,
  createClassicMcEliece6688128,
  createClassicMcEliece6960119,
  createClassicMcEliece8192128,
} from '@openforge-sh/liboqs'
import { createLogger } from '../utils/logger'

const logger = createLogger('liboqs_kem')

// Instance cache to avoid creating/destroying WASM instances repeatedly
type MLKEMInstance = {
  generateKeyPair: () => { publicKey: Uint8Array; secretKey: Uint8Array }
  encapsulate: (publicKey: Uint8Array) => { ciphertext: Uint8Array; sharedSecret: Uint8Array }
  decapsulate: (ciphertext: Uint8Array, secretKey: Uint8Array) => Uint8Array
  destroy?: () => void
}

const instanceCache: Map<string, Promise<MLKEMInstance>> = new Map()

/**
 * Get or create a cached instance for the specified algorithm
 */
const getInstance = async (algorithmName: string): Promise<MLKEMInstance> => {
  if (!instanceCache.has(algorithmName)) {
    logger.debug(`Creating new WASM instance for ${algorithmName}`)

    let createAlgo
    switch (algorithmName) {
      case 'ML-KEM-512':
        createAlgo = createMLKEM512
        break
      case 'ML-KEM-768':
        createAlgo = createMLKEM768
        break
      case 'ML-KEM-1024':
        createAlgo = createMLKEM1024
        break
      // HQC
      case 'HQC-128':
        createAlgo = createHQC128
        break
      case 'HQC-192':
        createAlgo = createHQC192
        break
      case 'HQC-256':
        createAlgo = createHQC256
        break
      // FrodoKEM
      case 'FrodoKEM-640-AES':
        createAlgo = createFrodoKEM640AES
        break
      case 'FrodoKEM-976-AES':
        createAlgo = createFrodoKEM976AES
        break
      case 'FrodoKEM-1344-AES':
        createAlgo = createFrodoKEM1344AES
        break
      // Classic McEliece
      case 'Classic-McEliece-348864':
        createAlgo = createClassicMcEliece348864
        break
      case 'Classic-McEliece-460896':
        createAlgo = createClassicMcEliece460896
        break
      case 'Classic-McEliece-6688128':
        createAlgo = createClassicMcEliece6688128
        break
      case 'Classic-McEliece-6960119':
        createAlgo = createClassicMcEliece6960119
        break
      case 'Classic-McEliece-8192128':
        createAlgo = createClassicMcEliece8192128
        break
      default:
        throw new Error(`Unknown algorithm: ${algorithmName}`)
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
  logger.debug('Clearing WASM instance cache')
  instanceCache.forEach((instancePromise) => {
    instancePromise.then((instance) => {
      if (instance.destroy) {
        instance.destroy()
      }
    })
  })
  instanceCache.clear()
}

/**
 * Generates a new ML-KEM key pair.
 *
 * @param params - Configuration object containing the algorithm name (e.g., 'ML-KEM-768').
 * @param _exportPublic - (Optional) Whether to export the public key. Defaults to true.
 * @param _ops - (Optional) List of allowed operations.
 * @returns An object containing the generated `publicKey` and `secretKey` as Uint8Arrays.
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
 * Decapsulates a shared secret from a ciphertext using a private key.
 *
 * @param params - Configuration object containing the algorithm name.
 * @param secretKey - The private key to use for decapsulation.
 * @param ciphertext - The ciphertext to decapsulate.
 * @returns The recovered shared secret as a Uint8Array.
 */
export const decapsulateBits = async (
  params: { name: string },
  secretKey: Uint8Array,
  ciphertext: Uint8Array
) => {
  const instance = await getInstance(params.name)
  return instance.decapsulate(ciphertext, secretKey)
}

/**
 * Encapsulates a shared secret for a given public key.
 *
 * @param params - Configuration object containing the algorithm name.
 * @param publicKey - The public key to encapsulate against.
 * @returns An object containing the `ciphertext` and the generated `sharedKey`.
 */
export const encapsulateBits = async (params: { name: string }, publicKey: Uint8Array) => {
  const instance = await getInstance(params.name)
  const result = instance.encapsulate(publicKey)
  return {
    ciphertext: result.ciphertext,
    sharedKey: result.sharedSecret,
  }
}
