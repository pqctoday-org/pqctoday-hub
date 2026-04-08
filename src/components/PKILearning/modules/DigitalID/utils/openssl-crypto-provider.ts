// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'
import { generateKeyPair, signData, verifySignature, sha256Hash } from './crypto-utils'

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
    return signData(key, data, onLog)
  }

  async signRaw(
    key: CryptoKey,
    tbs: Uint8Array,
    onLog?: (log: string) => void
  ): Promise<Uint8Array> {
    const b64url = await this.signData(key, tbs, onLog)
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const binString = atob(b64)
    return new Uint8Array(binString.length).map((_, i) => binString.charCodeAt(i))
  }

  async verifySignature(
    key: CryptoKey,
    signature: string,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<boolean> {
    return verifySignature(key, signature, data, onLog)
  }

  async sha256Hash(data: string | Uint8Array, onLog?: (log: string) => void): Promise<string> {
    return sha256Hash(data, onLog)
  }
}
