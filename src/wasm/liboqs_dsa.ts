// Wrapper for ML-DSA using OpenSSL Service (replacing @openforge-sh/liboqs)
/* eslint-disable */
import { openSSLService } from '../services/crypto/OpenSSLService'
import { createLogger } from '../utils/logger'

const logger = createLogger('liboqs_dsa')

export const load = async () => {
  return true
}

/**
 * Generates a new ML-DSA key pair.
 */
export const generateKey = async (
  params: { name: string },
  _exportPublic = true,
  _ops?: string[]
) => {
  try {
    const algoName = params.name.toUpperCase() // Ensure ML-DSA-65
    const id = Date.now().toString()
    const privName = `mldsa_priv_${id}.key`
    const pubName = `mldsa_pub_${id}.key`

    // Generate keys
    const genRes = await openSSLService.execute(
      `openssl genpkey -algorithm ${algoName} -out ${privName}`
    )
    if (genRes.stderr && genRes.stderr.toLowerCase().includes('error')) {
      throw new Error(`OpenSSL genpkey failed for ${algoName}: ${genRes.stderr}`)
    }

    // Retrieve generated private key from result files
    const privKeyFile = genRes.files.find((f) => f.name === privName)
    if (!privKeyFile) {
      throw new Error(`Failed to retrieve generated private key ${privName}`)
    }

    // Extract Public Key (PEM) - Pass private key file
    const pubRes = await openSSLService.execute(
      `openssl pkey -in ${privName} -pubout -out ${pubName}`,
      [privKeyFile]
    )
    if (pubRes.stderr && pubRes.stderr.toLowerCase().includes('error'))
      throw new Error(`Pubout failed: ${pubRes.stderr}`)

    const pubKeyFile = pubRes.files.find((f) => f.name === pubName)
    if (!pubKeyFile) {
      throw new Error(`Failed to retrieve generated public key ${pubName}`)
    }

    // Return PEM keys directly (as bytes)
    const secretKey = privKeyFile.data
    const publicKey = pubKeyFile.data

    console.log(
      `[liboqs_dsa] Keys generated. Priv: ${secretKey.length} bytes, Pub: ${publicKey.length} bytes`
    )

    return {
      publicKey,
      secretKey,
    }
  } catch (error) {
    logger.error('ML-DSA generateKey failed', error)
    throw error
  }
}

/**
 * Signs a message using a private key.
 */
export const sign = async (
  message: Uint8Array,
  privateKey: Uint8Array,
  _algorithm?: string
): Promise<Uint8Array> => {
  try {
    const id = Date.now().toString()
    const privName = `sign_key_${id}.pem`
    const msgName = `sign_msg_${id}.dat`
    const sigName = `sign_sig_${id}.sig`

    const sigRes = await openSSLService.execute(
      `openssl pkeyutl -sign -inkey ${privName} -in ${msgName} -out ${sigName}`,
      [
        { name: privName, data: privateKey },
        { name: msgName, data: message },
      ]
    )

    // Relaxed check
    if (sigRes.error || (sigRes.stderr && sigRes.stderr.toLowerCase().includes('error'))) {
      throw new Error(`Sign failed: ${sigRes.stderr || sigRes.error}`)
    }

    const signature = sigRes.files.find((f) => f.name === sigName)?.data
    if (!signature) {
      throw new Error(`Failed to retrieve signature file ${sigName}`)
    }

    return signature
  } catch (error) {
    logger.error('ML-DSA sign failed', error)
    throw error
  }
}

export const verify = async (
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
  _algorithm?: string
): Promise<boolean> => {
  try {
    const id = Date.now().toString()
    const pubName = `verify_pub_${id}.pem`
    const msgName = `verify_msg_${id}.dat`
    const sigName = `verify_sig_${id}.sig`

    // Verify needs Public Key, Message, and Signature passed as input files
    const verRes = await openSSLService.execute(
      `openssl pkeyutl -verify -pubin -inkey ${pubName} -in ${msgName} -sigfile ${sigName}`,
      [
        { name: pubName, data: publicKey },
        { name: msgName, data: message },
        { name: sigName, data: signature },
      ]
    )

    // OpenSSL pkeyutl -verify prints "Signature Verified Successfully" to stdout
    if (verRes.stdout.includes('Signature Verified Successfully')) {
      return true
    }

    return false
  } catch (error) {
    // OpenSSL throws error on verification failure typically
    logger.error('ML-DSA verify failed', error)
    return false
  }
}

export const clearInstanceCache = () => {
  // No-op
}
