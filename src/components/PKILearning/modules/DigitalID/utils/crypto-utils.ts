import { p256, p384 } from '@noble/curves/nist.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'

export function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('')
  return btoa(binString)
}

export function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64)
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!)
}

// Helper to convert Uint8Array to Base64URL
const toBase64Url = (bytes: Uint8Array): string => {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const fromBase64Url = (base64url: string): Uint8Array => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  return base64ToBytes(padded)
}

export const generateKeyPair = async (alg: KeyAlgorithm, curve: KeyCurve): Promise<CryptoKey> => {
  const timestamp = new Date().toISOString()
  const id = `key_${timestamp}_${Math.random().toString(36).substring(2, 8)}` // Simple simulation ID

  let privKeyBytes: Uint8Array
  let pubKeyBytes: Uint8Array

  if (curve === 'P-256') {
    privKeyBytes = p256.utils.randomSecretKey()
    pubKeyBytes = p256.getPublicKey(privKeyBytes)
  } else if (curve === 'P-384') {
    privKeyBytes = p384.utils.randomSecretKey()
    pubKeyBytes = p384.getPublicKey(privKeyBytes)
  } else if (curve === 'Ed25519') {
    privKeyBytes = ed25519.utils.randomSecretKey()
    pubKeyBytes = ed25519.getPublicKey(privKeyBytes)
  } else {
    throw new Error(`Unsupported curve: ${curve}`)
  }

  return {
    id,
    algorithm: alg,
    curve: curve,
    privateKey: toBase64Url(privKeyBytes),
    publicKey: toBase64Url(pubKeyBytes),
    created: timestamp,
  }
}

export const signData = async (key: CryptoKey, data: string | Uint8Array): Promise<string> => {
  if (!key.privateKey) {
    throw new Error('Private key missing for signing')
  }

  const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data
  const privBytes = fromBase64Url(key.privateKey)
  const hash = sha256(dataBytes)

  let signature: Uint8Array

  if (key.curve === 'P-256') {
    // noble p256.sign v2 returns Uint8Array (compact r|s) synchronously
    signature = p256.sign(hash, privBytes)
  } else if (key.curve === 'P-384') {
    signature = p384.sign(hash, privBytes)
  } else if (key.curve === 'Ed25519') {
    signature = ed25519.sign(dataBytes, privBytes) // Ed25519 signs message directly, usually.
  } else {
    throw new Error(`Unsupported curve: ${key.curve}`)
  }

  return toBase64Url(signature)
}

export const verifySignature = async (
  key: CryptoKey,
  signature: string,
  data: string | Uint8Array
): Promise<boolean> => {
  const sigBytes = fromBase64Url(signature)
  const pubBytes = fromBase64Url(key.publicKey)
  const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data
  const hash = sha256(dataBytes)

  if (key.curve === 'P-256') {
    return p256.verify(sigBytes, hash, pubBytes)
  } else if (key.curve === 'P-384') {
    return p384.verify(sigBytes, hash, pubBytes)
  } else if (key.curve === 'Ed25519') {
    return ed25519.verify(sigBytes, dataBytes, pubBytes)
  } else {
    throw new Error(`Unsupported curve: ${key.curve}`)
  }
}

export const sha256Hash = (data: string | Uint8Array): string => {
  const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data
  return toBase64Url(sha256(dataBytes))
}
