// SPDX-License-Identifier: AGPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'

/** Demonstrates key binding only; this is not PID issuer-chain or identity verification. */
export async function signAndVerifySampleBinding(
  provider: CryptoProvider,
  key: CryptoKey,
  payload: string,
  onLog?: (log: string) => void
): Promise<void> {
  const signature = await provider.signData(key, payload, onLog)
  if (!signature || !(await provider.verifySignature(key, signature, payload, onLog))) {
    throw new Error('Sample key-binding signature verification failed.')
  }
}

export async function verifyIssuedSampleJwt(
  provider: CryptoProvider,
  key: CryptoKey,
  issuerJwt: string,
  onLog?: (log: string) => void
): Promise<void> {
  const parts = issuerJwt.split('.')
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error('Sample credential signing did not produce a complete JWT.')
  }
  const valid = await provider.verifySignature(key, parts[2], `${parts[0]}.${parts[1]}`, onLog)
  if (!valid) throw new Error('Sample credential signature verification failed.')
}
