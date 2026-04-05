// SPDX-License-Identifier: GPL-3.0-only
//
// stateful.ts — TypeScript wrappers for stateful hash-based signature operations
// via the softhsmv3 C++ WASM engine.
//
// All constants and attributes strictly follow PKCS#11 v3.2 §6.14 (HSS/XMSS/XMSSMT).
// No vendor extensions are used.
//
// Supported operations:
//   HSS/LMS: hsm_generateHSSKeyPair, hsm_hssSign, hsm_hssVerify
//            (single-level LMS = HSS with levels=1, CKM_HSS_KEY_PAIR_GEN)
//   XMSS:    hsm_generateXMSSKeyPair, hsm_xmssSign, hsm_xmssVerify
//   XMSSMT:  hsm_generateXMSSMTKeyPair, hsm_xmssmtSign, hsm_xmssmtVerify
//   State:   hsm_getKeysRemaining — reads CKA_HSS_KEYS_REMAINING (0x61c)

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VERIFY,
  CKA_ENCRYPT,
  CKA_WRAP,
  CKA_DECRYPT,
  CKA_UNWRAP,
  CKA_DERIVE,
  CKA_PARAMETER_SET,
  // Standard HSS attributes (PKCS#11 v3.2 §6.14)
  CKA_HSS_LEVELS,
  CKA_HSS_LMS_TYPE,
  CKA_HSS_LMOTS_TYPE,
  CKA_HSS_KEYS_REMAINING,
  // Key types
  CKK_HSS,
  CKK_XMSS,
  CKK_XMSSMT,
  // Mechanisms
  CKM_HSS_KEY_PAIR_GEN,
  CKM_HSS,
  CKM_XMSS_KEY_PAIR_GEN,
  CKM_XMSSMT_KEY_PAIR_GEN,
  CKM_XMSS,
  CKM_XMSSMT,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  // LMS/LMOTS default param values (RFC 8554)
  CKP_LMS_SHA256_M32_H5,
  CKP_LMOTS_SHA256_N32_W4,
  LMS_PUB_BYTES,
  LMS_SIG_BYTES,
} from './constants'
import {
  allocUlong,
  buildMech,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
  writeUlong,
} from './helpers'

// ── LMS/HSS signature size helpers ───────────────────────────────────────────

/** Map CKP_LMS_SHA256_M32_H* value to tree height H. */
export const lmsTypeToHeight = (lmsType: number): number => {
  // RFC 8554 §5.1 LMS type codes: H5=5, H10=6, H15=7, H20=8, H25=9
  switch (lmsType) {
    case 5:
      return 5
    case 6:
      return 10
    case 7:
      return 15
    case 8:
      return 20
    case 9:
      return 25
    default:
      return 5
  }
}

/** Max leaves for an LMS type (2^H). */
export const lmsMaxLeaves = (lmsType: number): number => 1 << lmsTypeToHeight(lmsType)

/** LMS signature byte length for a given type combination. */
export const lmsSigBytes = (lmsType: number, lmotsType: number): number =>
  LMS_SIG_BYTES[lmsTypeToHeight(lmsType)]?.[lmotsType] ??
  LMS_SIG_BYTES[CKP_LMS_SHA256_M32_H5][CKP_LMOTS_SHA256_N32_W4]

/** HSS signature byte length: 4 + (levels-1)*(pub+sig) + 1*sig */
export const hssSigBytes = (levels: number, lmsType: number, lmotsType: number): number => {
  const sigLen = lmsSigBytes(lmsType, lmotsType)
  return 4 + (levels - 1) * (LMS_PUB_BYTES + sigLen) + sigLen
}

// ── HSS / LMS key generation ──────────────────────────────────────────────────

/**
 * Generate an HSS key pair using CKM_HSS_KEY_PAIR_GEN (PKCS#11 v3.2 §6.14).
 * Single-level LMS: pass levels=1, one entry each in lmsTypes / lmotsTypes.
 *
 * Mechanism parameter: CK_HSS_KEY_PAIR_GEN_PARAMS struct (68 bytes):
 *   ulLevels (4) + ulLmsParamSet[8] (32) + ulLmotsParamSet[8] (32)
 *
 * @param levels     HSS tree depth (1–8). Use 1 for single-level LMS.
 * @param lmsTypes   CKP_LMS_SHA256_M32_H* per level (RFC 8554 type codes)
 * @param lmotsTypes CKP_LMOTS_SHA256_N32_W* per level
 */
export const hsm_generateHSSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  levels: number,
  lmsTypes: number[],
  lmotsTypes: number[]
): { pubHandle: number; privHandle: number } => {
  if (levels < 1 || levels > 8) throw new Error(`HSS levels must be 1–8, got ${levels}`)
  if (lmsTypes.length !== levels || lmotsTypes.length !== levels)
    throw new Error('lmsTypes and lmotsTypes must each have exactly `levels` entries')

  // Build CK_HSS_KEY_PAIR_GEN_PARAMS (68 bytes): ulLevels(4) + lm_type[8](32) + lm_ots_type[8](32)
  const HSS_MAX_LEVELS = 8
  const paramWords = new Uint32Array(1 + HSS_MAX_LEVELS + HSS_MAX_LEVELS)
  paramWords[0] = levels
  for (let i = 0; i < levels; i++) paramWords[1 + i] = lmsTypes[i]
  for (let i = 0; i < levels; i++) paramWords[1 + HSS_MAX_LEVELS + i] = lmotsTypes[i]
  const paramBuf = new Uint8Array(paramWords.buffer)
  const paramPtr = writeBytes(M, paramBuf)

  const mech = buildMech(M, CKM_HSS_KEY_PAIR_GEN, paramPtr, paramBuf.length)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_HSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
    { type: CKA_HSS_LEVELS, ulongVal: levels },
    { type: CKA_HSS_LMS_TYPE, ulongVal: lmsTypes[0] },
    { type: CKA_HSS_LMOTS_TYPE, ulongVal: lmotsTypes[0] },
  ])

  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_HSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
    { type: CKA_HSS_LEVELS, ulongVal: levels },
    { type: CKA_HSS_LMS_TYPE, ulongVal: lmsTypes[0] },
    { type: CKA_HSS_LMOTS_TYPE, ulongVal: lmotsTypes[0] },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 9, prvTpl.ptr, 12, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(HSS)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(paramPtr)
    freeTemplate(M, pubTpl, 9)
    freeTemplate(M, prvTpl, 12)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

// ── XMSS key generation ───────────────────────────────────────────────────────

/**
 * Generate an XMSS key pair using CKM_XMSS_KEY_PAIR_GEN (PKCS#11 v3.2 §6.14).
 * CKA_PARAMETER_SET selects the XMSS variant (RFC 8391 §5.3 OID-derived integers).
 * Default: CKP_XMSS_SHA2_10_256 = 0x01
 */
export const hsm_generateXMSSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet = 0x00000001 // CKP_XMSS_SHA2_10_256
): { pubHandle: number; privHandle: number } => {
  const paramPtr = allocUlong(M)
  writeUlong(M, paramPtr, paramSet)
  const mech = buildMech(M, CKM_XMSS_KEY_PAIR_GEN, paramPtr, 4)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_XMSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
  ])

  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_XMSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 9, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(XMSS)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(paramPtr)
    M._free(mech)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 9)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

// ── XMSS-MT key generation ────────────────────────────────────────────────────

/**
 * Generate an XMSS-MT key pair using CKM_XMSSMT_KEY_PAIR_GEN (PKCS#11 v3.2 §6.14).
 * Default: CKP_XMSSMT_SHA2_20_2_256 = 0x01
 */
export const hsm_generateXMSSMTKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet = 0x00000001 // CKP_XMSSMT_SHA2_20_2_256
): { pubHandle: number; privHandle: number } => {
  const paramPtr = allocUlong(M)
  writeUlong(M, paramPtr, paramSet)
  const mech = buildMech(M, CKM_XMSSMT_KEY_PAIR_GEN, paramPtr, 4)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_XMSSMT },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
  ])

  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_XMSSMT },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 9, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(XMSSMT)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(paramPtr)
    M._free(mech)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 9)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

// ── HSS sign ──────────────────────────────────────────────────────────────────

/** Sign a message with an HSS private key using CKM_HSS. */
export const hsm_hssSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_HSS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(HSS)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(HSS,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(HSS)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

// ── HSS verify ────────────────────────────────────────────────────────────────

/** Verify an HSS signature. Returns true if valid. */
export const hsm_hssVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const mech = buildMech(M, CKM_HSS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(HSS)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

// ── XMSS sign ─────────────────────────────────────────────────────────────────

/** Sign a message with an XMSS private key using CKM_XMSS. */
export const hsm_xmssSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_XMSS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(XMSS)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(XMSS,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(XMSS)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

// ── XMSS verify ───────────────────────────────────────────────────────────────

/** Verify an XMSS signature. Returns true if valid. */
export const hsm_xmssVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const mech = buildMech(M, CKM_XMSS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(XMSS)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

// ── XMSS-MT sign ──────────────────────────────────────────────────────────────

/** Sign a message with an XMSS-MT private key using CKM_XMSSMT. */
export const hsm_xmssmtSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_XMSSMT)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(XMSSMT)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(XMSSMT,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(XMSSMT)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

// ── XMSS-MT verify ────────────────────────────────────────────────────────────

/** Verify an XMSS-MT signature. Returns true if valid. */
export const hsm_xmssmtVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const mech = buildMech(M, CKM_XMSSMT)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(XMSSMT)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

// ── Key usage tracking ────────────────────────────────────────────────────────

/**
 * Read CKA_HSS_KEYS_REMAINING (0x61c) from a stateful private key object.
 * Returns the number of signature operations that can still be performed.
 * Standard PKCS#11 v3.2 §6.14 — decremented atomically by the token on each C_Sign.
 *
 * UI usage: currentLeaf = maxLeaves - keysRemaining
 */
export const hsm_getKeysRemaining = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number
): number => {
  const bufPtr = M._malloc(4)
  const tpl = buildTemplate(M, [{ type: CKA_HSS_KEYS_REMAINING, bytesPtr: bufPtr, bytesLen: 4 }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, privHandle, tpl.ptr, 1),
      'C_GetAttributeValue(CKA_HSS_KEYS_REMAINING)'
    )
    return M.getValue(bufPtr, 'i32') >>> 0
  } finally {
    freeTemplate(M, tpl, 1)
    M._free(bufPtr)
  }
}

// ── Keccak-256 (Rust engine only, vendor extension — no PKCS#11 v3.2 standard) ──

import { CKM_KECCAK_256 } from './constants'

/**
 * Compute Keccak-256 of data via CKM_KECCAK_256.
 * This is NOT SHA3-256 — uses the original Keccak padding (Ethereum standard).
 * Only available in Rust engine mode. Throws CKR_MECHANISM_INVALID on C++ engine.
 */
export const hsm_keccak256 = (M: SoftHSMModule, hSession: number, data: Uint8Array): Uint8Array => {
  const mech = buildMech(M, CKM_KECCAK_256)
  const dataPtr = writeBytes(M, data)
  const digestLenPtr = allocUlong(M)
  let digestPtr = 0
  try {
    checkRV(M._C_DigestInit(hSession, mech), 'C_DigestInit(KECCAK_256)')
    checkRV(
      M._C_Digest(hSession, dataPtr, data.length, 0, digestLenPtr),
      'C_Digest(KECCAK_256,len)'
    )
    const digestLen = readUlong(M, digestLenPtr)
    digestPtr = M._malloc(digestLen)
    writeUlong(M, digestLenPtr, digestLen)
    checkRV(
      M._C_Digest(hSession, dataPtr, data.length, digestPtr, digestLenPtr),
      'C_Digest(KECCAK_256)'
    )
    return M.HEAPU8.slice(digestPtr, digestPtr + 32)
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(digestLenPtr)
    if (digestPtr) M._free(digestPtr)
  }
}
