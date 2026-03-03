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
  0x000000a0: 'CKR_MECHANISM_INVALID',
  0x000000b0: 'CKR_OBJECT_HANDLE_INVALID',
  0x000000c0: 'CKR_SIGNATURE_INVALID',
  0x000000c1: 'CKR_SIGNATURE_LEN_RANGE',
  0x000000d0: 'CKR_TEMPLATE_INCOMPLETE',
  0x000000d1: 'CKR_TEMPLATE_INCONSISTENT',
  0x000000e0: 'CKR_TOKEN_NOT_PRESENT',
  0x000000f0: 'CKR_USER_NOT_LOGGED_IN',
  0x00000100: 'CKR_USER_ALREADY_LOGGED_IN',
  0x00000150: 'CKR_SESSION_HANDLE_INVALID',
  0x00000180: 'CKR_KEY_HANDLE_INVALID',
  0x00000190: 'CKR_BUFFER_TOO_SMALL',
}

const rvName = (rv: number): string => RV_NAMES[rv] ?? `0x${rv.toString(16).padStart(8, '0')}`

const fmtTime = (): string => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

/**
 * Wraps a SoftHSMModule with a Proxy that intercepts all `_C_*` method calls,
 * records them into a log array (via `onLog`), and returns the result unchanged.
 */
export const createLoggingProxy = (
  M: SoftHSMModule,
  onLog: (entry: Pkcs11LogEntry) => void
): SoftHSMModule => {
  return new Proxy(M, {
    get(target, prop: string | symbol) {
      const val = (target as unknown as Record<string | symbol, unknown>)[prop]
      if (typeof prop === 'string' && prop.startsWith('_C_') && typeof val === 'function') {
        return (...args: unknown[]) => {
          const t0 = performance.now()
          const rv = (val as (...a: unknown[]) => number).apply(target, args)
          const ms = Math.round((performance.now() - t0) * 10) / 10
          const rvUnsigned = rv >>> 0
          const ok = rvUnsigned === 0 || rvUnsigned === 0x190 // CKR_OK or BUFFER_TOO_SMALL (size query)
          onLog({
            id: ++_logId,
            timestamp: fmtTime(),
            fn: prop,
            args: args
              .slice(0, 4)
              .map((a) =>
                typeof a === 'number' ? (a === 0 ? '0' : `0x${a.toString(16)}`) : String(a)
              )
              .join(', '),
            rvHex: `0x${rvUnsigned.toString(16).padStart(8, '0')}`,
            rvName: rvName(rvUnsigned),
            ms,
            ok,
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
const CKK_ML_KEM = 0x23
const CKK_ML_DSA = 0x21
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
const CKA_VALUE = 0x00000011
const CKA_KEY_TYPE = 0x00000100
const CKA_PARAMETER_SET = 0x0000061d
const CKA_ENCAPSULATE = 0x00000633
const CKA_DECAPSULATE = 0x00000634

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

/** C_GetSlotList → first slot id */
export const hsm_getFirstSlot = (M: SoftHSMModule): number => {
  const slotPtr = allocUlong(M)
  const countPtr = allocUlong(M)
  try {
    checkRV(M._C_GetSlotList(0, slotPtr, countPtr), 'C_GetSlotList')
    return readUlong(M, slotPtr)
  } finally {
    M._free(slotPtr)
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

  // Re-enumerate: initialized token appears in a new slot
  const slotPtr = M._malloc(32) // room for up to 8 slots
  const countPtr = allocUlong(M)
  try {
    checkRV(M._C_GetSlotList(1, slotPtr, countPtr), 'C_GetSlotList(initialized)')
    return readUlong(M, slotPtr)
  } finally {
    M._free(slotPtr)
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

/** C_EncapsulateKey → {ciphertextBytes, secretHandle} */
export const hsm_encapsulate = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): { ciphertextBytes: Uint8Array; secretHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])
  const ctLenPtr = allocUlong(M)
  const secretHPtr = allocUlong(M)

  // First call: size query (ctPtr = 0)
  checkRV(
    M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 3, 0, ctLenPtr, secretHPtr),
    'C_EncapsulateKey(size)'
  )
  const ctLen = readUlong(M, ctLenPtr)
  const ctPtr = M._malloc(ctLen)

  // Second call: actual encapsulation
  try {
    writeUlong(M, ctLenPtr, ctLen)
    checkRV(
      M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 3, ctPtr, ctLenPtr, secretHPtr),
      'C_EncapsulateKey'
    )
    const ciphertextBytes = M.HEAPU8.slice(ctPtr, ctPtr + readUlong(M, ctLenPtr))
    return { ciphertextBytes, secretHandle: readUlong(M, secretHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 3)
    M._free(ctLenPtr)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

/** C_DecapsulateKey → secretHandle */
export const hsm_decapsulate = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array
): number => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
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
        3,
        ctPtr,
        ciphertextBytes.length,
        secretHPtr
      ),
      'C_DecapsulateKey'
    )
    return readUlong(M, secretHPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 3)
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
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(ML-DSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** C_SignInit(ML-DSA) + C_Sign → sigBytes */
export const hsm_sign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string
): Uint8Array => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit')

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)

  const sigLenPtr = allocUlong(M)
  // First call: get signature length
  checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(len)')
  const sigLen = readUlong(M, sigLenPtr)
  const sigPtr = M._malloc(sigLen)

  try {
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    M._free(sigPtr)
  }
}

/** C_VerifyInit(ML-DSA) + C_Verify → boolean */
export const hsm_verify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array
): boolean => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit')

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)

  const sigPtr = M._malloc(sigBytes.length)
  M.HEAPU8.set(sigBytes, sigPtr)

  try {
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
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
