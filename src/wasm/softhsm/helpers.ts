import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKD_NULL,
  CKG_MGF1_SHA256_NEW,
  CKG_MGF1_SHA384_NEW,
  CKG_MGF1_SHA512_NEW,
  CKM_SHA256,
  CKM_SHA384,
  CKM_SHA384_RSA_PKCS_PSS,
  CKM_SHA512,
  CKM_SHA512_RSA_PKCS_PSS,
  CKZ_DATA_SPECIFIED,
  CK_ATTRIBUTE_SIZE,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_VALUE_LEN,
  CKA_DERIVE,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_WRAP,
  CKA_UNWRAP,
  CKA_SIGN,
  CKA_VERIFY,
  CKO_SECRET_KEY,
  CKK_GENERIC_SECRET,
} from './constants'
import { rvName } from './logging'

// ── Pointer helpers ──────────────────────────────────────────────────────────

export const allocUlong = (M: SoftHSMModule): number => M._malloc(4)

export const readUlong = (M: SoftHSMModule, ptr: number): number => M.getValue(ptr, 'i32') >>> 0

export const writeUlong = (M: SoftHSMModule, ptr: number, val: number): void =>
  M.setValue(ptr, val, 'i32')

export const writeStr = (M: SoftHSMModule, s: string): number => {
  const bytes = new TextEncoder().encode(s)
  const ptr = M._malloc(bytes.length + 1)
  M.HEAPU8.set(bytes, ptr)
  M.HEAPU8[ptr + bytes.length] = 0
  return ptr
}

export const checkRV = (rv: number, fn: string): void => {
  const u = rv >>> 0
  if (u !== 0) throw new Error(`${fn} → ${rvName(u)} (0x${u.toString(16).padStart(8, '0')})`)
}

// Build a CK_ATTRIBUTE array in WASM memory.
// attrs: [{ type, boolVal? | ulongVal? | bytesPtr?/len? }]
// ── PKCS#11 v3.2 Derived Key Profile ─────────────────────────────────────────
/**
 * Caller-defined attribute profile for a key produced by C_DeriveKey.
 * Maps directly to the CK_ATTRIBUTE template passed in pTemplate per PKCS#11 v3.2.
 *
 * All fields are optional — omitted fields are not included in the template.
 * keyLen and keyType are always required for GENERIC_SECRET derived keys.
 *
 * Usage examples:
 *   // ECDH shared secret that will be used as HKDF base key (CKA_DERIVE=true)
 *   { keyLen: 32, derive: true, extractable: true }
 *
 *   // AES-256 key for direct encryption
 *   { keyType: CKK_AES, keyLen: 32, encrypt: true, decrypt: true }
 *
 *   // Intermediate key for further derivation only (non-extractable, derive-only)
 *   { keyLen: 32, derive: true, sensitive: true, extractable: false }
 */
export interface DerivedKeyProfile {
  /** CKA_KEY_TYPE — defaults to CKK_GENERIC_SECRET (0x10) if omitted */
  keyType?: number
  /** CKA_VALUE_LEN — derived key length in bytes */
  keyLen: number
  /** CKA_TOKEN — store in token (default: false, session-only) */
  token?: boolean
  /** CKA_SENSITIVE — key value hidden from C_GetAttributeValue */
  sensitive?: boolean
  /** CKA_EXTRACTABLE — key value can be extracted (default: true) */
  extractable?: boolean
  /** CKA_DERIVE — key may be used as base key for C_DeriveKey (HKDF, ECDH chain etc.) */
  derive?: boolean
  /** CKA_ENCRYPT — key may be used with C_EncryptInit */
  encrypt?: boolean
  /** CKA_DECRYPT — key may be used with C_DecryptInit */
  decrypt?: boolean
  /** CKA_WRAP — key may wrap other keys */
  wrap?: boolean
  /** CKA_UNWRAP — key may unwrap other keys */
  unwrap?: boolean
  /** CKA_SIGN — key may be used with C_SignInit (HMAC) */
  sign?: boolean
  /** CKA_VERIFY — key may be used with C_VerifyInit (HMAC) */
  verify?: boolean
}

export interface AttrDef {
  type: number
  boolVal?: boolean
  ulongVal?: number
  bytesPtr?: number
  bytesLen?: number
}

export const buildTemplate = (
  M: SoftHSMModule,
  defs: AttrDef[]
): { ptr: number; auxPtrs: number[] } => {
  const ptr = M._malloc(defs.length * CK_ATTRIBUTE_SIZE)
  const auxPtrs: number[] = []

  defs.forEach((d, i) => {
    const base = ptr + i * CK_ATTRIBUTE_SIZE
    M.setValue(base, d.type, 'i32') // CK_ATTRIBUTE_TYPE type

    if (d.boolVal !== undefined) {
      const bPtr = M._malloc(1)
      M.HEAPU8[bPtr] = d.boolVal ? 1 : 0
      M.setValue(base + 4, bPtr, 'i32') // pValue
      M.setValue(base + 8, 1, 'i32') // ulValueLen
      auxPtrs.push(bPtr)
    } else if (d.ulongVal !== undefined) {
      const uPtr = M._malloc(4)
      M.setValue(uPtr, d.ulongVal, 'i32')
      M.setValue(base + 4, uPtr, 'i32')
      M.setValue(base + 8, 4, 'i32')
      auxPtrs.push(uPtr)
    } else if (d.bytesPtr !== undefined) {
      M.setValue(base + 4, d.bytesPtr, 'i32')
      M.setValue(base + 8, d.bytesLen ?? 0, 'i32')
    } else {
      // null attribute (size query)
      M.setValue(base + 4, 0, 'i32')
      M.setValue(base + 8, 0, 'i32')
    }
  })

  return { ptr, auxPtrs }
}

export const freeTemplate = (
  M: SoftHSMModule,
  tpl: { ptr: number; auxPtrs: number[] },
  count: number
): void => {
  M._free(tpl.ptr)
  tpl.auxPtrs.forEach((p) => M._free(p))
  void count
}

/**
 * Build a WASM CK_ATTRIBUTE template from a DerivedKeyProfile per PKCS#11 v3.2.
 * Only includes attributes that are explicitly set in the profile —
 * unset boolean flags are omitted (not included in the template) per spec §4.1.
 *
 * Returns { tpl, attrCount } — pass both to C_DeriveKey as pTemplate/ulAttributeCount.
 */
export const buildDerivedKeyTemplate = (
  M: SoftHSMModule,
  profile: DerivedKeyProfile
): { tpl: ReturnType<typeof buildTemplate>; attrCount: number } => {
  const defs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: profile.keyType ?? CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: profile.token ?? false },
    { type: CKA_SENSITIVE, boolVal: profile.sensitive ?? false },
    { type: CKA_EXTRACTABLE, boolVal: profile.extractable ?? true },
    { type: CKA_VALUE_LEN, ulongVal: profile.keyLen },
  ]
  // Conditionally include usage attributes — omit if not specified (PKCS#11 v3.2 §4.1)
  if (profile.derive !== undefined) defs.push({ type: CKA_DERIVE, boolVal: profile.derive })
  if (profile.encrypt !== undefined) defs.push({ type: CKA_ENCRYPT, boolVal: profile.encrypt })
  if (profile.decrypt !== undefined) defs.push({ type: CKA_DECRYPT, boolVal: profile.decrypt })
  if (profile.wrap !== undefined) defs.push({ type: CKA_WRAP, boolVal: profile.wrap })
  if (profile.unwrap !== undefined) defs.push({ type: CKA_UNWRAP, boolVal: profile.unwrap })
  if (profile.sign !== undefined) defs.push({ type: CKA_SIGN, boolVal: profile.sign })
  if (profile.verify !== undefined) defs.push({ type: CKA_VERIFY, boolVal: profile.verify })

  return { tpl: buildTemplate(M, defs), attrCount: defs.length }
}

// ── High-level PKCS#11 helpers ───────────────────────────────────────────────

/** C_Initialize */
// ── Additional WASM memory helpers ───────────────────────────────────────────

/** Allocate and fill a CK_MECHANISM struct (12 bytes) in WASM heap. */
export const buildMech = (M: SoftHSMModule, type: number, paramPtr = 0, paramLen = 0): number => {
  const mech = M._malloc(12)
  M.setValue(mech, type, 'i32')
  M.setValue(mech + 4, paramPtr, 'i32')
  M.setValue(mech + 8, paramLen, 'i32')
  return mech
}

/** Copy bytes into WASM heap; returns pointer. Caller must free. */
export const writeBytes = (M: SoftHSMModule, bytes: Uint8Array): number => {
  const ptr = M._malloc(bytes.length || 1)
  if (bytes.length) M.HEAPU8.set(bytes, ptr)
  return ptr
}

/** Build CK_RSA_PKCS_OAEP_PARAMS (20 bytes) in WASM heap. */
export const buildOAEPParams = (
  M: SoftHSMModule,
  hashAlgo: 'sha256' | 'sha384' | 'sha512'
): { ptr: number; len: number } => {
  const hashMech =
    hashAlgo === 'sha512' ? CKM_SHA512 : hashAlgo === 'sha384' ? CKM_SHA384 : CKM_SHA256
  const mgf =
    hashAlgo === 'sha512'
      ? CKG_MGF1_SHA512_NEW
      : hashAlgo === 'sha384'
        ? CKG_MGF1_SHA384_NEW
        : CKG_MGF1_SHA256_NEW
  const ptr = M._malloc(20)
  M.setValue(ptr, hashMech, 'i32') // hashAlg
  M.setValue(ptr + 4, mgf, 'i32') // mgf
  M.setValue(ptr + 8, CKZ_DATA_SPECIFIED, 'i32') // source
  M.setValue(ptr + 12, 0, 'i32') // pSourceData = NULL
  M.setValue(ptr + 16, 0, 'i32') // ulSourceDataLen = 0
  return { ptr, len: 20 }
}

/** Build CK_RSA_PKCS_PSS_PARAMS (12 bytes) in WASM heap. */
export const buildPSSParams = (
  M: SoftHSMModule,
  mechType: number
): { ptr: number; len: number } => {
  const isS512 = mechType === CKM_SHA512_RSA_PKCS_PSS
  const isS384 = mechType === CKM_SHA384_RSA_PKCS_PSS
  const hashMech = isS512 ? CKM_SHA512 : isS384 ? CKM_SHA384 : CKM_SHA256
  const mgf = isS512 ? CKG_MGF1_SHA512_NEW : isS384 ? CKG_MGF1_SHA384_NEW : CKG_MGF1_SHA256_NEW
  const sLen = isS512 ? 64 : isS384 ? 48 : 32
  const ptr = M._malloc(12)
  M.setValue(ptr, hashMech, 'i32')
  M.setValue(ptr + 4, mgf, 'i32')
  M.setValue(ptr + 8, sLen, 'i32')
  return { ptr, len: 12 }
}

/** Build CK_EDDSA_PARAMS (12 bytes) in WASM heap. All allocPtrs must be freed. */
export const buildEdDSAParams = (
  M: SoftHSMModule,
  prehash: boolean = false,
  contextData?: Uint8Array
): { ptr: number; len: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  let ctxPtr = 0
  let ctxLen = 0
  if (contextData && contextData.length > 0) {
    ctxPtr = writeBytes(M, contextData)
    allocPtrs.push(ctxPtr)
    ctxLen = contextData.length
  }
  const ptr = M._malloc(12)
  allocPtrs.push(ptr)
  M.setValue(ptr, prehash ? 1 : 0, 'i32') // phFlag
  M.setValue(ptr + 4, ctxLen, 'i32') // ulContextDataLen
  M.setValue(ptr + 8, ctxPtr, 'i32') // pContextData
  return { ptr, len: 12, allocPtrs }
}

/** Build CK_GCM_PARAMS (24 bytes) in WASM heap. All returned allocPtrs must be freed. */
export const buildGCMParams = (
  M: SoftHSMModule,
  iv: Uint8Array,
  aad?: Uint8Array
): { ptr: number; len: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  const ivPtr = writeBytes(M, iv)
  allocPtrs.push(ivPtr)
  let aadPtr = 0
  let aadLen = 0
  if (aad && aad.length > 0) {
    aadPtr = writeBytes(M, aad)
    allocPtrs.push(aadPtr)
    aadLen = aad.length
  }
  const ptr = M._malloc(24)
  allocPtrs.push(ptr)
  M.setValue(ptr, ivPtr, 'i32') // pIv
  M.setValue(ptr + 4, iv.length, 'i32') // ulIvLen
  M.setValue(ptr + 8, iv.length * 8, 'i32') // ulIvBits
  M.setValue(ptr + 12, aadPtr, 'i32') // pAAD
  M.setValue(ptr + 16, aadLen, 'i32') // ulAADLen
  M.setValue(ptr + 20, 128, 'i32') // ulTagBits = 128
  return { ptr, len: 24, allocPtrs }
}

/** Build CK_ECDH1_DERIVE_PARAMS (20 bytes) in WASM heap. All allocPtrs must be freed.
 *  kdf: CKD_NULL (default) or CKD_SHA256_KDF etc. for ANSI X9.63 KDF.
 *  sharedData: optional SharedInfo bytes (passed as ANSI X9.63 KDF input, e.g. ephemeral public key for SUCI).
 */
export const buildECDH1DeriveParams = (
  M: SoftHSMModule,
  peerPubBytes: Uint8Array,
  kdf: number = CKD_NULL,
  sharedData?: Uint8Array
): { ptr: number; len: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  const pubPtr = writeBytes(M, peerPubBytes)
  allocPtrs.push(pubPtr)
  let sharedPtr = 0
  let sharedLen = 0
  if (kdf !== CKD_NULL && sharedData && sharedData.length > 0) {
    sharedPtr = writeBytes(M, sharedData)
    allocPtrs.push(sharedPtr)
    sharedLen = sharedData.length
  }
  const ptr = M._malloc(20)
  allocPtrs.push(ptr)
  M.setValue(ptr, kdf, 'i32') // kdf
  M.setValue(ptr + 4, sharedLen, 'i32') // ulSharedDataLen
  M.setValue(ptr + 8, sharedPtr, 'i32') // pSharedData
  M.setValue(ptr + 12, peerPubBytes.length, 'i32') // ulPublicDataLen
  M.setValue(ptr + 16, pubPtr, 'i32') // pPublicData
  return { ptr, len: 20, allocPtrs }
}

/** Build CK_BIP32_CHILD_DERIVE_PARAMS (8 bytes) in WASM heap. All allocPtrs must be freed. */
export const buildBIP32ChildDeriveParams = (
  M: SoftHSMModule,
  index: number,
  hardened: boolean
): { ptr: number; len: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  const ptr = M._malloc(8)
  allocPtrs.push(ptr)
  M.setValue(ptr, hardened ? 1 : 0, 'i32') // flags
  M.setValue(ptr + 4, index, 'i32') // index
  return { ptr, len: 8, allocPtrs }
}
