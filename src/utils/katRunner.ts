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
 *   LMS/HSS: RFC 8554 Appendix F Test Cases 1-2 (src/data/kat/lms_hss_rfc8554.json
 *     for TC1; TC2 inline below as RFC8554_TC2)
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
import wycRsaPss from '../data/acvp/wycheproof_rsa_pss_2048_sha256_mgf1_32_test.json'
import sha256TestVectors from '../data/acvp/sha256_test.json'
// Phase 2 gap-fill vectors — wiring in progress

import sha384TestVectors from '../data/acvp/sha384_test.json'

import sha512TestVectors from '../data/acvp/sha512_test.json'

import sha3_256TestVectors from '../data/acvp/sha3_256_test.json'

import sha3_512TestVectors from '../data/acvp/sha3_512_test.json'

import aescmacTestVectors from '../data/acvp/aescmac_test.json'

import pbkdf2TestVectors from '../data/acvp/pbkdf2_test.json'
import pbkdf2Rfc7914Vectors from '../data/acvp/pbkdf2_rfc7914_test.json'

import hkdfTestVectors from '../data/acvp/hkdf_test.json'
import suciProfileBTestVectors from '../data/kat/gsma_suci_ts33501_annex_c.json'
import lmsHssRfc8554Vectors from '../data/kat/lms_hss_rfc8554.json'
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
  hsm_rsaVerifyBytes,
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
  hsm_importStatefulPublicKey,
  hsm_statefulVerifyBytes,
  hsm_getSessionInfo,
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
import { CKM_ML_DSA, CKM_HSS, CKK_HSS } from '../wasm/softhsm/constants'
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
  /** RFC 8554 Appendix F HSS/LMS test case verified through C_Verify(CKM_HSS),
   *  plus a one-bit-flipped copy that must be rejected. */
  | { type: 'lms-sigver'; testCase: 1 | 2 }
  // AES symmetric (SP 800-38D/38A, RFC 3394)
  | { type: 'aesgcm-decrypt'; testIndex?: number }
  | { type: 'aescbc-decrypt'; testIndex?: number }
  | { type: 'aesctr-roundtrip'; testIndex?: number }
  | { type: 'aeskw-wrap'; testIndex?: number }
  | { type: 'aesgcm-functional' }
  // HMAC / Hash (FIPS 180-4, FIPS 198-1)
  | { type: 'hmac-verify'; hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512'; testIndex?: number }
  | { type: 'sha256-hash'; testIndex?: number }
  // Classical signatures — vector verification (RFC 6979 / RFC 8032 examples, Wycheproof RSA-PSS)
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
 * RSA-PSS SHA-256 SigVer — one case of Project Wycheproof (Google / C2SP)
 * rsa_pss_2048_sha256_mgf1_32_test.json (MGF1-SHA-256, sLen 32, matching
 * CKM_SHA256_RSA_PKCS_PSS's parameters here). `testIndex` indexes the file's one
 * group; a `valid` case must verify and an `invalid` one must not.
 * independent-oracle evidence: agreement with Wycheproof, never conformance.
 */
async function runRSAPSSSigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  testIndex = 0
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const g = wycRsaPss.testGroups[0]
  const test = g.tests[testIndex] ?? g.tests[0]
  // Wycheproof's modulus is an ASN.1 INTEGER; CKA_MODULUS is unsigned.
  const unsigned = (hex: string) => hex.replace(/^(00)+(?=[0-9a-fA-F]{2})/, '')
  const pubHandle = hsm_importRSAPublicKey(
    M,
    hSession,
    hexToBytes(unsigned(g.publicKey.modulus)),
    hexToBytes(unsigned(g.publicKey.publicExponent))
  )
  const verified = hsm_rsaVerifyBytes(
    M,
    hSession,
    pubHandle,
    hexToBytes(test.msg),
    hexToBytes(test.sig),
    CKM_SHA256_RSA_PKCS_PSS
  )
  const want = test.result === 'valid'
  const where = `Wycheproof rsa_pss_2048_sha256_mgf1_32 tc${test.tcId} (${test.result})`
  if (verified === want) {
    return {
      status: 'pass',
      details: want
        ? `Imported the Wycheproof public key → verified the ${where} signature`
        : `Imported the Wycheproof public key → refused the ${where} signature`,
    }
  }
  return {
    status: 'fail',
    details: want
      ? `RSA-PSS verification failed for ${where}`
      : `RSA-PSS VERIFIED a signature Wycheproof marks invalid: ${where}`,
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
 * PBKDF2 Key Derivation KAT — SHA-256 against RFC 7914 §11, SHA-512 against a self-generated
 * OpenSSL-oracle value (no standard publishes a PBKDF2-HMAC-SHA512 vector).
 */
async function runPBKDF2DeriveKAT(
  M: SoftHSMModule,
  hSession: number,
  prf: 'SHA-256' | 'SHA-512',
  // Default = each group's second case: RFC 7914's c = 80000 case for SHA-256
  // (the one the workbench's §17 runs) and c = 4096 for SHA-512. The first case
  // (c = 1) is an iteration count
  // the Rust engine refuses by policy (rust/src/ffi.rs:11125 at 417c47a2,
  // `iterations < 1000` → CKR_ARGUMENTS_BAD) while C++ accepts it — an engine
  // divergence tracked in open-gaps.json (pbkdf2-min-iterations-divergence),
  // not something this runner can pass by choosing its input.
  testIndex = 1
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  // SHA-256: RFC 7914 §11 (published). SHA-512: no standard publishes a
  // PBKDF2-HMAC-SHA512 vector, so it stays the self-generated file (2026-09-26).
  const group =
    prf === 'SHA-512' ? pbkdf2TestVectors.testGroups[0] : pbkdf2Rfc7914Vectors.testGroups[0]
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
      details: `PBKDF2-HMAC-${prf} (${test.iterations} iterations) → derived key matches ${prf === 'SHA-512' ? 'the OpenSSL-oracle value' : 'RFC 7914 §11'} (${derivedKey.length}B)`,
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
 * RFC 8554 Appendix F, Test Case 2 — transcribed byte-for-byte from the RFC
 * text (HSS L=2: top LMS_SHA256_M32_H10 / LMOTS_SHA256_N32_W4, second level
 * LMS_SHA256_M32_H5 / LMOTS_SHA256_N32_W8). Test Case 1 lives in
 * src/data/kat/lms_hss_rfc8554.json; this case is kept here until it is moved
 * into that file beside it. The lengths are structural and asserted in the
 * katRunner tests: public key 60 B, signature 4 + (2,508 + 56) + 1,292 = 3,860 B.
 */
const RFC8554_TC2 = {
  id: 'Test Case 2 (HSS, RFC 8554 Appendix F)',
  levels: 2,
  pub_key_hex: [
    '000000020000000600000003d08fabd4a2091ff0a8cb4ed834e7453432a58885cd9ba0431235466bff9651c6c9212440',
    '4d45fa53cf161c28f1ad5a8e',
  ].join(''),
  message_hex: [
    '54686520656e756d65726174696f6e20696e2074686520436f6e737469747574696f6e2c206f66206365727461696e20',
    '7269676874732c207368616c6c206e6f7420626520636f6e73747275656420746f2064656e79206f7220646973706172',
    '616765206f74686572732072657461696e6564206279207468652070656f706c652e0a',
  ].join(''),
  signature_hex: [
    '0000000100000003000000033d46bee8660f8f215d3f96408a7a64cf1c4da02b63a55f62c666ef5707a914ce0674e8cb',
    '7a55f0c48d484f31f3aa4af9719a74f22cf823b94431d01c926e2a76bb71226d279700ec81c9e95fb11a0d10d065279a',
    '5796e265ae17737c44eb8c594508e126a9a7870bf4360820bdeb9a01d9693779e416828e75bddd7d8c70d50a0ac8ba39',
    '810909d445f44cb5bb58de737e60cb4345302786ef2c6b14af212ca19edeaa3bfcfe8baa6621ce88480df2371dd37add',
    '732c9de4ea2ce0dffa53c92649a18d39a50788f4652987f226a1d48168205df6ae7c58e049a25d4907edc1aa90da8aa5',
    'e5f7671773e941d8055360215c6b60dd35463cf2240a9c06d694e9cb54e7b1e1bf494d0d1a28c0d31acc75161f4f485d',
    'fd3cb9578e836ec2dc722f37ed30872e07f2b8bd0374eb57d22c614e09150f6c0d8774a39a6e168211035dc52988ab46',
    'eaca9ec597fb18b4936e66ef2f0df26e8d1e34da28cbb3af752313720c7b345434f72d65314328bbb030d0f0f6d5e47b',
    '28ea91008fb11b05017705a8be3b2adb83c60a54f9d1d1b2f476f9e393eb5695203d2ba6ad815e6a111ea293dcc21033',
    'f9453d49c8e5a6387f588b1ea4f706217c151e05f55a6eb7997be09d56a326a32f9cba1fbe1c07bb49fa04cecf9df1a1',
    'b815483c75d7a27cc88ad1b1238e5ea986b53e087045723ce16187eda22e33b2c70709e53251025abde8939645fc8c06',
    '93e97763928f00b2e3c75af3942d8ddaee81b59a6f1f67efda0ef81d11873b59137f67800b35e81b01563d187c4a1575',
    'a1acb92d087b517a8833383f05d357ef4678de0c57ff9f1b2da61dfde5d88318bcdde4d9061cc75c2de3cd4740dd7739',
    'ca3ef66f1930026f47d9ebaa713b07176f76f953e1c2e7f8f271a6ca375dbfb83d719b1635a7d8a13891957944b1c29b',
    'b101913e166e11bd5f34186fa6c0a555c9026b256a6860f4866bd6d0b5bf90627086c6149133f8282ce6c9b362244244',
    '3d5eca959d6c14ca8389d12c4068b503e4e3c39b635bea245d9d05a2558f249c9661c0427d2e489ca5b5dde220a90333',
    'f4862aec793223c781997da98266c12c50ea28b2c438e7a379eb106eca0c7fd6006e9bf612f3ea0a454ba3bdb76e8027',
    '992e60de01e9094fddeb3349883914fb17a9621ab929d970d101e45f8278c14b032bcab02bd15692d21b6c5c204abbf0',
    '77d465553bd6eda645e6c3065d33b10d518a61e15ed0f092c32226281a29c8a0f50cde0a8c66236e29c2f310a375cebd',
    'a1dc6bb9a1a01dae6c7aba8ebedc6371a7d52aacb955f83bd6e4f84d2949dcc198fb77c7e5cdf6040b0f84faf82808bf',
    '985577f0a2acf2ec7ed7c0b0ae8a270e951743ff23e0b2dd12e9c3c828fb5598a22461af94d568f29240ba2820c4591f',
    '71c088f96e095dd98beae456579ebbba36f6d9ca2613d1c26eee4d8c73217ac5962b5f3147b492e8831597fd89b64aa7',
    'fde82e1974d2f6779504dc21435eb3109350756b9fdabe1c6f368081bd40b27ebcb9819a75d7df8bb07bb05db1bab705',
    'a4b7e37125186339464ad8faaa4f052cc1272919fde3e025bb64aa8e0eb1fcbfcc25acb5f718ce4f7c2182fb393a1814',
    'b0e942490e52d3bca817b2b26e90d4c9b0cc38608a6cef5eb153af0858acc867c9922aed43bb67d7b33acc519313d28d',
    '41a5c6fe6cf3595dd5ee63f0a4c4065a083590b275788bee7ad875a7f88dd73720708c6c6c0ecf1f43bbaadae6f20855',
    '7fdc07bd4ed91f88ce4c0de842761c70c186bfdafafc444834bd3418be4253a71eaf41d718753ad07754ca3effd5960b',
    '0336981795721426803599ed5b2b7516920efcbe32ada4bcf6c73bd29e3fa152d9adeca36020fdeeee1b739521d3ea8c',
    '0da497003df1513897b0f54794a873670b8d93bcca2ae47e64424b7423e1f078d9554bb5232cc6de8aae9b83fa5b9510',
    'beb39ccf4b4e1d9c0f19d5e17f58e5b8705d9a6837a7d9bf99cd13387af256a8491671f1f2f22af253bcff54b673199b',
    'db7d05d81064ef05f80f0153d0be7919684b23da8d42ff3effdb7ca0985033f389181f47659138003d712b5ec0a614d3',
    '1cc7487f52de8664916af79c98456b2c94a8038083db55391e3475862250274a1de2584fec975fb09536792cfbfcf619',
    '2856cc76eb5b13dc4709e2f7301ddff26ec1b23de2d188c999166c74e1e14bbc15f457cf4e471ae13dcbdd9c50f4d646',
    'fc6278e8fe7eb6cb5c94100fa870187380b777ed19d7868fd8ca7ceb7fa7d5cc861c5bdac98e7495eb0a2ceec1924ae9',
    '79f44c5390ebedddc65d6ec11287d978b8df064219bc5679f7d7b264a76ff272b2ac9f2f7cfc9fdcfb6a51428240027a',
    'fd9d52a79b647c90c2709e060ed70f87299dd798d68f4fadd3da6c51d839f851f98f67840b964ebe73f8cec41572538e',
    'c6bc131034ca2894eb736b3bda93d9f5f6fa6f6c0f03ce43362b8414940355fb54d3dfdd03633ae108f3de3ebc85a3ff',
    '51efeea3bc2cf27e1658f1789ee612c83d0f5fd56f7cd071930e2946beeecaa04dccea9f97786001475e0294bc2852f6',
    '2eb5d39bb9fbeef75916efe44a662ecae37ede27e9d6eadfdeb8f8b2b2dbccbf96fa6dbaf7321fb0e701f4d429c2f4dc',
    'd153a2742574126e5eaccc77686acf6e3ee48f423766e0fc466810a905ff5453ec99897b56bc55dd49b991142f65043f',
    '2d744eeb935ba7f4ef23cf80cc5a8a335d3619d781e7454826df720eec82e06034c44699b5f0c44a8787752e057fa341',
    '9b5bb0e25d30981e41cb1361322dba8f69931cf42fad3f3bce6ded5b8bfc3d20a2148861b2afc14562ddd27f12897abf',
    '0685288dcc5c4982f826026846a24bf77e383c7aacab1ab692b29ed8c018a65f3dc2b87ff619a633c41b4fadb1c78725',
    'c1f8f922f6009787b1964247df0136b1bc614ab575c59a16d089917bd4a8b6f04d95c581279a139be09fcf6e98a470a0',
    'bceca191fce476f9370021cbc05518a7efd35d89d8577c990a5e19961ba16203c959c91829ba7497cffcbb4b29454645',
    '4fa5388a23a22e805a5ca35f956598848bda678615fec28afd5da61a00000006b326493313053ced3876db9d23714818',
    '1b7173bc7d042cefb4dbe94d2e58cd21a769db4657a103279ba8ef3a629ca84ee836172a9c50e51f45581741cf808315',
    '0b491cb4ecbbabec128e7c81a46e62a67b57640a0a78be1cbf7dd9d419a10cd8686d16621a80816bfdb5bdc56211d72c',
    'a70b81f1117d129529a7570cf79cf52a7028a48538ecdd3b38d3d5d62d26246595c4fb73a525a5ed2c30524ebb1d8cc8',
    '2e0c19bc4977c6898ff95fd3d310b0bae71696cef93c6a552456bf96e9d075e383bb7543c675842bafbfc7cdb88483b3',
    '276c29d4f0a341c2d406e40d4653b7e4d045851acf6a0a0ea9c710b805cced4635ee8c107362f0fc8d80c14d0ac49c51',
    '6703d26d14752f34c1c0d2c4247581c18c2cf4de48e9ce949be7c888e9caebe4a415e291fd107d21dc1f084b11582082',
    '49f28f4f7c7e931ba7b3bd0d824a45700000000500000004215f83b7ccb9acbcd08db97b0d04dc2ba1cd035833e0e900',
    '59603f26e07ad2aad152338e7a5e5984bcd5f7bb4eba40b700000004000000040eb1ed54a2460d512388cad533138d24',
    '0534e97b1e82d33bd927d201dfc24ebb11b3649023696f85150b189e50c00e98850ac343a77b3638319c347d7310269d',
    '3b7714fa406b8c35b021d54d4fdada7b9ce5d4ba5b06719e72aaf58c5aae7aca057aa0e2e74e7dcfd17a0823429db629',
    '65b7d563c57b4cec942cc865e29c1dad83cac8b4d61aacc457f336e6a10b66323f5887bf3523dfcadee158503bfaa89d',
    'c6bf59daa82afd2b5ebb2a9ca6572a6067cee7c327e9039b3b6ea6a1edc7fdc3df927aade10c1c9f2d5ff446450d2a39',
    '98d0f9f6202b5e07c3f97d2458c69d3c8190643978d7a7f4d64e97e3f1c4a08a7c5bc03fd55682c017e2907eab07e5bb',
    '2f190143475a6043d5e6d5263471f4eecf6e2575fbc6ff37edfa249d6cda1a09f797fd5a3cd53a066700f45863f04b6c',
    '8a58cfd341241e002d0d2c0217472bf18b636ae547c1771368d9f317835c9b0ef430b3df4034f6af00d0da44f4af7800',
    'bc7a5cf8a5abdb12dc718b559b74cab9090e33cc58a955300981c420c4da8ffd67df540890a062fe40dba8b2c1c548ce',
    'd22473219c534911d48ccaabfb71bc71862f4a24ebd376d288fd4e6fb06ed8705787c5fedc813cd2697e5b1aac1ced45',
    '767b14ce88409eaebb601a93559aae893e143d1c395bc326da821d79a9ed41dcfbe549147f71c092f4f3ac522b5cc572',
    '90706650487bae9bb5671ecc9ccc2ce51ead87ac01985268521222fb9057df7ed41810b5ef0d4f7cc67368c90f573b1a',
    'c2ce956c365ed38e893ce7b2fae15d3685a3df2fa3d4cc098fa57dd60d2c9754a8ade980ad0f93f6787075c3f680a2ba',
    '1936a8c61d1af52ab7e21f416be09d2a8d64c3d3d8582968c2839902229f85aee297e717c094c8df4a23bb5db658dd37',
    '7bf0f4ff3ffd8fba5e383a48574802ed545bbe7a6b4753533353d73706067640135a7ce517279cd683039747d218647c',
    '86e097b0daa2872d54b8f3e5085987629547b830d8118161b65079fe7bc59a99e9c3c7380e3e70b7138fe5d9be255150',
    '2b698d09ae193972f27d40f38dea264a0126e637d74ae4c92a6249fa103436d3eb0d4029ac712bfc7a5eacbdd7518d6d',
    '4fe903a5ae65527cd65bb0d4e9925ca24fd7214dc617c150544e423f450c99ce51ac8005d33acd74f1bed3b17b7266a4',
    'a3bb86da7eba80b101e15cb79de9a207852cf91249ef480619ff2af8cabca83125d1faa94cbb0a03a906f683b3f47a97',
    'c871fd513e510a7a25f283b196075778496152a91c2bf9da76ebe089f4654877f2d586ae7149c406e663eadeb2b5c7e8',
    '2429b9e8cb4834c83464f079995332e4b3c8f5a72bb4b8c6f74b0d45dc6c1f79952c0b7420df525e37c15377b5f09843',
    '19c3993921e5ccd97e097592064530d33de3afad5733cbe7703c5296263f77342efbf5a04755b0b3c997c4328463e84c',
    'aa2de3ffdcd297baaaacd7ae646e44b5c0f16044df38fabd296a47b3a838a913982fb2e370c078edb042c84db34ce36b',
    '46ccb76460a690cc86c302457dd1cde197ec8075e82b393d542075134e2a17ee70a5e187075d03ae3c853cff60729ba4',
    '000000054de1f6965bdabc676c5a4dc7c35f97f82cb0e31c68d04f1dad96314ff09e6b3de96aeee300d1f68bf1bca9fc',
    '58e4032336cd819aaf578744e50d1357a0e4286704d341aa0a337b19fe4bc43c2e79964d4f351089f2e0e41c7c43ae0d',
    '49e7f404b0f75be80ea3af098c9752420a8ac0ea2bbb1f4eeba05238aef0d8ce63f0c6e5e4041d95398a6f7f3e0ee97c',
    'c1591849d4ed236338b147abde9f51ef9fd4e1c1',
  ].join(''),
}

interface Rfc8554Case {
  id: string
  levels: number
  pub_key_hex: string
  message_hex: string
  signature_hex: string
}

function rfc8554Case(testCase: 1 | 2): Rfc8554Case {
  if (testCase === 2) return RFC8554_TC2
  const tc1 = lmsHssRfc8554Vectors.test_cases[0]
  if (!tc1) throw new Error('RFC 8554 Test Case 1 missing from lms_hss_rfc8554.json')
  return tc1
}

/** Exported for the structural-length assertions in katRunner.test.ts. */
export const RFC8554_TEST_CASES = { 1: () => rfc8554Case(1), 2: () => rfc8554Case(2) } as const

/**
 * LMS/HSS SigVer KAT — RFC 8554 Appendix F.
 *
 * Imports the RFC's HSS public key with C_CreateObject(CKK_HSS), verifies the
 * RFC's signature over the RFC's message with C_Verify(CKM_HSS) and expects
 * CKR_OK, then flips one bit in the last byte of the signature and expects the
 * engine to refuse it. A verifier that returned CKR_OK for everything would
 * pass the first half and fail the second, which is why both halves run.
 */
async function runLMSSigVerKAT(
  M: SoftHSMModule,
  hSession: number,
  testCase: 1 | 2
): Promise<{ status: 'pass' | 'fail'; details: string }> {
  const tc = rfc8554Case(testCase)
  const pub = hexToBytes(tc.pub_key_hex)
  const msg = hexToBytes(tc.message_hex)
  const sig = hexToBytes(tc.signature_hex)
  // KNOWN ISSUE, NOT FIXED (C++ softhsm-wasm engine, found 2026-10-02): a valid
  // C_Verify(CKM_HSS) corrupts later HMAC cases in the SAME session — HMAC
  // verify rejects the ACVP MAC and HMAC sign returns CKR_KEY_HANDLE_INVALID.
  // The Rust engine is unaffected. This KAT therefore runs in its own session
  // on the caller's slot and closes it, which isolates the corruption (checked
  // with this case registered both before and after the HMAC cases). The
  // engine bug itself is open; this only keeps it from failing other cases.
  // Root cause (session 49, read-only repro): StatefulVerifyInit/StatefulSignInit
  // set the session mechanism to 1000-1002, Session::resetOp()
  // (src/lib/session_mgr/Session.cpp) never resets it, and C_Sign/C_Verify in
  // SoftHSM_sign.cpp test that mechanism before getMacOp(), so a later HMAC op is
  // routed to StatefulSign/StatefulVerify. Affects HSS, XMSS and XMSS^MT; the fix
  // (reset it in resetOp) is a later softhsm PR.
  const slotID = hsm_getSessionInfo(M, hSession).slotID
  const hPtr = M._malloc(4)
  let hLms: number
  try {
    const rvOpen =
      M._C_OpenSession(slotID, 0x6 /* CKF_RW_SESSION | CKF_SERIAL_SESSION */, 0, 0, hPtr) >>> 0
    if (rvOpen !== 0) return { status: 'fail', details: `C_OpenSession → ${rvName(rvOpen)}` }
    hLms = M.getValue(hPtr, 'i32') >>> 0
  } finally {
    M._free(hPtr)
  }
  let rvGood: number
  let rvBad: number
  try {
    const pubHandle = hsm_importStatefulPublicKey(M, hLms, CKK_HSS, pub)
    rvGood = hsm_statefulVerifyBytes(M, hLms, CKM_HSS, pubHandle, msg, sig)
    const tampered = sig.slice()
    tampered[tampered.length - 1] ^= 0x01
    rvBad = hsm_statefulVerifyBytes(M, hLms, CKM_HSS, pubHandle, msg, tampered)
  } finally {
    M._C_CloseSession(hLms)
  }

  const what = `RFC 8554 App. F ${tc.id.replace(/ \(.*$/, '')} (HSS L=${tc.levels}, pk ${pub.length} B, sig ${sig.length} B, msg ${msg.length} B)`
  if (rvGood !== 0) {
    return {
      status: 'fail',
      details: `${what}: C_Verify(CKM_HSS) → ${rvName(rvGood)}, expected CKR_OK`,
    }
  }
  if (rvBad === 0) {
    return {
      status: 'fail',
      details: `${what}: verified, but a one-bit-flipped signature was ALSO accepted (C_Verify → CKR_OK)`,
    }
  }
  return {
    status: 'pass',
    details: `${what}: C_Verify(CKM_HSS) → CKR_OK; one-bit-flipped copy → ${rvName(rvBad)}, as expected`,
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
    case 'lms-sigver':
      return kind.testCase === 1 ? 'HSS/LMS (L=2, H5/W8)' : 'HSS/LMS (L=2, H10/W4 + H5/W8)'
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
      case 'lms-sigver':
        result = await runLMSSigVerKAT(M, hSession, spec.kind.testCase)
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
