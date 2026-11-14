// SPDX-License-Identifier: AGPL-3.0-only
import type { AssessmentInput } from '../assessmentTypes'

/**
 * The assessment wizard lets a visitor tick a crypto *family* ("Key Exchange",
 * "Signatures", …) and optionally narrow it to specific algorithms; the step
 * tells them "none selected = all included". This module is where that promise
 * is kept: a family with no specific algorithm picked stands for the classical
 * algorithms the engine knows in that family, so the report scores, lists and
 * plans for them instead of showing an empty inventory.
 *
 * Algorithms retired for classical reasons (3DES) are left out of the implied
 * set — a visitor who still runs them names them.
 */
export const CRYPTO_CATEGORY_ALGORITHMS: Readonly<Record<string, readonly string[]>> = {
  'Key Exchange': [
    'RSA-2048',
    'RSA-3072',
    'RSA-4096',
    'ECDH P-256',
    'ECDH P-384',
    'ECDH P-521',
    'X25519',
    'X448',
    'DH (Diffie-Hellman)',
  ],
  Signatures: [
    'RSA-2048',
    'RSA-3072',
    'RSA-4096',
    'ECDSA P-256',
    'ECDSA P-384',
    'ECDSA P-521',
    'Ed25519',
    'Ed448',
  ],
  'Symmetric Encryption': ['AES-128', 'AES-192', 'AES-256', 'ChaCha20-Poly1305'],
  'Hash & MAC': ['SHA-256', 'SHA-3', 'HMAC-SHA256'],
}

/**
 * Which families an algorithm name belongs to. Read by pattern so chip keys that
 * are not in the scoring table (e.g. "RSA-PSS-2048") still count as narrowing
 * the family they obviously sit in. RSA is both a key-transport and a signature
 * algorithm, so it narrows both.
 */
export function categoriesOfAlgorithm(name: string): string[] {
  const n = name.trim().toLowerCase()
  const out: string[] = []
  if (/^(rsa|sm2)/.test(n)) out.push('Key Exchange', 'Signatures')
  else if (/^(ecdh|dh\b|dh |x25519|x448|ml-kem|mlkem|kyber|frodo|hqc|hpke)/.test(n))
    out.push('Key Exchange')
  else if (
    /^(ecdsa|ed25519|ed448|secp256k1|dsa|ml-dsa|mldsa|slh-dsa|fn-dsa|lms|xmss|sphincs|falcon)/.test(
      n
    )
  )
    out.push('Signatures')
  else if (/^(aes|chacha|3des|des\b|camellia|sm4|aria)/.test(n)) out.push('Symmetric Encryption')
  else if (/^(sha|md5|hmac|blake|sm3|ripemd|poly1305)/.test(n)) out.push('Hash & MAC')
  return out
}

/**
 * The algorithms a "family only" declaration stands for: for every selected
 * family that has no specific algorithm picked, that family's classical set.
 * Empty when the visitor said they do not know their algorithms, or named a
 * specific algorithm in every family they ticked.
 */
export function impliedAlgorithms(
  input: Pick<AssessmentInput, 'currentCrypto' | 'currentCryptoCategories' | 'currentCryptoUnknown'>
): string[] {
  if (input.currentCryptoUnknown) return []
  const categories = input.currentCryptoCategories ?? []
  if (categories.length === 0) return []
  const narrowed = new Set(input.currentCrypto.flatMap(categoriesOfAlgorithm))
  const seen = new Set(input.currentCrypto)
  const implied: string[] = []
  for (const cat of categories) {
    if (narrowed.has(cat)) continue
    // eslint-disable-next-line security/detect-object-injection
    for (const algo of CRYPTO_CATEGORY_ALGORITHMS[cat] ?? []) {
      if (seen.has(algo)) continue
      seen.add(algo)
      implied.push(algo)
    }
  }
  return implied
}

/** The input with family-only declarations expanded into their algorithms; a no-op otherwise. */
export function withEffectiveCrypto(input: AssessmentInput): AssessmentInput {
  const implied = impliedAlgorithms(input)
  if (implied.length === 0) return input
  return { ...input, currentCrypto: [...input.currentCrypto, ...implied] }
}
