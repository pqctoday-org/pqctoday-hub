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
const CKP_ML_KEM_768 = 0x2
const CKP_ML_DSA_65 = 0x2
const CK_ATTRIBUTE_SIZE = 12
const CK_MECHANISM_SIZE = 12

// ── State ─────────────────────────────────────────────────────────────────────
let hsmModule: SoftHSMModule | null = null
let hsmSession: number = 0
let hsmInitialized = false

// Cache generated key handles for the TPM bridge
let mlkemPubHandle = 0
let mlkemPrivHandle = 0
let mldsaPrivHandle = 0

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
  _paramSet: number,
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

  try {
    // Build key pair generation templates
    const pubAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PUBLIC_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_KEM }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_ENCAPSULATE, { bool: true }),
      buildAttr(CKA_PARAMETER_SET, { ulong: CKP_ML_KEM_768 }),
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

    // Save handles for later encap/decap
    mlkemPubHandle = pubH
    mlkemPrivHandle = privH

    // Extract public key via C_GetAttributeValue
    const pkBytes = extractAttribute(M, pubH, CKA_VALUE, pkOutMax)
    if (!pkBytes || pkBytes.length === 0) return -2

    // Write the public key into TPM WASM memory
    tpm.HEAPU8.set(pkBytes, pkOutPtr)

    // For the private key, we store the seed (which was already written by the C code)
    // The softhsm handles stay alive in mlkemPrivHandle for encap/decap

    console.log(`[PQC Bridge] ML-KEM-768 keygen OK: pk=${pkBytes.length}B`)
    return pkBytes.length
  } catch (e) {
    console.error('[PQC Bridge] mlkemKeygen error:', e)
    return -2
  }
}

// ── ML-KEM encapsulate via PKCS#11 ────────────────────────────────────────────
function mlkemEncap(
  _paramSet: number,
  pkPtr: number,
  pkLen: number,
  ctOutPtr: number,
  ctOutMax: number,
  ssOutPtr: number,
  ssOutMax: number
): number {
  if (!hsmModule) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1

  try {
    // If we don't have a cached public key handle, import the pk
    let pubH = mlkemPubHandle
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

    console.log(`[PQC Bridge] ML-KEM encap OK: ct=${actualCtLen}B ss=${ssBytes?.length ?? 0}B`)
    return 0
  } catch (e) {
    console.error('[PQC Bridge] mlkemEncap error:', e)
    return -2
  }
}

// ── ML-KEM decapsulate via PKCS#11 ────────────────────────────────────────────
function mlkemDecap(
  _paramSet: number,
  _skPtr: number,
  _skLen: number,
  ctPtr: number,
  ctLen: number,
  ssOutPtr: number,
  ssOutMax: number
): number {
  if (!hsmModule || !mlkemPrivHandle) return -1
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
      mlkemPrivHandle,
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
    console.log(`[PQC Bridge] ML-KEM decap OK: ss=${ssBytes?.length ?? 0}B`)
    return 0
  } catch (e) {
    console.error('[PQC Bridge] mlkemDecap error:', e)
    return -2
  }
}

// ── ML-DSA keygen via PKCS#11 ─────────────────────────────────────────────────
function mldsaKeygen(
  _paramSet: number,
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

  try {
    const pubAttrs = [
      buildAttr(CKA_CLASS, { ulong: CKO_PUBLIC_KEY }),
      buildAttr(CKA_KEY_TYPE, { ulong: CKK_ML_DSA }),
      buildAttr(CKA_TOKEN, { bool: false }),
      buildAttr(CKA_VERIFY, { bool: true }),
      buildAttr(CKA_PARAMETER_SET, { ulong: CKP_ML_DSA_65 }),
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

    mldsaPrivHandle = privH

    const pkBytes = extractAttribute(M, pubH, CKA_VALUE, pkOutMax)
    if (!pkBytes || pkBytes.length === 0) return -2

    tpm.HEAPU8.set(pkBytes, pkOutPtr)
    console.log(`[PQC Bridge] ML-DSA-65 keygen OK: pk=${pkBytes.length}B`)
    return pkBytes.length
  } catch (e) {
    console.error('[PQC Bridge] mldsaKeygen error:', e)
    return -2
  }
}

// ── ML-DSA sign via PKCS#11 ───────────────────────────────────────────────────
function mldsaSign(
  _paramSet: number,
  _skPtr: number,
  _skLen: number,
  digestPtr: number,
  digestLen: number,
  sigOutPtr: number,
  sigOutMax: number
): number {
  if (!hsmModule || !mldsaPrivHandle) return -1
  const M = hsmModule
  const tpm = (globalThis as any).__pqcTpmModule as PqcTpmModule | undefined
  if (!tpm) return -1

  try {
    // C_SignInit
    const mechPtr = writeMechanism(CKM_ML_DSA)
    let rv = M._C_SignInit(hsmSession, mechPtr, mldsaPrivHandle)
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
    console.log(`[PQC Bridge] ML-DSA-65 sign OK: sig=${actualSigLen}B`)
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
