// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The key combiner used by the Hybrid Key Establishment workshop demo.
 *
 * Both shared secrets are concatenated, ML-KEM first, and fed as the input key
 * material of HKDF-SHA-256 with no salt. That is the form CMVP IG D.S accepts
 * as an approved key combiner: "a concatenation of shared secrets ... fed into
 * an SP 800-56C one-step or two-step KDF", with HKDF named as included
 * (https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf,
 * IG D.S, 9 April 2026). SP 800-227 section 4.6.2 says the same of a two-step
 * KDF: "extraction is performed with all shared secrets as the input".
 * The order follows RFC 10024 section 4.3 for X25519MLKEM768: "the
 * concatenation of the ML-KEM shared secret and the X25519 shared secret"
 * (64 bytes, 32 for each part).
 *
 * This is the combiner form only. It binds no key shares, ciphertext or
 * transcript, and it is not a module-enforced hybrid scheme.
 */
import { hsm_hkdf, hsm_importGenericSecret, CKM_SHA256 } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'

/** Domain-separation string passed as the HKDF-Expand info. */
export const HYBRID_KEM_INFO = 'hybrid-kem-x25519-mlkem768-v1'

/** ML-KEM_ss || X25519_ss (RFC 10024 section 4.3 order for X25519MLKEM768). */
export const concatHybridSecrets = (kemSS: Uint8Array, ecdhSS: Uint8Array): Uint8Array => {
  const out = new Uint8Array(kemSS.length + ecdhSS.length)
  out.set(kemSS, 0)
  out.set(ecdhSS, kemSS.length)
  return out
}

export interface HybridCombineResult {
  /** The HKDF input key material, ML-KEM_ss || X25519_ss. */
  ikm: Uint8Array
  /** Handle of the generic-secret object that holds the input key material. */
  ikmHandle: number
  /** The 32-byte combined session key. */
  key: Uint8Array
  /** Handle of the derived session key object. */
  keyHandle: number
}

/**
 * HKDF-SHA-256(IKM = ML-KEM_ss || X25519_ss, salt = none, info = HYBRID_KEM_INFO, L = 32)
 * run through C_DeriveKey(CKM_HKDF_DERIVE). With no salt, HKDF uses a string of
 * HashLen zero bytes (RFC 5869 section 2.2).
 */
export const combineHybridSecrets = (
  M: SoftHSMModule,
  hSession: number,
  kemSS: Uint8Array,
  ecdhSS: Uint8Array
): HybridCombineResult => {
  const ikm = concatHybridSecrets(kemSS, ecdhSS)
  const ikmHandle = hsm_importGenericSecret(M, hSession, ikm)
  const keyOut = { current: 0 }
  const key = hsm_hkdf(
    M,
    hSession,
    ikmHandle,
    CKM_SHA256,
    true,
    true,
    undefined,
    new TextEncoder().encode(HYBRID_KEM_INFO),
    32,
    keyOut
  )
  return { ikm, ikmHandle, key, keyHandle: keyOut.current }
}
