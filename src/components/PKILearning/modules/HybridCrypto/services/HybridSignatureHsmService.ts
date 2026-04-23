// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid Signature HSM Service — concatenation and nesting via softhsmv3 WASM.
 *
 * Component split per construction:
 *
 *   Concatenation / Nesting
 *     EC-Schnorr (secp256k1)  →  @noble/curves        (no PKCS#11 Schnorr mechanism)
 *     ML-DSA-65               →  softhsmv3 WASM        (CKM_ML_DSA, PKCS#11 v3.2)
 *
 *   Silithium
 *     Both components         →  @noble/post-quantum   (fused Fiat-Shamir needs Sign_internal)
 *     (see HybridSignatureService.ts)
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_generateMLDSAKeyPair,
  hsm_signBytesMLDSA,
  hsm_verifyBytes,
  hsm_extractKeyValue,
} from '@/wasm/softhsm/pqc'
import {
  ecSchnorrKeygen,
  ecSchnorrSign,
  ecSchnorrVerify,
  concat,
  toHex,
} from './HybridSignatureService'
import type { HybridSigResult, VerifyResult } from './HybridSignatureService'

// ── Key pair type ─────────────────────────────────────────────────────────────

export interface HsmHybridKeyPair {
  /** EC-Schnorr private key (32 bytes) — @noble/curves */
  ecSk: Uint8Array
  /** EC-Schnorr public key (33 bytes compressed) — @noble/curves */
  ecPk: Uint8Array
  /** ML-DSA-65 PKCS#11 public key handle — softhsmv3 WASM */
  mlPubHandle: number
  /** ML-DSA-65 PKCS#11 private key handle — softhsmv3 WASM */
  mlPrivHandle: number
  /** ML-DSA-65 public key bytes (1952 bytes) extracted for display */
  mlPubBytes: Uint8Array
}

// ── Keygen ────────────────────────────────────────────────────────────────────

/** Generate a hybrid key pair: EC-Schnorr via noble, ML-DSA-65 via HSM. */
export function hsmKeygen(M: SoftHSMModule, hSession: number): HsmHybridKeyPair {
  const { sk: ecSk, pk: ecPk } = ecSchnorrKeygen()
  const { pubHandle: mlPubHandle, privHandle: mlPrivHandle } = hsm_generateMLDSAKeyPair(
    M,
    hSession,
    65
  )
  const mlPubBytes = hsm_extractKeyValue(M, hSession, mlPubHandle)
  return { ecSk, ecPk, mlPubHandle, mlPrivHandle, mlPubBytes }
}

// ── Construction 1: Concatenation (HSM) ──────────────────────────────────────

/**
 * Concatenation sign — EC-Schnorr (noble) + ML-DSA (HSM).
 * Wire format: ecSig(65) ‖ mlSig(3309)
 */
export function hsmConcatenationSign(
  msg: Uint8Array,
  keys: HsmHybridKeyPair,
  M: SoftHSMModule,
  hSession: number
): HybridSigResult {
  const t0 = performance.now()
  const ecSig = ecSchnorrSign(msg, keys.ecSk)
  const ecBytes = concat(ecSig.R, ecSig.s) // 65 bytes
  const mlSig = hsm_signBytesMLDSA(M, hSession, keys.mlPrivHandle, msg)
  const totalBytes = ecBytes.length + mlSig.length
  return {
    construction: 'concatenation',
    signatureBytes: concat(ecBytes, mlSig),
    components: {
      ecPart: toHex(ecBytes),
      mlPart: toHex(mlSig.slice(0, 32)) + '…',
    },
    sizes: {
      ecBytes: ecBytes.length,
      mlBytes: mlSig.length,
      totalBytes,
      concatenationBytes: totalBytes,
      savedBytes: 0,
    },
    separable: true,
    timingMs: performance.now() - t0,
  }
}

export function hsmConcatenationVerify(
  msg: Uint8Array,
  sig: Uint8Array,
  keys: HsmHybridKeyPair,
  M: SoftHSMModule,
  hSession: number
): VerifyResult {
  const ecBytes = sig.slice(0, 65)
  const mlSig = sig.slice(65)
  const R = ecBytes.slice(0, 33)
  const s = ecBytes.slice(33, 65)
  const ecValid = ecSchnorrVerify(msg, keys.ecPk, R, s)
  const mlValid = hsm_verifyBytes(M, hSession, keys.mlPubHandle, msg, mlSig)
  return {
    valid: ecValid && mlValid,
    ecValid,
    mlValid,
    ecAloneValid: ecValid,
    mlAloneValid: mlValid,
  }
}

// ── Construction 2: Nesting (HSM) ─────────────────────────────────────────────

/**
 * Nesting sign — EC-Schnorr on msg (noble), ML-DSA on msg‖ecSig (HSM).
 * Wire format: ecSig(65) ‖ mlSig(3309)
 */
export function hsmNestingSign(
  msg: Uint8Array,
  keys: HsmHybridKeyPair,
  M: SoftHSMModule,
  hSession: number
): HybridSigResult {
  const t0 = performance.now()
  const ecSig = ecSchnorrSign(msg, keys.ecSk)
  const ecBytes = concat(ecSig.R, ecSig.s)
  const nestedMsg = concat(msg, ecBytes)
  const mlSig = hsm_signBytesMLDSA(M, hSession, keys.mlPrivHandle, nestedMsg)
  const totalBytes = ecBytes.length + mlSig.length
  return {
    construction: 'nesting',
    signatureBytes: concat(ecBytes, mlSig),
    components: {
      ecPart: toHex(ecBytes),
      mlPart: toHex(mlSig.slice(0, 32)) + '…',
    },
    sizes: {
      ecBytes: ecBytes.length,
      mlBytes: mlSig.length,
      totalBytes,
      concatenationBytes: 65 + mlSig.length,
      savedBytes: 0,
    },
    separable: true,
    timingMs: performance.now() - t0,
  }
}

export function hsmNestingVerify(
  msg: Uint8Array,
  sig: Uint8Array,
  keys: HsmHybridKeyPair,
  M: SoftHSMModule,
  hSession: number
): VerifyResult {
  const ecBytes = sig.slice(0, 65)
  const mlSig = sig.slice(65)
  const R = ecBytes.slice(0, 33)
  const s = ecBytes.slice(33, 65)
  const nestedMsg = concat(msg, ecBytes)
  const ecValid = ecSchnorrVerify(msg, keys.ecPk, R, s)
  const mlValid = hsm_verifyBytes(M, hSession, keys.mlPubHandle, nestedMsg, mlSig)
  // ML-DSA signed over msg‖ecSig — verifying on raw msg alone must fail
  const mlAloneValid = hsm_verifyBytes(M, hSession, keys.mlPubHandle, msg, mlSig)
  return { valid: ecValid && mlValid, ecValid, mlValid, ecAloneValid: ecValid, mlAloneValid }
}
