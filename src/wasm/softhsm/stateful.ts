// SPDX-License-Identifier: GPL-3.0-only
//
// stateful.ts — the hub's ONLY implementation of stateful hash-based signature
// operations (HSS/LMS, XMSS, XMSS-MT) against either WASM engine.
//
// It used to be one of three. `softhsm.ts` carried XMSS/LMS keygen plus
// sign/verify, `softhsm/pqc.ts` carried a combined hsm_generateStatefulKeyPair,
// and this file carried a third set — same feature, three forks, and they had
// drifted to opposite conclusions about where the XMSS parameter set travels.
// Both other modules now re-export from here; see the block comment on
// hsm_generateStatefulKeyPair for what the spec actually requires.
//
// All constants and attributes follow PKCS#11 v3.2 §6.14 / §6.66.
//
// Supported operations:
//   any:     hsm_generateStatefulKeyPair (the canonical entry point)
//   HSS/LMS: hsm_generateHSSKeyPair, hsm_generateLMSKeyPair, hsm_hssSign, hsm_hssVerify
//            (single-level LMS = HSS with levels=1, CKM_HSS_KEY_PAIR_GEN)
//   XMSS:    hsm_generateXMSSKeyPair, hsm_xmssSign, hsm_xmssVerify
//   XMSSMT:  hsm_generateXMSSMTKeyPair, hsm_xmssmtSign, hsm_xmssmtVerify
//   both:    hsm_statefulSignBytes, hsm_statefulVerifyBytes
//   State:   hsm_getKeysRemaining

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_LABEL,
  CKA_PARAMETER_SET,
  CKA_PRIVATE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VERIFY,
  CKA_ENCRYPT,
  CKA_WRAP,
  CKA_DECRYPT,
  CKA_UNWRAP,
  CKA_DERIVE,
  // Standard HSS attributes (PKCS#11 v3.2 §6.14)
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
  CKP_XMSS_SHA2_10_256,
  CKP_XMSSMT_SHA2_20_2_256,
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
  type AttrDef,
} from './helpers'

/** CK_HSS_KEY_PAIR_GEN_PARAMS carries a fixed 8-entry array per PKCS#11 v3.2 §6.14. */
const HSS_MAX_LEVELS = 8

/**
 * Where the Rust engine keeps the XMSS remaining-signature counter since the
 * v3.2 conformance pass — the engine-private range (≥0xFFFF_0000) that
 * attr_mutation_allowed refuses writes to, so a client cannot rewind a
 * one-time-signature key. Reads are not restricted.
 */
const CKA_PRIV_XMSS_KEYS_REMAINING = 0xffff_0007

/** The vendor id the Rust engine used for the same counter before that move. */
const CKA_XMSS_KEYS_REMAINING_LEGACY = 0x8000_0106

// ── LMS/HSS signature size helpers ───────────────────────────────────────────

/** Map any LMS IANA type ID to tree height H.
 *  0x05–0x09: SHA-256 N32, 0x0A–0x0E: SHA-256 N24,
 *  0x0F–0x13: SHAKE N32,  0x14–0x18: SHAKE N24 */
export const lmsTypeToHeight = (lmsType: number): number => {
  const heights = [5, 10, 15, 20, 25]
  if (lmsType >= 0x05 && lmsType <= 0x09) return heights[lmsType - 0x05]
  if (lmsType >= 0x0a && lmsType <= 0x0e) return heights[lmsType - 0x0a]
  if (lmsType >= 0x0f && lmsType <= 0x13) return heights[lmsType - 0x0f]
  if (lmsType >= 0x14 && lmsType <= 0x18) return heights[lmsType - 0x14]
  return 5
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

// ── Stateful hash-based key generation (the single implementation) ────────────

/**
 * Generate a stateful hash-based signature key pair (HSS/LMS, XMSS, XMSS-MT).
 *
 * THIS IS THE ONLY STATEFUL KEYGEN IN THE HUB. `softhsm.ts` and
 * `softhsm/pqc.ts` used to carry their own forks of it; both now delegate here.
 * The forks had drifted to OPPOSITE conclusions about where the parameter set
 * travels, which is how three StatefulSignatures workshops broke while the
 * playground panels next door kept working.
 *
 * Where the parameter set travels, per PKCS#11 v3.2:
 *
 *   XMSS / XMSS-MT — §6.66.6 is explicit: "This mechanism does not have a
 *     parameter", and the mechanism generates key pairs "using an oid, as
 *     specified in the CKA_PARAMETER_SET attribute of the template for the
 *     public key". So the mechanism parameter is NULL and CKA_PARAMETER_SET
 *     goes in the template. It is written to BOTH halves with the same value:
 *     the engine stamps both anyway, and a private template naming a different
 *     oid is CKR_TEMPLATE_INCONSISTENT (§4.1.1 rule 5). Omitting it entirely is
 *     CKR_TEMPLATE_INCOMPLETE — deliberately, so that asking for
 *     XMSS-SHA2_16_256 can no longer silently hand back a 10_256 key.
 *
 *   HSS/LMS — the opposite: the hierarchy shape is a genuine mechanism
 *     parameter (CK_HSS_KEY_PAIR_GEN_PARAMS, 68 bytes), and
 *     CKA_HSS_LEVELS / CKA_HSS_LMS_TYPE(S) / CKA_HSS_LMOTS_TYPE(S) are marked
 *     "MUST NOT be specified when the object is generated" (footnotes 2/4 on
 *     the §6.14 public-key table, 1/4 on the private-key table). Putting them
 *     in a keygen template is CKR_ATTRIBUTE_READ_ONLY. They come back as
 *     mechanism-contributed OUTPUT attributes.
 *
 * The private template carries no CKA_SENSITIVE / CKA_EXTRACTABLE /
 * CKA_COPYABLE. These keys hold one-time-signature state in CKA_VALUE, so both
 * engines now mandate SENSITIVE=TRUE, EXTRACTABLE=FALSE (and COPYABLE=FALSE for
 * HSS) and write those values themselves; a template that contradicts any of
 * them is CKR_ATTRIBUTE_VALUE_INVALID. Restating the mandated value is legal
 * (§4.1.1 rule 6) but buys nothing, so this omits them — which is also why
 * there is no `extractable` argument here. An extractable HBS private key is
 * not something either engine can produce any more.
 */
export const hsm_generateStatefulKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  keyType: number,
  paramSet: number,
  lmotsParamSet: number = CKP_LMOTS_SHA256_N32_W4,
  lmsParamsAll?: number[], // per-level LMS type ids (length = levels); overrides paramSet
  lmotsParamsAll?: number[], // per-level LMOTS type ids (length = levels); overrides lmotsParamSet
  label?: string
): { pubHandle: number; privHandle: number } => {
  const isXmssFamily = mechType === CKM_XMSS_KEY_PAIR_GEN || mechType === CKM_XMSSMT_KEY_PAIR_GEN

  // ── Mechanism parameter ────────────────────────────────────────────────────
  let paramPtr = 0
  let paramLen = 0
  if (mechType === CKM_HSS_KEY_PAIR_GEN) {
    // CK_HSS_KEY_PAIR_GEN_PARAMS: ulLevels(4) + ulLmsParamSet[8](32) + ulLmotsParamSet[8](32)
    const lmsAll = lmsParamsAll ?? [paramSet]
    const lmotsAll = lmotsParamsAll ?? [lmotsParamSet]
    const levels = Math.min(lmsAll.length, HSS_MAX_LEVELS)
    // levels === 0 means "no hierarchy asked for": leave the mechanism
    // parameter NULL and let the engine pick its own single-level default.
    // The §6.14 parameter is optional, so that is a valid call, not an error —
    // it is exactly the shape hsm_generateLMSKeyPair wants.
    if (levels > 0) {
      const words = new Uint32Array(1 + HSS_MAX_LEVELS + HSS_MAX_LEVELS)
      words[0] = levels
      for (let i = 0; i < levels; i++) {
        words[1 + i] = lmsAll[i] ?? 0
        words[1 + HSS_MAX_LEVELS + i] = lmotsAll[i] ?? 0
      }
      const buf = new Uint8Array(words.buffer)
      paramPtr = writeBytes(M, buf)
      paramLen = buf.length
    }
  }
  // XMSS/XMSS-MT deliberately leave the mechanism parameter NULL (§6.66.6).

  const mech = buildMech(M, mechType, paramPtr, paramLen)

  // ── Templates ──────────────────────────────────────────────────────────────
  const pubAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: keyType },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
  ]
  const prvAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: keyType },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
  ]
  if (isXmssFamily) {
    pubAttrs.push({ type: CKA_PARAMETER_SET, ulongVal: paramSet })
    prvAttrs.push({ type: CKA_PARAMETER_SET, ulongVal: paramSet })
  }

  const labelBytes = label ? new TextEncoder().encode(label) : null
  const labelPtr = labelBytes ? writeBytes(M, labelBytes) : 0
  if (labelBytes && labelPtr) {
    pubAttrs.push({ type: CKA_LABEL, bytesPtr: labelPtr, bytesLen: labelBytes.length })
    prvAttrs.push({ type: CKA_LABEL, bytesPtr: labelPtr, bytesLen: labelBytes.length })
  }

  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)

  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair(stateful)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    if (paramPtr) M._free(paramPtr)
    if (labelPtr) M._free(labelPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/**
 * Generate an HSS key pair (PKCS#11 v3.2 §6.14). Single-level LMS is levels=1.
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
  lmotsTypes: number[],
  label?: string
): { pubHandle: number; privHandle: number } => {
  if (levels < 1 || levels > HSS_MAX_LEVELS)
    throw new Error(`HSS levels must be 1–${HSS_MAX_LEVELS}, got ${levels}`)
  if (lmsTypes.length !== levels || lmotsTypes.length !== levels)
    throw new Error('lmsTypes and lmotsTypes must each have exactly `levels` entries')
  return hsm_generateStatefulKeyPair(
    M,
    hSession,
    CKM_HSS_KEY_PAIR_GEN,
    CKK_HSS,
    lmsTypes[0],
    lmotsTypes[0],
    lmsTypes,
    lmotsTypes,
    label
  )
}

/**
 * Generate a single-level LMS key pair with the engine's own defaults.
 *
 * CKM_HSS_KEY_PAIR_GEN with a NULL mechanism parameter: both engines default to
 * a one-level hierarchy (LMS_SHA256_N32_H5 / LMOTS_SHA256_N32_W8 on C++).
 */
export const hsm_generateLMSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  label?: string
): { pubHandle: number; privHandle: number } =>
  hsm_generateStatefulKeyPair(M, hSession, CKM_HSS_KEY_PAIR_GEN, CKK_HSS, 0, 0, [], [], label)

/**
 * Generate an XMSS key pair. `paramSet` is the RFC 8391 §5.3 oid integer and
 * travels in CKA_PARAMETER_SET — it is mandatory, not defaulted, on the engine.
 */
export const hsm_generateXMSSKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet: number = CKP_XMSS_SHA2_10_256,
  label?: string
): { pubHandle: number; privHandle: number } =>
  hsm_generateStatefulKeyPair(
    M,
    hSession,
    CKM_XMSS_KEY_PAIR_GEN,
    CKK_XMSS,
    paramSet,
    undefined,
    undefined,
    undefined,
    label
  )

/** Generate an XMSS-MT key pair. Default: CKP_XMSSMT_SHA2_20_2_256 = 0x01. */
export const hsm_generateXMSSMTKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet: number = CKP_XMSSMT_SHA2_20_2_256,
  label?: string
): { pubHandle: number; privHandle: number } =>
  hsm_generateStatefulKeyPair(
    M,
    hSession,
    CKM_XMSSMT_KEY_PAIR_GEN,
    CKK_XMSSMT,
    paramSet,
    undefined,
    undefined,
    undefined,
    label
  )

// ── Stateful sign / verify (the single implementation) ───────────────────────

/**
 * Single-part sign via C_SignInit + C_Sign. HSS, XMSS and XMSS-MT all use the
 * traditional single-part path, not the message API.
 */
export const hsm_statefulSignBytes = (
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(stateful)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(stateful,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(stateful)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/**
 * Single-part verify via C_VerifyInit + C_Verify.
 * Returns the raw CKR value (0 = CKR_OK = valid signature).
 */
export const hsm_statefulVerifyBytes = (
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): number => {
  const mech = buildMech(M, mechType)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(stateful)')
    return M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/** Sign a message with an HSS private key using CKM_HSS. */
export const hsm_hssSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => hsm_statefulSignBytes(M, hSession, CKM_HSS, privHandle, message)

/** Verify an HSS signature. Returns true if valid. */
export const hsm_hssVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => hsm_statefulVerifyBytes(M, hSession, CKM_HSS, pubHandle, message, sigBytes) === 0

/** Sign a message with an XMSS private key using CKM_XMSS. */
export const hsm_xmssSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => hsm_statefulSignBytes(M, hSession, CKM_XMSS, privHandle, message)

/** Verify an XMSS signature. Returns true if valid. */
export const hsm_xmssVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => hsm_statefulVerifyBytes(M, hSession, CKM_XMSS, pubHandle, message, sigBytes) === 0

/** Sign a message with an XMSS-MT private key using CKM_XMSSMT. */
export const hsm_xmssmtSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => hsm_statefulSignBytes(M, hSession, CKM_XMSSMT, privHandle, message)

/** Verify an XMSS-MT signature. Returns true if valid. */
export const hsm_xmssmtVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => hsm_statefulVerifyBytes(M, hSession, CKM_XMSSMT, pubHandle, message, sigBytes) === 0

// ── Remaining-signature counter ──────────────────────────────────────────────

/**
 * Remaining one-time signatures on a stateful key, or null when the engine does
 * not publish a counter for that key type.
 *
 * Three attribute ids have to be tried, because the two engines expose this
 * differently and the Rust one moved its id in the v3.2 conformance pass:
 *
 *   CKA_HSS_KEYS_REMAINING (0x61c)  — the standard §6.14 attribute. C++ sets it
 *     for HSS keys only; XMSS keys on C++ carry no counter at all.
 *   CKA_PRIV_XMSS_KEYS_REMAINING (0xFFFF_0007) — where the Rust engine keeps
 *     the XMSS counter now. Writes into the engine-private range are refused
 *     (that is the point: it stops a client rewinding a one-time key), but
 *     C_GetAttributeValue has no such guard, so reads work.
 *   0x8000_0106 — the vendor id the Rust engine used before that move. Kept so
 *     a hub running an older bundle still shows a count.
 *
 * Returns null rather than throwing: a missing counter is a normal state for
 * XMSS on C++, and the callers render "unknown" for it.
 */
export const hsm_getKeysRemaining = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number
): number | null => {
  for (const attrType of [
    CKA_HSS_KEYS_REMAINING,
    CKA_PRIV_XMSS_KEYS_REMAINING,
    CKA_XMSS_KEYS_REMAINING_LEGACY,
  ]) {
    const bufPtr = M._malloc(4)
    const tpl = buildTemplate(M, [{ type: attrType, bytesPtr: bufPtr, bytesLen: 4 }])
    try {
      if (M._C_GetAttributeValue(hSession, keyHandle, tpl.ptr, 1) >>> 0 === 0)
        return M.getValue(bufPtr, 'i32') >>> 0
    } finally {
      freeTemplate(M, tpl, 1)
      M._free(bufPtr)
    }
  }
  return null
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
