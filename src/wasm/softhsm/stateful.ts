// SPDX-License-Identifier: GPL-3.0-only
//
// stateful.ts — TypeScript wrappers for stateful hash-based signature operations
// and Keccak-256 via the softhsmv3 Rust WASM engine.
//
// Supported operations:
//   LMS single-level: hsm_generateLMSKeyPair, hsm_lmsSign, hsm_lmsVerify, hsm_lmsGetLeafIndex
//   HSS multi-level:  hsm_generateHSSKeyPair, hsm_hssSign, hsm_hssVerify
//   Keccak-256:       hsm_keccak256

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_LEAF_INDEX,
  CKA_LMS_PARAM_SET,
  CKA_LMOTS_PARAM_SET,
  CKA_HSS_LMS_TYPE,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VALUE,
  CKA_VERIFY,
  CKK_HSS,
  CKK_LMS,
  CKM_HSS,
  CKM_HSS_KEY_PAIR_GEN,
  CKM_KECCAK_256,
  CKM_LMS,
  CKM_LMS_KEY_PAIR_GEN,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  CKP_LMS_SHA256_M32_H5,
  CKP_LMS_SHA256_M32_H10,
  CKP_LMS_SHA256_M32_H15,
  CKP_LMS_SHA256_M32_H20,
  CKP_LMS_SHA256_M32_H25,
  CKP_LMOTS_SHA256_N32_W1,
  CKP_LMOTS_SHA256_N32_W2,
  CKP_LMOTS_SHA256_N32_W4,
  CKP_LMOTS_SHA256_N32_W8,
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

// ── LMS signature size helper ─────────────────────────────────────────────────

/** Compute LMS H in leaves from the CKP_LMS_SHA256_M32_H* param set value. */
export const lmsParamToHeight = (lmsParam: number): number => {
  switch (lmsParam) {
    case CKP_LMS_SHA256_M32_H5:
      return 5
    case CKP_LMS_SHA256_M32_H10:
      return 10
    case CKP_LMS_SHA256_M32_H15:
      return 15
    case CKP_LMS_SHA256_M32_H20:
      return 20
    case CKP_LMS_SHA256_M32_H25:
      return 25
    default:
      return 5
  }
}

/** Compute max leaves for an LMS param set (2^H). */
export const lmsMaxLeaves = (lmsParam: number): number => 1 << lmsParamToHeight(lmsParam)

/** Get the LMOTS Winternitz factor from the CKP_LMOTS_* value. */
export const lmotsParamToW = (lmotsParam: number): number => {
  switch (lmotsParam) {
    case CKP_LMOTS_SHA256_N32_W1:
      return 1
    case CKP_LMOTS_SHA256_N32_W2:
      return 2
    case CKP_LMOTS_SHA256_N32_W4:
      return 4
    case CKP_LMOTS_SHA256_N32_W8:
      return 8
    default:
      return 4
  }
}

/** LMS signature byte length for a given param set combination. */
export const lmsSigBytes = (lmsParam: number, lmotsParam: number): number =>
  LMS_SIG_BYTES[lmsParam]?.[lmotsParam] ??
  LMS_SIG_BYTES[CKP_LMS_SHA256_M32_H5][CKP_LMOTS_SHA256_N32_W4]

/** HSS signature byte length: 4 + (levels-1)*(pub+sig) + 1*sig */
export const hssSigBytes = (levels: number, lmsParam: number, lmotsParam: number): number => {
  const sigLen = lmsSigBytes(lmsParam, lmotsParam)
  return 4 + (levels - 1) * (LMS_PUB_BYTES + sigLen) + sigLen
}

// ── LMS single-level keygen ──────────────────────────────────────────────────

/**
 * Generate a single-level LMS key pair via CKM_LMS_KEY_PAIR_GEN (vendor).
 *
 * @param lmsParam   CKP_LMS_SHA256_M32_H* (default H5 = 5)
 * @param lmotsParam CKP_LMOTS_SHA256_N32_W* (default W4 = 4)
 * @returns { pubHandle, privHandle }
 */
export const hsm_generateLMSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  lmsParam = CKP_LMS_SHA256_M32_H5,
  lmotsParam = CKP_LMOTS_SHA256_N32_W4
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_LMS_KEY_PAIR_GEN)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_LMS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_LMS_PARAM_SET, ulongVal: lmsParam },
    { type: CKA_LMOTS_PARAM_SET, ulongVal: lmotsParam },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_LMS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_LMS_PARAM_SET, ulongVal: lmsParam },
    { type: CKA_LMOTS_PARAM_SET, ulongVal: lmotsParam },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(LMS)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

// ── HSS multi-level keygen ───────────────────────────────────────────────────

/**
 * Generate an HSS multi-level key pair via CKM_HSS_KEY_PAIR_GEN (standard PKCS#11 v3.2 §6.14).
 *
 * @param levels     HSS tree depth (1–8)
 * @param lmsParams  Array of CKP_LMS_SHA256_M32_H* values, one per level
 * @param lmotsParams Array of CKP_LMOTS_SHA256_N32_W* values, one per level
 */
export const hsm_generateHSSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  levels: number,
  lmsParams: number[],
  lmotsParams: number[]
): { pubHandle: number; privHandle: number } => {
  if (levels < 1 || levels > 8) throw new Error(`HSS levels must be 1–8, got ${levels}`)
  if (lmsParams.length !== levels || lmotsParams.length !== levels)
    throw new Error('lmsParams and lmotsParams must each have exactly `levels` entries')

  // Build CK_HSS_KEY_PAIR_GEN_PARAMS: ulLevels(4) + ulLmsParamSet[8](32) + ulLmotsParamSet[8](32) = 68 bytes
  const HSS_MAX_LEVELS = 8
  const paramBytes = new Uint32Array(1 + HSS_MAX_LEVELS + HSS_MAX_LEVELS) // 17 × 4 = 68 bytes
  paramBytes[0] = levels
  for (let i = 0; i < levels; i++) paramBytes[1 + i] = lmsParams[i]
  for (let i = 0; i < levels; i++) paramBytes[1 + HSS_MAX_LEVELS + i] = lmotsParams[i]
  const paramBuf = new Uint8Array(paramBytes.buffer)
  const paramPtr = writeBytes(M, paramBuf)

  const mech = buildMech(M, CKM_HSS_KEY_PAIR_GEN, paramPtr, paramBuf.length)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_HSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_HSS_LMS_TYPE, ulongVal: levels },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_HSS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_HSS_LMS_TYPE, ulongVal: levels },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 7, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(HSS)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(paramPtr)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 7)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

// ── LMS sign ─────────────────────────────────────────────────────────────────

/**
 * Sign a message with a single-level LMS private key.
 * The key's CKA_STATEFUL_KEY_STATE and CKA_LEAF_INDEX are updated atomically by the engine.
 */
export const hsm_lmsSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_LMS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(LMS)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(LMS,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(LMS)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

// ── LMS verify ───────────────────────────────────────────────────────────────

/** Verify an LMS signature. Returns true if valid. */
export const hsm_lmsVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const mech = buildMech(M, CKM_LMS)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(LMS)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

// ── LMS leaf index read ───────────────────────────────────────────────────────

/**
 * Read the current CKA_LEAF_INDEX from an LMS/HSS private key object.
 * Returns the number of signatures already produced (0 = freshly generated).
 */
export const hsm_lmsGetLeafIndex = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number
): number => {
  // CKA_LEAF_INDEX is stored as 8-byte LE u64. Allocate 8 bytes for the buffer.
  const bufPtr = M._malloc(8)
  const tpl = buildTemplate(M, [{ type: CKA_LEAF_INDEX, bytesPtr: bufPtr, bytesLen: 8 }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, privHandle, tpl.ptr, 1),
      'C_GetAttributeValue(LEAF_INDEX)'
    )
    // Read 64-bit LE — use low 32 bits (indices > 2^32 are unreachable in practice for H≤25)
    const lo = M.getValue(bufPtr, 'i32') >>> 0
    return lo
  } finally {
    freeTemplate(M, tpl, 1)
    M._free(bufPtr)
  }
}

// ── HSS sign ─────────────────────────────────────────────────────────────────

/** Sign a message with an HSS multi-level private key. */
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

// ── HSS verify ───────────────────────────────────────────────────────────────

/** Verify an HSS multi-level signature. Returns true if valid. */
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

// ── Keccak-256 (G11 — Ethereum, Rust engine only) ────────────────────────────

/**
 * Compute Keccak-256 of data via CKM_KECCAK_256.
 * This is NOT SHA3-256 — uses original Keccak padding (Ethereum standard).
 * Only available in Rust engine mode. Throws if C++ engine returns CKR_MECHANISM_INVALID.
 */
export const hsm_keccak256 = (M: SoftHSMModule, hSession: number, data: Uint8Array): Uint8Array => {
  const mech = buildMech(M, CKM_KECCAK_256)
  const dataPtr = writeBytes(M, data)
  const digestLenPtr = allocUlong(M)
  let digestPtr = 0
  try {
    checkRV(M._C_DigestInit(hSession, mech), 'C_DigestInit(KECCAK_256)')
    // Size query
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
