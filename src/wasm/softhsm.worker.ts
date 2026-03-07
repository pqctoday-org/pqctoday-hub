// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable */
/**
 * SoftHSM SLH-DSA Web Worker — PKCS#11 v3.2
 *
 * Classic script worker (no ES module imports). Loads /wasm/softhsm.js via
 * importScripts, then handles SLH-DSA keygen/sign/verify messages off-thread.
 *
 * SLH-DSA-SHA2-256s keygen: ~3-5s
 * SLH-DSA-SHAKE-128f sign:  ~8-10s
 *
 * Message protocol:
 *   → { type: 'SLH_DSA_KEYGEN', requestId, paramSet }
 *   ← { type: 'SLH_DSA_KEYGEN_RESULT', requestId, pubHandle, privHandle, pubKeyBytes, timingMs }
 *
 *   → { type: 'SLH_DSA_SIGN', requestId, privHandle, message }
 *   ← { type: 'SLH_DSA_SIGN_RESULT', requestId, sigBytes, timingMs }
 *
 *   → { type: 'SLH_DSA_VERIFY', requestId, pubHandle, message, sigBytes }
 *   ← { type: 'SLH_DSA_VERIFY_RESULT', requestId, verified, timingMs }
 *
 *   ← { type: 'ERROR', requestId, error } — on any failure
 */

declare function importScripts(...urls: string[]): void
declare var createSoftHSMModule: (arg?: Record<string, unknown>) => Promise<SoftHSMW>

// Minimal subset of the Emscripten module interface needed here
interface SoftHSMW {
  _malloc(n: number): number
  _free(p: number): void
  setValue(ptr: number, val: number, type: 'i32' | 'i8'): void
  getValue(ptr: number, type: 'i32'): number
  HEAPU8: Uint8Array
  _C_Initialize(pInitArgs: number): number
  _C_GetSlotList(tokenPresent: number, pSlotList: number, pulCount: number): number
  _C_InitToken(slotID: number, pPin: number, ulPinLen: number, pLabel: number): number
  _C_OpenSession(
    slotID: number,
    flags: number,
    pApp: number,
    notify: number,
    phSession: number
  ): number
  _C_Login(hSession: number, userType: number, pPin: number, ulPinLen: number): number
  _C_InitPIN(hSession: number, pPin: number, ulPinLen: number): number
  _C_Logout(hSession: number): number
  _C_CloseSession(hSession: number): number
  _C_GenerateKeyPair(
    hSession: number,
    pMechanism: number,
    pPublicKeyTemplate: number,
    ulPublicKeyAttributeCount: number,
    pPrivateKeyTemplate: number,
    ulPrivateKeyAttributeCount: number,
    phPublicKey: number,
    phPrivateKey: number
  ): number
  _C_GetAttributeValue(
    hSession: number,
    hObject: number,
    pTemplate: number,
    ulCount: number
  ): number
  _C_MessageSignInit(hSession: number, pMechanism: number, hKey: number): number
  _C_SignMessage(
    hSession: number,
    pParameter: number,
    ulParameterLen: number,
    pData: number,
    ulDataLen: number,
    pSignature: number,
    pulSignatureLen: number
  ): number
  _C_MessageSignFinal(
    hSession: number,
    pParameter: number,
    ulParameterLen: number,
    pSignature: number,
    pulSignatureLen: number
  ): number
  _C_MessageVerifyInit(hSession: number, pMechanism: number, hKey: number): number
  _C_VerifyMessage(
    hSession: number,
    pParameter: number,
    ulParameterLen: number,
    pData: number,
    ulDataLen: number,
    pSignature: number,
    ulSignatureLen: number
  ): number
  _C_MessageVerifyFinal(hSession: number, pParameter: number, ulParameterLen: number): number
}

// ── PKCS#11 v3.2 constants ────────────────────────────────────────────────────

var CKO_PUBLIC_KEY = 3
var CKO_PRIVATE_KEY = 4
var CKK_SLH_DSA = 0x4b
var CKA_CLASS = 0x00000000
var CKA_KEY_TYPE = 0x00000100
var CKA_TOKEN = 0x00000001
var CKA_PRIVATE = 0x00000002
var CKA_SENSITIVE = 0x00000103
var CKA_EXTRACTABLE = 0x00000162
var CKA_SIGN = 0x00000108
var CKA_VERIFY = 0x0000010a
var CKA_PARAMETER_SET = 0x000001d9
var CKA_VALUE = 0x00000011
var CKM_SLH_DSA_KEY_PAIR_GEN = 0x2d
var CKM_SLH_DSA = 0x2e
var CKF_RW_SESSION = 2
var CKF_SERIAL_SESSION = 4
var CKU_SO = 0
var CKU_USER = 1
var CKR_CRYPTOKI_ALREADY_INITIALIZED = 0x191

// Named SLH-DSA parameter sets → CKP_SLH_DSA_* constants (PKCS#11 v3.2 §6.68)
var SLH_DSA_PARAMS: Record<string, number> = {
  'sha2-128s': 0x01,
  'shake-128s': 0x02,
  'sha2-128f': 0x03,
  'shake-128f': 0x04,
  'sha2-192s': 0x05,
  'shake-192s': 0x06,
  'sha2-192f': 0x07,
  'shake-192f': 0x08,
  'sha2-256s': 0x09,
  'shake-256s': 0x0a,
  'sha2-256f': 0x0b,
  'shake-256f': 0x0c,
}

// ── Module state ──────────────────────────────────────────────────────────────

var M: SoftHSMW | null = null
var hSession: number = 0
var initPromise: Promise<void> | null = null

// ── Low-level helpers ─────────────────────────────────────────────────────────

function checkRV(rv: number, label: string): void {
  if (rv !== 0) throw new Error(`${label}: CKR=0x${rv.toString(16).padStart(8, '0')}`)
}

function allocUlong(): number {
  var p = M!._malloc(4)
  M!.setValue(p, 0, 'i32')
  return p
}

function readUlong(p: number): number {
  return M!.getValue(p, 'i32') >>> 0
}

function writeUlong(p: number, v: number): void {
  M!.setValue(p, v, 'i32')
}

function writeStr(s: string): number {
  var b = new TextEncoder().encode(s)
  var p = M!._malloc(b.length)
  M!.HEAPU8.set(b, p)
  return p
}

function writeBytes(data: Uint8Array): number {
  var p = M!._malloc(data.length)
  M!.HEAPU8.set(data, p)
  return p
}

interface TplAttr {
  type: number
  ulong?: number
  bool?: boolean
  buf?: number
  len?: number
}

function buildTpl(attrs: TplAttr[]): { ptr: number; valPtrs: number[] } {
  var valPtrs: number[] = []
  var ptr = M!._malloc(attrs.length * 12)
  for (var i = 0; i < attrs.length; i++) {
    var a = attrs[i]
    var p = ptr + i * 12
    M!.setValue(p, a.type, 'i32')
    if (a.ulong !== undefined) {
      var vp = M!._malloc(4)
      valPtrs.push(vp)
      writeUlong(vp, a.ulong)
      M!.setValue(p + 4, vp, 'i32')
      M!.setValue(p + 8, 4, 'i32')
    } else if (a.bool !== undefined) {
      var vp = M!._malloc(1)
      valPtrs.push(vp)
      M!.HEAPU8[vp] = a.bool ? 1 : 0
      M!.setValue(p + 4, vp, 'i32')
      M!.setValue(p + 8, 1, 'i32')
    } else if (a.buf !== undefined) {
      M!.setValue(p + 4, a.buf, 'i32')
      M!.setValue(p + 8, a.len || 0, 'i32')
    } else {
      M!.setValue(p + 4, 0, 'i32')
      M!.setValue(p + 8, 0, 'i32')
    }
  }
  return { ptr, valPtrs }
}

function freeTpl(t: { ptr: number; valPtrs: number[] }): void {
  t.valPtrs.forEach(function (p) {
    M!._free(p)
  })
  M!._free(t.ptr)
}

function buildMech(type: number): number {
  var p = M!._malloc(12)
  M!.setValue(p, type, 'i32')
  M!.setValue(p + 4, 0, 'i32')
  M!.setValue(p + 8, 0, 'i32')
  return p
}

// ── PKCS#11 session initialization ────────────────────────────────────────────

var SO_PIN = 'slhdsa_worker_so'
var USER_PIN = 'slhdsa_worker_u1'
var LABEL = 'SoftHSMWorker   ' // 16 chars, padded to 32 with spaces

function initSLHDSAWorker(): Promise<void> {
  if (M !== null) return Promise.resolve()
  if (initPromise) return initPromise

  initPromise = (async function () {
    // Load the Emscripten script (makes createSoftHSMModule available on globalThis)
    importScripts('/wasm/softhsm.js')

    M = await createSoftHSMModule({
      locateFile: function (path: string) {
        return '/wasm/' + path
      },
    })

    // C_Initialize — tolerate ALREADY_INITIALIZED
    var rv0 = M._C_Initialize(0)
    if (rv0 !== 0 && rv0 !== CKR_CRYPTOKI_ALREADY_INITIALIZED) checkRV(rv0, 'C_Initialize')

    // C_GetSlotList → slot0
    var cntP = allocUlong()
    checkRV(M._C_GetSlotList(0, 0, cntP), 'C_GetSlotList(cnt)')
    var cnt = readUlong(cntP)
    M._free(cntP)
    var listP = M._malloc(cnt * 4)
    var c2P = allocUlong()
    writeUlong(c2P, cnt)
    checkRV(M._C_GetSlotList(0, listP, c2P), 'C_GetSlotList')
    var slot0 = readUlong(listP)
    M._free(listP)
    M._free(c2P)

    // C_InitToken — create token in slot0
    var labelBuf = new Uint8Array(32).fill(0x20)
    for (var i = 0; i < LABEL.length && i < 32; i++) labelBuf[i] = LABEL.charCodeAt(i)
    var soPinP = writeStr(SO_PIN)
    var labelP = writeBytes(labelBuf)
    checkRV(M._C_InitToken(slot0, soPinP, SO_PIN.length, labelP), 'C_InitToken')
    M._free(soPinP)
    M._free(labelP)

    // C_GetSlotList again (token moves slot after InitToken)
    var c3P = allocUlong()
    checkRV(M._C_GetSlotList(0, 0, c3P), 'C_GetSlotList(post-init)')
    var cnt3 = readUlong(c3P)
    M._free(c3P)
    var list3P = M._malloc(cnt3 * 4)
    var c4P = allocUlong()
    writeUlong(c4P, cnt3)
    checkRV(M._C_GetSlotList(0, list3P, c4P), 'C_GetSlotList2')
    var newSlot = readUlong(list3P)
    M._free(list3P)
    M._free(c4P)

    // C_OpenSession(SO) → C_InitPIN(USER_PIN) → C_Logout → C_CloseSession
    var hSP = allocUlong()
    checkRV(
      M._C_OpenSession(newSlot, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, hSP),
      'C_OpenSession(SO)'
    )
    var hSoSession = readUlong(hSP)
    M._free(hSP)
    var soP = writeStr(SO_PIN)
    checkRV(M._C_Login(hSoSession, CKU_SO, soP, SO_PIN.length), 'C_Login(SO)')
    M._free(soP)
    var uPinP = writeStr(USER_PIN)
    checkRV(M._C_InitPIN(hSoSession, uPinP, USER_PIN.length), 'C_InitPIN')
    M._free(uPinP)
    checkRV(M._C_Logout(hSoSession), 'C_Logout')
    checkRV(M._C_CloseSession(hSoSession), 'C_CloseSession(SO)')

    // C_OpenSession(USER) → C_Login(USER)
    var hUP = allocUlong()
    checkRV(
      M._C_OpenSession(newSlot, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, hUP),
      'C_OpenSession(user)'
    )
    hSession = readUlong(hUP)
    M._free(hUP)
    var uP = writeStr(USER_PIN)
    checkRV(M._C_Login(hSession, CKU_USER, uP, USER_PIN.length), 'C_Login(USER)')
    M._free(uP)
  })().catch(function (e) {
    initPromise = null
    M = null
    throw e
  })
  return initPromise
}

// ── SLH-DSA helpers ───────────────────────────────────────────────────────────

function slhdsaKeyGen(paramSet: number): {
  pubHandle: number
  privHandle: number
  pubKeyBytes: Uint8Array
} {
  var mech = buildMech(CKM_SLH_DSA_KEY_PAIR_GEN)
  var pubTpl = buildTpl([
    { type: CKA_CLASS, ulong: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulong: CKK_SLH_DSA },
    { type: CKA_TOKEN, bool: false },
    { type: CKA_VERIFY, bool: true },
    { type: CKA_PARAMETER_SET, ulong: paramSet },
  ])
  var prvTpl = buildTpl([
    { type: CKA_CLASS, ulong: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulong: CKK_SLH_DSA },
    { type: CKA_TOKEN, bool: false },
    { type: CKA_PRIVATE, bool: true },
    { type: CKA_SENSITIVE, bool: false },
    { type: CKA_EXTRACTABLE, bool: false },
    { type: CKA_SIGN, bool: true },
  ])
  var pubHP = allocUlong(),
    prvHP = allocUlong()
  try {
    checkRV(
      M!._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 7, pubHP, prvHP),
      'C_GenerateKeyPair(SLH-DSA)'
    )
    var pubHandle = readUlong(pubHP),
      privHandle = readUlong(prvHP)

    // C_GetAttributeValue(CKA_VALUE) — get public key bytes
    var lenTpl = buildTpl([{ type: CKA_VALUE }])
    checkRV(M!._C_GetAttributeValue(hSession, pubHandle, lenTpl.ptr, 1), 'C_GetAttributeValue(len)')
    var len = readUlong(lenTpl.ptr + 8)
    freeTpl(lenTpl)
    var valP = M!._malloc(len)
    var valTpl = buildTpl([{ type: CKA_VALUE, buf: valP, len: len }])
    checkRV(M!._C_GetAttributeValue(hSession, pubHandle, valTpl.ptr, 1), 'C_GetAttributeValue')
    var pubKeyBytes = M!.HEAPU8.slice(valP, valP + len)
    freeTpl(valTpl)
    M!._free(valP)

    return { pubHandle, privHandle, pubKeyBytes }
  } finally {
    M!._free(mech)
    freeTpl(pubTpl)
    freeTpl(prvTpl)
    M!._free(pubHP)
    M!._free(prvHP)
  }
}

function slhdsaSign(privHandle: number, message: string): Uint8Array {
  var mech = buildMech(CKM_SLH_DSA)
  var msgBytes = new TextEncoder().encode(message)
  var msgP = writeBytes(msgBytes)
  var sigLenP = allocUlong()
  var sigP = 0
  checkRV(M!._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit(SLH-DSA)')
  try {
    checkRV(
      M!._C_SignMessage(hSession, 0, 0, msgP, msgBytes.length, 0, sigLenP),
      'C_SignMessage(len)'
    )
    var sigLen = readUlong(sigLenP)
    sigP = M!._malloc(sigLen)
    writeUlong(sigLenP, sigLen)
    checkRV(
      M!._C_SignMessage(hSession, 0, 0, msgP, msgBytes.length, sigP, sigLenP),
      'C_SignMessage'
    )
    return M!.HEAPU8.slice(sigP, sigP + readUlong(sigLenP))
  } finally {
    M!._C_MessageSignFinal(hSession, 0, 0, 0, 0) // close context
    M!._free(mech)
    M!._free(msgP)
    M!._free(sigLenP)
    if (sigP) M!._free(sigP)
  }
}

function slhdsaVerify(pubHandle: number, message: string, sigBytes: Uint8Array): boolean {
  var mech = buildMech(CKM_SLH_DSA)
  var msgBytes = new TextEncoder().encode(message)
  var msgP = writeBytes(msgBytes)
  var sigP = writeBytes(sigBytes)
  checkRV(M!._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit(SLH-DSA)')
  try {
    var rv = M!._C_VerifyMessage(hSession, 0, 0, msgP, msgBytes.length, sigP, sigBytes.length)
    return rv === 0
  } finally {
    M!._C_MessageVerifyFinal(hSession, 0, 0)
    M!._free(mech)
    M!._free(msgP)
    M!._free(sigP)
  }
}

// ── Message handler ────────────────────────────────────────────────────────────

self.onmessage = async function (ev: MessageEvent) {
  var msg = ev.data as {
    type: string
    requestId?: string
    paramSet?: string
    privHandle?: number
    pubHandle?: number
    message?: string
    sigBytes?: Uint8Array
  }
  var requestId = msg.requestId

  try {
    await initSLHDSAWorker()
  } catch (e) {
    self.postMessage({ type: 'ERROR', requestId, error: String(e) })
    return
  }

  try {
    if (msg.type === 'SLH_DSA_KEYGEN') {
      var paramName = msg.paramSet ?? 'sha2-128s'
      var paramSetVal = SLH_DSA_PARAMS[paramName]
      if (!paramSetVal) throw new Error(`Unknown SLH-DSA param set: ${paramName}`)
      var t0 = performance.now()
      var result = slhdsaKeyGen(paramSetVal)
      var timingMs = Math.round(performance.now() - t0)
      self.postMessage(
        {
          type: 'SLH_DSA_KEYGEN_RESULT',
          requestId,
          pubHandle: result.pubHandle,
          privHandle: result.privHandle,
          pubKeyBytes: result.pubKeyBytes,
          timingMs,
        },
        { transfer: [result.pubKeyBytes.buffer] }
      )
    } else if (msg.type === 'SLH_DSA_SIGN') {
      if (!msg.privHandle || !msg.message)
        throw new Error('SLH_DSA_SIGN requires privHandle + message')
      var t1 = performance.now()
      var sigBytes = slhdsaSign(msg.privHandle, msg.message)
      var timingMs1 = Math.round(performance.now() - t1)
      self.postMessage(
        { type: 'SLH_DSA_SIGN_RESULT', requestId, sigBytes, timingMs: timingMs1 },
        { transfer: [sigBytes.buffer] }
      )
    } else if (msg.type === 'SLH_DSA_VERIFY') {
      if (!msg.pubHandle || !msg.message || !msg.sigBytes)
        throw new Error('SLH_DSA_VERIFY requires pubHandle + message + sigBytes')
      var t2 = performance.now()
      var verified = slhdsaVerify(msg.pubHandle, msg.message, msg.sigBytes)
      var timingMs2 = Math.round(performance.now() - t2)
      self.postMessage({ type: 'SLH_DSA_VERIFY_RESULT', requestId, verified, timingMs: timingMs2 })
    } else {
      throw new Error(`Unknown message type: ${msg.type}`)
    }
  } catch (e) {
    self.postMessage({ type: 'ERROR', requestId, error: String(e) })
  }
}
