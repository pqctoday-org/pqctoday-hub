/**
 * pqcCryptoBridge.ts — Issue #9
 *
 * Cross-module bridge that routes PQC crypto operations from the pqctpm WASM
 * module to the softhsmv3 Rust WASM module. This replaces the 0xCC/0xDD/0xEE
 * placeholder stubs with real ML-KEM-768 and ML-DSA-65 cryptographic operations.
 *
 * Architecture:
 *   pqctpm.wasm (C) ──EM_JS──> Module._pqcBridge (JS) ──> softhsmv3.wasm (Rust)
 *
 * The C code in CryptMlKem.c / CryptMlDsa.c calls EM_JS functions that check
 * for Module._pqcBridge on the pqctpm Module object. This module registers
 * those bridge functions after both WASM modules are initialized.
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import type { PqcTpmModule } from './tpmBridge'
import { getSoftHSMRustModule } from './softhsm'

// ── PKCS#11 constants (inline to avoid circular imports) ──────────────────────
const CKF_RW_SESSION = 0x0002
const CKF_SERIAL_SESSION = 0x0004
const CKU_USER = 1
const CKO_PUBLIC_KEY = 0x02
const CKO_PRIVATE_KEY = 0x03
const CKA_CLASS = 0x00000000
const CKA_KEY_TYPE = 0x00000100
const CKA_TOKEN = 0x00000001
const CKA_PRIVATE = 0x00000002
const CKA_SIGN = 0x00000108
const CKA_VERIFY = 0x0000010a
const CKA_ENCAPSULATE = 0x00000633
const CKA_DECAPSULATE = 0x00000634
const CKA_PARAMETER_SET = 0x0000061d
const CKA_VALUE = 0x00000011
const CKK_ML_KEM = 0x49
const CKK_ML_DSA = 0x4a
const CKM_ML_KEM_KEY_PAIR_GEN = 0x0000000f
const CKM_ML_KEM = 0x00000017
const CKM_ML_DSA_KEY_PAIR_GEN = 0x0000001c
const CKM_ML_DSA = 0x0000001d
// PKCS#11 v3.2 paramset enumerations. The bridge accepts the TPM-style
// paramSet (1/2/3) and maps directly — TCG V1.85 §11.9 + PKCS#11 v3.2
// happen to use the same numeric values for the three NIST levels.
const CKP_ML_KEM_512 = 0x1
const CKP_ML_KEM_768 = 0x2
const CKP_ML_KEM_1024 = 0x3
const CKP_ML_DSA_44 = 0x1
const CKP_ML_DSA_65 = 0x2
const CKP_ML_DSA_87 = 0x3
const CK_ATTRIBUTE_SIZE = 12
const CK_MECHANISM_SIZE = 12

function mlkemParamName(p: number): string {
  if (p === 1) return 'ML-KEM-512'
  if (p === 2) return 'ML-KEM-768'
  if (p === 3) return 'ML-KEM-1024'
  return `ML-KEM-?(${p})`
}
function mldsaParamName(p: number): string {
  if (p === 1) return 'ML-DSA-44'
  if (p === 2) return 'ML-DSA-65'
  if (p === 3) return 'ML-DSA-87'
  return `ML-DSA-?(${p})`
}
function mlkemCkp(p: number): number | null {
  if (p === 1) return CKP_ML_KEM_512
  if (p === 2) return CKP_ML_KEM_768
  if (p === 3) return CKP_ML_KEM_1024
  return null
}
function mldsaCkp(p: number): number | null {
  if (p === 1) return CKP_ML_DSA_44
  if (p === 2) return CKP_ML_DSA_65
  if (p === 3) return CKP_ML_DSA_87
  return null
}

// ── State ─────────────────────────────────────────────────────────────────────
let hsmModule: SoftHSMModule | null = null
let hsmSession: number = 0
let hsmInitialized = false

// Per-paramSet fallback cache. Used ONLY when libtpms does not carry the
// per-object handle in its sensitive buffer (e.g. legacy KEM flows that
// don't round-trip a sensitive). For ML-DSA keys provisioned via the bridge
// the per-object handle stored in libtpms's sensitive buffer (first 4 bytes,
// little-endian) is authoritative — see PQC_BRIDGE_SK_MAGIC below. That
// per-object encoding survives compliance-suite collisions where two AKs
// share paramSet=2 but live at different persistent handles.
const mlkemPubHandleByParam: Map<number, number> = new Map()
const mlkemPrivHandleByParam: Map<number, number> = new Map()
const mldsaPrivHandleByParam: Map<number, number> = new Map()
const mldsaPubHandleByParam: Map<number, number> = new Map()
// Map of every softhsm ML-DSA private handle ever produced by the bridge.
// Used by mldsaSign to validate the handle libtpms reads back from its
// sensitive buffer is one we actually issued. Filters out the unlikely
// case of random sensitive bytes (placeholder fallback) coincidentally
// matching a stale handle.
const mldsaIssuedPrivHandles: Set<number> = new Set()
const mldsaLastPubBytesByParam: Map<number, Uint8Array> = new Map()
// Tag the first 4 bytes of the sensitive buffer with a magic prefix so
// mldsaSign can tell "the bridge wrote this" from "libtpms wrote random
// seed bytes here". 0x42504751 = "BPGQ" (Bridge PQC Q-sign).
const PQC_BRIDGE_SK_MAGIC = 0x42504751

export function getBridgeMlDsaPubBytes(paramSet: number): Uint8Array | null {
  return mldsaLastPubBytesByParam.get(paramSet) ?? null
}

// Cache the ML-KEM public bytes per paramSet so the hybrid Labeled-KEM Encap
// can run without a TPM2_CreatePrimary round-trip if the caller already has
// a softhsm key from a previous keygen via the bridge.
const mlkemLastPubBytesByParam: Map<number, Uint8Array> = new Map()

export function getBridgeMlKemPubBytes(paramSet: number): Uint8Array | null {
  return mlkemLastPubBytesByParam.get(paramSet) ?? null
}

// ── HSM memory helpers ────────────────────────────────────────────────────────
function hsmAlloc(size: number): number {
  return hsmModule!._malloc(size)
}
function hsmFree(ptr: number): void {
  hsmModule!._free(ptr)
}
function hsmSetValue(ptr: number, val: number): void {
  hsmModule!.setValue(ptr, val, 'i32')
}
function hsmGetValue(ptr: number): number {
  return hsmModule!.getValue(ptr, 'i32') >>> 0
}

function buildAttr(
  type: number,
  value: { bool?: boolean; ulong?: number; bytes?: Uint8Array }
): { type: number; valPtr: number; valLen: number } {
  if (value.bool !== undefined) {
    const ptr = hsmAlloc(1)
    hsmModule!.HEAPU8[ptr] = value.bool ? 1 : 0
    return { type, valPtr: ptr, valLen: 1 }
  }
  if (value.ulong !== undefined) {
    const ptr = hsmAlloc(4)
    hsmSetValue(ptr, value.ulong)
    return { type, valPtr: ptr, valLen: 4 }
  }
  if (value.bytes !== undefined) {
    const ptr = hsmAlloc(value.bytes.length)
    hsmModule!.HEAPU8.set(value.bytes, ptr)
    return { type, valPtr: ptr, valLen: value.bytes.length }
  }
  return { type, valPtr: 0, valLen: 0 }
}

function writeTemplate(attrs: { type: number; valPtr: number; valLen: number }[]): number {
  const ptr = hsmAlloc(attrs.length * CK_ATTRIBUTE_SIZE)
  for (let i = 0; i < attrs.length; i++) {
    const base = ptr + i * CK_ATTRIBUTE_SIZE
    hsmSetValue(base, attrs[i].type)
    hsmSetValue(base + 4, attrs[i].valPtr)
    hsmSetValue(base + 8, attrs[i].valLen)
  }
  return ptr
}

function freeAttrs(attrs: { type: number; valPtr: number; valLen: number }[]): void {
  for (const a of attrs) {
    if (a.valPtr) hsmFree(a.valPtr)
  }
}

function writeMechanism(mechType: number, paramPtr = 0, paramLen = 0): number {
  const ptr = hsmAlloc(CK_MECHANISM_SIZE)
  hsmSetValue(ptr, mechType)
  hsmSetValue(ptr + 4, paramPtr)
  hsmSetValue(ptr + 8, paramLen)
  return ptr
}

// ── HSM initialization ───────────────────────────────────────────────────────
async function ensureHSM(): Promise<void> {
  if (hsmInitialized) return

  hsmModule = await getSoftHSMRustModule()
  const M = hsmModule

  // Initialize
  let rv = M._C_Initialize(0)
  if (rv >>> 0 !== 0 && rv >>> 0 !== 0x191 /* CKR_CRYPTOKI_ALREADY_INITIALIZED */) {
    throw new Error(`C_Initialize failed: 0x${(rv >>> 0).toString(16)}`)
  }

  // Get first slot
  const countPtr = hsmAlloc(4)
  hsmSetValue(countPtr, 0)
  rv = M._C_GetSlotList(0, 0, countPtr)
  const slotCount = hsmGetValue(countPtr)
  if (slotCount === 0) {
    hsmFree(countPtr)
    throw new Error('No HSM slots available')
  }
  const slotListPtr = hsmAlloc(slotCount * 4)
  hsmSetValue(countPtr, slotCount)
  rv = M._C_GetSlotList(0, slotListPtr, countPtr)
  const slotId = hsmGetValue(slotListPtr)
  hsmFree(slotListPtr)
  hsmFree(countPtr)

  // Init token (if not already)
  const pinStr = '1234'
  const pinBytes = new TextEncoder().encode(pinStr)
  const pinPtr = hsmAlloc(pinBytes.length)
  M.HEAPU8.set(pinBytes, pinPtr)
  const labelBytes = new Uint8Array(32)
  labelBytes.set(new TextEncoder().encode('TPM-PQC-Bridge'))
  const labelPtr = hsmAlloc(32)
  M.HEAPU8.set(labelBytes, labelPtr)

  rv = M._C_InitToken(slotId, pinPtr, pinBytes.length, labelPtr)
  // Ignore CKR_TOKEN_WRITE_PROTECTED or similar — might be already initialized

  // Open session
  const sessionPtr = hsmAlloc(4)
  rv = M._C_OpenSession(slotId, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessionPtr)
  if (rv >>> 0 !== 0) {
    hsmFree(pinPtr)
    hsmFree(labelPtr)
    hsmFree(sessionPtr)
    throw new Error(`C_OpenSession failed: 0x${(rv >>> 0).toString(16)}`)
  }
  hsmSession = hsmGetValue(sessionPtr)
  hsmFree(sessionPtr)

  // Login
  rv = M._C_Login(hsmSession, CKU_USER, pinPtr, pinBytes.length)
  // Ignore CKR_USER_ALREADY_LOGGED_IN

  // Init PIN (for freshly initialized tokens)
  rv = M._C_InitPIN(hsmSession, pinPtr, pinBytes.length)

  hsmFree(pinPtr)
  hsmFree(labelPtr)
  hsmInitialized = true

  console.log('[PQC Bridge] SoftHSMv3 initialized for TPM crypto delegation')
}

// ── ML-KEM keygen via PKCS#11 ─────────────────────────────────────────────────
function mlkemKeygen(
  paramSet: number,
  _seedPtr: number,
  _seedLen: number,
  pkOutPtr: number,
  pkOutMax: number,
  _skOutPtr: number,
  _skOutMax: number
): number {
  if (!hsmModule) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1
  const ckp = mlkemCkp(paramSet)
  if (ckp === null) {
    console.warn(`[PQC Bridge] mlkemKeygen: unsupported paramSet ${paramSet}`)
    return -1
  }

  try {
    // Build key pair generation templates
    const pubAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PUBLIC_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_KEM }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_ENCAPSULATE, { bool: true }),
      buildAttr(CKA_PARAMETER_SET, { ulong: ckp }),
    ]
    const privAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_KEM }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_PRIVATE, { bool: true }),
      buildAttr(CKA_DECAPSULATE, { bool: true }),
    ]

    const pubTplPtr = writeTemplate(pubAttrs)
    const privTplPtr = writeTemplate(privAttrs)
    const mechPtr = writeMechanism(CKM_ML_KEM_KEY_PAIR_GEN)
    const phPub = hsmAlloc(4)
    const phPriv = hsmAlloc(4)

    const rv = M._C_GenerateKeyPair(
      hsmSession,
      mechPtr,
      pubTplPtr,
      pubAttrs.length,
      privTplPtr,
      privAttrs.length,
      phPub,
      phPriv
    )

    const pubH = hsmGetValue(phPub)
    const privH = hsmGetValue(phPriv)

    // Cleanup template memory
    hsmFree(pubTplPtr)
    hsmFree(privTplPtr)
    hsmFree(mechPtr)
    hsmFree(phPub)
    hsmFree(phPriv)
    freeAttrs(pubAttrs)
    freeAttrs(privAttrs)

    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_GenerateKeyPair(ML-KEM) failed: 0x${(rv >>> 0).toString(16)}`)
      return -2
    }

    // Cache handles by paramSet so subsequent encap/decap pick the right key.
    mlkemPubHandleByParam.set(paramSet, pubH)
    mlkemPrivHandleByParam.set(paramSet, privH)

    // Extract public key via C_GetAttributeValue
    const pkBytes = extractAttribute(M, pubH, CKA_VALUE, pkOutMax)
    if (!pkBytes || pkBytes.length === 0) return -2

    tpm.HEAPU8.set(pkBytes, pkOutPtr)
    mlkemLastPubBytesByParam.set(paramSet, new Uint8Array(pkBytes))
    console.log(`[PQC Bridge] ${mlkemParamName(paramSet)} keygen OK: pk=${pkBytes.length}B`)
    return pkBytes.length
  } catch (e) {
    console.error('[PQC Bridge] mlkemKeygen error:', e)
    return -2
  }
}

// ── ML-KEM encapsulate via PKCS#11 ────────────────────────────────────────────
function mlkemEncap(
  paramSet: number,
  pkPtr: number,
  pkLen: number,
  ctOutPtr: number,
  ctOutMax: number,
  ssOutPtr: number,
  ssOutMax: number
): number {
  if (!hsmModule) return -1
  if (mlkemCkp(paramSet) === null) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1

  try {
    let pubH = mlkemPubHandleByParam.get(paramSet) ?? 0
    if (!pubH) {
      // Import the public key from TPM memory
      const pkData = new Uint8Array(tpm.HEAPU8.buffer, pkPtr, pkLen).slice()
      pubH = importMlKemPublicKey(M, pkData)
      if (!pubH) return -2
    }

    // Build mechanism
    const mechPtr = writeMechanism(CKM_ML_KEM)

    // Derive key template (shared secret as a generic secret)
    const deriveTplAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: 0x10 /* CKK_GENERIC_SECRET */ }),
      buildAttr(CKA_TOKEN, { bool: false }),
    ]
    const deriveTplPtr = writeTemplate(deriveTplAttrs)

    // Allocate output buffers in HSM memory
    const ctLenPtr = hsmAlloc(4)
    hsmSetValue(ctLenPtr, ctOutMax)
    const ctBufPtr = hsmAlloc(ctOutMax)
    const phKey = hsmAlloc(4)

    const rv = M._C_EncapsulateKey(
      hsmSession,
      mechPtr,
      pubH,
      deriveTplPtr,
      deriveTplAttrs.length,
      ctBufPtr,
      ctLenPtr,
      phKey
    )

    // Cleanup
    hsmFree(mechPtr)
    hsmFree(deriveTplPtr)
    freeAttrs(deriveTplAttrs)

    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_EncapsulateKey failed: 0x${(rv >>> 0).toString(16)}`)
      hsmFree(ctLenPtr)
      hsmFree(ctBufPtr)
      hsmFree(phKey)
      return -2
    }

    // Read ciphertext
    const actualCtLen = hsmGetValue(ctLenPtr)
    const ctData = new Uint8Array(M.HEAPU8.buffer, ctBufPtr, actualCtLen).slice()
    tpm.HEAPU8.set(ctData, ctOutPtr)

    // Extract shared secret from the derived key
    const derivedKeyH = hsmGetValue(phKey)
    const ssBytes = extractAttribute(M, derivedKeyH, CKA_VALUE, ssOutMax)
    if (ssBytes && ssBytes.length > 0) {
      tpm.HEAPU8.set(ssBytes.slice(0, Math.min(ssBytes.length, ssOutMax)), ssOutPtr)
    }

    hsmFree(ctLenPtr)
    hsmFree(ctBufPtr)
    hsmFree(phKey)

    console.log(
      `[PQC Bridge] ${mlkemParamName(paramSet)} encap OK: ct=${actualCtLen}B ss=${ssBytes?.length ?? 0}B`
    )
    return 0
  } catch (e) {
    console.error('[PQC Bridge] mlkemEncap error:', e)
    return -2
  }
}

// ── ML-KEM decapsulate via PKCS#11 ────────────────────────────────────────────
function mlkemDecap(
  paramSet: number,
  _skPtr: number,
  _skLen: number,
  ctPtr: number,
  ctLen: number,
  ssOutPtr: number,
  ssOutMax: number
): number {
  if (!hsmModule) return -1
  const privH = mlkemPrivHandleByParam.get(paramSet) ?? 0
  if (!privH) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1

  try {
    const mechPtr = writeMechanism(CKM_ML_KEM)

    const deriveTplAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: 0x10 /* CKK_GENERIC_SECRET */ }),
      buildAttr(CKA_TOKEN, { bool: false }),
    ]
    const deriveTplPtr = writeTemplate(deriveTplAttrs)

    // Copy ciphertext from TPM memory to HSM memory
    const ctData = new Uint8Array(tpm.HEAPU8.buffer, ctPtr, ctLen).slice()
    const ctHsmPtr = hsmAlloc(ctData.length)
    M.HEAPU8.set(ctData, ctHsmPtr)

    const phKey = hsmAlloc(4)

    const rv = M._C_DecapsulateKey(
      hsmSession,
      mechPtr,
      privH,
      deriveTplPtr,
      deriveTplAttrs.length,
      ctHsmPtr,
      ctData.length,
      phKey
    )

    hsmFree(mechPtr)
    hsmFree(deriveTplPtr)
    hsmFree(ctHsmPtr)
    freeAttrs(deriveTplAttrs)

    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_DecapsulateKey failed: 0x${(rv >>> 0).toString(16)}`)
      hsmFree(phKey)
      return -2
    }

    const derivedKeyH = hsmGetValue(phKey)
    const ssBytes = extractAttribute(M, derivedKeyH, CKA_VALUE, ssOutMax)
    if (ssBytes && ssBytes.length > 0) {
      tpm.HEAPU8.set(ssBytes.slice(0, Math.min(ssBytes.length, ssOutMax)), ssOutPtr)
    }

    hsmFree(phKey)
    console.log(`[PQC Bridge] ${mlkemParamName(paramSet)} decap OK: ss=${ssBytes?.length ?? 0}B`)
    return 0
  } catch (e) {
    console.error('[PQC Bridge] mlkemDecap error:', e)
    return -2
  }
}

// ── ML-DSA keygen via PKCS#11 ─────────────────────────────────────────────────
function mldsaKeygen(
  paramSet: number,
  _seedPtr: number,
  _seedLen: number,
  pkOutPtr: number,
  pkOutMax: number,
  skOutPtr: number,
  skOutMax: number
): number {
  if (!hsmModule) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1
  const ckp = mldsaCkp(paramSet)
  if (ckp === null) {
    console.warn(`[PQC Bridge] mldsaKeygen: unsupported paramSet ${paramSet}`)
    return -1
  }

  try {
    const pubAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PUBLIC_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_DSA }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_VERIFY, { bool: true }),
      buildAttr(CKA_PARAMETER_SET, { ulong: ckp }),
    ]
    const privAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_DSA }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_PRIVATE, { bool: true }),
      buildAttr(CKA_SIGN, { bool: true }),
    ]

    const pubTplPtr = writeTemplate(pubAttrs)
    const privTplPtr = writeTemplate(privAttrs)
    const mechPtr = writeMechanism(CKM_ML_DSA_KEY_PAIR_GEN)
    const phPub = hsmAlloc(4)
    const phPriv = hsmAlloc(4)

    const rv = M._C_GenerateKeyPair(
      hsmSession,
      mechPtr,
      pubTplPtr,
      pubAttrs.length,
      privTplPtr,
      privAttrs.length,
      phPub,
      phPriv
    )

    const pubH = hsmGetValue(phPub)
    const privH = hsmGetValue(phPriv)

    hsmFree(pubTplPtr)
    hsmFree(privTplPtr)
    hsmFree(mechPtr)
    hsmFree(phPub)
    hsmFree(phPriv)
    freeAttrs(pubAttrs)
    freeAttrs(privAttrs)

    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_GenerateKeyPair(ML-DSA) failed: 0x${(rv >>> 0).toString(16)}`)
      return -2
    }

    mldsaPrivHandleByParam.set(paramSet, privH)
    mldsaPubHandleByParam.set(paramSet, pubH)
    mldsaIssuedPrivHandles.add(privH)

    const pkBytes = extractAttribute(M, pubH, CKA_VALUE, pkOutMax)
    if (!pkBytes || pkBytes.length === 0) return -2

    tpm.HEAPU8.set(pkBytes, pkOutPtr)
    mldsaLastPubBytesByParam.set(paramSet, new Uint8Array(pkBytes))

    // Encode [privH(4 LE) | MAGIC(4 LE) | random padding] into libtpms's
    // sensitive buffer. mldsaSign reads privH out by the magic tag — this
    // makes the per-TPM-key softhsm pointer survive cache collisions where
    // a later mldsaKeygen on the same paramSet would otherwise overwrite
    // a Map keyed on paramSet. See PQC_BRIDGE_SK_MAGIC above.
    if (skOutPtr && skOutMax >= 8) {
      const skBytes = new Uint8Array(Math.min(skOutMax, 32))
      const dv = new DataView(skBytes.buffer)
      dv.setUint32(0, privH >>> 0, true)
      dv.setUint32(4, PQC_BRIDGE_SK_MAGIC, true)
      if (skBytes.length > 8) {
        crypto.getRandomValues(skBytes.subarray(8))
      }
      tpm.HEAPU8.set(skBytes, skOutPtr)
    }

    console.log(
      `[PQC Bridge] ${mldsaParamName(paramSet)} keygen OK: pk=${pkBytes.length}B privH=${privH} pubH=${pubH} (handle pinned in sensitive)`
    )
    return pkBytes.length
  } catch (e) {
    console.error('[PQC Bridge] mldsaKeygen error:', e)
    return -2
  }
}

// ── ML-DSA sign via PKCS#11 ───────────────────────────────────────────────────
function mldsaSign(
  paramSet: number,
  skPtr: number,
  skLen: number,
  digestPtr: number,
  digestLen: number,
  sigOutPtr: number,
  sigOutMax: number
): number {
  if (!hsmModule) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1

  // Per-key handle lookup: libtpms's sensitive buffer carries the softhsm
  // handle the bridge stamped in at keygen time (first 4 LE bytes, with
  // MAGIC at offset 4). Falls back to the legacy paramSet-keyed cache if
  // the sensitive doesn't carry our tag — preserves backward compat for
  // flows that don't round-trip the sensitive (placeholder / KEM-only).
  let privH = 0
  if (skPtr && skLen >= 8) {
    const dv = new DataView(tpm.HEAPU8.buffer, skPtr, 8)
    const candidate = dv.getUint32(0, true)
    const magic = dv.getUint32(4, true)
    if (magic === PQC_BRIDGE_SK_MAGIC && mldsaIssuedPrivHandles.has(candidate)) {
      privH = candidate
    }
  }
  if (!privH) {
    privH = mldsaPrivHandleByParam.get(paramSet) ?? 0
    if (privH) {
      console.warn(
        `[PQC Bridge] mldsaSign: no per-key handle tag in sensitive, falling back to last paramSet=${paramSet} handle ${privH}`
      )
    }
  }
  if (!privH) return -1

  try {
    // C_SignInit
    const mechPtr = writeMechanism(CKM_ML_DSA)
    let rv = M._C_SignInit(hsmSession, mechPtr, privH)
    hsmFree(mechPtr)
    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_SignInit(ML-DSA) failed: 0x${(rv >>> 0).toString(16)}`)
      return -2
    }

    // Copy digest from TPM memory to HSM memory
    const digestData = new Uint8Array(tpm.HEAPU8.buffer, digestPtr, digestLen).slice()
    const digestHsmPtr = hsmAlloc(digestData.length)
    M.HEAPU8.set(digestData, digestHsmPtr)

    // C_Sign (size query)
    const sigLenPtr = hsmAlloc(4)
    hsmSetValue(sigLenPtr, sigOutMax)

    const sigBufPtr = hsmAlloc(sigOutMax)

    rv = M._C_Sign(hsmSession, digestHsmPtr, digestData.length, sigBufPtr, sigLenPtr)

    const actualSigLen = hsmGetValue(sigLenPtr)
    const sigData = new Uint8Array(M.HEAPU8.buffer, sigBufPtr, actualSigLen).slice()

    hsmFree(digestHsmPtr)
    hsmFree(sigLenPtr)
    hsmFree(sigBufPtr)

    if (rv >>> 0 !== 0) {
      console.error(`[PQC Bridge] C_Sign(ML-DSA) failed: 0x${(rv >>> 0).toString(16)}`)
      return -2
    }

    // Write signature into TPM WASM memory
    tpm.HEAPU8.set(sigData, sigOutPtr)
    console.log(`[PQC Bridge] ${mldsaParamName(paramSet)} sign OK: sig=${actualSigLen}B`)
    return actualSigLen
  } catch (e) {
    console.error('[PQC Bridge] mldsaSign error:', e)
    return -2
  }
}

// ── Utility: extract CKA_VALUE from an HSM object ─────────────────────────────
function extractAttribute(
  M: SoftHSMModule,
  handle: number,
  attrType: number,
  maxLen: number
): Uint8Array | null {
  // First pass: query size
  const tplPtr = hsmAlloc(CK_ATTRIBUTE_SIZE)
  hsmSetValue(tplPtr, attrType)
  hsmSetValue(tplPtr + 4, 0) // pValue = NULL
  hsmSetValue(tplPtr + 8, 0) // ulValueLen = 0

  let rv = M._C_GetAttributeValue(hsmSession, handle, tplPtr, 1)
  const len = hsmGetValue(tplPtr + 8)

  if (len === 0 || len > maxLen) {
    hsmFree(tplPtr)
    return null
  }

  // Second pass: read value
  const valPtr = hsmAlloc(len)
  hsmSetValue(tplPtr + 4, valPtr)
  hsmSetValue(tplPtr + 8, len)
  rv = M._C_GetAttributeValue(hsmSession, handle, tplPtr, 1)

  const result = rv >>> 0 === 0 ? new Uint8Array(M.HEAPU8.buffer, valPtr, len).slice() : null

  hsmFree(valPtr)
  hsmFree(tplPtr)
  return result
}

// ── Utility: import an ML-KEM public key into the HSM ─────────────────────────
function importMlKemPublicKey(M: SoftHSMModule, pkData: Uint8Array): number {
  const pkPtr = hsmAlloc(pkData.length)
  M.HEAPU8.set(pkData, pkPtr)

  const attrs = [
    buildAttr(CKA_CLASS, { ulong: CKO_PUBLIC_KEY }),
    buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_KEM }),
    buildAttr(CKA_TOKEN, { bool: false }),
    buildAttr(CKA_ENCAPSULATE, { bool: true }),
    buildAttr(CKA_PARAMETER_SET, { ulong: CKP_ML_KEM_768 }),
    buildAttr(CKA_VALUE, { bytes: pkData }),
  ]
  const tplPtr = writeTemplate(attrs)
  const phObj = hsmAlloc(4)

  const rv = M._C_CreateObject(hsmSession, tplPtr, attrs.length, phObj)
  const handle = hsmGetValue(phObj)

  hsmFree(tplPtr)
  hsmFree(phObj)
  hsmFree(pkPtr)
  freeAttrs(attrs)

  if (rv >>> 0 !== 0) return 0
  return handle
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register PQC bridge callbacks on the pqctpm WASM Module object.
 * Call this after tpm_wasm_startup() succeeds and before any TPM2_CreatePrimary.
 *
 * The C code's EM_JS dispatchers check `Module._pqcBridge.*` and call through
 * to the softhsmv3 Rust WASM module for real ML-KEM/ML-DSA operations.
 */
export async function registerPqcBridge(tpmModule: PqcTpmModule): Promise<void> {
  // Store TPM module globally so bridge callbacks can access it
  ;(globalThis as any).__pqcTpmModule = tpmModule

  // Initialize the HSM
  await ensureHSM()

  // Register callbacks on the TPM Module object — these are what the EM_JS
  // dispatchers in wasm_platform.c look for.
  const mod = tpmModule as any
  mod._pqcBridge = {
    mlkemKeygen,
    mlkemEncap,
    mlkemDecap,
    mldsaKeygen,
    mldsaSign,
  }

  console.log('[PQC Bridge] Registered on pqctpm Module — real ML-KEM/ML-DSA active')
}

// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Labeled-KEM (educational construct atop TCG v1.85 §11 Labeled KEM)
// ─────────────────────────────────────────────────────────────────────────────
//
// TCG v1.85 §11 introduces "Labeled KEM" as a generic abstraction for wrapping
// KEM algorithms with a domain-separation label. The spec does NOT define a
// hybrid (classical + PQ) mode — that is an educational construct we build by
// composing two real KEMs at the JS layer:
//
//   ss1 = ML-KEM.Encap(mlkem_pk)        // real ML-KEM via softhsmv3 PKCS#11
//   ss2 = ECDH(classical_pk, classical_sk_eph)  // real X25519 or P-256 via Web Crypto
//   ss  = HKDF-SHA256(salt = "TCG-LabeledKEM-Hybrid-v0",
//                     ikm  = ss1 || ss2,
//                     info = "ml-kem || classical",
//                     L    = 32)
//
// Every primitive here is real — no placeholders, no hand-rolled lattice math.
// This is marked `experimental` in the protocol matrix and the UI surfaces a
// banner reminding the user the construct is educational only.

export type HybridLabeledKemClassicalAlg = 'X25519' | 'P-256'

export interface HybridLabeledKemEncapResult {
  mlkemCt: Uint8Array
  mlkemSs: Uint8Array
  classicalCt: Uint8Array // raw ephemeral public key
  classicalSs: Uint8Array
  combinedSs: Uint8Array
  classicalAlg: HybridLabeledKemClassicalAlg
  mlkemParamSet: number
}

export interface HybridLabeledKemDecapResult {
  mlkemSs: Uint8Array
  classicalSs: Uint8Array
  combinedSs: Uint8Array
}

// HKDF combiner labels — fixed strings for reproducibility / unit testability.
const HYBRID_KEM_HKDF_SALT = new TextEncoder().encode('TCG-LabeledKEM-Hybrid-v0')
const HYBRID_KEM_HKDF_INFO = new TextEncoder().encode('ml-kem || classical')

/**
 * Real HKDF-SHA256 combiner via Web Crypto API (RFC 5869).
 * Returns a 32-byte combined shared secret.
 */
async function hkdfCombine(ss1: Uint8Array, ss2: Uint8Array): Promise<Uint8Array> {
  const ikm = new Uint8Array(ss1.length + ss2.length)
  ikm.set(ss1, 0)
  ikm.set(ss2, ss1.length)

  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikm as BufferSource,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  )
  const okm = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: HYBRID_KEM_HKDF_SALT as BufferSource,
      info: HYBRID_KEM_HKDF_INFO as BufferSource,
    },
    ikmKey,
    256 // 32 bytes
  )
  return new Uint8Array(okm)
}

/**
 * Run real ML-KEM encap against the softhsm public key cached at the given
 * paramSet, returning { ct, ss } as plain Uint8Arrays (no TPM heap involved).
 * The public key MUST have been produced via the bridge already (mlkemKeygen
 * caches the handle by paramSet).
 */
async function softhsmMlKemEncap(paramSet: number): Promise<{ ct: Uint8Array; ss: Uint8Array }> {
  await ensureHSM()
  if (!hsmModule) throw new Error('softhsmv3 not initialized')
  const M = hsmModule

  const pubH = mlkemPubHandleByParam.get(paramSet)
  if (!pubH) {
    throw new Error(
      `Hybrid Labeled-KEM Encap: no ML-KEM public key cached for paramSet=${paramSet}. ` +
        'Run TPM2_CreatePrimary with the matching ML-KEM algorithm first.'
    )
  }

  const mechPtr = writeMechanism(CKM_ML_KEM)
  const deriveTplAttrs = [
    buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
    buildAttr(CKA_KEY_TYPE, { ulong: 0x10 /* CKK_GENERIC_SECRET */ }),
    buildAttr(CKA_TOKEN, { bool: false }),
  ]
  const deriveTplPtr = writeTemplate(deriveTplAttrs)

  // Worst-case ciphertext sizes per FIPS 203 §7
  const ctMax = paramSet === 1 ? 768 : paramSet === 2 ? 1088 : 1568
  const ctLenPtr = hsmAlloc(4)
  hsmSetValue(ctLenPtr, ctMax)
  const ctBufPtr = hsmAlloc(ctMax)
  const phKey = hsmAlloc(4)

  const rv = M._C_EncapsulateKey(
    hsmSession,
    mechPtr,
    pubH,
    deriveTplPtr,
    deriveTplAttrs.length,
    ctBufPtr,
    ctLenPtr,
    phKey
  )

  hsmFree(mechPtr)
  hsmFree(deriveTplPtr)
  freeAttrs(deriveTplAttrs)

  if (rv >>> 0 !== 0) {
    hsmFree(ctLenPtr)
    hsmFree(ctBufPtr)
    hsmFree(phKey)
    throw new Error(`C_EncapsulateKey failed: 0x${(rv >>> 0).toString(16)}`)
  }

  const actualCtLen = hsmGetValue(ctLenPtr)
  const ct = new Uint8Array(M.HEAPU8.buffer, ctBufPtr, actualCtLen).slice()
  const derivedKeyH = hsmGetValue(phKey)
  const ss = extractAttribute(M, derivedKeyH, CKA_VALUE, 64) ?? new Uint8Array(0)

  hsmFree(ctLenPtr)
  hsmFree(ctBufPtr)
  hsmFree(phKey)

  if (ss.length === 0) throw new Error('Failed to extract ML-KEM shared secret')
  return { ct, ss }
}

/**
 * Real ML-KEM decap via softhsmv3 PKCS#11 (no TPM heap).
 */
async function softhsmMlKemDecap(paramSet: number, ct: Uint8Array): Promise<Uint8Array> {
  await ensureHSM()
  if (!hsmModule) throw new Error('softhsmv3 not initialized')
  const M = hsmModule

  const privH = mlkemPrivHandleByParam.get(paramSet)
  if (!privH) {
    throw new Error(
      `Hybrid Labeled-KEM Decap: no ML-KEM private key cached for paramSet=${paramSet}. ` +
        'Run TPM2_CreatePrimary with the matching ML-KEM algorithm first.'
    )
  }

  const mechPtr = writeMechanism(CKM_ML_KEM)
  const deriveTplAttrs = [
    buildAttr(CKA_CLASS, { ulong: CKO_PRIVATE_KEY }),
    buildAttr(CKA_KEY_TYPE, { ulong: 0x10 /* CKK_GENERIC_SECRET */ }),
    buildAttr(CKA_TOKEN, { bool: false }),
  ]
  const deriveTplPtr = writeTemplate(deriveTplAttrs)

  const ctHsmPtr = hsmAlloc(ct.length)
  M.HEAPU8.set(ct, ctHsmPtr)
  const phKey = hsmAlloc(4)

  const rv = M._C_DecapsulateKey(
    hsmSession,
    mechPtr,
    privH,
    deriveTplPtr,
    deriveTplAttrs.length,
    ctHsmPtr,
    ct.length,
    phKey
  )

  hsmFree(mechPtr)
  hsmFree(deriveTplPtr)
  hsmFree(ctHsmPtr)
  freeAttrs(deriveTplAttrs)

  if (rv >>> 0 !== 0) {
    hsmFree(phKey)
    throw new Error(`C_DecapsulateKey failed: 0x${(rv >>> 0).toString(16)}`)
  }

  const derivedKeyH = hsmGetValue(phKey)
  const ss = extractAttribute(M, derivedKeyH, CKA_VALUE, 64) ?? new Uint8Array(0)
  hsmFree(phKey)

  if (ss.length === 0) throw new Error('Failed to extract ML-KEM shared secret on decap')
  return ss
}

/**
 * Generate a real classical ephemeral key pair via Web Crypto.
 * Returns { rawPub, privKey } — rawPub is the wire-format public key bytes
 * (32 for X25519, 65 for P-256 uncompressed SEC1).
 */
async function classicalGenerateEphemeral(
  alg: HybridLabeledKemClassicalAlg
): Promise<{ rawPub: Uint8Array; privKey: CryptoKey }> {
  const algorithm =
    alg === 'X25519' ? { name: 'X25519' } : { name: 'ECDH', namedCurve: 'P-256' as const }
  const pair = (await crypto.subtle.generateKey(algorithm, true, ['deriveBits'])) as CryptoKeyPair
  const rawPubBuf = await crypto.subtle.exportKey('raw', pair.publicKey)
  return { rawPub: new Uint8Array(rawPubBuf), privKey: pair.privateKey }
}

/**
 * Import a raw classical public key (peer side) for ECDH derivation.
 */
async function classicalImportPub(
  alg: HybridLabeledKemClassicalAlg,
  rawPub: Uint8Array
): Promise<CryptoKey> {
  const algorithm =
    alg === 'X25519' ? { name: 'X25519' } : { name: 'ECDH', namedCurve: 'P-256' as const }
  return crypto.subtle.importKey('raw', rawPub as BufferSource, algorithm, false, [])
}

/**
 * Real ECDH derivation via Web Crypto.
 */
async function classicalEcdh(
  alg: HybridLabeledKemClassicalAlg,
  privKey: CryptoKey,
  peerPub: CryptoKey
): Promise<Uint8Array> {
  const name = alg === 'X25519' ? 'X25519' : 'ECDH'
  const bits = await crypto.subtle.deriveBits({ name, public: peerPub }, privKey, 256)
  return new Uint8Array(bits)
}

/**
 * Hybrid Labeled-KEM Encapsulate — educational construct.
 *
 * Performs:
 *  1. Real ML-KEM encap against the softhsm-resident public key identified by
 *     `mlkemParamSet` (the same one TPM2_Encapsulate would target via the bridge).
 *  2. Real classical ECDH (X25519 or P-256) where this side acts as the
 *     ephemeral originator; `classicalPeerPubBytes` is the peer's static or
 *     ephemeral public key (raw wire format).
 *  3. HKDF-SHA256 combine ss1 || ss2 → 32-byte combined shared secret.
 *
 * @param mlkemParamSet   1=ML-KEM-512, 2=ML-KEM-768, 3=ML-KEM-1024
 * @param classicalAlg    'X25519' or 'P-256'
 * @param classicalPeerPubBytes  Peer's raw public key (32 B X25519 / 65 B P-256 SEC1 uncompressed)
 */
export async function hybridLabeledKemEncap(
  mlkemParamSet: number,
  classicalAlg: HybridLabeledKemClassicalAlg,
  classicalPeerPubBytes: Uint8Array
): Promise<HybridLabeledKemEncapResult> {
  // 1. ML-KEM via softhsmv3 (real)
  const { ct: mlkemCt, ss: mlkemSs } = await softhsmMlKemEncap(mlkemParamSet)

  // 2. Classical ECDH via Web Crypto (real)
  const peerPub = await classicalImportPub(classicalAlg, classicalPeerPubBytes)
  const { rawPub: classicalCt, privKey: ephPriv } = await classicalGenerateEphemeral(classicalAlg)
  const classicalSs = await classicalEcdh(classicalAlg, ephPriv, peerPub)

  // 3. HKDF-SHA256 combine (real KDF, not a stub)
  const combinedSs = await hkdfCombine(mlkemSs, classicalSs)

  console.log(
    `[PQC Bridge] Hybrid Labeled-KEM Encap OK: ${mlkemParamName(mlkemParamSet)} + ${classicalAlg} → ct(ML-KEM)=${mlkemCt.length}B ct(classical)=${classicalCt.length}B ss(combined)=${combinedSs.length}B`
  )

  return {
    mlkemCt,
    mlkemSs,
    classicalCt,
    classicalSs,
    combinedSs,
    classicalAlg,
    mlkemParamSet,
  }
}

/**
 * Hybrid Labeled-KEM Decapsulate — educational mirror of the Encap path.
 *
 * @param mlkemParamSet   1=ML-KEM-512, 2=ML-KEM-768, 3=ML-KEM-1024
 * @param mlkemCt         ML-KEM ciphertext produced by hybridLabeledKemEncap
 * @param classicalAlg    'X25519' or 'P-256'
 * @param classicalEphPubBytes  Ephemeral classical pub from the encapsulator
 *                              (the `classicalCt` field of HybridLabeledKemEncapResult)
 * @param classicalLocalPriv    Local (static) classical private key — the one
 *                              whose public was given to the encapsulator
 */
export async function hybridLabeledKemDecap(
  mlkemParamSet: number,
  mlkemCt: Uint8Array,
  classicalAlg: HybridLabeledKemClassicalAlg,
  classicalEphPubBytes: Uint8Array,
  classicalLocalPriv: CryptoKey
): Promise<HybridLabeledKemDecapResult> {
  // 1. ML-KEM decap via softhsmv3 (real)
  const mlkemSs = await softhsmMlKemDecap(mlkemParamSet, mlkemCt)

  // 2. Classical ECDH (real)
  const peerEph = await classicalImportPub(classicalAlg, classicalEphPubBytes)
  const classicalSs = await classicalEcdh(classicalAlg, classicalLocalPriv, peerEph)

  // 3. HKDF combine
  const combinedSs = await hkdfCombine(mlkemSs, classicalSs)

  console.log(
    `[PQC Bridge] Hybrid Labeled-KEM Decap OK: ${mlkemParamName(mlkemParamSet)} + ${classicalAlg} → ss(combined)=${combinedSs.length}B`
  )

  return { mlkemSs, classicalSs, combinedSs }
}

/**
 * Helper: generate a "peer" classical key pair the playground can use as the
 * stand-in receiver. Returns both the raw public bytes (for the encap caller)
 * and the private key (for the matching decap demonstration).
 */
export async function generateHybridLabeledKemPeer(
  classicalAlg: HybridLabeledKemClassicalAlg
): Promise<{ rawPub: Uint8Array; privKey: CryptoKey }> {
  return classicalGenerateEphemeral(classicalAlg)
}
