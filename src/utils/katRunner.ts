// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * katRunner — Use-case-specific Known Answer Test runner.
 *
 * Validates industry-specific PQC scenarios against NIST FIPS 203/204 ACVP
 * test vectors. No ACVP seed injection required — import-based KATs are
 * deterministic without seeding.
 *
 * Test vector sources:
 *   ML-KEM: src/data/acvp/mlkem_test.json (NIST ACVP vsId=1, encapDecap)
 *   ML-DSA: src/data/acvp/mldsa_test.json (NIST ACVP vsId=2, sigGen)
 *   SLH-DSA: functional round-trip (FIPS 205 — NIST ACVP vectors too large to embed)
 */
import mlkemTestVectors from '../data/acvp/mlkem_test.json'
import mldsaTestVectors from '../data/acvp/mldsa_test.json'
import { hexToBytes } from './dataInputUtils'
import {
  hsm_importMLKEMPrivateKey,
  hsm_decapsulate,
  hsm_extractKeyValue,
  hsm_generateMLKEMKeyPair,
  hsm_encapsulate,
  hsm_importMLDSAPublicKey,
  hsm_verifyBytes,
  hsm_generateMLDSAKeyPair,
  hsm_sign,
  hsm_verify,
  hsm_generateSLHDSAKeyPair,
  hsm_slhdsaSign,
  hsm_slhdsaVerify,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHAKE_256F,
} from '../wasm/softhsm'
import type { SoftHSMModule } from '../wasm/softhsm'

export interface KATResult {
  id: string
  useCase: string
  algorithm: string
  standard: string
  referenceUrl: string
  status: 'pass' | 'fail' | 'error'
  details: string
}

export type SlhDsaVariant =
  | 'SHA2-128s'
  | 'SHA2-128f'
  | 'SHA2-192s'
  | 'SHA2-192f'
  | 'SHA2-256s'
  | 'SHA2-256f'
  | 'SHAKE-128s'
  | 'SHAKE-128f'
  | 'SHAKE-192s'
  | 'SHAKE-192f'
  | 'SHAKE-256s'
  | 'SHAKE-256f'

export type KatKind =
  | { type: 'mlkem-decap'; variant: 512 | 768 | 1024 }
  | { type: 'mlkem-encap-roundtrip'; variant: 512 | 768 | 1024 }
  | { type: 'mldsa-sigver'; variant: 44 | 65 | 87 }
  | { type: 'mldsa-functional'; variant: 44 | 65 | 87 }
  | { type: 'slhdsa-functional'; variant: SlhDsaVariant }

export interface KatTestSpec {
  id: string
  useCase: string
  standard: string
  /** URL to the authoritative KAT source (NIST ACVP vectors or FIPS document) so users can self-verify. */
  referenceUrl: string
  kind: KatKind
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format bytes as a lowercase hex string, truncated to maxBytes with … suffix */
function toHex(bytes: Uint8Array, maxBytes = 32): string {
  return (
    Array.from(bytes.slice(0, maxBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('') + (bytes.length > maxBytes ? '…' : '')
  )
}

// ── NIST vector helpers ───────────────────────────────────────────────────────

function getMlkemGroup(variant: 512 | 768 | 1024) {
  const paramSet = `ML-KEM-${variant}`
  const group = mlkemTestVectors.testGroups.find((g) => g.parameterSet === paramSet)
  if (!group) throw new Error(`No NIST test group for ${paramSet}`)
  return group
}

function getMldsaGroup(variant: 44 | 65 | 87) {
  const paramSet = `ML-DSA-${variant}`
  const group = mldsaTestVectors.testGroups.find((g) => g.parameterSet === paramSet)
  if (!group) throw new Error(`No NIST test group for ${paramSet}`)
  return group
}

const SLH_DSA_CKP_MAP: Record<SlhDsaVariant, number> = {
  'SHA2-128s': CKP_SLH_DSA_SHA2_128S,
  'SHA2-128f': CKP_SLH_DSA_SHA2_128F,
  'SHA2-192s': CKP_SLH_DSA_SHA2_192S,
  'SHA2-192f': CKP_SLH_DSA_SHA2_192F,
  'SHA2-256s': CKP_SLH_DSA_SHA2_256S,
  'SHA2-256f': CKP_SLH_DSA_SHA2_256F,
  'SHAKE-128s': CKP_SLH_DSA_SHAKE_128S,
  'SHAKE-128f': CKP_SLH_DSA_SHAKE_128F,
  'SHAKE-192s': CKP_SLH_DSA_SHAKE_192S,
  'SHAKE-192f': CKP_SLH_DSA_SHAKE_192F,
  'SHAKE-256s': CKP_SLH_DSA_SHAKE_256S,
  'SHAKE-256f': CKP_SLH_DSA_SHAKE_256F,
}

// ── KAT implementations ───────────────────────────────────────────────────────

/**
 * ML-KEM Decapsulation KAT — byte-for-byte shared secret comparison.
 * Imports NIST private key, decapsulates NIST ciphertext, compares SS.
 * Authoritative: FIPS 203 ACVP test vectors.
 */
async function runMLKEMDecapKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const group = getMlkemGroup(variant)
  const test = group.tests[0]
  const skBytes = hexToBytes(test.sk)
  const ctBytes = hexToBytes(test.ct)
  const expectedSs = hexToBytes(test.ss)

  const privHandle = hsm_importMLKEMPrivateKey(M, hSession, variant, skBytes)
  const secretHandle = hsm_decapsulate(M, hSession, privHandle, ctBytes, variant)
  const recoveredSs = hsm_extractKeyValue(M, hSession, secretHandle)

  const matches =
    recoveredSs.length === expectedSs.length &&
    recoveredSs.every((b: number, i: number) => b === expectedSs[i])

  if (matches) {
    return {
      status: 'pass',
      details: `SS[${recoveredSs.length}B]: ${toHex(recoveredSs)}`,
    }
  }
  return {
    status: 'fail',
    details: `SS mismatch: got ${toHex(recoveredSs, 8)}… expected ${toHex(expectedSs, 8)}…`,
  }
}

/**
 * ML-KEM Encap + Decap Round-Trip — functional correctness test.
 * Generates a fresh keypair, encapsulates, decapsulates, verifies SS match.
 */
async function runMLKEMEncapRoundtripKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, variant)
  const { ciphertextBytes, secretHandle: encapSecret } = hsm_encapsulate(
    M,
    hSession,
    pubHandle,
    variant
  )
  const encapSs = hsm_extractKeyValue(M, hSession, encapSecret)
  const decapSecret = hsm_decapsulate(M, hSession, privHandle, ciphertextBytes, variant)
  const decapSs = hsm_extractKeyValue(M, hSession, decapSecret)

  const matches =
    encapSs.length === decapSs.length && encapSs.every((b: number, i: number) => b === decapSs[i])

  if (matches) {
    return {
      status: 'pass',
      details: `SS[${encapSs.length}B]: ${toHex(encapSs)} | ct=${ciphertextBytes.length}B`,
    }
  }
  const encapHex = toHex(encapSs, 8)
  const decapHex = toHex(decapSs, 8)
  return {
    status: 'fail',
    details: `SS mismatch: encap=${encapHex}… decap=${decapHex}…`,
  }
}

/**
 * ML-DSA SigVer KAT — verifies NIST reference signature.
 * Imports NIST public key, verifies NIST signature on NIST message.
 * Authoritative: FIPS 204 ACVP test vectors.
 */
async function runMLDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const group = getMldsaGroup(variant)
  const test = group.tests[0]
  const pkBytes = hexToBytes(test.pk)
  const msgBytes = hexToBytes(test.msg)
  const sigBytes = hexToBytes(test.sig)

  const pubHandle = hsm_importMLDSAPublicKey(M, hSession, variant, pkBytes)
  const isValid = hsm_verifyBytes(M, hSession, pubHandle, msgBytes, sigBytes)

  if (isValid) {
    return {
      status: 'pass',
      details: `Verified sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: 'Signature verification failed against NIST vector' }
}

/**
 * ML-DSA Functional Sign + Verify Round-Trip.
 * Generates a fresh keypair, signs a message, verifies the signature.
 */
async function runMLDSAFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const message = 'NIST PQC KAT validation message — ML-DSA functional round-trip'
  const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, variant)
  const sigBytes = hsm_sign(M, hSession, privHandle, message)
  const isValid = hsm_verify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return {
      status: 'pass',
      details: `sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: 'Functional sign+verify round-trip failed' }
}

/**
 * SLH-DSA Functional Sign + Verify Round-Trip.
 * Generates a fresh keypair, signs a message, verifies the signature.
 * Authoritative: FIPS 205.
 */
async function runSLHDSAFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: SlhDsaVariant
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const ckp = SLH_DSA_CKP_MAP[variant]
  const message = `NIST PQC KAT validation — SLH-DSA-${variant} functional round-trip`
  const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession, ckp)
  const sigBytes = hsm_slhdsaSign(M, hSession, privHandle, message)
  const isValid = hsm_slhdsaVerify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return {
      status: 'pass',
      details: `sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: 'Functional sign+verify round-trip failed' }
}

// ── Public dispatcher ─────────────────────────────────────────────────────────

export async function runKAT(
  M: SoftHSMModule,
  hSession: number,
  spec: KatTestSpec
): Promise<KATResult> {
  const algorithm =
    spec.kind.type === 'mlkem-decap' || spec.kind.type === 'mlkem-encap-roundtrip'
      ? `ML-KEM-${spec.kind.variant}`
      : spec.kind.type === 'slhdsa-functional'
        ? `SLH-DSA-${spec.kind.variant}`
        : `ML-DSA-${spec.kind.variant}`

  try {
    let result: { status: 'pass' | 'fail'; details: string }

    switch (spec.kind.type) {
      case 'mlkem-decap':
        result = await runMLKEMDecapKAT(M, hSession, spec.kind.variant)
        break
      case 'mlkem-encap-roundtrip':
        result = await runMLKEMEncapRoundtripKAT(M, hSession, spec.kind.variant)
        break
      case 'mldsa-sigver':
        result = await runMLDSASigVerKAT(M, hSession, spec.kind.variant)
        break
      case 'mldsa-functional':
        result = await runMLDSAFunctionalKAT(M, hSession, spec.kind.variant)
        break
      case 'slhdsa-functional':
        result = await runSLHDSAFunctionalKAT(M, hSession, spec.kind.variant)
        break
    }

    return {
      id: spec.id,
      useCase: spec.useCase,
      algorithm,
      standard: spec.standard,
      referenceUrl: spec.referenceUrl,
      status: result.status,
      details: result.details,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      id: spec.id,
      useCase: spec.useCase,
      algorithm,
      standard: spec.standard,
      referenceUrl: spec.referenceUrl,
      status: 'error',
      details: msg,
    }
  }
}
