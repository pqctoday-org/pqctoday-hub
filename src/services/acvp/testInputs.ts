// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pure helpers for the "extended" ACVP plan profile (dispatch.ts): values the
 * ACVP prompt does not carry in the form PKCS#11 wants, computed outside the
 * engine from the prompt's own bytes.
 *
 * - mlDsaMu: ML-DSA internal-interface verification with a raw message M′
 *   (ACVP signatureInterface "internal", externalMu false). The engine takes
 *   mu through the vendor mechanism CKM_ML_DSA_EXTERNAL_MU, so mu is computed
 *   here: mu = SHAKE256(tr ‖ M′, 64) with tr = SHAKE256(pk, 64)
 *   (FIPS 204 Algorithm 7, lines 1 and 6).
 * - preHashSha512t: HashML-DSA with SHA2-512/224 or SHA2-512/256, which have
 *   no hash-specific CKM_HASH_ML_DSA_* mechanism. The generic mechanism takes
 *   PH(M), so the hash is computed here.
 *
 * No I/O, no engine, no network.
 */
import { sha512_224, sha512_256 } from '@noble/hashes/sha2.js'
import { shake256 } from '@noble/hashes/sha3.js'

/** mu = SHAKE256(SHAKE256(pk, 64) ‖ M′, 64) — FIPS 204 Algorithm 7 lines 1 and 6. */
export const mlDsaMu = (pk: Uint8Array, mPrime: Uint8Array): Uint8Array => {
  const tr = shake256(pk, { dkLen: 64 })
  const buf = new Uint8Array(tr.length + mPrime.length)
  buf.set(tr, 0)
  buf.set(mPrime, tr.length)
  return shake256(buf, { dkLen: 64 })
}

/** The two ACVP hashAlg values that only the generic pre-hash mechanism can carry. */
export type Sha512tAlg = 'SHA2-512/224' | 'SHA2-512/256'

export const isSha512t = (hashAlg: string): hashAlg is Sha512tAlg =>
  hashAlg === 'SHA2-512/224' || hashAlg === 'SHA2-512/256'

/** PH(M) for the two SHA-512/t hash algorithms. */
export const preHashSha512t = (hashAlg: Sha512tAlg, message: Uint8Array): Uint8Array =>
  hashAlg === 'SHA2-512/224' ? sha512_224(message) : sha512_256(message)
