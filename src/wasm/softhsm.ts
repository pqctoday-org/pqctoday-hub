/**
 * SoftHSM WASM service — Phase 6 integration
 *
 * Loads the Emscripten CJS output (`/wasm/softhsm.js`) via a <script> tag so that
 * the global `createSoftHSMModule` function is available, then instantiates it with
 * `locateFile` pointing to `/wasm/softhsm.wasm`.
 *
 * Exports:
 *  - getSoftHSMModule()     — singleton loader
 *  - clearSoftHSMCache()    — reset singleton (PlaygroundProvider cleanup)
 *  - createLoggingProxy()   — transparent PKCS#11 call logger
 *  - Pkcs11LogEntry         — log entry type
 *  - hsm_*                  — high-level PKCS#11 helper functions
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { buildInspect } from './pkcs11Inspect'
export type {
  Pkcs11LogInspect,
  InspectSection,
  DecodedMechanism,
  DecodedAttribute,
  DecodedValue,
} from './pkcs11Inspect'

// ── Singleton loader ─────────────────────────────────────────────────────────

let modulePromise: Promise<SoftHSMModule> | null = null

/**
 * Returns the SoftHSM WASM module singleton.
 * On first call, injects a <script> tag to load /wasm/softhsm.js, then
 * calls window.createSoftHSMModule({ locateFile }) to instantiate the WASM.
 */
export const getSoftHSMModule = async (): Promise<SoftHSMModule> => {
  if (!modulePromise) {
    modulePromise = (async () => {
      // Load the Emscripten script if not already present
      if (!document.querySelector('script[data-softhsm]')) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = '/wasm/softhsm.js'
          s.dataset.softhsm = '1'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load /wasm/softhsm.js'))
          document.head.appendChild(s)
        })
      }
      const createFn = (globalThis as Record<string, unknown>)['createSoftHSMModule'] as
        | ((arg?: Record<string, unknown>) => Promise<SoftHSMModule>)
        | undefined
      if (!createFn) throw new Error('createSoftHSMModule not available after script load')
      return createFn({
        locateFile: (path: string) => (path.endsWith('.wasm') ? '/wasm/softhsm.wasm' : path),
      })
    })().catch((e) => {
      modulePromise = null
      throw e
    })
  }
  return modulePromise
}

/** Reset singleton — call from PlaygroundProvider cleanup. */
export const clearSoftHSMCache = (): void => {
  modulePromise = null
}

// ── PKCS#11 call log ─────────────────────────────────────────────────────────

export interface Pkcs11LogEntry {
  id: number
  timestamp: string // HH:MM:SS
  fn: string
  args: string
  rvHex: string
  rvName: string
  ms: number
  ok: boolean
  inspect?: import('./pkcs11Inspect').Pkcs11LogInspect
}

let _logId = 0

const RV_NAMES: Record<number, string> = {
  0x00000000: 'CKR_OK',
  0x00000001: 'CKR_CANCEL',
  0x00000002: 'CKR_HOST_MEMORY',
  0x00000003: 'CKR_SLOT_ID_INVALID',
  0x00000005: 'CKR_GENERAL_ERROR',
  0x00000006: 'CKR_FUNCTION_FAILED',
  0x00000007: 'CKR_ARGUMENTS_BAD',
  0x00000020: 'CKR_DATA_INVALID',
  0x00000030: 'CKR_DEVICE_ERROR',
  0x00000042: 'CKR_AEAD_DECRYPT_FAILED',
  0x00000054: 'CKR_FUNCTION_NOT_SUPPORTED',
  0x00000060: 'CKR_KEY_HANDLE_INVALID',
  0x00000063: 'CKR_KEY_TYPE_INCONSISTENT',
  0x00000068: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
  0x00000070: 'CKR_MECHANISM_INVALID',
  0x00000071: 'CKR_MECHANISM_PARAM_INVALID',
  0x00000082: 'CKR_OBJECT_HANDLE_INVALID',
  0x00000090: 'CKR_OPERATION_ACTIVE',
  0x00000091: 'CKR_OPERATION_NOT_INITIALIZED',
  0x000000a0: 'CKR_PIN_INCORRECT',
  0x000000a4: 'CKR_PIN_LOCKED',
  0x000000b0: 'CKR_SESSION_CLOSED',
  0x000000b3: 'CKR_SESSION_HANDLE_INVALID',
  0x000000b5: 'CKR_SESSION_READ_ONLY',
  0x000000b6: 'CKR_SESSION_EXISTS',
  0x000000c0: 'CKR_SIGNATURE_INVALID',
  0x000000c1: 'CKR_SIGNATURE_LEN_RANGE',
  0x000000d0: 'CKR_TEMPLATE_INCOMPLETE',
  0x000000d1: 'CKR_TEMPLATE_INCONSISTENT',
  0x000000e0: 'CKR_TOKEN_NOT_PRESENT',
  0x000000e2: 'CKR_TOKEN_WRITE_PROTECTED',
  0x000000f0: 'CKR_UNWRAPPING_KEY_HANDLE_INVALID',
  0x00000100: 'CKR_USER_ALREADY_LOGGED_IN',
  0x00000101: 'CKR_USER_NOT_LOGGED_IN',
  0x00000102: 'CKR_USER_PIN_NOT_INITIALIZED',
  0x00000103: 'CKR_USER_TYPE_INVALID',
  0x00000110: 'CKR_WRAPPED_KEY_INVALID',
  0x00000113: 'CKR_WRAPPING_KEY_HANDLE_INVALID',
  0x00000130: 'CKR_DOMAIN_PARAMS_INVALID',
  0x00000140: 'CKR_CURVE_NOT_SUPPORTED',
  0x00000150: 'CKR_BUFFER_TOO_SMALL',
  0x00000190: 'CKR_CRYPTOKI_NOT_INITIALIZED',
  0x00000191: 'CKR_CRYPTOKI_ALREADY_INITIALIZED',
  0x00000200: 'CKR_FUNCTION_REJECTED',
  0x00000201: 'CKR_TOKEN_RESOURCE_EXCEEDED',
}

const rvName = (rv: number): string => RV_NAMES[rv] ?? `0x${rv.toString(16).padStart(8, '0')}`

const fmtTime = (): string => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

/**
 * PKCS#11 v3.2 parameter names per function (positional, first N params shown).
 * Sources: PKCS#11 v3.2 CSD01 §5, §6; FIPS 203/204 mechanism appendices.
 */
const PKCS11_PARAMS: Record<string, string[]> = {
  // Session management
  C_Initialize: ['pInitArgs'],
  C_Finalize: ['pReserved'],
  C_GetInfo: ['pInfo'],
  C_GetSlotList: ['tokenPresent', 'pSlotList', 'pulCount'],
  C_GetSlotInfo: ['slotID', 'pInfo'],
  C_GetTokenInfo: ['slotID', 'pInfo'],
  C_GetMechanismList: ['slotID', 'pMechanismList', 'pulCount'],
  C_GetMechanismInfo: ['slotID', 'type', 'pInfo'],
  C_InitToken: ['slotID', 'pPin', 'ulPinLen', 'pLabel'],
  C_InitPIN: ['hSession', 'pPin', 'ulPinLen'],
  C_SetPIN: ['hSession', 'pOldPin', 'ulOldLen', 'pNewPin'],
  C_OpenSession: ['slotID', 'flags', 'pApp', 'Notify', 'phSession'],
  C_CloseSession: ['hSession'],
  C_CloseAllSessions: ['slotID'],
  C_GetSessionInfo: ['hSession', 'pInfo'],
  C_Login: ['hSession', 'userType', 'pPin', 'ulPinLen'],
  C_Logout: ['hSession'],
  // Object management
  C_CreateObject: ['hSession', 'pTemplate', 'ulCount', 'phObject'],
  C_DestroyObject: ['hSession', 'hObject'],
  C_GetObjectSize: ['hSession', 'hObject', 'pulSize'],
  C_GetAttributeValue: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_SetAttributeValue: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_FindObjectsInit: ['hSession', 'pTemplate', 'ulCount'],
  C_FindObjects: ['hSession', 'phObject', 'ulMax', 'pulCount'],
  C_FindObjectsFinal: ['hSession'],
  // Key generation
  C_GenerateKey: ['hSession', 'pMechanism', 'pTemplate', 'ulCount'],
  C_GenerateKeyPair: ['hSession', 'pMechanism', 'pPubTemplate', 'ulPubCount'],
  C_WrapKey: ['hSession', 'pMechanism', 'hWrappingKey', 'hKey'],
  C_UnwrapKey: ['hSession', 'pMechanism', 'hUnwrappingKey', 'pWrapped'],
  C_DeriveKey: ['hSession', 'pMechanism', 'hBaseKey', 'pTemplate'],
  // Encryption
  C_EncryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_Encrypt: ['hSession', 'pData', 'ulDataLen', 'pOut'],
  C_EncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pOut'],
  C_EncryptFinal: ['hSession', 'pOut', 'pulOutLen'],
  C_DecryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_Decrypt: ['hSession', 'pEncData', 'ulEncDataLen', 'pOut'],
  C_DecryptUpdate: ['hSession', 'pEncPart', 'ulEncPartLen', 'pOut'],
  C_DecryptFinal: ['hSession', 'pOut', 'pulOutLen'],
  // Digest
  C_DigestInit: ['hSession', 'pMechanism'],
  C_Digest: ['hSession', 'pData', 'ulDataLen', 'pDigest'],
  C_DigestUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_DigestFinal: ['hSession', 'pDigest', 'pulDigestLen'],
  // Sign / Verify
  C_SignInit: ['hSession', 'pMechanism', 'hKey'],
  C_Sign: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_SignUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_SignFinal: ['hSession', 'pSignature', 'pulSignatureLen'],
  C_VerifyInit: ['hSession', 'pMechanism', 'hKey'],
  C_Verify: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_VerifyUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_VerifyFinal: ['hSession', 'pSignature', 'ulSignatureLen'],
  // PKCS#11 v3.2 — PQC KEM (FIPS 203)
  C_EncapsulateKey: [
    'hSession',
    'pMechanism',
    'hPublicKey',
    'pTemplate',
    'ulAttributeCount',
    'pCiphertext',
    'pulCiphertextLen',
    'phKey',
  ],
  C_DecapsulateKey: [
    'hSession',
    'pMechanism',
    'hPrivateKey',
    'pTemplate',
    'ulAttributeCount',
    'pCiphertext',
    'ulCiphertextLen',
    'phKey',
  ],
  // PKCS#11 v3.0 — One-shot message signing (ML-DSA, SLH-DSA)
  C_MessageSignInit: ['hSession', 'pMechanism', 'hKey'],
  C_SignMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_MessageSignFinal: ['hSession'],
  C_MessageVerifyInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_MessageVerifyFinal: ['hSession'],
  // PKCS#11 v3.2 — Async / session ops
  C_SessionCancel: ['hSession', 'flags'],
  C_GetInterfaceList: ['pInterfacesList', 'pulCount'],
  C_GetInterface: ['pInterfaceName', 'pVersion', 'ppInterface', 'flags'],
  C_GetSessionValidationFlags: ['hSession', 'flags', 'pulFlags'],
  // PKCS#11 v3.2 — Session & admin
  C_LoginUser: ['hSession', 'pPin', 'ulPinLen', 'pUsername'],
  C_CopyObject: ['hSession', 'hObject', 'pTemplate', 'ulCount'],
  C_GenerateRandom: ['hSession', 'pRandomData', 'ulRandomLen'],
  C_SeedRandom: ['hSession', 'pSeed', 'ulSeedLen'],
  C_GetFunctionList: ['ppFunctionList'],
  C_GetFunctionStatus: ['hSession'],
  C_CancelFunction: ['hSession'],
  C_WaitForSlotEvent: ['flags', 'pSlot', 'pReserved'],
  C_GetOperationState: ['hSession', 'pOperationState', 'pulOperationStateLen'],
  C_SetOperationState: ['hSession', 'pOperationState', 'ulOperationStateLen', 'hEncryptionKey'],
  // PKCS#11 v3.0 — G2: one-shot message signing begin/next
  C_SignMessageBegin: ['hSession', 'pMechanism', 'hKey'],
  C_SignMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  C_VerifyMessageBegin: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pData'],
  // PKCS#11 v3.0 — G3: AES-GCM message-based encrypt/decrypt
  C_MessageEncryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_EncryptMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_EncryptMessageBegin: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_EncryptMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pPlaintextPart'],
  C_MessageEncryptFinal: ['hSession'],
  C_MessageDecryptInit: ['hSession', 'pMechanism', 'hKey'],
  C_DecryptMessage: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_DecryptMessageBegin: ['hSession', 'pParameter', 'ulParameterLen', 'pAssociatedData'],
  C_DecryptMessageNext: ['hSession', 'pParameter', 'ulParameterLen', 'pCiphertextPart'],
  C_MessageDecryptFinal: ['hSession'],
  // PKCS#11 v3.2 — G4: single-shot signature verify
  C_VerifySignatureInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifySignature: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_VerifySignatureUpdate: ['hSession', 'pPart', 'ulPartLen'],
  C_VerifySignatureFinal: ['hSession', 'pSignature', 'ulSignatureLen'],
  // PKCS#11 v3.2 — G5: authenticated key wrap/unwrap (AES-GCM)
  C_WrapKeyAuthenticated: ['hSession', 'pMechanism', 'hWrappingKey', 'hKey'],
  C_UnwrapKeyAuthenticated: ['hSession', 'pMechanism', 'hUnwrappingKey', 'pWrappedKey'],
  // Recover & compound operations
  C_SignRecover: ['hSession', 'pData', 'ulDataLen', 'pSignature'],
  C_SignRecoverInit: ['hSession', 'pMechanism', 'hKey'],
  C_VerifyRecover: ['hSession', 'pSignature', 'ulSignatureLen', 'pData'],
  C_VerifyRecoverInit: ['hSession', 'pMechanism', 'hKey'],
  C_DigestKey: ['hSession', 'hKey'],
  C_DigestEncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pEncryptedPart'],
  C_DecryptDigestUpdate: ['hSession', 'pEncryptedPart', 'ulEncryptedPartLen', 'pPart'],
  C_SignEncryptUpdate: ['hSession', 'pPart', 'ulPartLen', 'pEncryptedPart'],
  C_DecryptVerifyUpdate: ['hSession', 'pEncryptedPart', 'ulEncryptedPartLen', 'pPart'],
  // PKCS#11 v3.2 — Async operations
  C_AsyncComplete: ['hSession', 'pOperation', 'pResult'],
  C_AsyncGetID: ['hSession', 'pulID'],
  C_AsyncJoin: ['hSession', 'pOperation'],
}

const fmtArg = (v: unknown): string =>
  typeof v === 'number'
    ? v === 0
      ? '0'
      : v < 0x10000
        ? `0x${v.toString(16)}`
        : `0x${(v >>> 0).toString(16)}`
    : String(v)

const fmtArgs = (fnName: string, args: unknown[]): string => {
  const names = PKCS11_PARAMS[fnName]
  if (!names) return args.slice(0, 4).map(fmtArg).join(', ')
  // Show up to 4 named params for readability; append '…' if more
  const shown = Math.min(4, args.length)
  const parts = Array.from(
    { length: shown },
    (_, i) => `${names[i] ?? `arg${i}`}=${fmtArg(args[i])}`
  )
  if (args.length > 4) parts.push('…')
  return parts.join(', ')
}

/**
 * Wraps a SoftHSMModule with a Proxy that intercepts all `_C_*` method calls,
 * logs them with PKCS#11 v3.2-spec parameter names, and returns the result unchanged.
 */
export const createLoggingProxy = (
  M: SoftHSMModule,
  onLog: (entry: Pkcs11LogEntry) => void
): SoftHSMModule => {
  return new Proxy(M, {
    get(target, prop: string | symbol) {
      const val = (target as unknown as Record<string | symbol, unknown>)[prop]
      if (typeof prop === 'string' && prop.startsWith('_C_') && typeof val === 'function') {
        // Strip leading '_' to match the PKCS#11 v3.2 spec function name
        const specName = prop.slice(1) // e.g. 'C_EncapsulateKey'
        return (...args: unknown[]) => {
          const t0 = performance.now()
          const rv = (val as (...a: unknown[]) => number).apply(target, args)
          const ms = Math.round((performance.now() - t0) * 10) / 10
          const rvUnsigned = rv >>> 0
          const ok = rvUnsigned === 0 || rvUnsigned === 0x150 // CKR_OK or CKR_BUFFER_TOO_SMALL (size query)
          const inspect = buildInspect(target, specName, args as number[], rvUnsigned)
          onLog({
            id: ++_logId,
            timestamp: fmtTime(),
            fn: specName,
            args: fmtArgs(specName, args),
            rvHex: `0x${rvUnsigned.toString(16).padStart(8, '0')}`,
            rvName: rvName(rvUnsigned),
            ms,
            ok,
            inspect,
          })
          return rv
        }
      }
      return val
    },
  })
}

// ── Inline PKCS#11 constants ─────────────────────────────────────────────────
// Values from PKCS#11 v3.2 + softhsmv3 constants.js

const CKF_RW_SESSION = 0x0002
const CKF_SERIAL_SESSION = 0x0004
const CKU_SO = 0
const CKU_USER = 1
const CKO_PUBLIC_KEY = 0x02
const CKO_PRIVATE_KEY = 0x03
const CKO_SECRET_KEY = 0x04
const CKK_ML_KEM = 0x49 // PKCS#11 v3.2
const CKK_ML_DSA = 0x4a // PKCS#11 v3.2
const CKM_ML_KEM_KEY_PAIR_GEN = 0x0000000f
const CKM_ML_KEM = 0x00000017
const CKM_ML_DSA_KEY_PAIR_GEN = 0x0000001c
const CKM_ML_DSA = 0x0000001d

// Attributes
const CKA_CLASS = 0x00000000
const CKA_TOKEN = 0x00000001
const CKA_PRIVATE = 0x00000002
const CKA_SENSITIVE = 0x00000103
const CKA_SIGN = 0x00000108
const CKA_VERIFY = 0x0000010a
const CKA_EXTRACTABLE = 0x00000162
const CKA_VALUE_LEN = 0x00000161
const CKA_VALUE = 0x00000011
const CKA_KEY_TYPE = 0x00000100
const CKA_PARAMETER_SET = 0x0000061d
const CKA_ENCAPSULATE = 0x00000633
const CKA_DECAPSULATE = 0x00000634

// ML-DSA pre-hash mechanisms (CKM_HASH_ML_DSA_*, PKCS#11 v3.2 §6.x, pkcs11t.h:1221-1231)
const CKM_HASH_ML_DSA = 0x0000001f // generic: hash specified in CK_HASH_SIGN_ADDITIONAL_CONTEXT
const CKM_HASH_ML_DSA_SHA224 = 0x00000023
const CKM_HASH_ML_DSA_SHA256 = 0x00000024
const CKM_HASH_ML_DSA_SHA384 = 0x00000025
const CKM_HASH_ML_DSA_SHA512 = 0x00000026
const CKM_HASH_ML_DSA_SHA3_224 = 0x00000027
const CKM_HASH_ML_DSA_SHA3_256 = 0x00000028
const CKM_HASH_ML_DSA_SHA3_384 = 0x00000029
const CKM_HASH_ML_DSA_SHA3_512 = 0x0000002a
const CKM_HASH_ML_DSA_SHAKE128 = 0x0000002b
const CKM_HASH_ML_DSA_SHAKE256 = 0x0000002c

// SLH-DSA pre-hash mechanisms (CKM_HASH_SLH_DSA_*, PKCS#11 v3.2 §6.x, pkcs11t.h:1235-1245)
// CKM_HASH_SLH_DSA (generic) already exported below; fixed-hash variants for inline dispatch
const CKM_HASH_SLH_DSA_SHA224 = 0x00000036
const CKM_HASH_SLH_DSA_SHA256 = 0x00000037
const CKM_HASH_SLH_DSA_SHA384 = 0x00000038
const CKM_HASH_SLH_DSA_SHA512 = 0x00000039
const CKM_HASH_SLH_DSA_SHA3_224 = 0x0000003a
const CKM_HASH_SLH_DSA_SHA3_256 = 0x0000003b
const CKM_HASH_SLH_DSA_SHA3_384 = 0x0000003c
const CKM_HASH_SLH_DSA_SHA3_512 = 0x0000003d
const CKM_HASH_SLH_DSA_SHAKE128 = 0x0000003e
const CKM_HASH_SLH_DSA_SHAKE256 = 0x0000003f

// Hedge types (PKCS#11 v3.2)
const CKH_HEDGE_PREFERRED = 0x00000000
const CKH_HEDGE_REQUIRED = 0x00000001
const CKH_DETERMINISTIC_REQUIRED = 0x00000002

// Parameter sets
const CKP_ML_KEM_512 = 0x1
const CKP_ML_KEM_768 = 0x2
const CKP_ML_KEM_1024 = 0x3
const CKP_ML_DSA_44 = 0x1
const CKP_ML_DSA_65 = 0x2
const CKP_ML_DSA_87 = 0x3

const CK_ATTRIBUTE_SIZE = 12 // sizeof(CK_ATTRIBUTE) on 32-bit WASM

// ── Pointer helpers ──────────────────────────────────────────────────────────

const allocUlong = (M: SoftHSMModule): number => M._malloc(4)

const readUlong = (M: SoftHSMModule, ptr: number): number => M.getValue(ptr, 'i32') >>> 0

const writeUlong = (M: SoftHSMModule, ptr: number, val: number): void => M.setValue(ptr, val, 'i32')

const writeStr = (M: SoftHSMModule, s: string): number => {
  const bytes = new TextEncoder().encode(s)
  const ptr = M._malloc(bytes.length + 1)
  M.HEAPU8.set(bytes, ptr)
  M.HEAPU8[ptr + bytes.length] = 0
  return ptr
}

const checkRV = (rv: number, fn: string): void => {
  const u = rv >>> 0
  if (u !== 0) throw new Error(`${fn} → ${rvName(u)} (0x${u.toString(16).padStart(8, '0')})`)
}

// Build a CK_ATTRIBUTE array in WASM memory.
// attrs: [{ type, boolVal? | ulongVal? | bytesPtr?/len? }]
interface AttrDef {
  type: number
  boolVal?: boolean
  ulongVal?: number
  bytesPtr?: number
  bytesLen?: number
}

const buildTemplate = (M: SoftHSMModule, defs: AttrDef[]): { ptr: number; auxPtrs: number[] } => {
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

const freeTemplate = (
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
export const hsm_initialize = (M: SoftHSMModule): void => {
  checkRV(M._C_Initialize(0), 'C_Initialize')
}

/** C_GetSlotList → first slot id (two-step: count then fill) */
export const hsm_getFirstSlot = (M: SoftHSMModule): number => {
  const countPtr = allocUlong(M)
  try {
    // Step 1: pSlotList=NULL → get count (required; passing non-NULL with count=0 → CKR_BUFFER_TOO_SMALL)
    checkRV(M._C_GetSlotList(0, 0, countPtr), 'C_GetSlotList(count)')
    const count = readUlong(M, countPtr)
    if (count === 0) throw new Error('C_GetSlotList: no slots available')
    // Step 2: allocate slot list and fill
    const slotListPtr = M._malloc(count * 4)
    writeUlong(M, countPtr, count)
    try {
      checkRV(M._C_GetSlotList(0, slotListPtr, countPtr), 'C_GetSlotList')
      return readUlong(M, slotListPtr)
    } finally {
      M._free(slotListPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/** C_InitToken → re-enumerate slots → return new slot id */
export const hsm_initToken = (
  M: SoftHSMModule,
  slot: number,
  soPin: string,
  label: string
): number => {
  const labelPtr = M._malloc(32)
  M.HEAPU8.fill(0x20, labelPtr, labelPtr + 32) // blank-pad
  const lb = new TextEncoder().encode(label.slice(0, 32))
  M.HEAPU8.set(lb, labelPtr)
  const pinPtr = writeStr(M, soPin)
  try {
    checkRV(M._C_InitToken(slot, pinPtr, soPin.length, labelPtr), 'C_InitToken')
  } finally {
    M._free(labelPtr)
    M._free(pinPtr)
  }

  // Re-enumerate: initialized token appears in a new slot (two-step)
  const countPtr = allocUlong(M)
  try {
    checkRV(M._C_GetSlotList(1, 0, countPtr), 'C_GetSlotList(initialized,count)')
    const slotCount = readUlong(M, countPtr)
    const slotListPtr = M._malloc(slotCount * 4)
    writeUlong(M, countPtr, slotCount)
    try {
      checkRV(M._C_GetSlotList(1, slotListPtr, countPtr), 'C_GetSlotList(initialized)')
      return readUlong(M, slotListPtr)
    } finally {
      M._free(slotListPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/**
 * Open RW session, log in as SO, init user PIN, re-login as user.
 * Returns hSession.
 */
export const hsm_openUserSession = (
  M: SoftHSMModule,
  slot: number,
  soPin: string,
  userPin: string
): number => {
  const sessionPtr = allocUlong(M)
  try {
    checkRV(
      M._C_OpenSession(slot, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessionPtr),
      'C_OpenSession'
    )
  } catch (e) {
    M._free(sessionPtr)
    throw e
  }
  const hSession = readUlong(M, sessionPtr)
  M._free(sessionPtr)

  // Login as SO to set user PIN
  const soPinPtr = writeStr(M, soPin)
  try {
    checkRV(M._C_Login(hSession, CKU_SO, soPinPtr, soPin.length), 'C_Login(SO)')
  } finally {
    M._free(soPinPtr)
  }

  const userPinPtr = writeStr(M, userPin)
  try {
    checkRV(M._C_InitPIN(hSession, userPinPtr, userPin.length), 'C_InitPIN')
  } finally {
    M._free(userPinPtr)
  }

  checkRV(M._C_Logout(hSession), 'C_Logout')

  // Re-login as normal user
  const uPinPtr = writeStr(M, userPin)
  try {
    checkRV(M._C_Login(hSession, CKU_USER, uPinPtr, userPin.length), 'C_Login(USER)')
  } finally {
    M._free(uPinPtr)
  }

  return hSession
}

const kemParamSet = (variant: 512 | 768 | 1024): number => {
  if (variant === 512) return CKP_ML_KEM_512
  if (variant === 1024) return CKP_ML_KEM_1024
  return CKP_ML_KEM_768
}

const dsaParamSet = (variant: 44 | 65 | 87): number => {
  if (variant === 44) return CKP_ML_DSA_44
  if (variant === 87) return CKP_ML_DSA_87
  return CKP_ML_DSA_65
}

/** Generate an ML-KEM key pair. Returns {pubHandle, privHandle}. */
export const hsm_generateMLKEMKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const ps = kemParamSet(variant)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: false },
    { type: CKA_ENCAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_DECAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(ML-KEM)'
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

/** C_EncapsulateKey → {ciphertextBytes, secretHandle}
 * variant is used to validate the returned ciphertext length. */
export const hsm_encapsulate = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  variant: 512 | 768 | 1024
): { ciphertextBytes: Uint8Array; secretHandle: number } => {
  const expectedCtLen: Record<number, number> = { 512: 768, 768: 1088, 1024: 1568 }
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  // CKA_VALUE_LEN is ck3 (mandatory in OBJECT_OP_GENERATE) for CKK_GENERIC_SECRET.
  // ML-KEM shared secret is always 32 bytes for all parameter sets (FIPS 203 §7).
  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_VALUE_LEN, ulongVal: 32 },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])
  const ctLenPtr = allocUlong(M)
  const secretHPtr = allocUlong(M)

  // First call: size query (ctPtr = 0)
  checkRV(
    M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 4, 0, ctLenPtr, secretHPtr),
    'C_EncapsulateKey(size)'
  )
  const ctLen = readUlong(M, ctLenPtr)
  if (ctLen !== expectedCtLen[variant]) {
    throw new Error(
      `ML-KEM-${variant}: unexpected ciphertext length ${ctLen} (expected ${expectedCtLen[variant]})`
    )
  }
  const ctPtr = M._malloc(ctLen)

  // Second call: actual encapsulation
  try {
    writeUlong(M, ctLenPtr, ctLen)
    checkRV(
      M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 4, ctPtr, ctLenPtr, secretHPtr),
      'C_EncapsulateKey'
    )
    const ciphertextBytes = M.HEAPU8.slice(ctPtr, ctPtr + readUlong(M, ctLenPtr))
    return { ciphertextBytes, secretHandle: readUlong(M, secretHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 4)
    M._free(ctLenPtr)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

/** C_DecapsulateKey → secretHandle
 * variant is used to validate the ciphertext length before calling into WASM. */
export const hsm_decapsulate = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array,
  variant: 512 | 768 | 1024
): number => {
  const expectedCtLen: Record<number, number> = { 512: 768, 768: 1088, 1024: 1568 }
  if (ciphertextBytes.length !== expectedCtLen[variant]) {
    throw new Error(
      `ML-KEM-${variant}: ciphertext length ${ciphertextBytes.length} does not match expected ${expectedCtLen[variant]}`
    )
  }
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  // CKA_VALUE_LEN is ck3 (mandatory in OBJECT_OP_GENERATE) for CKK_GENERIC_SECRET.
  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_VALUE_LEN, ulongVal: 32 },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])

  const ctPtr = M._malloc(ciphertextBytes.length)
  M.HEAPU8.set(ciphertextBytes, ctPtr)
  const secretHPtr = allocUlong(M)

  try {
    checkRV(
      M._C_DecapsulateKey(
        hSession,
        mech,
        privHandle,
        secretTpl.ptr,
        4,
        ctPtr,
        ciphertextBytes.length,
        secretHPtr
      ),
      'C_DecapsulateKey'
    )
    return readUlong(M, secretHPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 4)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

/** C_GetAttributeValue(CKA_VALUE) → Uint8Array */
export const hsm_extractKeyValue = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number
): Uint8Array => {
  // First call: get length
  const lenTpl = buildTemplate(M, [{ type: CKA_VALUE }])
  checkRV(M._C_GetAttributeValue(hSession, keyHandle, lenTpl.ptr, 1), 'C_GetAttributeValue(len)')
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)

  // Second call: get value
  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_VALUE, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(M._C_GetAttributeValue(hSession, keyHandle, valTpl.ptr, 1), 'C_GetAttributeValue')
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}

/** Generate an ML-DSA key pair. Returns {pubHandle, privHandle}. */
export const hsm_generateMLDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const ps = dsaParamSet(variant)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])
  // Per spec §6.67.4: CKA_PARAMETER_SET goes in the public key template only.
  // The mechanism infers the parameter set for the private key from the public key template.
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 7, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(ML-DSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 7)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/**
 * ML-DSA sign/verify options (PKCS#11 v3.2 context string + hedging + pre-hash).
 * All fields optional — defaults to pure ML-DSA with hedge-preferred, no context.
 */
export type MLDSAPreHash =
  | 'sha224'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'shake128'
  | 'shake256'

export interface MLDSASignOptions {
  hedging?: 'preferred' | 'required' | 'deterministic'
  context?: Uint8Array // 0-255 bytes (FIPS 204 max context length)
  preHash?: MLDSAPreHash // all PKCS#11 v3.2 CKM_HASH_ML_DSA_* variants
}

// Map preHash option to CKM mechanism constant (PKCS#11 v3.2 §6.x, FIPS 204 HashML-DSA)
const PREHASH_MECH: Record<string, number> = {
  sha224: CKM_HASH_ML_DSA_SHA224,
  sha256: CKM_HASH_ML_DSA_SHA256,
  sha384: CKM_HASH_ML_DSA_SHA384,
  sha512: CKM_HASH_ML_DSA_SHA512,
  'sha3-224': CKM_HASH_ML_DSA_SHA3_224,
  'sha3-256': CKM_HASH_ML_DSA_SHA3_256,
  'sha3-384': CKM_HASH_ML_DSA_SHA3_384,
  'sha3-512': CKM_HASH_ML_DSA_SHA3_512,
  shake128: CKM_HASH_ML_DSA_SHAKE128,
  shake256: CKM_HASH_ML_DSA_SHAKE256,
}

export type SLHDSAPreHash =
  | 'sha224'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'shake128'
  | 'shake256'

export interface SLHDSASignOptions {
  preHash?: SLHDSAPreHash // all PKCS#11 v3.2 CKM_HASH_SLH_DSA_* variants
}

// Map preHash option to CKM mechanism constant (PKCS#11 v3.2 §6.x, FIPS 205 HashSLH-DSA)
const SLH_DSA_PREHASH_MECH: Record<string, number> = {
  sha224: CKM_HASH_SLH_DSA_SHA224,
  sha256: CKM_HASH_SLH_DSA_SHA256,
  sha384: CKM_HASH_SLH_DSA_SHA384,
  sha512: CKM_HASH_SLH_DSA_SHA512,
  'sha3-224': CKM_HASH_SLH_DSA_SHA3_224,
  'sha3-256': CKM_HASH_SLH_DSA_SHA3_256,
  'sha3-384': CKM_HASH_SLH_DSA_SHA3_384,
  'sha3-512': CKM_HASH_SLH_DSA_SHA3_512,
  shake128: CKM_HASH_SLH_DSA_SHAKE128,
  shake256: CKM_HASH_SLH_DSA_SHAKE256,
}

/**
 * Allocate CK_SIGN_ADDITIONAL_CONTEXT in WASM memory.
 * Layout (WASM32, 12 bytes):
 *   offset 0: CK_HEDGE_TYPE hedgeVariant  (4 bytes)
 *   offset 4: CK_BYTE_PTR  pContext       (4 bytes pointer)
 *   offset 8: CK_ULONG     ulContextLen   (4 bytes)
 * Returns { paramPtr, paramLen, allocPtrs } — caller must free allocPtrs.
 */
const buildSignContext = (
  M: SoftHSMModule,
  opts: MLDSASignOptions
): { paramPtr: number; paramLen: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  const paramPtr = M._malloc(12)
  allocPtrs.push(paramPtr)

  // Hedge variant
  const hedge =
    opts.hedging === 'required'
      ? CKH_HEDGE_REQUIRED
      : opts.hedging === 'deterministic'
        ? CKH_DETERMINISTIC_REQUIRED
        : CKH_HEDGE_PREFERRED
  M.setValue(paramPtr, hedge, 'i32')

  // Context string
  if (opts.context && opts.context.length > 0) {
    const ctxPtr = M._malloc(opts.context.length)
    M.HEAPU8.set(opts.context, ctxPtr)
    allocPtrs.push(ctxPtr)
    M.setValue(paramPtr + 4, ctxPtr, 'i32')
    M.setValue(paramPtr + 8, opts.context.length, 'i32')
  } else {
    M.setValue(paramPtr + 4, 0, 'i32') // pContext = NULL
    M.setValue(paramPtr + 8, 0, 'i32') // ulContextLen = 0
  }

  return { paramPtr, paramLen: 12, allocPtrs }
}

/** C_MessageSignInit(ML-DSA) + C_SignMessage + C_MessageSignFinal → sigBytes (PKCS#11 v3.2) */
export const hsm_sign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  opts?: MLDSASignOptions
): Uint8Array => {
  // Determine mechanism: pure ML-DSA or pre-hash variant
  const mechType = opts?.preHash ? (PREHASH_MECH[opts.preHash] ?? CKM_ML_DSA) : CKM_ML_DSA

  // Build CK_SIGN_ADDITIONAL_CONTEXT if hedging or context specified
  const hasParams = opts && (opts.hedging || (opts.context && opts.context.length > 0))
  const ctxAlloc = hasParams ? buildSignContext(M, opts) : null

  const mech = M._malloc(12)
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, ctxAlloc ? ctxAlloc.paramPtr : 0, 'i32') // pParameter
  M.setValue(mech + 8, ctxAlloc ? ctxAlloc.paramLen : 0, 'i32') // ulParameterLen

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0

  // C_MessageSignInit opens a multi-message signing context — MUST be closed with C_MessageSignFinal
  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit')
  try {
    // First call: size query (pSignature = 0)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, 0, sigLenPtr),
      'C_SignMessage(len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigLenPtr),
      'C_SignMessage'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession, 0, 0, 0, 0) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
    if (ctxAlloc) ctxAlloc.allocPtrs.forEach((p) => M._free(p))
  }
}

/** C_MessageVerifyInit(ML-DSA) + C_VerifyMessage + C_MessageVerifyFinal → boolean (PKCS#11 v3.2) */
export const hsm_verify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  opts?: MLDSASignOptions
): boolean => {
  // Determine mechanism: must match the mechanism used during signing
  const mechType = opts?.preHash ? (PREHASH_MECH[opts.preHash] ?? CKM_ML_DSA) : CKM_ML_DSA

  const hasParams = opts && (opts.hedging || (opts.context && opts.context.length > 0))
  const ctxAlloc = hasParams ? buildSignContext(M, opts) : null

  const mech = M._malloc(12)
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, ctxAlloc ? ctxAlloc.paramPtr : 0, 'i32')
  M.setValue(mech + 8, ctxAlloc ? ctxAlloc.paramLen : 0, 'i32')

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)
  const sigPtr = M._malloc(sigBytes.length)
  M.HEAPU8.set(sigBytes, sigPtr)

  // C_MessageVerifyInit opens a multi-message verify context — MUST be closed with C_MessageVerifyFinal
  checkRV(M._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit')
  try {
    const rv =
      M._C_VerifyMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._C_MessageVerifyFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
    if (ctxAlloc) ctxAlloc.allocPtrs.forEach((p) => M._free(p))
  }
}

/** C_CloseSession + C_Finalize */
export const hsm_finalize = (M: SoftHSMModule, hSession: number): void => {
  try {
    M._C_CloseSession(hSession)
  } catch {
    // ignore
  }
  try {
    M._C_Finalize(0)
  } catch {
    // ignore
  }
}

// ── Additional PKCS#11 constants (exported for HSM panel UI) ─────────────────

// Key types
export const CKK_RSA = 0x00
export const CKK_EC = 0x03
export const CKK_GENERIC_SECRET = 0x10
export const CKK_AES = 0x1f
export const CKK_EC_EDWARDS = 0x40
export const CKK_SLH_DSA = 0x4b

// RSA mechanisms
export const CKM_RSA_PKCS_KEY_PAIR_GEN = 0x00
export const CKM_RSA_PKCS_OAEP = 0x09
export const CKM_SHA256_RSA_PKCS = 0x40
export const CKM_SHA384_RSA_PKCS = 0x41
export const CKM_SHA512_RSA_PKCS = 0x42
export const CKM_SHA256_RSA_PKCS_PSS = 0x43
export const CKM_SHA384_RSA_PKCS_PSS = 0x44
export const CKM_SHA512_RSA_PKCS_PSS = 0x45

// EC mechanisms
export const CKM_EC_KEY_PAIR_GEN = 0x1040
export const CKM_ECDSA_SHA256 = 0x1044
export const CKM_ECDSA_SHA384 = 0x1045
export const CKM_ECDSA_SHA512 = 0x1046
export const CKM_ECDSA_SHA3_224 = 0x1047 // PKCS#11 v3.2 §6.3
export const CKM_ECDSA_SHA3_256 = 0x1048
export const CKM_ECDSA_SHA3_384 = 0x1049
export const CKM_ECDSA_SHA3_512 = 0x104a
export const CKM_ECDH1_DERIVE = 0x1050
export const CKM_EC_EDWARDS_KEY_PAIR_GEN = 0x1055
export const CKM_EDDSA = 0x1057

// PBKDF2 (PKCS#11 v3.2 §5.7.3.1)
export const CKM_PKCS5_PBKD2 = 0x3b0
export const CKP_PKCS5_PBKD2_HMAC_SHA1 = 0x01
export const CKP_PKCS5_PBKD2_HMAC_SHA224 = 0x03
export const CKP_PKCS5_PBKD2_HMAC_SHA256 = 0x04
export const CKP_PKCS5_PBKD2_HMAC_SHA384 = 0x05
export const CKP_PKCS5_PBKD2_HMAC_SHA512 = 0x06

// Symmetric / HMAC / digest mechanisms
export const CKM_GENERIC_SECRET_KEY_GEN = 0x350
export const CKM_AES_KEY_GEN = 0x1080
export const CKM_AES_ECB = 0x1081 // PKCS#11 v3.2 §2.14.1 — MILENAGE f1–f5
export const CKM_AES_CTR = 0x1086 // PKCS#11 v3.2 §2.14.3 — SUCI MSIN encryption (TS 33.501)
export const CKM_AES_CBC_PAD = 0x1085
export const CKM_AES_GCM = 0x1087
export const CKM_AES_CMAC = 0x108a
export const CKM_AES_KEY_WRAP = 0x2109
export const CKM_SHA256_HMAC = 0x251
export const CKM_SHA384_HMAC = 0x261
export const CKM_SHA512_HMAC = 0x271
export const CKM_SHA3_256_HMAC = 0x2b1
export const CKM_SHA3_512_HMAC = 0x2d1
export const CKM_SHA256 = 0x250
export const CKM_SHA384 = 0x260
export const CKM_SHA512 = 0x270
export const CKM_SHA3_256 = 0x2b0
export const CKM_SHA3_512 = 0x2d0

// SLH-DSA mechanisms (PKCS#11 v3.2, FIPS 205, pkcs11t.h:1232-1245)
export const CKM_SLH_DSA_KEY_PAIR_GEN = 0x2d
export const CKM_SLH_DSA = 0x2e
export const CKM_HASH_SLH_DSA = 0x34 // generic: hash in CK_HASH_SIGN_ADDITIONAL_CONTEXT
export const CKM_HASH_SLH_DSA_SHA224 = 0x36
export const CKM_HASH_SLH_DSA_SHA256 = 0x37
export const CKM_HASH_SLH_DSA_SHA384 = 0x38
export const CKM_HASH_SLH_DSA_SHA512 = 0x39
export const CKM_HASH_SLH_DSA_SHA3_224 = 0x3a
export const CKM_HASH_SLH_DSA_SHA3_256 = 0x3b
export const CKM_HASH_SLH_DSA_SHA3_384 = 0x3c
export const CKM_HASH_SLH_DSA_SHA3_512 = 0x3d
export const CKM_HASH_SLH_DSA_SHAKE128 = 0x3e
export const CKM_HASH_SLH_DSA_SHAKE256 = 0x3f

// ML-DSA pre-hash mechanisms — exported for Playground UI (PKCS#11 v3.2, pkcs11t.h:1221-1231)
export const CKM_HASH_ML_DSA = 0x1f
export const CKM_HASH_ML_DSA_SHA224 = 0x23
export const CKM_HASH_ML_DSA_SHA256 = 0x24
export const CKM_HASH_ML_DSA_SHA384 = 0x25
export const CKM_HASH_ML_DSA_SHA512 = 0x26
export const CKM_HASH_ML_DSA_SHA3_224 = 0x27
export const CKM_HASH_ML_DSA_SHA3_256 = 0x28
export const CKM_HASH_ML_DSA_SHA3_384 = 0x29
export const CKM_HASH_ML_DSA_SHA3_512 = 0x2a
export const CKM_HASH_ML_DSA_SHAKE128 = 0x2b
export const CKM_HASH_ML_DSA_SHAKE256 = 0x2c

// SLH-DSA parameter sets — pkcs11t.h ordering (interleaved SHA2/SHAKE per security level)
export const CKP_SLH_DSA_SHA2_128S = 0x01
export const CKP_SLH_DSA_SHAKE_128S = 0x02
export const CKP_SLH_DSA_SHA2_128F = 0x03
export const CKP_SLH_DSA_SHAKE_128F = 0x04
export const CKP_SLH_DSA_SHA2_192S = 0x05
export const CKP_SLH_DSA_SHAKE_192S = 0x06
export const CKP_SLH_DSA_SHA2_192F = 0x07
export const CKP_SLH_DSA_SHAKE_192F = 0x08
export const CKP_SLH_DSA_SHA2_256S = 0x09
export const CKP_SLH_DSA_SHAKE_256S = 0x0a
export const CKP_SLH_DSA_SHA2_256F = 0x0b
export const CKP_SLH_DSA_SHAKE_256F = 0x0c

// Additional attributes
export const CKA_MODULUS = 0x120
export const CKA_MODULUS_BITS = 0x121
export const CKA_PUBLIC_EXPONENT = 0x122
export const CKA_ENCRYPT = 0x104
export const CKA_DECRYPT = 0x105
export const CKA_WRAP = 0x106
export const CKA_UNWRAP = 0x107
export const CKA_DERIVE = 0x10c
export const CKA_EC_PARAMS = 0x180

// SLH-DSA signature and public key sizes (bytes), keyed by CKP_SLH_DSA_* constant
// Ordering follows pkcs11t.h: interleaved SHA2/SHAKE per security level
export const SLH_DSA_SIG_BYTES: Record<number, number> = {
  0x01: 7856, // SHA2-128s
  0x02: 7856, // SHAKE-128s
  0x03: 17088, // SHA2-128f
  0x04: 17088, // SHAKE-128f
  0x05: 16224, // SHA2-192s
  0x06: 16224, // SHAKE-192s
  0x07: 35664, // SHA2-192f
  0x08: 35664, // SHAKE-192f
  0x09: 29792, // SHA2-256s
  0x0a: 29792, // SHAKE-256s
  0x0b: 49856, // SHA2-256f
  0x0c: 49856, // SHAKE-256f
}

export const SLH_DSA_PUB_BYTES: Record<number, number> = {
  0x01: 32, // SHA2-128s
  0x02: 32, // SHAKE-128s
  0x03: 32, // SHA2-128f
  0x04: 32, // SHAKE-128f
  0x05: 48, // SHA2-192s
  0x06: 48, // SHAKE-192s
  0x07: 48, // SHA2-192f
  0x08: 48, // SHAKE-192f
  0x09: 64, // SHA2-256s
  0x0a: 64, // SHAKE-256s
  0x0b: 64, // SHA2-256f
  0x0c: 64, // SHAKE-256f
}

/** Human-readable SLH-DSA parameter set descriptors for UI selectors. */
export const SLH_DSA_PARAM_SETS: Array<{ value: number; label: string; sigBytes: number }> = [
  { value: 0x01, label: 'SLH-DSA-SHA2-128s', sigBytes: 7856 },
  { value: 0x02, label: 'SLH-DSA-SHAKE-128s', sigBytes: 7856 },
  { value: 0x03, label: 'SLH-DSA-SHA2-128f', sigBytes: 17088 },
  { value: 0x04, label: 'SLH-DSA-SHAKE-128f', sigBytes: 17088 },
  { value: 0x05, label: 'SLH-DSA-SHA2-192s', sigBytes: 16224 },
  { value: 0x06, label: 'SLH-DSA-SHAKE-192s', sigBytes: 16224 },
  { value: 0x07, label: 'SLH-DSA-SHA2-192f', sigBytes: 35664 },
  { value: 0x08, label: 'SLH-DSA-SHAKE-192f', sigBytes: 35664 },
  { value: 0x09, label: 'SLH-DSA-SHA2-256s', sigBytes: 29792 },
  { value: 0x0a, label: 'SLH-DSA-SHAKE-256s', sigBytes: 29792 },
  { value: 0x0b, label: 'SLH-DSA-SHA2-256f', sigBytes: 49856 },
  { value: 0x0c, label: 'SLH-DSA-SHAKE-256f', sigBytes: 49856 },
]

// ── Internal crypto constants ─────────────────────────────────────────────────

// MGF types (RSA-OAEP / PSS)
const CKG_MGF1_SHA256_NEW = 0x00000002
const CKG_MGF1_SHA384_NEW = 0x00000003
const CKG_MGF1_SHA512_NEW = 0x00000004
const CKZ_DATA_SPECIFIED = 0x00000001
const CKD_NULL = 0x00000001
export const CKD_SHA1_KDF = 0x00000002 // ANSI X9.63 KDF with SHA-1
export const CKD_SHA256_KDF = 0x00000006 // ANSI X9.63 KDF with SHA-256 (SUCI Profile A/B)
export const CKD_SHA384_KDF = 0x00000007 // ANSI X9.63 KDF with SHA-384
export const CKD_SHA512_KDF = 0x00000008 // ANSI X9.63 KDF with SHA-512

// HKDF derive (PKCS#11 v3.0+ §2.43)
export const CKM_HKDF_DERIVE = 0x0000402a // PKCS#11 v3.0 §2.43
export const CKF_HKDF_SALT_NULL = 0x00000001 // No salt
export const CKF_HKDF_SALT_DATA = 0x00000002 // Salt as explicit bytes

// NIST SP 800-108 KBKDF (PKCS#11 v3.2 §2.44)
export const CKM_SP800_108_COUNTER_KDF = 0x000003ac // Counter mode KBKDF
export const CKM_SP800_108_FEEDBACK_KDF = 0x000003ad // Feedback mode KBKDF
export const CKM_SP800_108_DOUBLE_PIPELINE_KDF = 0x000003ae // Double-pipeline KBKDF
// CK_PRF_DATA_TYPE constants (CK_SP800_108_* in PKCS#11 v3.2 §2.44)
export const CK_SP800_108_ITERATION_VARIABLE = 0x00000001 // Counter/IV position marker
export const CK_SP800_108_BYTE_ARRAY = 0x00000004 // Arbitrary byte data (label/context)

// DER-encoded NamedCurve OID bytes used as CKA_EC_PARAMS value
const EC_OID_P256 = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])
const EC_OID_P384 = new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22])
const EC_OID_P521 = new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23])
const EC_OID_ED25519 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x70])
const EC_OID_ED448 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x71])

// ── Additional WASM memory helpers ───────────────────────────────────────────

/** Allocate and fill a CK_MECHANISM struct (12 bytes) in WASM heap. */
const buildMech = (M: SoftHSMModule, type: number, paramPtr = 0, paramLen = 0): number => {
  const mech = M._malloc(12)
  M.setValue(mech, type, 'i32')
  M.setValue(mech + 4, paramPtr, 'i32')
  M.setValue(mech + 8, paramLen, 'i32')
  return mech
}

/** Copy bytes into WASM heap; returns pointer. Caller must free. */
const writeBytes = (M: SoftHSMModule, bytes: Uint8Array): number => {
  const ptr = M._malloc(bytes.length || 1)
  if (bytes.length) M.HEAPU8.set(bytes, ptr)
  return ptr
}

/** Build CK_RSA_PKCS_OAEP_PARAMS (20 bytes) in WASM heap. */
const buildOAEPParams = (
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
const buildPSSParams = (M: SoftHSMModule, mechType: number): { ptr: number; len: number } => {
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
const buildGCMParams = (
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
const buildECDH1DeriveParams = (
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

// ── RSA helpers ───────────────────────────────────────────────────────────────

/** Generate an RSA key pair via CKM_RSA_PKCS_KEY_PAIR_GEN. */
export const hsm_generateRSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  keyBits: 1024 | 2048 | 3072 | 4096
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const exp = new Uint8Array([0x01, 0x00, 0x01]) // e=65537
  const expPtr = writeBytes(M, exp)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_MODULUS_BITS, ulongVal: keyBits },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: 3 },
    { type: CKA_ENCRYPT, boolVal: true },
    { type: CKA_VERIFY, boolVal: true },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_DECRYPT, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 7, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(RSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(expPtr)
    freeTemplate(M, pubTpl, 7)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** RSA sign via C_SignInit + C_Sign (PKCS#1 v1.5 or PSS). */
export const hsm_rsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  mechType: number = CKM_SHA256_RSA_PKCS
): Uint8Array => {
  const isPSS =
    mechType === CKM_SHA256_RSA_PKCS_PSS ||
    mechType === CKM_SHA384_RSA_PKCS_PSS ||
    mechType === CKM_SHA512_RSA_PKCS_PSS
  let pssParams: { ptr: number; len: number } | null = null
  if (isPSS) pssParams = buildPSSParams(M, mechType)
  const mech = buildMech(M, mechType, pssParams?.ptr ?? 0, pssParams?.len ?? 0)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(RSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(RSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(RSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
    if (pssParams) M._free(pssParams.ptr)
  }
}

/** RSA verify via C_VerifyInit + C_Verify. Returns true if valid. */
export const hsm_rsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  mechType: number = CKM_SHA256_RSA_PKCS
): boolean => {
  const isPSS =
    mechType === CKM_SHA256_RSA_PKCS_PSS ||
    mechType === CKM_SHA384_RSA_PKCS_PSS ||
    mechType === CKM_SHA512_RSA_PKCS_PSS
  let pssParams: { ptr: number; len: number } | null = null
  if (isPSS) pssParams = buildPSSParams(M, mechType)
  const mech = buildMech(M, mechType, pssParams?.ptr ?? 0, pssParams?.len ?? 0)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(RSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
    if (pssParams) M._free(pssParams.ptr)
  }
}

/** RSA-OAEP encrypt via C_EncryptInit + C_Encrypt. */
export const hsm_rsaEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  plaintext: string,
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): Uint8Array => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const plain = new TextEncoder().encode(plaintext)
  const plainPtr = writeBytes(M, plain)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, pubHandle), 'C_EncryptInit(RSA-OAEP)')
    checkRV(M._C_Encrypt(hSession, plainPtr, plain.length, 0, outLenPtr), 'C_Encrypt(RSA-OAEP,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Encrypt(hSession, plainPtr, plain.length, outPtr, outLenPtr),
      'C_Encrypt(RSA-OAEP)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(oaepParams.ptr)
    M._free(plainPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/** RSA-OAEP decrypt via C_DecryptInit + C_Decrypt. */
export const hsm_rsaDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertext: Uint8Array,
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): Uint8Array => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const ctPtr = writeBytes(M, ciphertext)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, privHandle), 'C_DecryptInit(RSA-OAEP)')
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr),
      'C_Decrypt(RSA-OAEP,len)'
    )
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr),
      'C_Decrypt(RSA-OAEP)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(oaepParams.ptr)
    M._free(ctPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

// ── EC / ECDSA / ECDH helpers ─────────────────────────────────────────────────

const ecCurveOID = (curve: 'P-256' | 'P-384' | 'P-521'): Uint8Array => {
  if (curve === 'P-384') return EC_OID_P384
  if (curve === 'P-521') return EC_OID_P521
  return EC_OID_P256
}

/** Generate an EC key pair (P-256, P-384, or P-521) for ECDSA and ECDH. */
export const hsm_generateECKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384' | 'P-521'
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_EC_KEY_PAIR_GEN)
  const oid = ecCurveOID(curve)
  const oidPtr = writeBytes(M, oid)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DERIVE, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(EC)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** ECDSA sign via C_SignInit + C_Sign. mechType defaults to CKM_ECDSA_SHA256. */
export const hsm_ecdsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  mechType: number = CKM_ECDSA_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(ECDSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(ECDSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(ECDSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** ECDSA verify via C_VerifyInit + C_Verify. Returns true if valid. */
export const hsm_ecdsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  mechType: number = CKM_ECDSA_SHA256
): boolean => {
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(ECDSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/**
 * ECDH1 key derivation via C_DeriveKey (PKCS#11 v3.2 §2.3.5).
 * peerPubBytes: DER-encoded EC point from peer's CKA_EC_POINT attribute.
 * kdf: CKD_NULL (raw Z, default) or CKD_SHA256_KDF etc. for ANSI X9.63 KDF.
 * sharedData: optional SharedInfo for X9.63 KDF (e.g. ephemeral public key for SUCI deconcealment).
 * keyLen: derived key length in bytes (default 32).
 * Returns handle to derived generic secret key.
 */
export const hsm_ecdhDerive = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  peerPubBytes: Uint8Array,
  kdf: number = CKD_NULL,
  sharedData?: Uint8Array,
  keyLen = 32
): number => {
  const dp = buildECDH1DeriveParams(M, peerPubBytes, kdf, sharedData)
  const mech = buildMech(M, CKM_ECDH1_DERIVE, dp.ptr, dp.len)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, privHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(ECDH1)'
    )
    return readUlong(M, derivedHPtr)
  } finally {
    M._free(mech)
    dp.allocPtrs.forEach((p) => M._free(p))
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

// ── PBKDF2 helpers ────────────────────────────────────────────────────────────

/**
 * PBKDF2 key derivation via C_DeriveKey(CKM_PKCS5_PBKD2) (PKCS#11 v3.2 §5.7.3.1).
 * prf defaults to CKP_PKCS5_PBKD2_HMAC_SHA512 (BIP39 / SLIP-0010 standard).
 * Returns a Uint8Array of the derived key bytes.
 */
export const hsm_pbkdf2 = (
  M: SoftHSMModule,
  hSession: number,
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLen: number,
  prf: number = CKP_PKCS5_PBKD2_HMAC_SHA512
): Uint8Array => {
  const CKZ_SALT_SPECIFIED = 0x00000001
  const saltPtr = M._malloc(Math.max(salt.length, 1))
  if (salt.length > 0) M.HEAPU8.set(salt, saltPtr)
  const passPtr = M._malloc(Math.max(password.length, 1))
  if (password.length > 0) M.HEAPU8.set(password, passPtr)

  // CK_PKCS5_PBKD2_PARAMS2: 9 × CK_ULONG/CK_VOID_PTR (4 bytes each) = 36 bytes
  const params = M._malloc(36)
  M.setValue(params + 0, CKZ_SALT_SPECIFIED, 'i32') // saltSource
  M.setValue(params + 4, saltPtr, 'i32') // pSaltSourceData
  M.setValue(params + 8, salt.length, 'i32') // ulSaltSourceDataLen
  M.setValue(params + 12, iterations, 'i32') // iterations
  M.setValue(params + 16, prf, 'i32') // prf
  M.setValue(params + 20, 0, 'i32') // pPrfData (null)
  M.setValue(params + 24, 0, 'i32') // ulPrfDataLen
  M.setValue(params + 28, passPtr, 'i32') // pPassword
  M.setValue(params + 32, password.length, 'i32') // ulPasswordLen

  const mech = buildMech(M, CKM_PKCS5_PBKD2, params, 36)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, 0, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(PBKDF2)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(params)
    M._free(saltPtr)
    M._free(passPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

// ── HKDF helpers ──────────────────────────────────────────────────────────────

/**
 * HKDF key derivation via C_DeriveKey(CKM_HKDF_DERIVE) (PKCS#11 v3.0+ §2.43).
 *
 * @param baseKeyHandle  Key handle providing IKM (input key material).
 * @param prf            Hash mechanism for HMAC PRF: CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_SHA3_256 | CKM_SHA3_512
 * @param bExtract       Run HKDF-Extract step (use true for full HKDF or extract-only).
 * @param bExpand        Run HKDF-Expand step (use true for full HKDF or expand-only).
 * @param salt           Optional salt bytes (CKF_HKDF_SALT_DATA). Omit for CKF_HKDF_SALT_NULL.
 * @param info           Optional context/info bytes for HKDF-Expand.
 * @param keyLen         Output key length in bytes (default 32). Must be ≤ 512.
 * @returns Derived key bytes (Uint8Array of length keyLen).
 *
 * CK_HKDF_PARAMS layout in WASM (32 bytes total, 32-bit pointers):
 *   +0  CK_BBOOL bExtract        (1 byte, offset 0)
 *   +1  CK_BBOOL bExpand         (1 byte, offset 1)
 *   +2  padding                  (2 bytes)
 *   +4  CK_MECHANISM_TYPE prf    (4 bytes)
 *   +8  CK_ULONG ulSaltType      (4 bytes)
 *   +12 CK_BYTE_PTR pSalt        (4 bytes)
 *   +16 CK_ULONG ulSaltLen       (4 bytes)
 *   +20 CK_OBJECT_HANDLE hSaltKey(4 bytes)
 *   +24 CK_BYTE_PTR pInfo        (4 bytes)
 *   +28 CK_ULONG ulInfoLen       (4 bytes)
 */
export const hsm_hkdf = (
  M: SoftHSMModule,
  hSession: number,
  baseKeyHandle: number,
  prf: number,
  bExtract: boolean,
  bExpand: boolean,
  salt?: Uint8Array,
  info?: Uint8Array,
  keyLen = 32
): Uint8Array => {
  const saltPtr = salt && salt.length > 0 ? writeBytes(M, salt) : 0
  const infoPtr = info && info.length > 0 ? writeBytes(M, info) : 0
  const saltType = saltPtr > 0 ? CKF_HKDF_SALT_DATA : CKF_HKDF_SALT_NULL

  // Allocate and zero the 32-byte CK_HKDF_PARAMS struct
  const params = M._malloc(32)
  M.HEAPU8.fill(0, params, params + 32)
  M.HEAPU8[params + 0] = bExtract ? 1 : 0 // bExtract
  M.HEAPU8[params + 1] = bExpand ? 1 : 0 // bExpand
  M.setValue(params + 4, prf, 'i32') // prfHashMechanism
  M.setValue(params + 8, saltType, 'i32') // ulSaltType
  M.setValue(params + 12, saltPtr, 'i32') // pSalt
  M.setValue(params + 16, salt ? salt.length : 0, 'i32') // ulSaltLen
  M.setValue(params + 20, 0, 'i32') // hSaltKey (unused)
  M.setValue(params + 24, infoPtr, 'i32') // pInfo
  M.setValue(params + 28, info ? info.length : 0, 'i32') // ulInfoLen

  const mech = buildMech(M, CKM_HKDF_DERIVE, params, 32)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseKeyHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(HKDF)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(params)
    if (saltPtr) M._free(saltPtr)
    if (infoPtr) M._free(infoPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

/**
 * NIST SP 800-108 Counter KDF via C_DeriveKey(CKM_SP800_108_COUNTER_KDF) (PKCS#11 v3.2 §2.44).
 *
 * Builds a minimal CK_SP800_108_KDF_PARAMS with:
 *   - prfType: HMAC-SHA256 (CKM_SHA256_HMAC) or AES-CMAC (CKM_AES_CMAC)
 *   - Data params: [ITERATION_VARIABLE(32-bit counter)] + optional [BYTE_ARRAY(fixedInput)]
 *
 * @param M             SoftHSM WASM module
 * @param hSession      Session handle
 * @param baseKeyHandle Key handle for the base key (Ki)
 * @param prfType       PRF mechanism (e.g. CKM_SHA256_HMAC or CKM_AES_CMAC)
 * @param fixedInput    Optional label/context bytes concatenated as fixed input
 * @param keyLen        Output key length in bytes (must match CKA_VALUE_LEN in template)
 * @returns             Derived key bytes as Uint8Array
 */
export const hsm_kbkdf = (
  M: SoftHSMModule,
  hSession: number,
  baseKeyHandle: number,
  prfType: number,
  fixedInput?: Uint8Array,
  keyLen = 32
): Uint8Array => {
  // CK_SP800_108_COUNTER_FORMAT: bLittleEndian(CK_BBOOL=1B) + pad(3B) + ulWidthInBits(CK_ULONG=4B) = 8 bytes
  const counterFmt = M._malloc(8)
  M.HEAPU8[counterFmt + 0] = 0 // bLittleEndian = CK_FALSE (big-endian)
  M.HEAPU8[counterFmt + 1] = 0
  M.HEAPU8[counterFmt + 2] = 0
  M.HEAPU8[counterFmt + 3] = 0
  M.setValue(counterFmt + 4, 32, 'i32') // ulWidthInBits = 32

  // CK_PRF_DATA_PARAM: type(4B) + pValue ptr(4B) + ulValueLen(4B) = 12 bytes each
  const numParams = fixedInput && fixedInput.length > 0 ? 2 : 1
  const dataParams = M._malloc(numParams * 12)

  // Param[0]: ITERATION_VARIABLE with counter format
  M.setValue(dataParams + 0, CK_SP800_108_ITERATION_VARIABLE, 'i32')
  M.setValue(dataParams + 4, counterFmt, 'i32')
  M.setValue(dataParams + 8, 8, 'i32')

  let fixedPtr = 0
  if (fixedInput && fixedInput.length > 0) {
    fixedPtr = M._malloc(fixedInput.length)
    M.HEAPU8.set(fixedInput, fixedPtr)
    // Param[1]: BYTE_ARRAY with fixed input (label/context)
    M.setValue(dataParams + 12, CK_SP800_108_BYTE_ARRAY, 'i32')
    M.setValue(dataParams + 16, fixedPtr, 'i32')
    M.setValue(dataParams + 20, fixedInput.length, 'i32')
  }

  // CK_SP800_108_KDF_PARAMS: prfType(4B) + ulNumberOfDataParams(4B) + pDataParams ptr(4B)
  //                        + ulAdditionalDerivedKeys(4B) + pAdditionalDerivedKeys ptr(4B) = 20 bytes
  const kdfParams = M._malloc(20)
  M.setValue(kdfParams + 0, prfType, 'i32')
  M.setValue(kdfParams + 4, numParams, 'i32')
  M.setValue(kdfParams + 8, dataParams, 'i32')
  M.setValue(kdfParams + 12, 0, 'i32') // ulAdditionalDerivedKeys = 0
  M.setValue(kdfParams + 16, 0, 'i32') // pAdditionalDerivedKeys = NULL

  const mech = buildMech(M, CKM_SP800_108_COUNTER_KDF, kdfParams, 20)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseKeyHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(SP800-108 Counter KDF)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(kdfParams)
    M._free(dataParams)
    M._free(counterFmt)
    if (fixedPtr) M._free(fixedPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

// ── EdDSA helpers ─────────────────────────────────────────────────────────────

/** Generate an EdDSA key pair (Ed25519 or Ed448). */
export const hsm_generateEdDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  curve: 'Ed25519' | 'Ed448'
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_EC_EDWARDS_KEY_PAIR_GEN)
  const oid = curve === 'Ed448' ? EC_OID_ED448 : EC_OID_ED25519
  const oidPtr = writeBytes(M, oid)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_EDWARDS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_VERIFY, boolVal: true },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_EDWARDS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 7, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(EdDSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 7)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** EdDSA sign via C_SignInit(CKM_EDDSA) + C_Sign. */
export const hsm_eddsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string
): Uint8Array => {
  const mech = buildMech(M, CKM_EDDSA)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(EdDSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(EdDSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(EdDSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** EdDSA verify via C_VerifyInit(CKM_EDDSA) + C_Verify. Returns true if valid. */
export const hsm_eddsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array
): boolean => {
  const mech = buildMech(M, CKM_EDDSA)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(EdDSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

// ── AES helpers ───────────────────────────────────────────────────────────────

/** Generate an AES symmetric key (128/192/256 bits). Returns CKO_SECRET_KEY handle. */
export const hsm_generateAESKey = (
  M: SoftHSMModule,
  hSession: number,
  keyBits: 128 | 192 | 256
): number => {
  const mech = buildMech(M, CKM_AES_KEY_GEN)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: true },
    { type: CKA_DECRYPT, boolVal: true },
    { type: CKA_WRAP, boolVal: true },
    { type: CKA_UNWRAP, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyBits / 8 },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_GenerateKey(hSession, mech, tpl.ptr, 10, hKeyPtr), 'C_GenerateKey(AES)')
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, tpl, 10)
    M._free(hKeyPtr)
  }
}

/**
 * AES encrypt (GCM or CBC-PAD). A random IV is generated internally.
 * GCM output: ciphertext bytes include the 16-byte auth tag appended by SoftHSM.
 * Returns { ciphertext, iv }.
 */
export const hsm_aesEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  plaintext: Uint8Array,
  mode: 'gcm' | 'cbc' = 'gcm'
): { ciphertext: Uint8Array; iv: Uint8Array } => {
  const iv = new Uint8Array(mode === 'gcm' ? 12 : 16)
  crypto.getRandomValues(iv)
  let mech: number
  const allocPtrs: number[] = []
  if (mode === 'gcm') {
    const gcmP = buildGCMParams(M, iv)
    gcmP.allocPtrs.forEach((p) => allocPtrs.push(p))
    mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  } else {
    const ivPtr = writeBytes(M, iv)
    allocPtrs.push(ivPtr)
    mech = buildMech(M, CKM_AES_CBC_PAD, ivPtr, 16)
  }
  const plainPtr = writeBytes(M, plaintext)
  allocPtrs.push(plainPtr)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, keyHandle), 'C_EncryptInit(AES)')
    checkRV(M._C_Encrypt(hSession, plainPtr, plaintext.length, 0, outLenPtr), 'C_Encrypt(AES,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Encrypt(hSession, plainPtr, plaintext.length, outPtr, outLenPtr), 'C_Encrypt(AES)')
    return { ciphertext: M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr)), iv }
  } finally {
    M._free(mech)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
    allocPtrs.forEach((p) => M._free(p))
  }
}

/**
 * AES decrypt (GCM or CBC-PAD).
 * For GCM: ciphertext must include the 16-byte auth tag at the end (as returned by hsm_aesEncrypt).
 */
export const hsm_aesDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  mode: 'gcm' | 'cbc' = 'gcm'
): Uint8Array => {
  let mech: number
  const allocPtrs: number[] = []
  if (mode === 'gcm') {
    const gcmP = buildGCMParams(M, iv)
    gcmP.allocPtrs.forEach((p) => allocPtrs.push(p))
    mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  } else {
    const ivPtr = writeBytes(M, iv)
    allocPtrs.push(ivPtr)
    mech = buildMech(M, CKM_AES_CBC_PAD, ivPtr, 16)
  }
  const ctPtr = writeBytes(M, ciphertext)
  allocPtrs.push(ctPtr)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, keyHandle), 'C_DecryptInit(AES)')
    checkRV(M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr), 'C_Decrypt(AES,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr), 'C_Decrypt(AES)')
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
    allocPtrs.forEach((p) => M._free(p))
  }
}

/** AES-CMAC via C_SignInit(CKM_AES_CMAC) + C_Sign. Returns 16-byte MAC. */
export const hsm_aesCmac = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_AES_CMAC)
  const dataPtr = writeBytes(M, data)
  const macLenPtr = allocUlong(M)
  let macPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, keyHandle), 'C_SignInit(AES-CMAC)')
    checkRV(M._C_Sign(hSession, dataPtr, data.length, 0, macLenPtr), 'C_Sign(AES-CMAC,len)')
    const macLen = readUlong(M, macLenPtr)
    macPtr = M._malloc(macLen)
    writeUlong(M, macLenPtr, macLen)
    checkRV(M._C_Sign(hSession, dataPtr, data.length, macPtr, macLenPtr), 'C_Sign(AES-CMAC)')
    return M.HEAPU8.slice(macPtr, macPtr + readUlong(M, macLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macLenPtr)
    if (macPtr) M._free(macPtr)
  }
}

/**
 * AES-CTR encrypt via C_EncryptInit(CKM_AES_CTR) + C_Encrypt.
 * CK_AES_CTR_PARAMS: ulCounterBits (4 bytes) + cb[16] (counter block / IV).
 * For SUCI (TS 33.501): counterBits=128, ctrIv=16×0x00 (zero IV).
 */
export const hsm_aesCtrEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ctrIv: Uint8Array,
  counterBits: number,
  data: Uint8Array
): Uint8Array => {
  // Build CK_AES_CTR_PARAMS (20 bytes): ulCounterBits[4] + cb[16]
  const paramsPtr = M._malloc(20)
  M.setValue(paramsPtr, counterBits, 'i32') // ulCounterBits
  M.HEAPU8.set(ctrIv.slice(0, 16), paramsPtr + 4) // cb[16]
  const mech = buildMech(M, CKM_AES_CTR, paramsPtr, 20)
  const dataPtr = writeBytes(M, data)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, keyHandle), 'C_EncryptInit(AES-CTR)')
    checkRV(M._C_Encrypt(hSession, dataPtr, data.length, 0, outLenPtr), 'C_Encrypt(AES-CTR,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Encrypt(hSession, dataPtr, data.length, outPtr, outLenPtr), 'C_Encrypt(AES-CTR)')
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(paramsPtr)
    M._free(dataPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/**
 * AES-CTR decrypt via C_DecryptInit(CKM_AES_CTR) + C_Decrypt.
 * CTR mode is symmetric — encrypt and decrypt use the same operation.
 */
export const hsm_aesCtrDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ctrIv: Uint8Array,
  counterBits: number,
  ciphertext: Uint8Array
): Uint8Array => {
  const paramsPtr = M._malloc(20)
  M.setValue(paramsPtr, counterBits, 'i32')
  M.HEAPU8.set(ctrIv.slice(0, 16), paramsPtr + 4)
  const mech = buildMech(M, CKM_AES_CTR, paramsPtr, 20)
  const ctPtr = writeBytes(M, ciphertext)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, keyHandle), 'C_DecryptInit(AES-CTR)')
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr),
      'C_Decrypt(AES-CTR,len)'
    )
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr),
      'C_Decrypt(AES-CTR)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(paramsPtr)
    M._free(ctPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/** Wrap a key with an AES wrapping key via C_WrapKey(CKM_AES_KEY_WRAP). */
export const hsm_aesWrapKey = (
  M: SoftHSMModule,
  hSession: number,
  wrappingHandle: number,
  targetHandle: number
): Uint8Array => {
  const mech = buildMech(M, CKM_AES_KEY_WRAP)
  const wrappedLenPtr = allocUlong(M)
  let wrappedPtr = 0
  try {
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingHandle, targetHandle, 0, wrappedLenPtr),
      'C_WrapKey(len)'
    )
    const wrappedLen = readUlong(M, wrappedLenPtr)
    wrappedPtr = M._malloc(wrappedLen)
    writeUlong(M, wrappedLenPtr, wrappedLen)
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingHandle, targetHandle, wrappedPtr, wrappedLenPtr),
      'C_WrapKey'
    )
    return M.HEAPU8.slice(wrappedPtr, wrappedPtr + readUlong(M, wrappedLenPtr))
  } finally {
    M._free(mech)
    M._free(wrappedLenPtr)
    if (wrappedPtr) M._free(wrappedPtr)
  }
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

/** Generate an HMAC key (generic secret). keyBytes defaults to 32 (256-bit). */
export const hsm_generateHMACKey = (M: SoftHSMModule, hSession: number, keyBytes = 32): number => {
  const mech = buildMech(M, CKM_GENERIC_SECRET_KEY_GEN)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyBytes },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_GenerateKey(hSession, mech, tpl.ptr, 8, hKeyPtr), 'C_GenerateKey(HMAC)')
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, tpl, 8)
    M._free(hKeyPtr)
  }
}

/** Compute HMAC via C_SignInit + C_Sign. mechType: CKM_SHA256_HMAC, etc. */
export const hsm_hmac = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mechType: number = CKM_SHA256_HMAC
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macLenPtr = allocUlong(M)
  let macPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, keyHandle), 'C_SignInit(HMAC)')
    checkRV(M._C_Sign(hSession, dataPtr, data.length, 0, macLenPtr), 'C_Sign(HMAC,len)')
    const macLen = readUlong(M, macLenPtr)
    macPtr = M._malloc(macLen)
    writeUlong(M, macLenPtr, macLen)
    checkRV(M._C_Sign(hSession, dataPtr, data.length, macPtr, macLenPtr), 'C_Sign(HMAC)')
    return M.HEAPU8.slice(macPtr, macPtr + readUlong(M, macLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macLenPtr)
    if (macPtr) M._free(macPtr)
  }
}

/** Verify HMAC via C_VerifyInit + C_Verify. Returns true if MAC matches. */
export const hsm_hmacVerify = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mac: Uint8Array,
  mechType: number = CKM_SHA256_HMAC
): boolean => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macPtr = writeBytes(M, mac)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, keyHandle), 'C_VerifyInit(HMAC)')
    const rv = M._C_Verify(hSession, dataPtr, data.length, macPtr, mac.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macPtr)
  }
}

// ── SHA digest helper ─────────────────────────────────────────────────────────

/**
 * Compute a SHA digest via C_DigestInit + C_Digest (two-step: size query then actual).
 * mechType: CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_SHA3_256 | CKM_SHA3_512
 */
export const hsm_digest = (
  M: SoftHSMModule,
  hSession: number,
  data: Uint8Array,
  mechType: number = CKM_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const digestLenPtr = allocUlong(M)
  let digestPtr = 0
  try {
    checkRV(M._C_DigestInit(hSession, mech), 'C_DigestInit')
    // Size query: pDigest=0 returns required length without advancing state (PKCS#11 §5.2)
    checkRV(M._C_Digest(hSession, dataPtr, data.length, 0, digestLenPtr), 'C_Digest(len)')
    const digestLen = readUlong(M, digestLenPtr)
    digestPtr = M._malloc(digestLen)
    writeUlong(M, digestLenPtr, digestLen)
    checkRV(M._C_Digest(hSession, dataPtr, data.length, digestPtr, digestLenPtr), 'C_Digest')
    return M.HEAPU8.slice(digestPtr, digestPtr + readUlong(M, digestLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(digestLenPtr)
    if (digestPtr) M._free(digestPtr)
  }
}

// ── SLH-DSA helpers ───────────────────────────────────────────────────────────

/**
 * Generate an SLH-DSA key pair.
 * paramSet: one of the CKP_SLH_DSA_* constants (defaults to SHA2-128s).
 */
export const hsm_generateSLHDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet: number = CKP_SLH_DSA_SHA2_128S
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_SLH_DSA_KEY_PAIR_GEN)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 7, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(SLH-DSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 7)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/**
 * SLH-DSA sign via C_MessageSignInit + C_SignMessage + C_MessageSignFinal (PKCS#11 v3.2).
 * Supports both pure SLH-DSA (CKM_SLH_DSA) and pre-hash variants (CKM_HASH_SLH_DSA_*).
 * opts.preHash selects a fixed-hash variant per FIPS 205 HashSLH-DSA; omit for pure mode.
 */
export const hsm_slhdsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  opts?: SLHDSASignOptions
): Uint8Array => {
  const mechType = opts?.preHash ? (SLH_DSA_PREHASH_MECH[opts.preHash] ?? CKM_SLH_DSA) : CKM_SLH_DSA
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit(SLH-DSA)')
  try {
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, 0, sigLenPtr),
      'C_SignMessage(SLH-DSA,len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigLenPtr),
      'C_SignMessage(SLH-DSA)'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession, 0, 0, 0, 0) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/**
 * SLH-DSA verify via C_MessageVerifyInit + C_VerifyMessage + C_MessageVerifyFinal (PKCS#11 v3.2).
 * opts.preHash must match the mechanism used during signing.
 */
export const hsm_slhdsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  opts?: SLHDSASignOptions
): boolean => {
  const mechType = opts?.preHash ? (SLH_DSA_PREHASH_MECH[opts.preHash] ?? CKM_SLH_DSA) : CKM_SLH_DSA
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  checkRV(M._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit(SLH-DSA)')
  try {
    const rv =
      M._C_VerifyMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._C_MessageVerifyFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}
