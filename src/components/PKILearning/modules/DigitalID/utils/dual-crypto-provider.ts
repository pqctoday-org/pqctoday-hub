// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'

export class DualCryptoProvider implements CryptoProvider {
  primaryProvider: CryptoProvider
  shadowProvider: CryptoProvider

  constructor(primaryProvider: CryptoProvider, shadowProvider: CryptoProvider) {
    this.primaryProvider = primaryProvider
    this.shadowProvider = shadowProvider
  }

  async generateKeyPair(
    alg: KeyAlgorithm,
    curve: KeyCurve,
    onLog?: (log: string) => void
  ): Promise<CryptoKey> {
    // Execute both side by side
    const [primaryKey] = await Promise.all([
      this.primaryProvider.generateKeyPair(alg, curve, onLog),
      // We explicitly skip throwing on shadow provider errors to avoid breaking the primary flow
      this.shadowProvider.generateKeyPair(alg, curve).catch((e) => {
        console.warn('Shadow provider generateKeyPair failed:', e)
        return null
      }),
    ])
    return primaryKey
  }

  async signData(
    key: CryptoKey,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<string> {
    const [primarySig] = await Promise.all([
      this.primaryProvider.signData(key, data, onLog),
      // Mock execution in shadow if it has a matching key format, otherwise we just try and catch
      this.shadowProvider.signData(key, data).catch((e) => {
        console.warn('Shadow provider signData failed (expected if key format differs):', e)
        return null
      }),
    ])
    return primarySig
  }

  async signRaw(
    key: CryptoKey,
    tbs: Uint8Array,
    onLog?: (log: string) => void
  ): Promise<Uint8Array> {
    const [primarySig] = await Promise.all([
      this.primaryProvider.signRaw(key, tbs, onLog),
      this.shadowProvider.signRaw(key, tbs).catch((e) => {
        console.warn('Shadow provider signRaw failed:', e)
        return null
      }),
    ])
    return primarySig
  }

  async verifySignature(
    key: CryptoKey,
    signature: string,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<boolean> {
    const [primaryResult] = await Promise.all([
      this.primaryProvider.verifySignature(key, signature, data, onLog),
      this.shadowProvider.verifySignature(key, signature, data).catch((e) => {
        console.warn('Shadow provider verifySignature failed:', e)
        return false
      }),
    ])
    return primaryResult
  }

  async sha256Hash(data: string | Uint8Array, onLog?: (log: string) => void): Promise<string> {
    const [primaryHash] = await Promise.all([
      this.primaryProvider.sha256Hash(data, onLog),
      this.shadowProvider.sha256Hash(data).catch((e) => {
        console.warn('Shadow provider sha256Hash failed:', e)
        return null
      }),
    ])
    return primaryHash
  }
}
