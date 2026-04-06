import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_ALWAYS_SENSITIVE,
  CKA_CLASS,
  CKA_DECAPSULATE,
  CKA_DECRYPT,
  CKA_DERIVE,
  CKA_ENCAPSULATE,
  CKA_ENCRYPT,
  CKA_EXTRACTABLE,
  CKA_KEY_GEN_MECHANISM,
  CKA_KEY_TYPE,
  CKA_LOCAL,
  CKA_NEVER_EXTRACTABLE,
  CKA_PARAMETER_SET,
  CKA_PRIVATE,
  CKA_PUBLIC_KEY_INFO,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_UNWRAP,
  CKA_VALUE_LEN,
  CKA_VERIFY,
  CKA_WRAP,
  CKA_HSS_KEYS_REMAINING,
  CKA_XMSS_KEYS_REMAINING,
} from './constants'
import {
  type AttrDef,
  allocUlong,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
} from './helpers'

export const hsm_createObject = (
  M: SoftHSMModule,
  hSession: number,
  attributes: AttrDef[]
): number => {
  const tpl = buildTemplate(M, attributes)
  const pHandle = M._malloc(4)
  try {
    const rv = M._C_CreateObject(hSession, tpl.ptr, attributes.length, pHandle)
    if (rv !== 0) throw new Error(`C_CreateObject failed: ${rv.toString(16)}`)
    return M.getValue(pHandle, 'i32')
  } finally {
    freeTemplate(M, tpl, attributes.length)
    M._free(pHandle)
  }
}

export const hsm_destroyObject = (M: SoftHSMModule, hSession: number, hObject: number): void => {
  checkRV(M._C_DestroyObject(hSession, hObject), 'C_DestroyObject')
}

/** Find all PKCS#11 objects matching an optional template via C_FindObjects*. */
export const hsm_findAllObjects = (
  M: SoftHSMModule,
  hSession: number,
  template: AttrDef[]
): number[] => {
  const MAX_OBJECTS = 512
  const handleBufPtr = M._malloc(MAX_OBJECTS * 4)
  const foundCountPtr = allocUlong(M)
  const handles: number[] = []
  let tpl: { ptr: number; auxPtrs: number[] } | null = null
  try {
    if (template.length > 0) {
      tpl = buildTemplate(M, template)
      checkRV(M._C_FindObjectsInit(hSession, tpl.ptr, template.length), 'C_FindObjectsInit')
    } else {
      checkRV(M._C_FindObjectsInit(hSession, 0, 0), 'C_FindObjectsInit')
    }
    checkRV(M._C_FindObjects(hSession, handleBufPtr, MAX_OBJECTS, foundCountPtr), 'C_FindObjects')
    const foundCount = readUlong(M, foundCountPtr)
    for (let i = 0; i < foundCount; i++) {
      handles.push(readUlong(M, handleBufPtr + i * 4))
    }
  } finally {
    try {
      M._C_FindObjectsFinal(hSession)
    } catch {
      // ignore — best-effort cleanup
    }
    M._free(handleBufPtr)
    M._free(foundCountPtr)
    if (tpl) freeTemplate(M, tpl, template.length)
  }
  return handles
}

// ── Key attribute inspection ──────────────────────────────────────────────────

/** Safe single-attribute boolean read — returns null if attribute doesn't exist on this key type. */
export const readBoolAttr = (
  M: SoftHSMModule,
  hSession: number,
  handle: number,
  attrType: number
): boolean | null => {
  const bPtr = M._malloc(1)
  M.HEAPU8[bPtr] = 0
  const tpl = buildTemplate(M, [{ type: attrType, bytesPtr: bPtr, bytesLen: 1 }])
  const rv = M._C_GetAttributeValue(hSession, handle, tpl.ptr, 1) >>> 0
  freeTemplate(M, tpl, 1)
  const val = rv === 0 ? M.HEAPU8[bPtr] !== 0 : null
  M._free(bPtr)
  return val
}

/** Safe single-attribute ulong read — returns null if attribute doesn't exist. */
export const readUlongAttr = (
  M: SoftHSMModule,
  hSession: number,
  handle: number,
  attrType: number
): number | null => {
  const uPtr = M._malloc(4)
  const tpl = buildTemplate(M, [{ type: attrType, bytesPtr: uPtr, bytesLen: 4 }])
  const rv = M._C_GetAttributeValue(hSession, handle, tpl.ptr, 1) >>> 0
  freeTemplate(M, tpl, 1)
  const val = rv === 0 ? readUlong(M, uPtr) : null
  M._free(uPtr)
  return val
}

export interface KeyAttributeSet {
  /** CKA_CLASS: 2=public, 3=private, 4=secret */
  ckClass: number | null
  /** CKA_KEY_TYPE: algorithm family (e.g. CKK_AES=0x1f, CKK_RSA=0x00) */
  ckKeyType: number | null
  /** CKA_PARAMETER_SET: parameter set ID for PQC keys (ML-KEM/ML-DSA/SLH-DSA) */
  ckParameterSet: number | null
  /** CKA_KEY_GEN_MECHANISM: CKM_ type that generated this key */
  ckKeyGenMechanism: number | null
  ckToken: boolean | null
  ckPrivate: boolean | null
  ckSensitive: boolean | null
  ckExtractable: boolean | null
  ckAlwaysSensitive: boolean | null
  ckNeverExtractable: boolean | null
  ckLocal: boolean | null
  ckEncrypt: boolean | null
  ckDecrypt: boolean | null
  ckSign: boolean | null
  ckVerify: boolean | null
  ckWrap: boolean | null
  ckUnwrap: boolean | null
  ckDerive: boolean | null
  ckEncapsulate: boolean | null
  ckDecapsulate: boolean | null
  /** CKA_VALUE_LEN in bytes; present on secret keys only */
  ckValueLen: number | null
  /** CKA_CHECK_VALUE (KCV) bytes; present on symmetric/secret keys */
  ckCheckValue?: Uint8Array | null
  /** CKA_HSS_KEYS_REMAINING: remaining sign ops for HSS keys (PKCS#11 v3.2 §6.14) */
  ckHssKeysRemaining: number | null
  /** CKA_XMSS_KEYS_REMAINING: remaining sign ops for XMSS keys (vendor extension 0x8000_0106) */
  ckXmssKeysRemaining: number | null
}

/** Read common PKCS#11 attributes for any key object in the current session. */
export const hsm_getKeyAttributes = (
  M: SoftHSMModule,
  hSession: number,
  handle: number
): KeyAttributeSet => {
  const b = (t: number) => readBoolAttr(M, hSession, handle, t)
  const u = (t: number) => readUlongAttr(M, hSession, handle, t)
  return {
    ckClass: u(CKA_CLASS),
    ckKeyType: u(CKA_KEY_TYPE),
    ckParameterSet: u(CKA_PARAMETER_SET),
    ckKeyGenMechanism: u(CKA_KEY_GEN_MECHANISM),
    ckToken: b(CKA_TOKEN),
    ckPrivate: b(CKA_PRIVATE),
    ckSensitive: b(CKA_SENSITIVE),
    ckExtractable: b(CKA_EXTRACTABLE),
    ckAlwaysSensitive: b(CKA_ALWAYS_SENSITIVE),
    ckNeverExtractable: b(CKA_NEVER_EXTRACTABLE),
    ckLocal: b(CKA_LOCAL),
    ckEncrypt: b(CKA_ENCRYPT),
    ckDecrypt: b(CKA_DECRYPT),
    ckSign: b(CKA_SIGN),
    ckVerify: b(CKA_VERIFY),
    ckWrap: b(CKA_WRAP),
    ckUnwrap: b(CKA_UNWRAP),
    ckDerive: b(CKA_DERIVE),
    ckEncapsulate: b(CKA_ENCAPSULATE),
    ckDecapsulate: b(CKA_DECAPSULATE),
    ckValueLen: u(CKA_VALUE_LEN),
    ckHssKeysRemaining: u(CKA_HSS_KEYS_REMAINING),
    ckXmssKeysRemaining: u(CKA_XMSS_KEYS_REMAINING),
    ckCheckValue: (() => {
      try {
        return hsm_getKeyCheckValue(M, hSession, handle)
      } catch (e) {
        console.warn('[softhsm] KCV read failed for handle', handle, e)
        return null
      }
    })(),
  }
}

// ── SPKI public key extraction (PKCS#11 v3.2) ───────────────────────────────

/**
 * Extract SPKI-encoded public key via C_GetAttributeValue(CKA_PUBLIC_KEY_INFO).
 * Returns the DER-encoded SubjectPublicKeyInfo bytes.
 */
export const hsm_getPublicKeyInfo = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): Uint8Array => {
  const lenTpl = buildTemplate(M, [{ type: CKA_PUBLIC_KEY_INFO }])
  checkRV(
    M._C_GetAttributeValue(hSession, pubHandle, lenTpl.ptr, 1),
    'C_GetAttributeValue(PUBLIC_KEY_INFO,len)'
  )
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)

  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_PUBLIC_KEY_INFO, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, pubHandle, valTpl.ptr, 1),
      'C_GetAttributeValue(PUBLIC_KEY_INFO)'
    )
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}
export const CKA_CHECK_VALUE = 0x90

export const hsm_getKeyCheckValue = (
  M: SoftHSMModule,
  hSession: number,
  hKey: number
): Uint8Array => {
  const lenTpl = buildTemplate(M, [{ type: CKA_CHECK_VALUE }])
  checkRV(
    M._C_GetAttributeValue(hSession, hKey, lenTpl.ptr, 1),
    'C_GetAttributeValue(CKA_CHECK_VALUE,len)'
  )
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)
  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_CHECK_VALUE, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, hKey, valTpl.ptr, 1),
      'C_GetAttributeValue(CKA_CHECK_VALUE)'
    )
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}
