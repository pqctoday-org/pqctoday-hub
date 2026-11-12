// SPDX-License-Identifier: AGPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'
import { p256, p384 } from '@noble/curves/nist.js'
import {
  generateKeyPair,
  signData,
  verifySignature,
  sha256Hash,
  bytesToBase64,
} from './crypto-utils'
import { assertSigningSelection } from './hsm-crypto-provider'

function joseSignatureCodec(key: CryptoKey) {
  assertSigningSelection(key.algorithm, key.curve)
  if (key.algorithm === 'EdDSA') return null
  return key.algorithm === 'ES256' ? p256.Signature : p384.Signature
}

function encodeSignature(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeSignature(encoded: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Malformed sample signature encoding')
  const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0)
  )
  if (encodeSignature(bytes) !== encoded) throw new Error('Noncanonical sample signature encoding')
  return bytes
}

export class OpenSSLCryptoProvider implements CryptoProvider {
  async generateKeyPair(
    alg: KeyAlgorithm,
    curve: KeyCurve,
    onLog?: (log: string) => void
  ): Promise<CryptoKey> {
    return generateKeyPair(alg, curve, onLog)
  }

  async signData(
    key: CryptoKey,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<string> {
    const codec = joseSignatureCodec(key)
    const nativeSignature = await signData(key, data, onLog)
    if (!codec) return nativeSignature
    // OpenSSL dgst emits DER; ES256/ES384 JWTs carry fixed-width r||s.
    // The existing strict curve parser rejects malformed/noncanonical DER.
    const raw = codec.fromBytes(decodeSignature(nativeSignature), 'der').toBytes('compact')
    return encodeSignature(raw)
  }

  async signRaw(
    key: CryptoKey,
    tbs: Uint8Array,
    onLog?: (log: string) => void
  ): Promise<Uint8Array> {
    // Raw callers (notably X.509) require the native DER signature, not JOSE.
    return decodeSignature(await signData(key, tbs, onLog))
  }

  async verifySignature(
    key: CryptoKey,
    signature: string,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<boolean> {
    const codec = joseSignatureCodec(key)
    if (!codec) return verifySignature(key, signature, data, onLog)
    let nativeSignature: string
    try {
      const der = codec.fromBytes(decodeSignature(signature), 'compact').toBytes('der')
      nativeSignature = encodeSignature(der)
    } catch {
      // Invalid JOSE bytes are a failed signature check, not a valid result.
      return false
    }
    return verifySignature(key, nativeSignature, data, onLog)
  }

  async sha256Hash(data: string | Uint8Array, onLog?: (log: string) => void): Promise<string> {
    return sha256Hash(data, onLog)
  }
}
