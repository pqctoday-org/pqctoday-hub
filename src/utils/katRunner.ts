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
import aesgcmTestVectors from '../data/acvp/aesgcm_test.json'
import aescbcTestVectors from '../data/acvp/aescbc_test.json'
import aesctrTestVectors from '../data/acvp/aesctr_test.json'
import aeskwTestVectors from '../data/acvp/aeskw_test.json'
import hmacTestVectors from '../data/acvp/hmac_test.json'
import hmacSha384TestVectors from '../data/acvp/hmac_sha384_test.json'
import hmacSha512TestVectors from '../data/acvp/hmac_sha512_test.json'
import ecdsaTestVectors from '../data/acvp/ecdsa_test.json'
import ecdsaP384TestVectors from '../data/acvp/ecdsa_p384_test.json'
import eddsaTestVectors from '../data/acvp/eddsa_test.json'
import rsapssTestVectors from '../data/acvp/rsapss_test.json'
import sha256TestVectors from '../data/acvp/sha256_test.json'
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
  // Classical algorithm HSM functions
  hsm_importAESKey,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_aesCtrEncrypt,
  hsm_aesCtrDecrypt,
  hsm_aesWrapKey,
  hsm_generateAESKey,
  hsm_importHMACKey,
  hsm_hmacVerify,
  hsm_digest,
  hsm_importECPublicKey,
  hsm_generateECKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_importEdDSAPublicKey,
  hsm_generateEdDSAKeyPair,
  hsm_eddsaSign,
  hsm_eddsaVerify,
  hsm_importRSAPublicKey,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_rsaVerify,
  // Mechanism constants
  CKM_SHA256,
  CKM_SHA256_HMAC,
  CKM_SHA384_HMAC,
  CKM_SHA512_HMAC,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_SHA256_RSA_PKCS_PSS,
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
  // PQC algorithms (FIPS 203/204/205)
  | { type: 'mlkem-decap'; variant: 512 | 768 | 1024; testIndex?: number }
  | { type: 'mlkem-encap-roundtrip'; variant: 512 | 768 | 1024 }
  | { type: 'mldsa-sigver'; variant: 44 | 65 | 87; testIndex?: number }
  | { type: 'mldsa-functional'; variant: 44 | 65 | 87 }
  | { type: 'slhdsa-functional'; variant: SlhDsaVariant }
  // AES symmetric (SP 800-38D/38A, RFC 3394)
  | { type: 'aesgcm-decrypt'; testIndex?: number }
  | { type: 'aescbc-decrypt'; testIndex?: number }
  | { type: 'aesctr-roundtrip'; testIndex?: number }
  | { type: 'aeskw-wrap'; testIndex?: number }
  | { type: 'aesgcm-functional' }
  // HMAC / Hash (FIPS 180-4, FIPS 198-1)
  | { type: 'hmac-verify'; hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'; testIndex?: number }
  | { type: 'sha256-hash'; testIndex?: number }
  // Classical signatures — ACVP vector verification
  | { type: 'ecdsa-sigver'; curve: 'P-256' | 'P-384'; testIndex?: number }
  | { type: 'eddsa-sigver'; testIndex?: number }
  | { type: 'rsapss-sigver'; testIndex?: number }
  // Classical signatures — functional round-trips
  | { type: 'ecdsa-functional'; curve: 'P-256' | 'P-384' }
  | { type: 'eddsa-functional' }
  | { type: 'rsa-functional'; bits: 2048 | 3072 | 4096 }

export interface KatTestSpec {
  id: string
  useCase: string
  standard: string
  /** URL to the authoritative KAT source (NIST ACVP vectors or FIPS document) so users can self-verify. */
  referenceUrl: string
  kind: KatKind
  /** Domain-specific message for functional round-trip tests. Overrides the default generic message. */
  message?: string
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

function getMlkemGroup(variant: 512 | 768 | 1024, testIndex = 0) {
  const paramSet = `ML-KEM-${variant}`
  const group = mlkemTestVectors.testGroups.find((g) => g.parameterSet === paramSet)
  if (!group) throw new Error(`No NIST test group for ${paramSet}`)
  const test = group.tests[testIndex] ?? group.tests[0]
  return { group, test }
}

function getMldsaGroup(variant: 44 | 65 | 87, testIndex = 0) {
  const paramSet = `ML-DSA-${variant}`
  const group = mldsaTestVectors.testGroups.find((g) => g.parameterSet === paramSet)
  if (!group) throw new Error(`No NIST test group for ${paramSet}`)
  const test = group.tests[testIndex] ?? group.tests[0]
  return { group, test }
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
  variant: 512 | 768 | 1024,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const { test } = getMlkemGroup(variant, testIndex)
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
  variant: 44 | 65 | 87,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const { test } = getMldsaGroup(variant, testIndex)
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
  variant: 44 | 65 | 87,
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const message = customMessage ?? 'NIST PQC KAT validation message — ML-DSA functional round-trip'
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
  variant: SlhDsaVariant,
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const ckp = SLH_DSA_CKP_MAP[variant]
  const message =
    customMessage ?? `NIST PQC KAT validation — SLH-DSA-${variant} functional round-trip`
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

// ── Classical algorithm KAT implementations ──────────────────────────────────

/**
 * AES-256-GCM Decryption KAT — ACVP SP 800-38D vector.
 * Imports key, decrypts ct||tag with IV, compares against expected pt.
 */
async function runAESGCMDecryptKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    aesgcmTestVectors.testGroups[0].tests[testIndex] ?? aesgcmTestVectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const ivBytes = hexToBytes(test.iv)
  const expectedPt = hexToBytes(test.pt)
  const ctBytes = hexToBytes(test.ct)
  const tagBytes = hexToBytes(test.tag)
  // GCM ciphertext for hsm_aesDecrypt must include tag at the end
  const ctWithTag = new Uint8Array(ctBytes.length + tagBytes.length)
  ctWithTag.set(ctBytes)
  ctWithTag.set(tagBytes, ctBytes.length)

  const keyHandle = hsm_importAESKey(M, hSession, keyBytes)
  const recoveredPt = hsm_aesDecrypt(M, hSession, keyHandle, ctWithTag, ivBytes, 'gcm')

  const matches =
    recoveredPt.length === expectedPt.length &&
    recoveredPt.every((b: number, i: number) => b === expectedPt[i])

  if (matches) {
    return { status: 'pass', details: `pt[${recoveredPt.length}B]: ${toHex(recoveredPt)}` }
  }
  return {
    status: 'fail',
    details: `PT mismatch: got ${toHex(recoveredPt, 8)}… expected ${toHex(expectedPt, 8)}…`,
  }
}

/**
 * AES-256-CBC Decryption KAT — ACVP SP 800-38A vector.
 */
async function runAESCBCDecryptKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    aescbcTestVectors.testGroups[0].tests[testIndex] ?? aescbcTestVectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const ivBytes = hexToBytes(test.iv)
  const expectedPt = hexToBytes(test.pt)
  const ctBytes = hexToBytes(test.ct)

  const keyHandle = hsm_importAESKey(M, hSession, keyBytes)
  const recoveredPt = hsm_aesDecrypt(M, hSession, keyHandle, ctBytes, ivBytes, 'cbc')

  const matches =
    recoveredPt.length === expectedPt.length &&
    recoveredPt.every((b: number, i: number) => b === expectedPt[i])

  if (matches) {
    return { status: 'pass', details: `pt[${recoveredPt.length}B]: ${toHex(recoveredPt)}` }
  }
  return {
    status: 'fail',
    details: `PT mismatch: got ${toHex(recoveredPt, 8)}… expected ${toHex(expectedPt, 8)}…`,
  }
}

/**
 * AES-256-CTR Round-Trip KAT — encrypt plaintext, compare with known ct, decrypt back.
 */
async function runAESCTRRoundtripKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    aesctrTestVectors.testGroups[0].tests[testIndex] ?? aesctrTestVectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const ivBytes = hexToBytes(test.iv)
  const ptBytes = hexToBytes(test.pt)
  const expectedCt = hexToBytes(test.ct)

  const keyHandle = hsm_importAESKey(M, hSession, keyBytes)
  const ct = hsm_aesCtrEncrypt(M, hSession, keyHandle, ivBytes, 128, ptBytes)

  const ctMatches =
    ct.length === expectedCt.length && ct.every((b: number, i: number) => b === expectedCt[i])

  if (!ctMatches) {
    return {
      status: 'fail',
      details: `CT mismatch: got ${toHex(ct, 8)}… expected ${toHex(expectedCt, 8)}…`,
    }
  }

  const recovered = hsm_aesCtrDecrypt(M, hSession, keyHandle, ivBytes, 128, ct)
  const ptMatches =
    recovered.length === ptBytes.length &&
    recovered.every((b: number, i: number) => b === ptBytes[i])

  if (ptMatches) {
    return {
      status: 'pass',
      details: `ct[${ct.length}B] ↔ pt[${recovered.length}B]: round-trip OK`,
    }
  }
  return { status: 'fail', details: `Decrypt mismatch after round-trip` }
}

/**
 * AES-256 Key Wrap KAT — RFC 3394.
 * Imports KEK and key data as AES key objects, wraps, compares with known wrapped output.
 */
async function runAESKWWrapKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    aeskwTestVectors.testGroups[0].tests[testIndex] ?? aeskwTestVectors.testGroups[0].tests[0]
  const kekBytes = hexToBytes(test.kek)
  const keyDataBytes = hexToBytes(test.keyData)
  const expectedWrapped = hexToBytes(test.wrapped)

  const kekHandle = hsm_importAESKey(M, hSession, kekBytes, false, false, true, true)
  const dataHandle = hsm_importAESKey(M, hSession, keyDataBytes)
  const wrapped = hsm_aesWrapKey(M, hSession, kekHandle, dataHandle)

  const matches =
    wrapped.length === expectedWrapped.length &&
    wrapped.every((b: number, i: number) => b === expectedWrapped[i])

  if (matches) {
    return { status: 'pass', details: `wrapped[${wrapped.length}B]: ${toHex(wrapped)}` }
  }
  return {
    status: 'fail',
    details: `Wrap mismatch: got ${toHex(wrapped, 8)}… expected ${toHex(expectedWrapped, 8)}…`,
  }
}

/**
 * AES-256-GCM Functional Round-Trip — generate key, encrypt, decrypt, verify match.
 */
async function runAESGCMFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const message = customMessage ?? 'NIST KAT validation — AES-256-GCM functional round-trip'
  const ptBytes = new TextEncoder().encode(message)

  const keyHandle = hsm_generateAESKey(M, hSession, 256)
  const { ciphertext, iv } = hsm_aesEncrypt(M, hSession, keyHandle, ptBytes, 'gcm')
  const recovered = hsm_aesDecrypt(M, hSession, keyHandle, ciphertext, iv, 'gcm')

  const matches =
    recovered.length === ptBytes.length &&
    recovered.every((b: number, i: number) => b === ptBytes[i])

  if (matches) {
    return {
      status: 'pass',
      details: `ct[${ciphertext.length}B] ↔ pt[${recovered.length}B]: round-trip OK`,
    }
  }
  return { status: 'fail', details: 'AES-GCM encrypt+decrypt round-trip failed' }
}

/**
 * HMAC Verification KAT — imports key, verifies MAC against ACVP vector.
 */
async function runHMACVerifyKAT(
  M: SoftHSMModule,
  hSession: number,
  hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512',
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const vectors =
    hashAlg === 'SHA-384'
      ? hmacSha384TestVectors
      : hashAlg === 'SHA-512'
        ? hmacSha512TestVectors
        : hmacTestVectors
  const mechType =
    hashAlg === 'SHA-384'
      ? CKM_SHA384_HMAC
      : hashAlg === 'SHA-512'
        ? CKM_SHA512_HMAC
        : CKM_SHA256_HMAC
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const msgBytes = hexToBytes(test.msg)
  const macBytes = hexToBytes(test.mac)

  const keyHandle = hsm_importHMACKey(M, hSession, keyBytes)
  const isValid = hsm_hmacVerify(M, hSession, keyHandle, msgBytes, macBytes, mechType)

  if (isValid) {
    return {
      status: 'pass',
      details: `HMAC-${hashAlg} mac[${macBytes.length}B]: ${toHex(macBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: `HMAC-${hashAlg} verification failed against ACVP vector` }
}

/**
 * SHA-256 Hash KAT — computes digest, compares with ACVP expected value.
 */
async function runSHA256HashKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    sha256TestVectors.testGroups[0].tests[testIndex] ?? sha256TestVectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  const computed = hsm_digest(M, hSession, msgBytes, CKM_SHA256)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return { status: 'pass', details: `SHA-256[${computed.length}B]: ${toHex(computed)}` }
  }
  return {
    status: 'fail',
    details: `SHA-256 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * ECDSA SigVer KAT — imports public key from ACVP (qx,qy), verifies signature.
 */
async function runECDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384',
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const vectors = curve === 'P-384' ? ecdsaP384TestVectors : ecdsaTestVectors
  const mechType = curve === 'P-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const qxBytes = hexToBytes(test.qx)
  const qyBytes = hexToBytes(test.qy)
  // ECDSA msg in ACVP files is stored as plain text string
  const message =
    typeof test.msg === 'string' && !/^[0-9a-fA-F]+$/.test(test.msg)
      ? test.msg
      : new TextDecoder().decode(hexToBytes(test.msg))
  // Concatenate (r||s) for PKCS#11 raw signature format
  const rBytes = hexToBytes(test.r)
  const sBytes = hexToBytes(test.s)
  const sigBytes = new Uint8Array(rBytes.length + sBytes.length)
  sigBytes.set(rBytes)
  sigBytes.set(sBytes, rBytes.length)

  const pubHandle = hsm_importECPublicKey(M, hSession, qxBytes, qyBytes, curve)
  const isValid = hsm_ecdsaVerify(M, hSession, pubHandle, message, sigBytes, mechType)

  if (isValid) {
    return {
      status: 'pass',
      details: `ECDSA-${curve} sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: `ECDSA-${curve} verification failed against ACVP vector` }
}

/**
 * EdDSA (Ed25519) SigVer KAT — imports ACVP public key, verifies signature.
 */
async function runEdDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    eddsaTestVectors.testGroups[0].tests[testIndex] ?? eddsaTestVectors.testGroups[0].tests[0]
  const pkBytes = hexToBytes(test.pk)
  const sigBytes = hexToBytes(test.signature)
  // EdDSA msg in ACVP files is hex-encoded text
  const message = new TextDecoder().decode(hexToBytes(test.msg))

  const pubHandle = hsm_importEdDSAPublicKey(M, hSession, pkBytes)
  const isValid = hsm_eddsaVerify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return { status: 'pass', details: `Ed25519 sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…` }
  }
  return { status: 'fail', details: 'Ed25519 verification failed against ACVP vector' }
}

/**
 * RSA-PSS SigVer KAT — imports ACVP public key (n,e), verifies signature.
 */
async function runRSAPSSSigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    rsapssTestVectors.testGroups[0].tests[testIndex] ?? rsapssTestVectors.testGroups[0].tests[0]
  const nBytes = hexToBytes(test.n)
  const eBytes = hexToBytes(test.e)
  const sigBytes = hexToBytes(test.signature)
  // RSA msg in ACVP files is plain text
  const message =
    typeof test.msg === 'string' && !/^[0-9a-fA-F]+$/.test(test.msg)
      ? test.msg
      : new TextDecoder().decode(hexToBytes(test.msg))

  const pubHandle = hsm_importRSAPublicKey(M, hSession, nBytes, eBytes)
  const isValid = hsm_rsaVerify(M, hSession, pubHandle, message, sigBytes, CKM_SHA256_RSA_PKCS_PSS)

  if (isValid) {
    return {
      status: 'pass',
      details: `RSA-2048-PSS sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: 'RSA-PSS verification failed against ACVP vector' }
}

/**
 * ECDSA Functional Sign + Verify Round-Trip.
 */
async function runECDSAFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384',
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const mechType = curve === 'P-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
  const message = customMessage ?? `NIST KAT validation — ECDSA-${curve} functional round-trip`
  const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve)
  const sigBytes = hsm_ecdsaSign(M, hSession, privHandle, message, mechType)
  const isValid = hsm_ecdsaVerify(M, hSession, pubHandle, message, sigBytes, mechType)

  if (isValid) {
    return {
      status: 'pass',
      details: `ECDSA-${curve} sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: `ECDSA-${curve} functional sign+verify round-trip failed` }
}

/**
 * EdDSA (Ed25519) Functional Sign + Verify Round-Trip.
 */
async function runEdDSAFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const message = customMessage ?? 'NIST KAT validation — Ed25519 functional round-trip'
  const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, hSession, 'Ed25519')
  const sigBytes = hsm_eddsaSign(M, hSession, privHandle, message)
  const isValid = hsm_eddsaVerify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return { status: 'pass', details: `Ed25519 sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…` }
  }
  return { status: 'fail', details: 'Ed25519 functional sign+verify round-trip failed' }
}

/**
 * RSA Functional Sign + Verify Round-Trip (PSS).
 */
async function runRSAFunctionalKAT(
  M: SoftHSMModule,
  hSession: number,
  bits: 2048 | 3072 | 4096,
  customMessage?: string
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const message = customMessage ?? `NIST KAT validation — RSA-${bits}-PSS functional round-trip`
  const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, bits)
  const sigBytes = hsm_rsaSign(M, hSession, privHandle, message, CKM_SHA256_RSA_PKCS_PSS)
  const isValid = hsm_rsaVerify(M, hSession, pubHandle, message, sigBytes, CKM_SHA256_RSA_PKCS_PSS)

  if (isValid) {
    return {
      status: 'pass',
      details: `RSA-${bits}-PSS sig[${sigBytes.length}B]: ${toHex(sigBytes, 16)}…`,
    }
  }
  return { status: 'fail', details: `RSA-${bits}-PSS functional sign+verify round-trip failed` }
}

// ── Algorithm name derivation ────────────────────────────────────────────────

function getAlgorithmName(kind: KatKind): string {
  switch (kind.type) {
    case 'mlkem-decap':
    case 'mlkem-encap-roundtrip':
      return `ML-KEM-${kind.variant}`
    case 'mldsa-sigver':
    case 'mldsa-functional':
      return `ML-DSA-${kind.variant}`
    case 'slhdsa-functional':
      return `SLH-DSA-${kind.variant}`
    case 'aesgcm-decrypt':
    case 'aesgcm-functional':
      return 'AES-256-GCM'
    case 'aescbc-decrypt':
      return 'AES-256-CBC'
    case 'aesctr-roundtrip':
      return 'AES-256-CTR'
    case 'aeskw-wrap':
      return 'AES-256-KW'
    case 'hmac-verify':
      return `HMAC-${kind.hashAlg}`
    case 'sha256-hash':
      return 'SHA-256'
    case 'ecdsa-sigver':
    case 'ecdsa-functional':
      return `ECDSA-${kind.curve}`
    case 'eddsa-sigver':
    case 'eddsa-functional':
      return 'Ed25519'
    case 'rsapss-sigver':
      return 'RSA-2048-PSS'
    case 'rsa-functional':
      return `RSA-${kind.bits}-PSS`
  }
}

// ── Public dispatcher ─────────────────────────────────────────────────────────

export async function runKAT(
  M: SoftHSMModule,
  hSession: number,
  spec: KatTestSpec
): Promise<KATResult> {
  const algorithm = getAlgorithmName(spec.kind)

  try {
    let result: { status: 'pass' | 'fail'; details: string }

    switch (spec.kind.type) {
      case 'mlkem-decap':
        result = await runMLKEMDecapKAT(M, hSession, spec.kind.variant, spec.kind.testIndex)
        break
      case 'mlkem-encap-roundtrip':
        result = await runMLKEMEncapRoundtripKAT(M, hSession, spec.kind.variant)
        break
      case 'mldsa-sigver':
        result = await runMLDSASigVerKAT(M, hSession, spec.kind.variant, spec.kind.testIndex)
        break
      case 'mldsa-functional':
        result = await runMLDSAFunctionalKAT(M, hSession, spec.kind.variant, spec.message)
        break
      case 'slhdsa-functional':
        result = await runSLHDSAFunctionalKAT(M, hSession, spec.kind.variant, spec.message)
        break
      case 'aesgcm-decrypt':
        result = await runAESGCMDecryptKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aescbc-decrypt':
        result = await runAESCBCDecryptKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aesctr-roundtrip':
        result = await runAESCTRRoundtripKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aeskw-wrap':
        result = await runAESKWWrapKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aesgcm-functional':
        result = await runAESGCMFunctionalKAT(M, hSession, spec.message)
        break
      case 'hmac-verify':
        result = await runHMACVerifyKAT(M, hSession, spec.kind.hashAlg, spec.kind.testIndex)
        break
      case 'sha256-hash':
        result = await runSHA256HashKAT(M, hSession, spec.kind.testIndex)
        break
      case 'ecdsa-sigver':
        result = await runECDSASigVerKAT(M, hSession, spec.kind.curve, spec.kind.testIndex)
        break
      case 'eddsa-sigver':
        result = await runEdDSASigVerKAT(M, hSession, spec.kind.testIndex)
        break
      case 'rsapss-sigver':
        result = await runRSAPSSSigVerKAT(M, hSession, spec.kind.testIndex)
        break
      case 'ecdsa-functional':
        result = await runECDSAFunctionalKAT(M, hSession, spec.kind.curve, spec.message)
        break
      case 'eddsa-functional':
        result = await runEdDSAFunctionalKAT(M, hSession, spec.message)
        break
      case 'rsa-functional':
        result = await runRSAFunctionalKAT(M, hSession, spec.kind.bits, spec.message)
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
