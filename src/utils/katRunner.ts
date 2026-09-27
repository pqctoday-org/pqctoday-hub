// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * katRunner — Use-case-specific Known Answer Test runner.
 *
 * Runs industry-specific scenarios against pinned vectors of mixed evidence
 * class — public NIST ACVP-Server reference samples, published-standard
 * examples, OpenSSL-oracle values and functional round-trips. The class of
 * each kind is derived from its vector file's _provenance in katEvidence.ts;
 * result text must not claim more than that class supports.
 *
 * Test vector sources:
 *   ML-KEM: src/data/acvp/mlkem_test.json (NIST ACVP vsId=1, encapDecap)
 *   ML-DSA: src/data/acvp/mldsa_test.json (NIST ACVP vsId=2, sigGen)
 *   SLH-DSA: functional round-trip here. Real NIST ACVP vectors for all 12
 *     parameter sets DO exist (src/data/acvp/slhdsa_ctx_test.json) and are
 *     wired into the SigVer KAT in HsmAcvpTesting.tsx, not this file — this
 *     comment previously said the vectors were "too large to embed", which
 *     stopped being true once they were reduced to one case per parameter set
 *     (2026-08-24 WS-6/H-4 remediation).
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
import ecdsaP521TestVectors from '../data/acvp/ecdsa_p521_test.json'
import eddsaTestVectors from '../data/acvp/eddsa_test.json'
import eddsaEd448TestVectors from '../data/acvp/eddsa_ed448_test.json'
import rsapssTestVectors from '../data/acvp/rsapss_test.json'
import sha256TestVectors from '../data/acvp/sha256_test.json'
// Phase 2 gap-fill vectors — wiring in progress

import sha384TestVectors from '../data/acvp/sha384_test.json'

import sha512TestVectors from '../data/acvp/sha512_test.json'

import sha3_256TestVectors from '../data/acvp/sha3_256_test.json'

import sha3_512TestVectors from '../data/acvp/sha3_512_test.json'

import aescmacTestVectors from '../data/acvp/aescmac_test.json'

import pbkdf2TestVectors from '../data/acvp/pbkdf2_test.json'

import hkdfTestVectors from '../data/acvp/hkdf_test.json'
import suciProfileBTestVectors from '../data/kat/gsma_suci_ts33501_annex_c.json'
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
  hsm_slhdsaVerifyBytes,
  hsm_importSLHDSAPublicKey,
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
  hsm_hmacVerifyGeneral,
  hsm_digest,
  hsm_importECPublicKey,
  hsm_generateECKeyPair,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_ecdsaVerifyBytes,
  hsm_importEdDSAPublicKey,
  hsm_generateEdDSAKeyPair,
  hsm_eddsaSign,
  hsm_eddsaVerify,
  hsm_eddsaVerifyBytes,
  hsm_importRSAPublicKey,
  hsm_generateRSAKeyPair,
  hsm_rsaSign,
  hsm_rsaVerify,
  // Gap-fill HSM functions
  hsm_aesCmac,
  hsm_hmacGeneral,
  hsm_digestMultiPart,
  hsm_ecdhDerive,
  hsm_extractECPoint,
  hsm_pbkdf2,
  hsm_hkdf,
  hsm_importGenericSecret,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  hsm_createObject,
  hsm_injectTestKey,
  hsm_getMechanismList,
  hsm_importECPrivateKey,
  writeBytes,
  CKO_SECRET_KEY,
  CKK_AES,
  CKK_GENERIC_SECRET,
  CKM_AES_KEY_WRAP_KWP,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_SIGN,
  CKA_EXTRACTABLE,
  CKA_VALUE,
  // Mechanism constants
  CKM_SHA256,
  CKM_SHA256_HMAC_GENERAL,
  CKM_SHA384_HMAC_GENERAL,
  CKM_SHA512_HMAC_GENERAL,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_ECDSA_SHA512,
  rvName,
  CKM_SHA256_RSA_PKCS_PSS,
  CKM_SHA384,
  CKM_SHA512,
  CKM_SHA3_256,
  CKM_SHA3_512,
  CKP_PKCS5_PBKD2_HMAC_SHA256,
  CKP_PKCS5_PBKD2_HMAC_SHA512,
  CKD_SHA256_KDF,
} from '../wasm/softhsm'
import type { SoftHSMModule } from '../wasm/softhsm'
import { CKM_ML_DSA } from '../wasm/softhsm/constants'
import { MECH_TABLE } from '../wasm/softhsm/mechanismTable'
import { evidenceForKind, evidenceRecordsForKind, type KatEvidenceClass } from './katEvidence'

export type KatStatus = 'pass' | 'fail' | 'error' | 'skip'

export interface KATResult {
  id: string
  useCase: string
  algorithm: string
  standard: string
  referenceUrl: string
  /** Library CSV referenceId for the authoritative standard, used to render internal /library deep links. */
  libraryRefId?: string
  /** 'skip' = not tested (the engine does not advertise a mechanism the case
   *  needs). A skip is evidence of nothing: it never counts as a pass. */
  status: KatStatus
  details: string
  /** Evidence class of the expected value, derived from the vector file's provenance. */
  evidence: KatEvidenceClass
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
  /** Dedicated NIST ACVP ML-DSA sigVer case (external/pure group): the group's
   *  positive case, or its first negative case, verified through the same
   *  verifyRv the workbench's §5d.1 uses. */
  | { type: 'mldsa-sigver-nist'; variant: 44 | 65 | 87; expect: 'valid' | 'invalid' }
  | { type: 'slhdsa-functional'; variant: SlhDsaVariant }
  /** NIST ACVP SLH-DSA sigGen output verified locally (workbench §9b). */
  | { type: 'slhdsa-sigver'; variant: SlhDsaVariant }
  // AES symmetric (SP 800-38D/38A, RFC 3394)
  | { type: 'aesgcm-decrypt'; testIndex?: number }
  | { type: 'aescbc-decrypt'; testIndex?: number }
  | { type: 'aesctr-roundtrip'; testIndex?: number }
  | { type: 'aeskw-wrap'; testIndex?: number }
  | { type: 'aesgcm-functional' }
  // HMAC / Hash (FIPS 180-4, FIPS 198-1)
  | { type: 'hmac-verify'; hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'; testIndex?: number }
  | { type: 'sha256-hash'; testIndex?: number }
  // Classical signatures — vector verification (RFC 6979 / RFC 8032 examples, OpenSSL-oracle RSA-PSS)
  /** P-256/P-384: RFC 6979 examples; P-521: NIST ACVP-Server sigVer sample (workbench §33). */
  | { type: 'ecdsa-sigver'; curve: 'P-256' | 'P-384' | 'P-521'; testIndex?: number }
  /** Ed25519: RFC 8032 example; Ed448: NIST ACVP-Server sigVer sample (workbench §16b). */
  | { type: 'eddsa-sigver'; curve?: 'Ed25519' | 'Ed448'; testIndex?: number }
  | { type: 'rsapss-sigver'; testIndex?: number }
  // Classical signatures — functional round-trips
  | { type: 'ecdsa-functional'; curve: 'P-256' | 'P-384' }
  | { type: 'eddsa-functional' }
  | { type: 'rsa-functional'; bits: 2048 | 3072 | 4096 }
  // Gap-fill: additional hash algorithms
  | { type: 'sha384-hash'; testIndex?: number }
  | { type: 'sha512-hash'; testIndex?: number }
  | { type: 'sha3-256-hash'; testIndex?: number }
  | { type: 'sha3-512-hash'; testIndex?: number }
  // Gap-fill: AES-CMAC
  | { type: 'aescmac-verify'; testIndex?: number }
  // Gap-fill: HMAC generation (compute + compare, not just verify)
  | { type: 'hmac-generate'; hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'; testIndex?: number }
  // Gap-fill: multi-part digest
  | { type: 'digest-multipart'; hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'; testIndex?: number }
  // Gap-fill: ECDH key agreement
  | { type: 'ecdh-derive'; curve: 'P-256' | 'P-384' }
  // Gap-fill: key derivation functions
  | { type: 'pbkdf2-derive'; prf: 'SHA-256' | 'SHA-512'; testIndex?: number }
  | { type: 'hkdf-derive'; testIndex?: number }
  // Gap-fill: AES Key Wrap with Padding (RFC 5649)
  | { type: 'aes-kwp-wrap' }
  // GSMA 5G SUCI (3GPP TS 33.501)
  | {
      type: 'suci-profile-b'
      step:
        | '1-unwrap-hn-priv'
        | '2-unwrap-eph-priv'
        | '3-ecdh'
        | '4-kdf'
        | '5-encrypt'
        | '6-mac'
        | '7-e2e'
    }

export interface KatTestSpec {
  id: string
  useCase: string
  standard: string
  /** URL to the authoritative KAT source (NIST ACVP vectors or FIPS document) so users can self-verify. */
  referenceUrl: string
  /** Library CSV referenceId for the authoritative standard (e.g. 'NIST-SP-800-90B'). When present,
   *  KatValidationPanel renders an internal /library?ref=<id> deep link alongside the external referenceUrl. */
  libraryRefId?: string
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

/** The truncating HMAC mechanism the NIST ACVP-HMAC samples need (their macLen < digest). */
function hmacGeneralMech(hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'): number {
  return hashAlg === 'SHA-384'
    ? CKM_SHA384_HMAC_GENERAL
    : hashAlg === 'SHA-512'
      ? CKM_SHA512_HMAC_GENERAL
      : CKM_SHA256_HMAC_GENERAL
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

// A lazy function, not a top-level literal: the production build wraps this
// module's softhsm import in vite-plugin-top-level-await, so a top-level
// literal here would capture every CKP_SLH_DSA_* parameter set as `undefined`
// (assigned only once that chunk's own top-level await resolves, which
// happens AFTER this module's top-level runs). Dev/vitest don't use that
// plugin, so this bug is invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
const slhDsaCkpMap = (): Record<SlhDsaVariant, number> => ({
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
})

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
      details: `Imported NIST private key → decapsulated ciphertext → shared secret matches ACVP expected value (${recoveredSs.length}B)`,
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
      details: `Generated fresh keypair → encapsulated → decapsulated → both shared secrets match (${encapSs.length}B, ct ${ciphertextBytes.length}B)`,
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
      details: `Imported NIST public key → verified ACVP reference signature on NIST message (${sigBytes.length}B signature)`,
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
      details: `Generated keypair → signed message → signature verified successfully (${sigBytes.length}B signature)`,
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
  const ckp = slhDsaCkpMap()[variant]
  const message =
    customMessage ?? `NIST PQC KAT validation — SLH-DSA-${variant} functional round-trip`
  const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession, ckp)
  const sigBytes = hsm_slhdsaSign(M, hSession, privHandle, message)
  const isValid = hsm_slhdsaVerify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return {
      status: 'pass',
      details: `Generated keypair → signed message → signature verified successfully (${sigBytes.length}B signature)`,
    }
  }
  return { status: 'fail', details: 'Functional sign+verify round-trip failed' }
}

// ── Classical algorithm KAT implementations ──────────────────────────────────

/**
 * AES-256-GCM decryption vs NIST's CAVP GCM test vectors (gcmDecrypt256.rsp, AES-256,
 * 96-bit IV, no AAD, 128-bit tag; built by scripts/acvp/build_gcm_cavp_kat.py). Replaced
 * the Node/OpenSSL-generated cases on 2026-09-26 (manifest: published-standard-kat).
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
    return {
      status: 'pass',
      details: `Imported key → decrypted NIST's CAVP ciphertext+tag → plaintext matches NIST's expected value (${recoveredPt.length}B)`,
    }
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
  // Raw CKM_AES_CBC ('cbc-raw'): NIST ACVP-AES-CBC tests the block-cipher mode
  // with no PKCS#7 padding. 'cbc' is CKM_AES_CBC_PAD, whose unpad step rejects
  // this unpadded sample (C++ CKR_ENCRYPTED_DATA_INVALID, Rust
  // CKR_FUNCTION_FAILED) — the same mechanism the workbench's §11 uses.
  const recoveredPt = hsm_aesDecrypt(M, hSession, keyHandle, ctBytes, ivBytes, 'cbc-raw')

  const matches =
    recoveredPt.length === expectedPt.length &&
    recoveredPt.every((b: number, i: number) => b === expectedPt[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Imported NIST key → decrypted ACVP ciphertext → plaintext matches expected value (${recoveredPt.length}B)`,
    }
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
      details: `Imported SP 800-38A example key → ciphertext matches the published value → decrypted back to the original (${recovered.length}B)`,
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
    return {
      status: 'pass',
      details: `Imported wrapping key → wrapped RFC 3394 example key material → output matches the RFC's expected value (${wrapped.length}B)`,
    }
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
      details: `Generated AES-256 key → encrypted message → decrypted → plaintext matches original (${recovered.length}B)`,
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
  const mechType = hmacGeneralMech(hashAlg)
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const msgBytes = hexToBytes(test.msg)
  const macBytes = hexToBytes(test.mac)

  const keyHandle = hsm_importHMACKey(M, hSession, keyBytes)
  // The NIST sample's MAC is truncated (macLen < digest length), so verify with
  // the _GENERAL mechanism at that length, as the workbench's §2/§13/§14 do.
  const isValid = hsm_hmacVerifyGeneral(M, hSession, keyHandle, msgBytes, macBytes, mechType)

  if (isValid) {
    return {
      status: 'pass',
      details: `Imported NIST HMAC key → C_Verify(CKM_${hashAlg.replace('-', '')}_HMAC_GENERAL, ${macBytes.length}B) accepts the ACVP sample's truncated MAC (tcId ${test.tcId})`,
    }
  }
  return {
    status: 'fail',
    details: `HMAC-${hashAlg} _GENERAL verification rejected the ACVP sample's ${macBytes.length}B MAC (tcId ${test.tcId})`,
  }
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
    return {
      status: 'pass',
      details: `Hashed NIST test message → digest matches ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `SHA-256 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * ECDSA SigVer KAT — imports the RFC 6979 example public key (qx,qy), verifies its signature.
 */
async function runECDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384' | 'P-521',
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  if (curve === 'P-521') {
    // NIST ACVP-Server ECDSA-SigVer-FIPS186-5 sample (binary message), the
    // same case as the workbench's §33.
    const t = ecdsaP521TestVectors.testGroups[0].tests[0]
    const r = hexToBytes(t.r)
    const sBytes = hexToBytes(t.s)
    const sig = new Uint8Array([...r, ...sBytes])
    const pub = hsm_importECPublicKey(M, hSession, hexToBytes(t.qx), hexToBytes(t.qy), 'P-521')
    const ok =
      hsm_ecdsaVerifyBytes(M, hSession, pub, hexToBytes(t.message), sig, CKM_ECDSA_SHA512) ===
      t.testPassed
    return ok
      ? {
          status: 'pass',
          details: `Imported the NIST sample's P-521 public key → C_Verify(CKM_ECDSA_SHA512) = ${t.testPassed ? 'valid' : 'invalid'}, as the sample expects (tcId ${t.tcId})`,
        }
      : {
          status: 'fail',
          details: `ECDSA-P-521 verify disagrees with the NIST sample's testPassed=${t.testPassed} (tcId ${t.tcId})`,
        }
  }
  const vectors = curve === 'P-384' ? ecdsaP384TestVectors : ecdsaTestVectors
  const mechType = curve === 'P-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const qxBytes = hexToBytes(test.qx)
  const qyBytes = hexToBytes(test.qy)
  // ECDSA msg in these vector files is stored as plain text string
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
      details: `Imported RFC 6979 example public key → verified its published signature (${curve})`,
    }
  }
  return {
    status: 'fail',
    details: `ECDSA-${curve} verification failed against the RFC 6979 example`,
  }
}

/**
 * EdDSA (Ed25519) SigVer KAT — imports the RFC 8032 example public key, verifies its signature.
 */
async function runEdDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0,
  curve: 'Ed25519' | 'Ed448' = 'Ed25519'
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  if (curve === 'Ed448') {
    // NIST ACVP-Server EDDSA-SigVer-1.0 sample (Ed448, pure), workbench §16b.
    const t = eddsaEd448TestVectors.testGroups[0].tests[0]
    const pub = hsm_importEdDSAPublicKey(M, hSession, hexToBytes(t.pk), 'Ed448')
    const ok =
      hsm_eddsaVerifyBytes(M, hSession, pub, hexToBytes(t.message), hexToBytes(t.signature)) ===
      t.testPassed
    return ok
      ? {
          status: 'pass',
          details: `Imported the NIST sample's Ed448 public key → C_Verify(CKM_EDDSA) = ${t.testPassed ? 'valid' : 'invalid'}, as the sample expects (tcId ${t.tcId})`,
        }
      : {
          status: 'fail',
          details: `Ed448 verify disagrees with the NIST sample's testPassed=${t.testPassed} (tcId ${t.tcId})`,
        }
  }
  const test =
    eddsaTestVectors.testGroups[0].tests[testIndex] ?? eddsaTestVectors.testGroups[0].tests[0]
  const pkBytes = hexToBytes(test.pk)
  const sigBytes = hexToBytes(test.signature)
  // EdDSA msg in these vector files is hex-encoded text
  const message = new TextDecoder().decode(hexToBytes(test.msg))

  const pubHandle = hsm_importEdDSAPublicKey(M, hSession, pkBytes)
  const isValid = hsm_eddsaVerify(M, hSession, pubHandle, message, sigBytes)

  if (isValid) {
    return {
      status: 'pass',
      details: `Imported RFC 8032 example public key → verified its published Ed25519 signature`,
    }
  }
  return { status: 'fail', details: 'Ed25519 verification failed against the RFC 8032 example' }
}

/**
 * RSA-PSS SigVer KAT — imports an OpenSSL-oracle-generated public key (n,e), verifies its signature.
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
  // RSA msg in these vector files is plain text
  const message =
    typeof test.msg === 'string' && !/^[0-9a-fA-F]+$/.test(test.msg)
      ? test.msg
      : new TextDecoder().decode(hexToBytes(test.msg))

  const pubHandle = hsm_importRSAPublicKey(M, hSession, nBytes, eBytes)
  const isValid = hsm_rsaVerify(M, hSession, pubHandle, message, sigBytes, CKM_SHA256_RSA_PKCS_PSS)

  if (isValid) {
    return {
      status: 'pass',
      details: `Imported OpenSSL-oracle public key → verified the oracle's RSA-PSS signature`,
    }
  }
  return {
    status: 'fail',
    details: 'RSA-PSS verification failed against the OpenSSL-oracle vector',
  }
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
  const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'derive')
  const sigBytes = hsm_ecdsaSign(M, hSession, privHandle, message, mechType)
  const isValid = hsm_ecdsaVerify(M, hSession, pubHandle, message, sigBytes, mechType)

  if (isValid) {
    return {
      status: 'pass',
      details: `Generated keypair → signed message → signature verified successfully (${curve})`,
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
    return {
      status: 'pass',
      details: `Generated keypair → signed message → Ed25519 signature verified successfully`,
    }
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
  const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, bits, false, 'decrypt')
  const sigBytes = hsm_rsaSign(M, hSession, privHandle, message, CKM_SHA256_RSA_PKCS_PSS)
  const isValid = hsm_rsaVerify(M, hSession, pubHandle, message, sigBytes, CKM_SHA256_RSA_PKCS_PSS)

  if (isValid) {
    return {
      status: 'pass',
      details: `Generated ${bits}-bit keypair → signed message → RSA-PSS signature verified successfully`,
    }
  }
  return { status: 'fail', details: `RSA-${bits}-PSS functional sign+verify round-trip failed` }
}

// ── Gap-fill KAT implementations ────────────────────────────────────────────

/**
 * SHA-384 Hash KAT — computes digest, compares with ACVP expected value.
 */
async function runSHA384HashKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    sha384TestVectors.testGroups[0].tests[testIndex] ?? sha384TestVectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  const computed = hsm_digest(M, hSession, msgBytes, CKM_SHA384)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Hashed test message → digest matches ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `SHA-384 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * SHA-512 Hash KAT — computes digest, compares with ACVP expected value.
 */
async function runSHA512HashKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    sha512TestVectors.testGroups[0].tests[testIndex] ?? sha512TestVectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  const computed = hsm_digest(M, hSession, msgBytes, CKM_SHA512)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Hashed test message → digest matches ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `SHA-512 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * SHA3-256 Hash KAT — computes digest, compares with ACVP expected value.
 */
async function runSHA3_256HashKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    sha3_256TestVectors.testGroups[0].tests[testIndex] ?? sha3_256TestVectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  const computed = hsm_digest(M, hSession, msgBytes, CKM_SHA3_256)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Hashed test message → digest matches ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `SHA3-256 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * SHA3-512 Hash KAT — computes digest, compares with ACVP expected value.
 */
async function runSHA3_512HashKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    sha3_512TestVectors.testGroups[0].tests[testIndex] ?? sha3_512TestVectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  const computed = hsm_digest(M, hSession, msgBytes, CKM_SHA3_512)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Hashed test message → digest matches ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `SHA3-512 mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * AES-CMAC Verification KAT — imports key, computes CMAC, compares with NIST SP 800-38B vector.
 */
async function runAESCMACVerifyKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    aescmacTestVectors.testGroups[0].tests[testIndex] ?? aescmacTestVectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMac = hexToBytes(test.mac)

  // AES-CMAC requires CKA_SIGN on the key; hsm_importAESKey doesn't set it, so use createObject directly
  const keyPtr = writeBytes(M, keyBytes)
  const keyHandle = hsm_createObject(M, hSession, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_VALUE, bytesPtr: keyPtr, bytesLen: keyBytes.length },
  ])
  M._free(keyPtr)
  const computed = hsm_aesCmac(M, hSession, keyHandle, msgBytes)

  const matches =
    computed.length === expectedMac.length &&
    computed.every((b: number, i: number) => b === expectedMac[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Imported key → computed AES-CMAC → matches the vector file's SP 800-38B expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `AES-CMAC mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMac, 8)}…`,
  }
}

/**
 * HMAC Generation KAT — imports key, computes HMAC, compares with ACVP expected MAC.
 * Tests hsm_hmacGeneral (generation) rather than hsm_hmacVerifyGeneral.
 */
async function runHMACGenerateKAT(
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
  const mechType = hmacGeneralMech(hashAlg)
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const keyBytes = hexToBytes(test.key)
  const msgBytes = hexToBytes(test.msg)
  const expectedMac = hexToBytes(test.mac)

  const keyHandle = hsm_importHMACKey(M, hSession, keyBytes)
  // Generate at the sample's truncated macLen via _GENERAL; the plain mechanism
  // always emits the full digest, which can never equal a truncated MAC.
  const computed = hsm_hmacGeneral(M, hSession, keyHandle, msgBytes, expectedMac.length, mechType)

  const matches =
    computed.length === expectedMac.length &&
    computed.every((b: number, i: number) => b === expectedMac[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Imported key → C_Sign(CKM_${hashAlg.replace('-', '')}_HMAC_GENERAL, ${computed.length}B) → matches the ACVP sample's truncated MAC (tcId ${test.tcId})`,
    }
  }
  return {
    status: 'fail',
    details: `HMAC-${hashAlg} generation mismatch: got ${computed.length}B ${toHex(computed, 8)} expected ${expectedMac.length}B ${toHex(expectedMac, 8)}`,
  }
}

/**
 * Multi-part Digest KAT — splits message into chunks, digests via C_DigestUpdate, compares.
 * Uses the same SHA-256/384/512 ACVP vectors but exercises the multi-part API.
 */
async function runDigestMultiPartKAT(
  M: SoftHSMModule,
  hSession: number,
  hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512',
  testIndex = 2 // Use the longer test message (index 2) for meaningful chunking
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const vectors =
    hashAlg === 'SHA-384'
      ? sha384TestVectors
      : hashAlg === 'SHA-512'
        ? sha512TestVectors
        : sha256TestVectors
  const mechType =
    hashAlg === 'SHA-384' ? CKM_SHA384 : hashAlg === 'SHA-512' ? CKM_SHA512 : CKM_SHA256
  const test = vectors.testGroups[0].tests[testIndex] ?? vectors.testGroups[0].tests[0]
  const msgBytes = hexToBytes(test.msg || '')
  const expectedMd = hexToBytes(test.md)

  // Split into 3 chunks for multi-part test
  const third = Math.floor(msgBytes.length / 3)
  const chunks =
    msgBytes.length === 0
      ? [new Uint8Array(0)]
      : [msgBytes.slice(0, third), msgBytes.slice(third, third * 2), msgBytes.slice(third * 2)]

  const computed = hsm_digestMultiPart(M, hSession, chunks, mechType)

  const matches =
    computed.length === expectedMd.length &&
    computed.every((b: number, i: number) => b === expectedMd[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Multi-part digest (${chunks.length} chunks) → matches single-shot ACVP expected value (${computed.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `Multi-part ${hashAlg} mismatch: got ${toHex(computed, 8)}… expected ${toHex(expectedMd, 8)}…`,
  }
}

/**
 * ECDH Key Derivation KAT — generates two EC keypairs, derives shared secret from both sides,
 * verifies both derive the same secret (functional correctness).
 */
async function runECDHDeriveKAT(
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384'
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const { pubHandle: pubA, privHandle: privA } = hsm_generateECKeyPair(
    M,
    hSession,
    curve,
    true,
    'derive'
  )
  const { pubHandle: pubB, privHandle: privB } = hsm_generateECKeyPair(
    M,
    hSession,
    curve,
    true,
    'derive'
  )

  // Extract uncompressed EC points for peer public keys
  const pubBytesA = hsm_extractECPoint(M, hSession, pubA)
  const pubBytesB = hsm_extractECPoint(M, hSession, pubB)

  // A derives with B's public key
  const secretHandleAB = hsm_ecdhDerive(M, hSession, privA, pubBytesB)
  const secretAB = hsm_extractKeyValue(M, hSession, secretHandleAB)

  // B derives with A's public key
  const secretHandleBA = hsm_ecdhDerive(M, hSession, privB, pubBytesA)
  const secretBA = hsm_extractKeyValue(M, hSession, secretHandleBA)

  const matches =
    secretAB.length === secretBA.length &&
    secretAB.every((b: number, i: number) => b === secretBA[i])

  if (matches) {
    return {
      status: 'pass',
      details: `Generated two ${curve} keypairs → ECDH derive from both sides → shared secrets match (${secretAB.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `ECDH ${curve} secrets differ: A→B=${toHex(secretAB, 8)}… B→A=${toHex(secretBA, 8)}…`,
  }
}

/**
 * PBKDF2 Key Derivation KAT — derives key from password+salt, compares with an OpenSSL-oracle value.
 */
async function runPBKDF2DeriveKAT(
  M: SoftHSMModule,
  hSession: number,
  prf: 'SHA-256' | 'SHA-512',
  // Default = the group's second case (tcId 2 / tcId 5, c = 4096), the same
  // case the workbench's §17 runs. The first case (c = 1) is an iteration count
  // the Rust engine refuses by policy (rust/src/ffi.rs:11125 at 417c47a2,
  // `iterations < 1000` → CKR_ARGUMENTS_BAD) while C++ accepts it — an engine
  // divergence tracked in open-gaps.json (pbkdf2-min-iterations-divergence),
  // not something this runner can pass by choosing its input.
  testIndex = 1
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const groupIndex = prf === 'SHA-512' ? 1 : 0
  const group = pbkdf2TestVectors.testGroups[groupIndex]
  const test = group.tests[testIndex] ?? group.tests[0]
  const password = hexToBytes(test.password)
  const salt = hexToBytes(test.salt)
  const expectedDk = hexToBytes(test.dk)
  const prfConst = prf === 'SHA-512' ? CKP_PKCS5_PBKD2_HMAC_SHA512 : CKP_PKCS5_PBKD2_HMAC_SHA256

  const derivedKey = hsm_pbkdf2(M, hSession, password, salt, test.iterations, test.dkLen, prfConst)

  const matches =
    derivedKey.length === expectedDk.length &&
    derivedKey.every((b: number, i: number) => b === expectedDk[i])

  if (matches) {
    return {
      status: 'pass',
      details: `PBKDF2-HMAC-${prf} (${test.iterations} iterations) → derived key matches the OpenSSL-oracle value (${derivedKey.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `PBKDF2 mismatch: got ${toHex(derivedKey, 8)}… expected ${toHex(expectedDk, 8)}…`,
  }
}

/**
 * HKDF Key Derivation KAT — imports IKM, derives key with salt+info, compares with RFC 5869 vector.
 */
async function runHKDFDeriveKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const test =
    hkdfTestVectors.testGroups[0].tests[testIndex] ?? hkdfTestVectors.testGroups[0].tests[0]
  const ikmBytes = hexToBytes(test.ikm)
  const saltBytes = test.salt ? hexToBytes(test.salt) : new Uint8Array(0)
  const infoBytes = test.info ? hexToBytes(test.info) : new Uint8Array(0)
  const expectedOkm = hexToBytes(test.okm)

  // Import IKM as a generic secret key
  const ikmHandle = hsm_importGenericSecret(M, hSession, ikmBytes)

  const derivedKey = hsm_hkdf(
    M,
    hSession,
    ikmHandle,
    CKM_SHA256,
    true, // bExtract
    true, // bExpand
    saltBytes.length > 0 ? saltBytes : undefined,
    infoBytes.length > 0 ? infoBytes : undefined,
    test.okmLen
  )

  const matches =
    derivedKey.length === expectedOkm.length &&
    derivedKey.every((b: number, i: number) => b === expectedOkm[i])

  if (matches) {
    return {
      status: 'pass',
      details: `HKDF-SHA256 (extract+expand) → derived key matches RFC 5869 expected value (${derivedKey.length}B)`,
    }
  }
  return {
    status: 'fail',
    details: `HKDF mismatch: got ${toHex(derivedKey, 8)}… expected ${toHex(expectedOkm, 8)}…`,
  }
}

/**
 * AES Key Wrap with Padding — functional round-trip (RFC 5649 mechanism,
 * no published expected value). Wraps a 20-byte generic secret (not a
 * multiple of 8, so the padding path runs) under an AES-256 KEK with
 * CKM_AES_KEY_WRAP_KWP, unwraps it again and compares the recovered bytes.
 *
 * 2026-09-24 fix: the target used to be imported as CKK_AES, but 20 bytes is
 * not an AES key size (FIPS 197) — the Rust engine correctly refused it
 * (CKR_ATTRIBUTE_VALUE_INVALID) and the C++ call went through the deprecated
 * hsm_aesWrapKeyKwp, whose length pointer is the heap's last word, uninitialised
 * (CKR_ARGUMENTS_BAD). It also only checked the wrapped LENGTH. A 20-byte
 * secret is a CKK_GENERIC_SECRET, and the check is now the unwrapped bytes.
 */
async function runAESKWPWrapKAT(
  M: SoftHSMModule,
  hSession: number
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const keyData = hexToBytes('0011223344556677889900112233445566778899')
  const kekBytes = hexToBytes('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')

  const kekHandle = hsm_importAESKey(M, hSession, kekBytes, false, false, true, true)
  const dataHandle = hsm_importGenericSecret(M, hSession, keyData)

  const wrapped = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, kekHandle, dataHandle)
  // RFC 5649 §4.1: output = 8-byte AIV block + plaintext padded to a multiple of 8.
  const expectedLen = 8 + Math.ceil(keyData.length / 8) * 8
  if (wrapped.length !== expectedLen) {
    return {
      status: 'fail',
      details: `AES-KWP wrapped length ${wrapped.length}B, RFC 5649 §4.1 requires ${expectedLen}B for a ${keyData.length}B key`,
    }
  }

  const unwrappedHandle = hsm_unwrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, kekHandle, wrapped, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])
  const recovered = hsm_extractKeyValue(M, hSession, unwrappedHandle)
  const matches =
    recovered.length === keyData.length &&
    recovered.every((b: number, i: number) => b === keyData[i])

  return matches
    ? {
        status: 'pass',
        details: `AES-KWP round-trip: ${keyData.length}B secret → ${wrapped.length}B wrapped (AIV + padding) → unwrapped bytes match (no published expected value)`,
      }
    : {
        status: 'fail',
        details: `AES-KWP round-trip mismatch: unwrapped ${recovered.length}B ${toHex(recovered, 8)} ≠ original ${toHex(keyData, 8)}`,
      }
}

// ── NIST reference samples shared with the workbench (large files: loaded on demand) ──

const SLH_CKP: Record<SlhDsaVariant, number> = {
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

/** SLH-DSA verify of the NIST sigGen output for one parameter set (workbench §9b). */
async function runSLHDSASigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: SlhDsaVariant
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const vectors = (await import('../data/acvp/slhdsa_ctx_test.json')).default
  const name = `SLH-DSA-${variant}`
  const tv = (vectors.sigVer as Record<string, (typeof vectors.sigVer)['SLH-DSA-SHA2-128f']>)[name]
  if (!tv) throw new Error(`No NIST sigVer tuple for ${name} in slhdsa_ctx_test.json`)
  const pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[variant], hexToBytes(tv.pk))
  const isValid = hsm_slhdsaVerifyBytes(
    M,
    hSession,
    pub,
    hexToBytes(tv.message),
    hexToBytes(tv.signature),
    { context: hexToBytes(tv.context) }
  )
  return isValid === tv.testPassed
    ? {
        status: 'pass',
        details: `Verified the NIST sigGen output (tcId ${tv.tcId}, context ${tv.context.length / 2}B): verify=${isValid} matches testPassed=${tv.testPassed}`,
      }
    : {
        status: 'fail',
        details: `${name}: verify=${isValid}, the NIST sample expects testPassed=${tv.testPassed} (tcId ${tv.tcId})`,
      }
}

/**
 * Dedicated NIST ML-DSA sigVer case (external interface, pure) through the
 * workbench's own verifyRv — same case, same executor, same expected return
 * (CKR_OK for the positive case, CKR_SIGNATURE_INVALID for the negative one;
 * any other return fails).
 */
async function runMLDSASigVerNistKAT(
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87,
  expect: 'valid' | 'invalid'
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const [{ default: vectors }, section] = await Promise.all([
    import('../data/acvp/mldsa_sigver_test.json'),
    import('../components/Playground/hsm/acvp/sections/mldsaAcvp'),
  ])
  const g = vectors.testGroups.find(
    (x) => x.parameterSet === `ML-DSA-${variant}` && x.preHash === 'pure' && !x.externalMu
  )
  const t = g?.tests.find((x) => x.testPassed === (expect === 'valid'))
  if (!g || !t || !('message' in t))
    throw new Error(`No pure ${expect} sigVer case for ML-DSA-${variant}`)
  const pub = hsm_importMLDSAPublicKey(M, hSession, variant, hexToBytes(t.pk))
  const r = section.verifyRv(
    M,
    hSession,
    pub,
    CKM_ML_DSA,
    hexToBytes(t.message),
    hexToBytes(t.signature),
    hexToBytes(t.context)
  )
  const want = expect === 'valid' ? 0 : section.CKR_SIGNATURE_INVALID
  const observed =
    r.initRv !== 0 ? `C_VerifyInit → ${rvName(r.initRv)}` : `C_Verify → ${rvName(r.rv)}`
  const ok = r.initRv === 0 && r.rv === want
  const what = `tg${g.tgId}/tc${t.tcId} (${expect === 'valid' ? 'valid' : t.reason})`
  return ok
    ? { status: 'pass', details: `NIST sigVer ${what}: ${observed}, as expected` }
    : {
        status: 'fail',
        details: `NIST sigVer ${what}: ${observed}, expected ${rvName(want)}${expect === 'invalid' && r.rv === 0 ? ' — ACCEPTED an invalid signature' : ''}`,
      }
}

// ── Algorithm name derivation ────────────────────────────────────────────────

function getAlgorithmName(kind: KatKind): string {
  switch (kind.type) {
    case 'mlkem-decap':
    case 'mlkem-encap-roundtrip':
      return `ML-KEM-${kind.variant}`
    case 'mldsa-sigver':
    case 'mldsa-functional':
    case 'mldsa-sigver-nist':
      return `ML-DSA-${kind.variant}`
    case 'slhdsa-functional':
    case 'slhdsa-sigver':
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
      return kind.curve ?? 'Ed25519'
    case 'eddsa-functional':
      return 'Ed25519'
    case 'rsapss-sigver':
      return 'RSA-2048-PSS'
    case 'rsa-functional':
      return `RSA-${kind.bits}-PSS`
    case 'sha384-hash':
      return 'SHA-384'
    case 'sha512-hash':
      return 'SHA-512'
    case 'sha3-256-hash':
      return 'SHA3-256'
    case 'sha3-512-hash':
      return 'SHA3-512'
    case 'aescmac-verify':
      return 'AES-256-CMAC'
    case 'hmac-generate':
      return `HMAC-${kind.hashAlg}`
    case 'digest-multipart':
      return `${kind.hashAlg} (multi-part)`
    case 'ecdh-derive':
      return `ECDH-${kind.curve}`
    case 'pbkdf2-derive':
      return `PBKDF2-HMAC-${kind.prf}`
    case 'hkdf-derive':
      return 'HKDF-SHA256'
    case 'aes-kwp-wrap':
      return 'AES-256-KWP'
    case 'suci-profile-b':
      return `SUCI-Profile-B (Step ${kind.step})`
  }
}

// ── 5G SUCI Profile B (3GPP TS 33.501 Annex C.4.4.1) KAT ─────────────────────
//
// Every step checks a value PRINTED in TS 33.501 V19.5.0 Annex C.4.4.1
// (ECIES Profile B, IMSI MCC|MNC 274012 / MSIN 001002086) — the file's
// official_3gpp_vectors "profile-b-imsi" entry. (Until 2026-09-24 steps 4, 6
// and 7 returned 'pass' without checking anything, and steps 3/5 compared
// against the file's tool-default profiles.B values, which no published
// source contains; see that file's _provenance note.)
//
//   1/2  inject the HN / ephemeral private scalars (import only)
//   3    ECDH(eph priv, HN pub)                     → Eph. Shared Key
//   4    ECDH + X9.63-KDF(SHA-256, SharedInfo = compressed eph pub, 64 B)
//                                                   → Enc key ‖ ICB ‖ MAC key
//   5    AES-128-CTR(Enc key, ICB) over the plaintext block → cipher text
//   6    HMAC-SHA-256 _GENERAL, 8 B, over the cipher text     → MAC tag
//   7    steps 3–6 chained on engine-derived keys → Scheme Output
//        (compressed eph pub ‖ cipher text ‖ MAC tag). C.4.4.1 publishes the
//        Scheme Output, not a full SUCI string (routing indicator and HN
//        public-key identifier are not part of the test data), so that is
//        what is compared.

interface SuciProfileBVector {
  hn_priv_hex: string
  hn_pub_hex: string
  eph_priv_hex: string
  eph_pub_compressed_hex: string
  eph_shared_key_hex: string
  eph_enc_key_hex: string
  icb_hex: string
  eph_mac_key_hex: string
  plaintext_block_hex: string
  scheme_output: string
  scheme_output_parts: { cipher_msin: string; mac_tag: string }
}

const suciVector = (): SuciProfileBVector => {
  const v = (
    suciProfileBTestVectors as unknown as {
      official_3gpp_vectors: Array<{ id: string } & Partial<SuciProfileBVector>>
    }
  ).official_3gpp_vectors.find((x) => x.id === 'profile-b-imsi')
  if (!v?.eph_enc_key_hex || !v.icb_hex || !v.eph_mac_key_hex || !v.plaintext_block_hex)
    throw new Error(
      'TS 33.501 C.4.4.1 profile-b-imsi vector missing from gsma_suci_ts33501_annex_c.json'
    )
  return v as SuciProfileBVector
}

const hexUpper = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

const sameHex = (got: Uint8Array, wantHex: string) => hexUpper(got) === wantHex.toUpperCase()

const runSUCIProfileBKAT = async (
  M: SoftHSMModule,
  hSession: number,
  step: string
): Promise<{ status: 'pass' | 'fail'; details: string }> => {
  const v = suciVector()
  const mismatch = (what: string, got: Uint8Array, want: string) => ({
    status: 'fail' as const,
    details: `${what} mismatch vs TS 33.501 C.4.4.1: got ${hexUpper(got)}, published ${want.toUpperCase()}`,
  })

  if (step === '1-unwrap-hn-priv') {
    const h = await hsm_injectTestKey(M, hSession, hexToBytes(v.hn_priv_hex), 'P-256')
    return {
      status: h ? 'pass' : 'fail',
      details: `Imported the C.4.4.1 home-network private key: handle ${h} (import only — step 3 checks the key material)`,
    }
  }
  if (step === '2-unwrap-eph-priv') {
    const h = await hsm_injectTestKey(M, hSession, hexToBytes(v.eph_priv_hex), 'P-256')
    return {
      status: h ? 'pass' : 'fail',
      details: `Imported the C.4.4.1 ephemeral private key: handle ${h} (import only — step 3 checks the key material)`,
    }
  }

  // Steps 3–7 need the scalar, not the unwrap demo of steps 1–2: import it with
  // C_CreateObject, which both engines accept. (hsm_injectTestKey's
  // C_UnwrapKeyAuthenticated template carries CKA_EC_PARAMS; the C++ engine
  // rejects that template with CKR_ATTRIBUTE_READ_ONLY — the same unwrap
  // without CKA_EC_PARAMS succeeds, 2026-09-24 — while Rust accepts it.)
  const ephPriv = async () =>
    hsm_importECPrivateKey(M, hSession, hexToBytes(v.eph_priv_hex), 'P-256')
  /** Engine ECDH(eph priv, HN pub) with the given KDF; returns the derived bytes. */
  const derive = async (
    kdf: number | undefined,
    sharedInfo: Uint8Array | undefined,
    keyLen: number
  ) => {
    const zHandle = hsm_ecdhDerive(
      M,
      hSession,
      await ephPriv(),
      hexToBytes(v.hn_pub_hex),
      kdf,
      sharedInfo,
      {
        keyLen,
        extractable: true,
      }
    )
    return hsm_extractKeyValue(M, hSession, zHandle)
  }
  const kdfOut = () => derive(CKD_SHA256_KDF, hexToBytes(v.eph_pub_compressed_hex), 64)
  const ctr = (encKey: Uint8Array, icb: Uint8Array) =>
    hsm_aesCtrEncrypt(
      M,
      hSession,
      hsm_importAESKey(M, hSession, encKey),
      icb,
      128,
      hexToBytes(v.plaintext_block_hex)
    )
  const tag = (macKey: Uint8Array, ct: Uint8Array) =>
    hsm_hmacGeneral(
      M,
      hSession,
      hsm_importHMACKey(M, hSession, macKey),
      ct,
      8,
      CKM_SHA256_HMAC_GENERAL
    )

  if (step === '3-ecdh') {
    const z = await derive(undefined, undefined, 32) // default kdf = CKD_NULL (raw Z)
    if (!sameHex(z, v.eph_shared_key_hex))
      return mismatch('Eph. Shared Key', z, v.eph_shared_key_hex)
    return {
      status: 'pass',
      details: `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_NULL) → Eph. Shared Key matches: ${hexUpper(z)}`,
    }
  }

  if (step === '4-kdf') {
    const k = await kdfOut()
    const want = v.eph_enc_key_hex + v.icb_hex + v.eph_mac_key_hex
    if (!sameHex(k, want)) return mismatch('X9.63-KDF output (Enc key ‖ ICB ‖ MAC key)', k, want)
    return {
      status: 'pass',
      details: `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA256_KDF, SharedInfo = compressed eph pub) → Enc key ${v.eph_enc_key_hex}, ICB ${v.icb_hex} and MAC key match`,
    }
  }

  if (step === '5-encrypt') {
    const ct = ctr(hexToBytes(v.eph_enc_key_hex), hexToBytes(v.icb_hex))
    if (!sameHex(ct, v.scheme_output_parts.cipher_msin))
      return mismatch('Cipher text', ct, v.scheme_output_parts.cipher_msin)
    return {
      status: 'pass',
      details: `AES-128-CTR(Enc key, ICB) over plaintext block ${v.plaintext_block_hex} → cipher text matches: ${hexUpper(ct)}`,
    }
  }

  if (step === '6-mac') {
    const t = tag(hexToBytes(v.eph_mac_key_hex), hexToBytes(v.scheme_output_parts.cipher_msin))
    if (!sameHex(t, v.scheme_output_parts.mac_tag))
      return mismatch('MAC tag', t, v.scheme_output_parts.mac_tag)
    return {
      status: 'pass',
      details: `C_Sign(CKM_SHA256_HMAC_GENERAL, 8 B) over the cipher text → MAC tag matches: ${hexUpper(t)}`,
    }
  }

  if (step === '7-e2e') {
    const k = await kdfOut()
    const ct = ctr(k.slice(0, 16), k.slice(16, 32))
    const t = tag(k.slice(32, 64), ct)
    const out = new Uint8Array([...hexToBytes(v.eph_pub_compressed_hex), ...ct, ...t])
    if (!sameHex(out, v.scheme_output)) return mismatch('Scheme Output', out, v.scheme_output)
    return {
      status: 'pass',
      details: `ECDH → X9.63-KDF → AES-128-CTR → HMAC-SHA-256/64 chained on engine-derived keys → Scheme Output matches C.4.4.1 (${out.length} B). The full SUCI string is not part of the published test data and is not compared.`,
    }
  }

  return { status: 'fail', details: `Unknown step ${step}` }
}

// ── Not-tested (skip) support ────────────────────────────────────────────────

const MECH_BY_NAME: ReadonlyMap<string, number> = new Map(
  Object.entries(MECH_TABLE).map(([num, e]) => [e.name, Number(num)])
)

/**
 * PKCS #11 mechanisms a kind's registered case drives (from the generated
 * per-case records — the same exercises the coverage matrix counts). Empty for
 * an unregistered kind, which is then never pre-skipped.
 */
export function requiredMechanisms(kind: KatKind): number[] {
  const names = new Set(
    evidenceRecordsForKind(kind).flatMap((r) => r.exercises.map((e) => e.split(' ')[0]))
  )
  return [...names].map((n) => MECH_BY_NAME.get(n)).filter((m): m is number => m !== undefined)
}

/** C_GetMechanismList for the session's slot; empty set when the probe fails (no pre-skip). */
export function advertisedMechanisms(M: SoftHSMModule, slotId: number): Set<number> {
  try {
    return new Set(hsm_getMechanismList(M, slotId))
  } catch {
    return new Set()
  }
}

export interface RunKatOptions {
  /** The engine's C_GetMechanismList. A kind that needs a mechanism missing from
   *  it is reported 'skip' (not tested) instead of being run. Empty/absent = no check. */
  advertised?: ReadonlySet<number>
}

/** Result counts. `skip` is its own bucket — never a pass, never a failure. */
export function summarizeKatResults(results: readonly Pick<KATResult, 'status'>[]) {
  const c = { pass: 0, fail: 0, error: 0, skip: 0, total: results.length }
  for (const r of results) c[r.status] += 1
  return c
}

// ── Public dispatcher ─────────────────────────────────────────────────────────

export async function runKAT(
  M: SoftHSMModule,
  hSession: number,
  spec: KatTestSpec,
  opts: RunKatOptions = {}
): Promise<KATResult> {
  const algorithm = getAlgorithmName(spec.kind)

  if (opts.advertised && opts.advertised.size > 0) {
    const missing = requiredMechanisms(spec.kind).filter((m) => !opts.advertised!.has(m))
    if (missing.length > 0) {
      return {
        id: spec.id,
        useCase: spec.useCase,
        algorithm,
        standard: spec.standard,
        referenceUrl: spec.referenceUrl,
        libraryRefId: spec.libraryRefId,
        status: 'skip',
        details: `Not tested — this engine does not advertise ${missing
          .map((m) => MECH_TABLE[m]?.name ?? `0x${m.toString(16)}`)
          .join(', ')} (C_GetMechanismList)`,
        evidence: evidenceForKind(spec.kind),
      }
    }
  }

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
      case 'mldsa-sigver-nist':
        result = await runMLDSASigVerNistKAT(M, hSession, spec.kind.variant, spec.kind.expect)
        break
      case 'slhdsa-sigver':
        result = await runSLHDSASigVerKAT(M, hSession, spec.kind.variant)
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
        result = await runEdDSASigVerKAT(M, hSession, spec.kind.testIndex, spec.kind.curve)
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
      case 'sha384-hash':
        result = await runSHA384HashKAT(M, hSession, spec.kind.testIndex)
        break
      case 'sha512-hash':
        result = await runSHA512HashKAT(M, hSession, spec.kind.testIndex)
        break
      case 'sha3-256-hash':
        result = await runSHA3_256HashKAT(M, hSession, spec.kind.testIndex)
        break
      case 'sha3-512-hash':
        result = await runSHA3_512HashKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aescmac-verify':
        result = await runAESCMACVerifyKAT(M, hSession, spec.kind.testIndex)
        break
      case 'hmac-generate':
        result = await runHMACGenerateKAT(M, hSession, spec.kind.hashAlg, spec.kind.testIndex)
        break
      case 'digest-multipart':
        result = await runDigestMultiPartKAT(M, hSession, spec.kind.hashAlg, spec.kind.testIndex)
        break
      case 'ecdh-derive':
        result = await runECDHDeriveKAT(M, hSession, spec.kind.curve)
        break
      case 'pbkdf2-derive':
        result = await runPBKDF2DeriveKAT(M, hSession, spec.kind.prf, spec.kind.testIndex)
        break
      case 'hkdf-derive':
        result = await runHKDFDeriveKAT(M, hSession, spec.kind.testIndex)
        break
      case 'aes-kwp-wrap':
        result = await runAESKWPWrapKAT(M, hSession)
        break
      case 'suci-profile-b':
        result = await runSUCIProfileBKAT(M, hSession, spec.kind.step)
        break
    }

    return {
      id: spec.id,
      useCase: spec.useCase,
      algorithm,
      standard: spec.standard,
      referenceUrl: spec.referenceUrl,
      libraryRefId: spec.libraryRefId,
      status: result.status,
      details: result.details,
      evidence: evidenceForKind(spec.kind),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      id: spec.id,
      useCase: spec.useCase,
      algorithm,
      standard: spec.standard,
      referenceUrl: spec.referenceUrl,
      libraryRefId: spec.libraryRefId,
      status: 'error',
      details: msg,
      evidence: evidenceForKind(spec.kind),
    }
  }
}
