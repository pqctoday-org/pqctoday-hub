// Wrapper replacement: Adapting mlkem-wasm API to OpenSSLService
// This preserves Playground functionality while removing the npm package dependency.

import { openSSLService } from '../services/crypto/OpenSSLService'
import { createLogger } from '../utils/logger'

const logger = createLogger('mlkem_wasm_adapter')

/**
 * Loads the module (No-op for OpenSSL service as it lazy loads)
 */
export const load = async () => {
  return true
}

/**
 * Generates a key pair.
 * Mocks the mlkem-wasm API: returns raw bytes for public/private keys.
 */
export const generateKey = async (params: any, _exportPublic = true, _ops?: string[]) => {
  try {
    // Map params string (e.g. 'ML-KEM-768') to OpenSSL algorithm
    // params might be an object or string. mlkem-wasm usually takes a string or object.
    const algo = typeof params === 'string' ? params : params.name || 'ML-KEM-768'

    const id = Date.now().toString()
    const privFile = `adapter_key_${id}.pem`
    const pubFile = `adapter_pub_${id}.pem`
    const pubDer = `adapter_pub_${id}.der`

    // Generate Private Key
    const genRes = await openSSLService.execute(
      `openssl genpkey -algorithm ${algo} -out ${privFile}`
    )

    // Extract Public Key
    await openSSLService.execute(`openssl pkey -in ${privFile} -pubout -out ${pubFile}`)

    // We need RAW bytes.
    // Private Key: mlkem-wasm usually returns the "seed" (32/64 bytes) or the expanded private key?
    // mlkem-wasm 0.x usually returns the raw seed (d, z) or similar.
    // OpenSSL's genpkey produces a PKCS#8 or raw structure wrapped in PEM.
    // For the Playground visualizer, we just need *some* consistent bytes to show.
    // Let's return the DER bytes of the private key for now, or if possible, extract the raw key.
    // The previous implementation used `exportKey('raw-seed')`.
    // It is hard to extract the exact seed from an opaque OpenSSL key via CLI without specific providers.
    // We will return the encoded private key bytes (DER).

    const privDer = `adapter_priv_${id}.der`
    await openSSLService.execute(`openssl pkey -in ${privFile} -outform DER -out ${privDer}`)

    // Read files
    const secretKey = await readFileBytes(privDer)

    // Read Public Key (DER) for raw bytes (SPKI)
    await openSSLService.execute(`openssl pkey -in ${privFile} -pubout -outform DER -out ${pubDer}`)
    const publicKey = await readFileBytes(pubDer)

    // Cleanup
    await openSSLService.deleteFile(privFile)
    await openSSLService.deleteFile(pubFile)
    await openSSLService.deleteFile(privDer)
    await openSSLService.deleteFile(pubDer)

    return { publicKey, secretKey }
  } catch (e) {
    logger.error('[mlkem_adapter] generateKey failed:', e)
    throw e
  }
}

/**
 * Encapsulates a shared secret.
 */
export const encapsulateBits = async (_params: any, publicKeyBytes: Uint8Array) => {
  try {
    const id = Date.now().toString()
    // We have raw public key bytes.
    // We need to provide them to OpenSSL.
    // Issue: OpenSSL CLI expects a PEM/DER file with AlgorithmIdentifier (SPKI).
    // "publicKeyBytes" from Playground might just be the raw key bytes (unwrapped).
    // BUT, in generateKey above, we returned SPKI (DER). So if Playground passes that back, we are good.
    // If Playground generates keys via this adapter, it gets SPKI.
    // So we can write it to a DER file and use `openssl pkeyutl -keyform DER`.

    const pubKeyFile = `adapter_peer_${id}.der`
    const ctFile = `adapter_ct_${id}.bin`
    const ssFile = `adapter_ss_${id}.bin`

    // Write PubKey
    await openSSLService.execute('openssl version', [{ name: pubKeyFile, data: publicKeyBytes }])

    // Encapsulate
    // -inkey <pubkey> -peerform DER? Or just -keyform?
    // pkeyutl's -encap usually takes the *peer's* public key as input.
    // "openssl pkeyutl -encap -inkey pub.key -out ct -secret ss"

    // Some OpenSSL versions require -pubin for public keys
    await openSSLService.execute(
      `openssl pkeyutl -encap -inkey ${pubKeyFile} -keyform DER -pubin -out ${ctFile} -secret ${ssFile}`
    )

    const ciphertext = await readFileBytes(ctFile)
    const sharedKey = await readFileBytes(ssFile)

    // Cleanup
    await openSSLService.deleteFile(pubKeyFile)
    await openSSLService.deleteFile(ctFile)
    await openSSLService.deleteFile(ssFile)

    return { ciphertext, sharedKey }
  } catch (e) {
    logger.error('[mlkem_adapter] encapsulateBits failed:', e)
    throw e
  }
}

/**
 * Decapsulates a shared secret.
 */
export const decapsulateBits = async (
  _params: any,
  secretKeyBytes: Uint8Array,
  ciphertext: Uint8Array
) => {
  try {
    const id = Date.now().toString()

    // We have Private Key bytes (DER/PKCS8 from generateKey)
    const privKeyFile = `adapter_priv_${id}.der`
    const ctFile = `adapter_ct_${id}.bin`
    const ssOutFile = `adapter_ss_out_${id}.bin`

    await openSSLService.execute('openssl version', [
      { name: privKeyFile, data: secretKeyBytes },
      { name: ctFile, data: ciphertext },
    ])

    // Decapsulate
    // openssl pkeyutl -decap -inkey priv.key -in <ciphertext> -out <ss>
    await openSSLService.execute(
      `openssl pkeyutl -decap -inkey ${privKeyFile} -keyform DER -in ${ctFile} -out ${ssOutFile}`
    )

    const sharedKey = await readFileBytes(ssOutFile)

    await openSSLService.deleteFile(privKeyFile)
    await openSSLService.deleteFile(ctFile)
    await openSSLService.deleteFile(ssOutFile)

    return sharedKey
  } catch (e) {
    logger.error('[mlkem_adapter] decapsulateBits failed:', e)
    throw e
  }
}

// Helper to read binary file content
async function readFileBytes(filename: string): Promise<Uint8Array> {
  const res = await openSSLService.execute(`openssl enc -base64 -in ${filename}`)
  if (res.stdout && res.stdout.trim().length > 0) {
    // Decode base64
    const b64 = res.stdout.replace(/\n/g, '')
    const binStr = atob(b64)
    const bytes = new Uint8Array(binStr.length)
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i)
    }
    return bytes
  }
  throw new Error(`Failed to read file ${filename}`)
}
