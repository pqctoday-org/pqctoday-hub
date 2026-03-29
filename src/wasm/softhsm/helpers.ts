import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
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
