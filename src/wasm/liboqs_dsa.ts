// Wrapper for @openforge-sh/liboqs (ML-DSA)
/* eslint-disable */
import { createMLDSA44, createMLDSA65, createMLDSA87 } from '@openforge-sh/liboqs'
import { createLogger } from '../utils/logger'

const logger = createLogger('liboqs_dsa')

// Key size constants for ML-DSA parameter sets
const ML_DSA_44_SECRET_KEY_SIZE = 2560
const ML_DSA_65_SECRET_KEY_SIZE = 4032
const ML_DSA_87_SECRET_KEY_SIZE = 4896
const ML_DSA_44_PUBLIC_KEY_SIZE = 1312
const ML_DSA_65_PUBLIC_KEY_SIZE = 1952
const ML_DSA_87_PUBLIC_KEY_SIZE = 2592

// Instance cache to avoid creating/destroying WASM instances repeatedly
type MLDSAInstance = {
  generateKeyPair: () => { publicKey: Uint8Array; secretKey: Uint8Array }
  sign: (message: Uint8Array, secretKey: Uint8Array) => Uint8Array
  verify: (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => boolean
  destroy?: () => void
}

const instanceCache: Map<string, Promise<MLDSAInstance>> = new Map()

export const load = async () => {
  // No-op for compatibility
  return true
}

const getAlgorithmFactory = (algName: string) => {
  switch (algName) {
    case 'ML-DSA-44':
      return createMLDSA44
    case 'ML-DSA-65':
      return createMLDSA65
    case 'ML-DSA-87':
      return createMLDSA87
    default:
      throw new Error(`Unknown algorithm: ${algName}`)
  }
}

/**
 * Get or create a cached instance for the specified algorithm
 */
const getInstance = async (algorithmName: string): Promise<MLDSAInstance> => {
  if (!instanceCache.has(algorithmName)) {
    logger.debug(`Creating new WASM instance for ${algorithmName}`)
    const createAlgo = getAlgorithmFactory(algorithmName)
    instanceCache.set(algorithmName, createAlgo())
  } else {
    logger.debug(`Reusing cached WASM instance for ${algorithmName}`)
  }

  return instanceCache.get(algorithmName)!
}

/**
 * Infer algorithm name from secret key size
 */
const inferAlgorithmFromSecretKey = (secretKey: Uint8Array): string => {
  if (secretKey.length === ML_DSA_44_SECRET_KEY_SIZE) return 'ML-DSA-44'
  if (secretKey.length === ML_DSA_65_SECRET_KEY_SIZE) return 'ML-DSA-65'
  if (secretKey.length === ML_DSA_87_SECRET_KEY_SIZE) return 'ML-DSA-87'
  throw new Error(`Unknown private key size: ${secretKey.length}`)
}

/**
 * Infer algorithm name from public key size
 */
const inferAlgorithmFromPublicKey = (publicKey: Uint8Array): string => {
  if (publicKey.length === ML_DSA_44_PUBLIC_KEY_SIZE) return 'ML-DSA-44'
  if (publicKey.length === ML_DSA_65_PUBLIC_KEY_SIZE) return 'ML-DSA-65'
  if (publicKey.length === ML_DSA_87_PUBLIC_KEY_SIZE) return 'ML-DSA-87'
  throw new Error(`Unknown public key size: ${publicKey.length}`)
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
 * Generates a new ML-DSA key pair.
 *
 * @param params - Configuration object containing the algorithm name (e.g., 'ML-DSA-44').
 * @param _exportPublic - (Optional) Whether to export the public key. Defaults to true.
 * @param _ops - (Optional) List of allowed operations.
 * @returns An object containing the generated `publicKey` and `secretKey` as Uint8Arrays.
 */
export const generateKey = async (params: any, _exportPublic = true, _ops?: string[]) => {
  const instance = await getInstance(params.name)
  const keypair = instance.generateKeyPair()
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  }
}

/**
 * Signs a message using a private key.
 *
 * @param message - The message data to sign.
 * @param secretKey - The private key to use for signing.
 * @returns The generated signature as a Uint8Array.
 * @throws Error if the private key size does not match any known ML-DSA parameter set.
 */
export const sign = async (message: Uint8Array, secretKey: Uint8Array) => {
  const algorithmName = inferAlgorithmFromSecretKey(secretKey)
  const instance = await getInstance(algorithmName)
  return instance.sign(message, secretKey)
}

/**
 * Verifies a signature against a message and public key.
 *
 * @param signature - The signature to verify.
 * @param message - The original message data.
 * @param publicKey - The public key to use for verification.
 * @returns `true` if the signature is valid, `false` otherwise.
 * @throws Error if the public key size does not match any known ML-DSA parameter set.
 */
export const verify = async (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => {
  const algorithmName = inferAlgorithmFromPublicKey(publicKey)
  const instance = await getInstance(algorithmName)
  return instance.verify(message, signature, publicKey)
}
