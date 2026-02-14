import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'

export const bytesToBase64 = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('')
  return btoa(binString)
}

export const base64ToBytes = (base64: string): Uint8Array => {
  const binString = atob(base64)
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!)
}

// Helper to convert Uint8Array to Base64URL
const toBase64Url = (bytes: Uint8Array): string => {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Helper to convert hex string to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export const generateKeyPair = async (
  alg: KeyAlgorithm,
  curve: KeyCurve,
  onLog?: (log: string) => void
): Promise<CryptoKey> => {
  const timestamp = new Date().toISOString()
  const id = `key_${timestamp}_${Math.random().toString(36).substring(2, 8)}`

  let opensslCurve = 'prime256v1'
  if (curve === 'P-256') opensslCurve = 'prime256v1'
  else if (curve === 'P-384') opensslCurve = 'secp384r1'
  // Ed25519 requires specific genpkey command, simpler to handle via ecparam for EC curves

  let privKeyPem = ''
  let pubKeyPem = ''

  if (curve === 'Ed25519') {
    const result = await openSSLService.execute('openssl genpkey -algorithm ED25519')
    if (onLog) onLog(`[OpenSSL: Generate ED25519 Key]\n${result.stdout}\n${result.stderr}`)

    if (result.error) throw new Error(result.error)
    privKeyPem = result.stdout

    // Derive public key
    const privKeyFile = `priv_${id}.pem`
    const pubKeyResult = await openSSLService.execute(`openssl pkey -in ${privKeyFile} -pubout`, [
      { name: privKeyFile, data: new TextEncoder().encode(privKeyPem) },
    ])
    if (onLog) onLog(`[OpenSSL: Derive Public Key]\n${pubKeyResult.stdout}\n${pubKeyResult.stderr}`)

    if (pubKeyResult.error) throw new Error(pubKeyResult.error)
    pubKeyPem = pubKeyResult.stdout

    // Cleanup
    await openSSLService.deleteFile(privKeyFile)
  } else {
    // Generate EC Key using modern genpkey command
    const result = await openSSLService.execute(
      `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${opensslCurve}`
    )
    if (onLog) {
      onLog(
        `[OpenSSL: Generate ${curve} Key]\n> openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${opensslCurve}\n${result.stdout}\n${result.stderr}`
      )
    }

    if (result.error) throw new Error(result.error)
    privKeyPem = result.stdout

    // Derive public key
    const privKeyFile = `priv_${id}.pem`
    const pubKeyResult = await openSSLService.execute(`openssl pkey -in ${privKeyFile} -pubout`, [
      { name: privKeyFile, data: new TextEncoder().encode(privKeyPem) },
    ])
    if (onLog) {
      onLog(
        `[OpenSSL: Derive Public Key]\n> openssl pkey -in ${privKeyFile} -pubout\n${pubKeyResult.stdout}\n${pubKeyResult.stderr}`
      )
    }

    if (pubKeyResult.error) throw new Error(pubKeyResult.error)
    pubKeyPem = pubKeyResult.stdout

    // Cleanup
    await openSSLService.deleteFile(privKeyFile)
  }

  // We store PEMs directly in the fields that used to be Base64URL.
  // This is a format change, but internal to the DigitalID module if we update usage.
  // Actually, to minimize breakage with existing UI code that might decode it,
  // we could Base64 encode the PEM string.
  // But standard usage in this module seems to be for signing/verifying which we are replacing.
  // Let's store PEM string but Base64 encoded to keep the type check happy and "opaque"

  return {
    id,
    type: curve as 'P-256' | 'P-384' | 'Ed25519',
    algorithm: alg,
    curve: curve,
    privateKey: btoa(privKeyPem), // Storing PEM as Base64 to avoid issues
    publicKey: btoa(pubKeyPem),
    created: timestamp,
    usage: 'SIGN',
    status: 'ACTIVE',
  }
}

export const signData = async (
  key: CryptoKey,
  data: string | Uint8Array,
  onLog?: (log: string) => void
): Promise<string> => {
  if (!key.privateKey) {
    throw new Error('Private key missing for signing')
  }

  const privKeyPem = atob(key.privateKey)
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data

  const keyFileName = `key_sign_${Math.random().toString(36).substring(7)}.pem`
  const dataFileName = `data_sign_${Math.random().toString(36).substring(7)}.dat`
  const outFileName = `sig_${Math.random().toString(36).substring(7)}.bin`

  try {
    // Write key and data to files
    const result = await openSSLService.execute(
      `openssl dgst -sha256 -sign ${keyFileName} -out ${outFileName} ${dataFileName}`,
      [
        { name: keyFileName, data: new TextEncoder().encode(privKeyPem) },
        { name: dataFileName, data: dataBytes },
      ]
    )

    if (onLog) {
      onLog(
        `[OpenSSL: Sign Data]\n> openssl dgst -sha256 -sign key.pem -out sig.bin data.dat\n${result.stdout}\n${result.stderr}`
      )
    }

    if (result.error) throw new Error(result.error)

    // Read the output signature file
    const sigFile = result.files.find((f) => f.name === outFileName)
    if (!sigFile) throw new Error('Signature file was not generated')

    return toBase64Url(sigFile.data)
  } finally {
    // Cleanup is good practice but OpenSSLService cleans up files on init/reset usually.
    // We'll manual delete to be nice.
    await openSSLService.deleteFile(keyFileName)
    await openSSLService.deleteFile(dataFileName)
    // await openSSLService.deleteFile(outFileName) // handled by logic or left for GC
  }
}

export const verifySignature = async (
  key: CryptoKey,
  signature: string,
  data: string | Uint8Array,
  onLog?: (log: string) => void
): Promise<boolean> => {
  const pubKeyPem = atob(key.publicKey)
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data

  // Convert Base64URL signature back to binary
  const sigBytes = base64ToBytes(signature.replace(/-/g, '+').replace(/_/g, '/'))

  const keyFileName = `key_verify_${Math.random().toString(36).substring(7)}.pem`
  const dataFileName = `data_verify_${Math.random().toString(36).substring(7)}.dat`
  const sigFileName = `sig_verify_${Math.random().toString(36).substring(7)}.bin`

  try {
    const result = await openSSLService.execute(
      `openssl dgst -sha256 -verify ${keyFileName} -signature ${sigFileName} ${dataFileName}`,
      [
        { name: keyFileName, data: new TextEncoder().encode(pubKeyPem) },
        { name: dataFileName, data: dataBytes },
        { name: sigFileName, data: sigBytes },
      ]
    )

    if (onLog) {
      onLog(
        `[OpenSSL: Verify Signature]\n> openssl dgst -sha256 -verify key.pem -signature sig.bin data.dat\n${result.stdout}\n${result.stderr}`
      )
    }

    // OpenSSL dgst -verify prints "Verified OK" to stdout on success, or "Verification Failure"
    return result.stdout.includes('Verified OK')
  } catch (e) {
    if (onLog && e instanceof Error) {
      onLog(`[OpenSSL: Verification Error] ${e.message}`)
    }
    return false
  } finally {
    await openSSLService.deleteFile(keyFileName)
    await openSSLService.deleteFile(dataFileName)
    await openSSLService.deleteFile(sigFileName)
  }
}

export const sha256Hash = async (
  data: string | Uint8Array,
  onLog?: (log: string) => void
): Promise<string> => {
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const dataFileName = `data_hash_${Math.random().toString(36).substring(7)}.dat`

  try {
    // Using sha256 sum
    // Output format: "SHA2-256(filename)= <hex>"
    const result = await openSSLService.execute(`openssl dgst -sha256 ${dataFileName}`, [
      { name: dataFileName, data: dataBytes },
    ])

    if (onLog) {
      onLog(
        `[OpenSSL: SHA-256 Hash]\n> openssl dgst -sha256 data.dat\n${result.stdout}\n${result.stderr}`
      )
    }

    if (result.error) throw new Error(result.error)

    const output = result.stdout.trim()
    const parts = output.split('= ')
    if (parts.length < 2) throw new Error('Unexpected OpenSSL output format')

    const hex = parts[1].trim()
    const bytes = hexToBytes(hex)
    return toBase64Url(bytes)
  } finally {
    await openSSLService.deleteFile(dataFileName)
  }
}
