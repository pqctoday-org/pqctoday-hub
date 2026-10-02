// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmHpkeOps backed by SoftHSM3 (Rust engine) through PKCS#11 CKM_HPKE.
 *
 * Seal: C_EncapsulateKey(CKM_HPKE) on the recipient's public key returns the
 * encapsulated secret, a non-extractable AES-256 key object and the base nonce;
 * C_Encrypt(CKM_AES_GCM) on that key handle with IV = base_nonce (sequence 0,
 * the only message in a JWE) and the JWE AAD produces the ciphertext. Open
 * mirrors it with C_DecapsulateKey + C_Decrypt. The key schedule is the
 * one-stage SHAKE256 KDF (draft-ietf-hpke-pq-04 §5), in the engine since hsm
 * #310. The shared secret and the AEAD key never leave the token.
 *
 * Guardrail (hsm remediation plan D3): the CK_HPKE_PARAMS built here never
 * carry the binding's forced-encapsulation-randomness field. That hook is for
 * known-answer tests only (src/wasm/hpkePqVectors.local.test.ts);
 * hpkeJweHsm.local.test.ts asserts no non-test code outside the binding sets it.
 */
import {
  CKD_HPKE_SHAKE256,
  CKZ_HPKE_AEAD_256_GCM,
  CKZ_HPKE_MODE_BASE,
  hsm_aesDecrypt,
  hsm_aesEncrypt,
  hsm_destroyObject,
  hsm_extractKeyValue,
  hsm_generateHpkeKeyPair,
  hsm_hpkeDecapsulate,
  hsm_hpkeEncapsulate,
  type HpkeMechParams,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { HPKE_JWE_SUITES } from './hpkeJwe'
import type { HpkeJweAlg, HsmHpkeOps } from './hpkeJwe'

function mechParams(alg: HpkeJweAlg): HpkeMechParams {
  return {
    kemId: HPKE_JWE_SUITES[alg].kemId,
    kdfId: CKD_HPKE_SHAKE256,
    aeadId: CKZ_HPKE_AEAD_256_GCM,
    mode: CKZ_HPKE_MODE_BASE,
  }
}

export function softHsmHpkeOps(M: SoftHSMModule, hSession: number): HsmHpkeOps {
  return {
    seal(alg, pubHandle, aad, plaintext) {
      const r = hsm_hpkeEncapsulate(M, hSession, pubHandle, mechParams(alg))
      if (r.keyHandle === null || r.baseNonce === null) {
        throw new Error('C_EncapsulateKey(CKM_HPKE) returned no AEAD key')
      }
      try {
        const { ciphertext } = hsm_aesEncrypt(
          M,
          hSession,
          r.keyHandle,
          plaintext,
          'gcm',
          r.baseNonce,
          aad
        )
        return { enc: r.enc, ciphertext }
      } finally {
        hsm_destroyObject(M, hSession, r.keyHandle)
      }
    },
    open(alg, privHandle, enc, aad, ciphertext) {
      const r = hsm_hpkeDecapsulate(M, hSession, privHandle, enc, mechParams(alg))
      if (r.keyHandle === null || r.baseNonce === null) {
        throw new Error('C_DecapsulateKey(CKM_HPKE) returned no AEAD key')
      }
      try {
        return hsm_aesDecrypt(M, hSession, r.keyHandle, ciphertext, r.baseNonce, 'gcm', aad)
      } finally {
        hsm_destroyObject(M, hSession, r.keyHandle)
      }
    },
  }
}

export interface HsmHpkeRecipient {
  alg: HpkeJweAlg
  pubHandle: number
  privHandle: number
  /** Public key bytes (CKA_VALUE of the public key) — the JWK "pub". */
  publicKey: Uint8Array
}

/**
 * Recipient key pair in the token. Without `seed` the token generates a random
 * seed-format key; with `seed` (a JWK "priv" value: 64 bytes for HPKE-12, 32 for
 * HPKE-9) it imports that key and derives the public key itself.
 */
export function hsmHpkeRecipient(
  M: SoftHSMModule,
  hSession: number,
  alg: HpkeJweAlg,
  seed?: Uint8Array
): HsmHpkeRecipient {
  const { pubHandle, privHandle } = hsm_generateHpkeKeyPair(
    M,
    hSession,
    HPKE_JWE_SUITES[alg].kemId,
    seed
  )
  return { alg, pubHandle, privHandle, publicKey: hsm_extractKeyValue(M, hSession, pubHandle) }
}
