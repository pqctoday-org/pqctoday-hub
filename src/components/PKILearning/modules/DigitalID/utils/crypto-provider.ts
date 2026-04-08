// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'

export interface CryptoProvider {
  /** Generate a new Key Pair */
  generateKeyPair(
    alg: KeyAlgorithm,
    curve: KeyCurve,
    onLog?: (log: string) => void
  ): Promise<CryptoKey>

  /** SHA-256 or SHA-384 based on Key */
  signData(
    key: CryptoKey,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<string>

  /** Mathematically sign a raw byte array directly mapped to C_Sign (for X.509/DER flows) */
  signRaw(key: CryptoKey, tbs: Uint8Array, onLog?: (log: string) => void): Promise<Uint8Array>

  /** Verify Signature */
  verifySignature(
    key: CryptoKey,
    signature: string,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<boolean>

  /** Simple SHA-256 hash formatting to Base64Url */
  sha256Hash(data: string | Uint8Array, onLog?: (log: string) => void): Promise<string>
}
