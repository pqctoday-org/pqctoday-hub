// SPDX-License-Identifier: GPL-3.0-only
// v20260405-0001 — softhsm proxy bridge
//
// strongSwan charon WASM worker — charon + softhsmv3 wired via PKCS#11 proxy.
// Custom socket_wasm plugin for network I/O (no libc poll/recvmsg).
// Only network I/O uses SharedArrayBuffer (JS in-memory UDP loopback between workers).

// ── Network inbox SharedArrayBuffer state ────────────────────────────────────
let netInboxSab = null
let netInboxI32 = null
let netInboxBytes = null
let ikeSocketFd = -1
let boundIp = 0
let boundPort = 0
let workerRole = 'responder'

// ── PKCS#11 SAB + RPC mode ───────────────────────────────────────────────────
let pkcs11Sab = null
let rpcMode = false
let proposalMode = 0
let authMode = 'psk'

const originalConsoleError = console.error
console.error = (...args) => {
  const text = args
    .map((a) => {
      if (a instanceof Error) return a.stack || a.message
      if (typeof a === 'object' && a !== null) return JSON.stringify(a, null, 2)
      return String(a)
    })
    .join(' ')
  self.postMessage({ type: 'LOG', payload: { level: 'error', text: `[WASM TRAP] ${text}` } })
  originalConsoleError(...args)
}

self.addEventListener('error', (event) => {
  const err = event.error || event
  const trace = err.stack ? err.stack : err.message
  self.postMessage({ type: 'LOG', payload: { level: 'error', text: `[WASM EXCEPTION] ${trace}` } })
  event.preventDefault() // prevent bubbling to the main thread
})

self.addEventListener('unhandledrejection', (event) => {
  self.postMessage({
    type: 'LOG',
    payload: { level: 'error', text: `[WORKER] Unhandled rejection: ${event.reason}` },
  })
})

self.onmessage = (e) => {
  const { type, payload } = e.data

  // Handle START: call charon _main (blocks forever in receive loop)
  if (type === 'START' && self.Module && self.Module._main) {
    // Late-bind keyIds for the ML-DSA dual-auth flow: the panel generated
    // the keys post-spawn so the original INIT payload didn't carry them.
    // wasm_setup_config reads these env vars to build ID_KEY_ID identities.
    if (payload && typeof ENV !== 'undefined') {
      if (payload.localKeyId) ENV['WASM_LOCAL_KEYID'] = payload.localKeyId
      if (payload.remoteKeyId) ENV['WASM_REMOTE_KEYID'] = payload.remoteKeyId
      if (payload.localKeyId || payload.remoteKeyId) {
        self.postMessage({
          type: 'LOG',
          payload: {
            level: 'info',
            text: `[WASM ENV] START set WASM_LOCAL_KEYID=${(payload.localKeyId || '').slice(0, 12)}…, WASM_REMOTE_KEYID=${(payload.remoteKeyId || '').slice(0, 12)}…`,
          },
        })
      }
    }
    const stackAlloc = self.Module.stackAlloc
    const stackSave = self.Module.stackSave
    const stackRestore = self.Module.stackRestore

    const savedSp = stackSave()

    // Build standard argc/argv: [ "./charon", "--role", "<role>" ]
    const argvStrings = ['./charon', '--role', workerRole]
    const ptrs = []
    for (const str of argvStrings) {
      const len = lengthBytesUTF8(str) + 1
      const ptr = stackAlloc(len)
      stringToUTF8(str, ptr, len)
      ptrs.push(ptr)
    }
    const argvPtr = stackAlloc(ptrs.length * 4)
    const dv = new DataView(self._wasmMemory.buffer)
    for (let i = 0; i < ptrs.length; i++) dv.setUint32(argvPtr + i * 4, ptrs[i], true)

    // Set RPC mode before charon starts — pkcs11_library.c reads g_pkcs11_rpc_mode
    // during plugin init which happens inside _main().
    if (self.Module._pkcs11_set_rpc_mode) {
      self.Module._pkcs11_set_rpc_mode(rpcMode ? 1 : 0)
    }
    // Set proposal mode before charon starts — wasm_setup_config reads wasm_proposal_mode
    // during backend init which happens inside _main().
    if (self.Module._wasm_set_proposal_mode) {
      self.Module._wasm_set_proposal_mode(proposalMode)
    }
    // Set auth mode before charon starts — wasm_setup_config reads wasm_auth_mode
    // during backend init which happens inside _main().
    const authModeInt = authMode === 'dual' ? 1 : 0
    self.postMessage({ type: 'LOG', payload: { level: 'info', text: `[WASM-AUTH] authMode='${authMode}' → wasm_auth_mode=${authModeInt}` } })
    if (self.Module._wasm_set_auth_mode) {
      self.Module._wasm_set_auth_mode(authModeInt)
    } else {
      self.postMessage({ type: 'LOG', payload: { level: 'error', text: '[WASM-AUTH] _wasm_set_auth_mode not exported!' } })
    }

    self.postMessage({
      type: 'LOG',
      payload: {
        level: 'info',
        text: `[WASM] Starting charon daemon (role=${workerRole}, rpcMode=${rpcMode})...`,
      },
    })
    self.Module._main(ptrs.length, argvPtr)

    stackRestore(savedSp)
    return
  }

  // Handle GEN_KEYS: call wasm_hsm_init with user-selected algorithm
  if (type === 'GEN_KEYS' && self.Module && self.Module._wasm_hsm_init) {
    const { algType, slot0Size, slot1Size } = payload || {
      algType: 1,
      slot0Size: 3072,
      slot1Size: 3072,
    }
    const algName = algType === 1 ? 'RSA' : 'ML-DSA'
    self.postMessage({
      type: 'LOG',
      payload: {
        level: 'info',
        text: `[WORKER] Generating keys: ${algName}-${slot0Size} / ${algName}-${slot1Size}`,
      },
    })
    const rc = self.Module._wasm_hsm_init(algType, slot0Size, slot1Size)
    if (rc === 0) {
      self.postMessage({ type: 'KEYS_READY', payload: { slot0Size, slot1Size } })
    } else {
      self.postMessage({
        type: 'LOG',
        payload: { level: 'error', text: `[WORKER] wasm_hsm_init failed: rc=${rc}` },
      })
    }
    return
  }

  // Handle PANEL_PKCS11: panel-driven PKCS#11 ops against THIS worker's
  // softhsmv3 instance. Lets the panel provision ML-DSA keypair + sign the
  // X.509 TBSCertificate inside the worker's softhsm so charon's
  // strongswan-pkcs11 plugin can find the keys at IKE_AUTH time
  // (CKA_ID lookup matches the cert's SubjectKeyIdentifier).
  // Reply: { type: 'PANEL_PKCS11_RESULT', reqId, rv, data }
  if (type === 'PANEL_PKCS11' && self.Module) {
    const { reqId, op, args } = payload || {}
    const M = self.Module
    const reply = (rv, data) =>
      self.postMessage({ type: 'PANEL_PKCS11_RESULT', payload: { reqId, rv, data } })

    try {
      // Common PKCS#11 v3.2 attribute / class / mech values. Match
      // softhsmv3's vendor numerics (verified at trace time).
      const CK_TRUE = 1
      const CKA_CLASS = 0x00000000
      const CKA_TOKEN = 0x00000001
      const CKA_PRIVATE = 0x00000002
      const CKA_LABEL = 0x00000003
      const CKA_KEY_TYPE = 0x00000100
      const CKA_ID = 0x00000102
      const CKA_SENSITIVE = 0x00000103
      const CKA_ENCRYPT = 0x00000104
      const CKA_DECRYPT = 0x00000105
      const CKA_WRAP = 0x00000106
      const CKA_UNWRAP = 0x00000107
      const CKA_SIGN = 0x00000108
      const CKA_VERIFY = 0x0000010a
      const CKA_DERIVE = 0x0000010c
      const CKA_EXTRACTABLE = 0x00000162
      const CK_FALSE = 0
      const CKA_VALUE = 0x00000011
      const CKA_PARAMETER_SET = 0x0000061d
      const CKO_PUBLIC_KEY = 2
      const CKO_PRIVATE_KEY = 3
      // Verified against pqctoday-hsm/strongswan-pkcs11/pkcs11.h:
      //   CKK_ML_DSA              = 0x4a
      //   CKM_ML_DSA_KEY_PAIR_GEN = 0x1c
      //   CKM_ML_DSA              = 0x1d
      const CKK_ML_DSA = 0x0000004a
      const CKM_ML_DSA_KEY_PAIR_GEN = 0x0000001c
      const CKM_ML_DSA = 0x0000001d
      const CKP_ML_DSA_44 = 1
      const CKP_ML_DSA_65 = 2
      const CKP_ML_DSA_87 = 3
      const CKF_SERIAL_SESSION = 0x00000004
      const CKF_RW_SESSION = 0x00000002
      const CKU_USER = 1

      // Helper: write an attribute template to WASM memory.
      // attrs: Array<{ type, kind:'bool'|'ulong'|'bytes', value }>
      // Mirrors the proven panel-side buildTemplate (helpers.ts:109): bool
      // attrs (CKA_TOKEN/VERIFY/etc) are 1 byte, ulong attrs (CKA_CLASS/
      // KEY_TYPE/PARAMETER_SET) are 4 bytes, bytes attrs (CKA_ID) are raw.
      // Wrong size → softhsm returns CKR_ATTRIBUTE_VALUE_INVALID (0x13).
      const writeAttrTemplate = (attrs) => {
        const ATTR_SIZE = 12 // sizeof(CK_ATTRIBUTE) on wasm32
        const tmplPtr = M._malloc(attrs.length * ATTR_SIZE)
        const valPtrs = []
        const dv = new DataView(M.HEAPU8.buffer)
        for (let i = 0; i < attrs.length; i++) {
          const a = attrs[i]
          let valPtr, valLen
          if (a.kind === 'bool') {
            valLen = 1
            valPtr = M._malloc(1)
            M.HEAPU8[valPtr] = a.value ? 1 : 0
          } else if (a.kind === 'bytes') {
            valLen = a.value.length
            valPtr = M._malloc(valLen)
            M.HEAPU8.set(a.value, valPtr)
          } else {
            // 'ulong' (default)
            valLen = 4
            valPtr = M._malloc(valLen)
            dv.setUint32(valPtr, (a.value >>> 0) >>> 0, true)
          }
          valPtrs.push(valPtr)
          dv.setUint32(tmplPtr + i * ATTR_SIZE + 0, a.type >>> 0, true)
          dv.setUint32(tmplPtr + i * ATTR_SIZE + 4, valPtr, true)
          dv.setUint32(tmplPtr + i * ATTR_SIZE + 8, valLen, true)
        }
        return { tmplPtr, valPtrs, count: attrs.length }
      }
      const freeAttrTemplate = ({ tmplPtr, valPtrs }) => {
        for (const p of valPtrs) M._free(p)
        M._free(tmplPtr)
      }

      switch (op) {
        case 'C_GetSlotList': {
          // tokenPresent=CK_TRUE (1) → only slots with initialized tokens.
          const tokenPresent = args.tokenPresent === false ? 0 : 1
          const cntPtr = M._malloc(4)
          const dv = new DataView(M.HEAPU8.buffer)
          dv.setUint32(cntPtr, 0, true)
          let rv = M._C_GetSlotList(tokenPresent, 0, cntPtr) >>> 0
          if (rv !== 0) {
            M._free(cntPtr)
            reply(rv, {})
            break
          }
          const cnt = new DataView(M.HEAPU8.buffer).getUint32(cntPtr, true)
          const listPtr = M._malloc(cnt * 4)
          dv.setUint32(cntPtr, cnt, true)
          rv = M._C_GetSlotList(tokenPresent, listPtr, cntPtr) >>> 0
          let slots = []
          if (rv === 0) {
            const dv2 = new DataView(M.HEAPU8.buffer)
            const finalCnt = dv2.getUint32(cntPtr, true)
            for (let i = 0; i < finalCnt; i++) {
              slots.push(dv2.getUint32(listPtr + i * 4, true))
            }
          }
          M._free(listPtr)
          M._free(cntPtr)
          reply(rv, { slots })
          break
        }
        case 'C_OpenSession': {
          const slot = args.slot >>> 0
          const flags = args.flags >>> 0 || (CKF_SERIAL_SESSION | CKF_RW_SESSION)
          const sessPtr = M._malloc(4)
          const rv = M._C_OpenSession(slot, flags, 0, 0, sessPtr) >>> 0
          const hSess = rv === 0 ? new DataView(M.HEAPU8.buffer).getUint32(sessPtr, true) : 0
          M._free(sessPtr)
          reply(rv, { hSess })
          break
        }
        case 'C_Login': {
          const hSess = args.hSess >>> 0
          const userType = (args.userType ?? CKU_USER) >>> 0
          const pin = args.pin || '1234'
          const pinBytes = new TextEncoder().encode(pin)
          const pinPtr = M._malloc(pinBytes.length)
          M.HEAPU8.set(pinBytes, pinPtr)
          const rv = M._C_Login(hSess, userType, pinPtr, pinBytes.length) >>> 0
          M._free(pinPtr)
          reply(rv, {})
          break
        }
        case 'C_GenerateKeyPair_MLDSA': {
          const hSess = args.hSess >>> 0
          const variant = args.variant === 44 ? 44 : args.variant === 87 ? 87 : 65
          const paramSet =
            variant === 44 ? CKP_ML_DSA_44 : variant === 87 ? CKP_ML_DSA_87 : CKP_ML_DSA_65
          const ckaId = args.ckaId
            ? args.ckaId instanceof Uint8Array
              ? args.ckaId
              : new Uint8Array(args.ckaId)
            : crypto.getRandomValues(new Uint8Array(20))

          // Mechanism: { mechanism, pParameter=NULL, ulParameterLen=0 }
          const mechPtr = M._malloc(12)
          const dv = new DataView(M.HEAPU8.buffer)
          dv.setUint32(mechPtr + 0, CKM_ML_DSA_KEY_PAIR_GEN, true)
          dv.setUint32(mechPtr + 4, 0, true)
          dv.setUint32(mechPtr + 8, 0, true)

          // Mirror the proven panel-side template in
          // src/wasm/softhsm/pqc.ts::hsm_generateMLDSAKeyPair. Mismatches
          // produce CKR_ATTRIBUTE_VALUE_INVALID (0x13).
          // Per PKCS#11 v3.2 §6.67.4, CKA_PARAMETER_SET goes on the public
          // template only; the mechanism infers it for the private key.
          const pubAttrs = [
            { type: CKA_CLASS, kind: 'ulong', value: CKO_PUBLIC_KEY },
            { type: CKA_KEY_TYPE, kind: 'ulong', value: CKK_ML_DSA },
            { type: CKA_TOKEN, kind: 'bool', value: true },
            { type: CKA_VERIFY, kind: 'bool', value: true },
            { type: CKA_ENCRYPT, kind: 'bool', value: false },
            { type: CKA_WRAP, kind: 'bool', value: false },
            { type: CKA_PARAMETER_SET, kind: 'ulong', value: paramSet },
            { type: CKA_ID, kind: 'bytes', value: ckaId },
          ]
          const priAttrs = [
            { type: CKA_CLASS, kind: 'ulong', value: CKO_PRIVATE_KEY },
            { type: CKA_KEY_TYPE, kind: 'ulong', value: CKK_ML_DSA },
            { type: CKA_TOKEN, kind: 'bool', value: true },
            { type: CKA_PRIVATE, kind: 'bool', value: true },
            { type: CKA_SENSITIVE, kind: 'bool', value: true },
            { type: CKA_EXTRACTABLE, kind: 'bool', value: false },
            { type: CKA_SIGN, kind: 'bool', value: true },
            { type: CKA_DECRYPT, kind: 'bool', value: false },
            { type: CKA_UNWRAP, kind: 'bool', value: false },
            { type: CKA_DERIVE, kind: 'bool', value: false },
            { type: CKA_ID, kind: 'bytes', value: ckaId },
          ]
          const pubT = writeAttrTemplate(pubAttrs)
          const priT = writeAttrTemplate(priAttrs)
          const hPubPtr = M._malloc(4)
          const hPriPtr = M._malloc(4)
          const rv =
            M._C_GenerateKeyPair(
              hSess,
              mechPtr,
              pubT.tmplPtr,
              pubT.count,
              priT.tmplPtr,
              priT.count,
              hPubPtr,
              hPriPtr
            ) >>> 0
          const hPub = rv === 0 ? dv.getUint32(hPubPtr, true) : 0
          const hPri = rv === 0 ? dv.getUint32(hPriPtr, true) : 0
          M._free(hPubPtr)
          M._free(hPriPtr)
          M._free(mechPtr)
          freeAttrTemplate(pubT)
          freeAttrTemplate(priT)
          reply(rv, { hPub, hPri, ckaId: Array.from(ckaId) })
          break
        }
        case 'C_GetAttributeValue': {
          const hSess = args.hSess >>> 0
          const hObj = args.hObj >>> 0
          const attrType = (args.attrType ?? CKA_VALUE) >>> 0
          // Two-pass: first get length, then read value.
          const ATTR_SIZE = 12
          const tmplPtr = M._malloc(ATTR_SIZE)
          const dv = new DataView(M.HEAPU8.buffer)
          dv.setUint32(tmplPtr + 0, attrType, true)
          dv.setUint32(tmplPtr + 4, 0, true) // pValue = NULL
          dv.setUint32(tmplPtr + 8, 0, true) // ulValueLen = 0
          let rv = M._C_GetAttributeValue(hSess, hObj, tmplPtr, 1) >>> 0
          if (rv !== 0) {
            M._free(tmplPtr)
            reply(rv, {})
            break
          }
          const len = new DataView(M.HEAPU8.buffer).getUint32(tmplPtr + 8, true)
          const valPtr = M._malloc(len)
          dv.setUint32(tmplPtr + 4, valPtr, true)
          dv.setUint32(tmplPtr + 8, len, true)
          rv = M._C_GetAttributeValue(hSess, hObj, tmplPtr, 1) >>> 0
          let value = null
          if (rv === 0) {
            value = new Uint8Array(len)
            value.set(M.HEAPU8.subarray(valPtr, valPtr + len))
          }
          M._free(valPtr)
          M._free(tmplPtr)
          reply(rv, { value: value ? Array.from(value) : null, length: len })
          break
        }
        case 'getKeyAttributes': {
          // Batched attribute read for HsmKeyInspector. Mirrors the panel-side
          // hsm_getKeyAttributes (src/wasm/softhsm/objects.ts:165) so the inspector
          // can present the same fields whether the key lives in panel WASM or
          // a strongSwan worker WASM. One missing attribute = null; one round trip.
          const hSess = args.hSess >>> 0
          const hObj = args.hObj >>> 0
          const ATTR_SIZE = 12
          // PKCS#11 v3.2 attribute IDs — must match src/wasm/softhsm/constants.ts.
          const CKA_VALUE_LEN_ID = 0x00000161
          const CKA_LOCAL_ID = 0x00000163
          const CKA_NEVER_EXTRACTABLE_ID = 0x00000164
          const CKA_ALWAYS_SENSITIVE_ID = 0x00000165
          const CKA_KEY_GEN_MECHANISM_ID = 0x00000166
          const CKA_HSS_KEYS_REMAINING_ID = 0x0000061c
          const CKA_XMSS_KEYS_REMAINING_ID = 0x80000106
          const CKA_ENCAPSULATE_ID = 0x00000633
          const CKA_DECAPSULATE_ID = 0x00000634
          const CKA_CHECK_VALUE_ID = 0x00000090
          const readUlong = (type) => {
            const tplPtr = M._malloc(ATTR_SIZE)
            const valPtr = M._malloc(4)
            const dv = new DataView(M.HEAPU8.buffer)
            dv.setUint32(tplPtr + 0, type >>> 0, true)
            dv.setUint32(tplPtr + 4, valPtr, true)
            dv.setUint32(tplPtr + 8, 4, true)
            const rv2 = M._C_GetAttributeValue(hSess, hObj, tplPtr, 1) >>> 0
            const out = rv2 === 0 ? new DataView(M.HEAPU8.buffer).getUint32(valPtr, true) : null
            M._free(valPtr)
            M._free(tplPtr)
            return out
          }
          const readBool = (type) => {
            const tplPtr = M._malloc(ATTR_SIZE)
            const valPtr = M._malloc(1)
            const dv = new DataView(M.HEAPU8.buffer)
            M.HEAPU8[valPtr] = 0
            dv.setUint32(tplPtr + 0, type >>> 0, true)
            dv.setUint32(tplPtr + 4, valPtr, true)
            dv.setUint32(tplPtr + 8, 1, true)
            const rv2 = M._C_GetAttributeValue(hSess, hObj, tplPtr, 1) >>> 0
            const out = rv2 === 0 ? M.HEAPU8[valPtr] !== 0 : null
            M._free(valPtr)
            M._free(tplPtr)
            return out
          }
          const readBytes = (type) => {
            // Two-pass length probe + read. Used for CKA_CHECK_VALUE.
            const tplPtr = M._malloc(ATTR_SIZE)
            const dv = new DataView(M.HEAPU8.buffer)
            dv.setUint32(tplPtr + 0, type >>> 0, true)
            dv.setUint32(tplPtr + 4, 0, true)
            dv.setUint32(tplPtr + 8, 0, true)
            let rv2 = M._C_GetAttributeValue(hSess, hObj, tplPtr, 1) >>> 0
            if (rv2 !== 0) {
              M._free(tplPtr)
              return null
            }
            const len = new DataView(M.HEAPU8.buffer).getUint32(tplPtr + 8, true)
            const vPtr = M._malloc(len)
            dv.setUint32(tplPtr + 4, vPtr, true)
            dv.setUint32(tplPtr + 8, len, true)
            rv2 = M._C_GetAttributeValue(hSess, hObj, tplPtr, 1) >>> 0
            let out = null
            if (rv2 === 0) {
              out = Array.from(M.HEAPU8.subarray(vPtr, vPtr + len))
            }
            M._free(vPtr)
            M._free(tplPtr)
            return out
          }
          const attrs = {
            ckClass: readUlong(CKA_CLASS),
            ckKeyType: readUlong(CKA_KEY_TYPE),
            ckParameterSet: readUlong(CKA_PARAMETER_SET),
            ckKeyGenMechanism: readUlong(CKA_KEY_GEN_MECHANISM_ID),
            ckToken: readBool(CKA_TOKEN),
            ckPrivate: readBool(CKA_PRIVATE),
            ckSensitive: readBool(CKA_SENSITIVE),
            ckExtractable: readBool(CKA_EXTRACTABLE),
            ckAlwaysSensitive: readBool(CKA_ALWAYS_SENSITIVE_ID),
            ckNeverExtractable: readBool(CKA_NEVER_EXTRACTABLE_ID),
            ckLocal: readBool(CKA_LOCAL_ID),
            ckEncrypt: readBool(CKA_ENCRYPT),
            ckDecrypt: readBool(CKA_DECRYPT),
            ckSign: readBool(CKA_SIGN),
            ckVerify: readBool(CKA_VERIFY),
            ckWrap: readBool(CKA_WRAP),
            ckUnwrap: readBool(CKA_UNWRAP),
            ckDerive: readBool(CKA_DERIVE),
            ckEncapsulate: readBool(CKA_ENCAPSULATE_ID),
            ckDecapsulate: readBool(CKA_DECAPSULATE_ID),
            ckValueLen: readUlong(CKA_VALUE_LEN_ID),
            ckHssKeysRemaining: readUlong(CKA_HSS_KEYS_REMAINING_ID),
            ckXmssKeysRemaining: readUlong(CKA_XMSS_KEYS_REMAINING_ID),
            ckCheckValue: readBytes(CKA_CHECK_VALUE_ID),
          }
          reply(0, attrs)
          break
        }
        case 'C_Sign_MLDSA': {
          const hSess = args.hSess >>> 0
          const hPri = args.hPri >>> 0
          const data =
            args.data instanceof Uint8Array ? args.data : new Uint8Array(args.data || [])

          // C_SignInit
          const mechPtr = M._malloc(12)
          const dv = new DataView(M.HEAPU8.buffer)
          dv.setUint32(mechPtr + 0, CKM_ML_DSA, true)
          dv.setUint32(mechPtr + 4, 0, true)
          dv.setUint32(mechPtr + 8, 0, true)
          let rv = M._C_SignInit(hSess, mechPtr, hPri) >>> 0
          if (rv !== 0) {
            M._free(mechPtr)
            reply(rv, {})
            break
          }

          // C_Sign — two-pass for length first
          const dataPtr = M._malloc(data.length)
          M.HEAPU8.set(data, dataPtr)
          const sigLenPtr = M._malloc(4)
          dv.setUint32(sigLenPtr, 0, true)
          rv = M._C_Sign(hSess, dataPtr, data.length, 0, sigLenPtr) >>> 0
          if (rv !== 0) {
            M._free(mechPtr)
            M._free(dataPtr)
            M._free(sigLenPtr)
            reply(rv, {})
            break
          }
          // Some PKCS#11 impls require a fresh SignInit between size-query and full call;
          // softhsmv3 supports re-init via state machine. Call SignInit again to be safe.
          M._C_SignInit(hSess, mechPtr, hPri)
          const sigLen = new DataView(M.HEAPU8.buffer).getUint32(sigLenPtr, true)
          const sigPtr = M._malloc(sigLen)
          dv.setUint32(sigLenPtr, sigLen, true)
          rv = M._C_Sign(hSess, dataPtr, data.length, sigPtr, sigLenPtr) >>> 0
          let sig = null
          if (rv === 0) {
            const finalLen = new DataView(M.HEAPU8.buffer).getUint32(sigLenPtr, true)
            sig = new Uint8Array(finalLen)
            sig.set(M.HEAPU8.subarray(sigPtr, sigPtr + finalLen))
          }
          M._free(sigPtr)
          M._free(sigLenPtr)
          M._free(dataPtr)
          M._free(mechPtr)
          reply(rv, { sig: sig ? Array.from(sig) : null })
          break
        }
        case 'C_CloseSession': {
          const hSess = args.hSess >>> 0
          const rv = M._C_CloseSession(hSess) >>> 0
          reply(rv, {})
          break
        }
        default:
          reply(0x00000054 /* CKR_FUNCTION_NOT_SUPPORTED */, { reason: `unknown op ${op}` })
      }
    } catch (err) {
      self.postMessage({
        type: 'LOG',
        payload: { level: 'error', text: `[PANEL_PKCS11] ${op}: ${err.message || err}` },
      })
      reply(0x00000005 /* CKR_GENERAL_ERROR */, {})
    }
    return
  }

  // Handle WRITE_FILES: post-INIT addition of files to the WASM FS. Used by
  // dual-mode VPN provisioning to land cert PEMs after they've been built
  // (panel can't include them in the initial INIT configs because cert
  // generation depends on the worker softhsm being up first).
  if (type === 'WRITE_FILES' && self.Module) {
    const files = (payload && payload.files) || {}
    try {
      const wasmFS = typeof FS !== 'undefined' ? FS : null // eslint-disable-line no-undef
      if (!wasmFS) {
        self.postMessage({
          type: 'LOG',
          payload: { level: 'error', text: '[WORKER] WRITE_FILES: FS not available' },
        })
        return
      }
      for (const [path, content] of Object.entries(files)) {
        // Ensure parent dirs exist.
        const parts = path.split('/').filter(Boolean)
        let dir = ''
        for (let i = 0; i < parts.length - 1; i++) {
          dir += '/' + parts[i]
          try {
            wasmFS.mkdir(dir)
          } catch (_) {
            /* exists */
          }
        }
        wasmFS.writeFile(path, content)
      }
      self.postMessage({
        type: 'LOG',
        payload: {
          level: 'info',
          text: `[WORKER] WRITE_FILES wrote ${Object.keys(files).length} file(s)`,
        },
      })
    } catch (err) {
      self.postMessage({
        type: 'LOG',
        payload: { level: 'error', text: `[WORKER] WRITE_FILES failed: ${err.message || err}` },
      })
    }
    return
  }


  if (type !== 'INIT') return

  const initConfigs = payload.configs || {}
  const initPsk = payload.psk || ''
  workerRole = payload.role || 'responder'
  pkcs11Sab = payload.sab || null
  rpcMode = payload.rpcMode || false
  proposalMode = payload.proposalMode ?? 0
  authMode = payload.auth || 'psk'
  // ML-DSA dual auth: hex strings of CKA_ID bytes per role. wasm_setup_config
  // reads WASM_LOCAL_KEYID / WASM_REMOTE_KEYID and builds ID_KEY_ID identities,
  // letting credential_manager.c hit get_private_by_keyid fast path.
  const localKeyId = payload.localKeyId || ''
  const remoteKeyId = payload.remoteKeyId || ''
  // RFC 7383 negotiation (default on in wasm_backend.c; 'no' opts out) and
  // Tier-A CHILD_SA via the stub kernel (WASM_CHILDSA=1 flips
  // CHILDLESS_FORCE → CHILDLESS_NEVER in wasm_setup_config).
  const fragEnv = payload.fragmentation === false ? 'no' : 'yes'
  const childSaEnv = payload.childSa ? '1' : '0'
  netInboxSab = payload.netSab || payload.netInboxSab
  if (netInboxSab) {
    netInboxI32 = new Int32Array(netInboxSab, 0, 4)
    netInboxBytes = new Uint8Array(netInboxSab, 16)
    self.postMessage({
      type: 'LOG',
      payload: { level: 'info', text: `[WASM] Network SAB connected (role=${workerRole})` },
    })
  } else {
    self.postMessage({
      type: 'LOG',
      payload: { level: 'error', text: '[WASM] WARNING: No network SAB received!' },
    })
  }

  try {
    self.Module = {
      locateFile: (path) => `/wasm/${path === 'charon.wasm' ? 'strongswan.wasm' : path}`,
      noInitialRun: true,
      noExitRuntime: true,

      preRun: [
        () => {
          const wasmFS = typeof FS !== 'undefined' ? FS : null // eslint-disable-line no-undef
          if (!wasmFS) return
          for (const dir of [
            '/usr',
            '/usr/local',
            '/var',
            '/var/run',
            '/var/lib',
            '/var/lib/softhsmv3',
            '/var/lib/softhsmv3/tokens',
            '/etc',
            '/etc/ipsec.d',
            '/etc/ipsec.d/certs',
            '/etc/ipsec.d/private',
            '/etc/ipsec.d/cacerts',
            '/usr/local/etc',
            '/usr/local/etc/strongswan.d',
          ]) {
            try {
              wasmFS.mkdir(dir)
            } catch (_) {}
          }
          wasmFS.writeFile(
            '/etc/softhsmv3.conf',
            'directories.tokendir = /var/lib/softhsmv3/tokens\nobjectstore.backend = file\nlog.level = DEBUG\n'
          )
          self.postMessage({
            type: 'LOG',
            payload: { level: 'info', text: '[WASM FS] wrote /etc/softhsmv3.conf' },
          })

          for (let [filename, content] of Object.entries(initConfigs)) {
            const path = filename.startsWith('/') ? filename : `/usr/local/etc/${filename}`
            try {
              if (filename.includes('strongswan.conf')) {
                content = content.replace(
                  /load_modular\s*=\s*yes/g,
                  'load_modular = no\n  load = pkcs11 nonce aes sha1 sha2 hmac openssl'
                )
              }
              wasmFS.writeFile(path, content)
              self.postMessage({
                type: 'LOG',
                payload: {
                  level: 'info',
                  text: `[WASM FS] wrote ${path} (${content.length} chars)`,
                },
              })
            } catch (err) {
              self.postMessage({
                type: 'LOG',
                payload: { level: 'error', text: `[WASM FS] failed to write ${path}: ${err}` },
              })
            }
          }
          // Inject PSK + role into Emscripten ENV so C getenv() picks them up.
          // wasm_setup_config() reads WASM_ROLE to set local/remote addresses
          // (initiator=192.168.0.1, responder=192.168.0.2 — matches bridge.ts).
          if (typeof ENV !== 'undefined') {
            if (initPsk) ENV['WASM_PSK'] = initPsk
            ENV['WASM_ROLE'] = workerRole
            ENV['WASM_FRAGMENTATION'] = fragEnv
            ENV['WASM_CHILDSA'] = childSaEnv
            if (localKeyId) ENV['WASM_LOCAL_KEYID'] = localKeyId
            if (remoteKeyId) ENV['WASM_REMOTE_KEYID'] = remoteKeyId
            self.postMessage({
              type: 'LOG',
              payload: {
                level: 'info',
                text: `[WASM ENV] Set WASM_ROLE=${workerRole}, WASM_PSK (${(initPsk || '').length} chars), WASM_LOCAL_KEYID=${(localKeyId || '').slice(0, 12)}…, WASM_REMOTE_KEYID=${(remoteKeyId || '').slice(0, 12)}…`,
              },
            })
          }
          // Inject strongswan.conf via ENV — library.c reads STRONGSWAN_CONF_DATA
          // from getenv() and uses load_string() to parse config in WASM mode.
          if (initConfigs['strongswan.conf']) {
            let confData = initConfigs['strongswan.conf']
            if (confData.includes('load_modular = yes')) {
              confData = confData.replace(
                /load_modular\s*=\s*yes/g,
                'load_modular = no\n  load = pkcs11 nonce aes sha1 sha2 hmac openssl'
              )
            }
            // Try multiple ways to access Emscripten's ENV object
            const envObj =
              typeof ENV !== 'undefined'
                ? ENV
                : typeof Module !== 'undefined' && Module.ENV
                  ? Module.ENV
                  : null
            if (envObj) {
              envObj['STRONGSWAN_CONF_DATA'] = confData
              envObj['WASM_PSK'] = initPsk || ''
              envObj['WASM_ROLE'] = workerRole
              envObj['WASM_FRAGMENTATION'] = fragEnv
              envObj['WASM_CHILDSA'] = childSaEnv
              if (localKeyId) envObj['WASM_LOCAL_KEYID'] = localKeyId
              if (remoteKeyId) envObj['WASM_REMOTE_KEYID'] = remoteKeyId
              self.postMessage({
                type: 'LOG',
                payload: {
                  level: 'info',
                  text: `[WASM ENV] Set STRONGSWAN_CONF_DATA (${confData.length} chars) + WASM_PSK`,
                },
              })
            } else {
              self.postMessage({
                type: 'LOG',
                payload: {
                  level: 'error',
                  text: '[WASM ENV] ENV object not available in preRun — config will not be loaded!',
                },
              })
            }
          }
        },
      ],

      print: (text) => {
        self.postMessage({ type: 'LOG', payload: { level: 'info', text } })
      },
      printErr: (text) => {
        // Route charon diagnostic output as info; only propagate genuine runtime errors as error.
        // Charon writes all log output to stderr — lines are charon output if they start with a
        // HH:MM:SS timestamp, a thread prefix like "00[IKE]", or any known subsystem tag.
        const isCharonLog =
          /^\d{2}:\d{2}:\d{2}/.test(text) ||
          /^\d{2}\[(IKE|CFG|ENC|NET|KNL|LIB|MGR|JOB|TNC|ESP|TLS)\]/.test(text) ||
          /\[(IKE|CFG|ENC|NET|KNL|LIB|MGR|JOB)\]/.test(text) ||
          text.trim() === ''
        self.postMessage({ type: 'LOG', payload: { level: isCharonLog ? 'info' : 'error', text } })
      },

      instantiateWasm: (imports, successCallback) => {
        const env = imports.env || imports.a || imports.asmLibraryArg || {}
        const nameToKey = {}
        for (const [key, fn] of Object.entries(env)) {
          if (fn && fn.name) nameToKey[fn.name] = key
        }

        let wasmMemory = null
        const heap8 = () => new Uint8Array(wasmMemory.buffer)
        const heap16 = () => new Int16Array(wasmMemory.buffer)
        const heap32 = () => new Int32Array(wasmMemory.buffer)
        const heap32u = () => new Uint32Array(wasmMemory.buffer)
        const utf8ToString = (ptr) => {
          const h = heap8()
          let s = '',
            i = ptr
          while (h[i]) {
            s += String.fromCharCode(h[i++])
          }
          return s
        }

        const unmatchedKeys = Object.keys(env).filter((k) => !Object.values(nameToKey).includes(k))
        for (const key of unmatchedKeys) {
          const origFn = env[key]
          env[key] = (...args) => {
            if (args.length >= 1 && wasmMemory) {
              try {
                const str = utf8ToString(args[0])
                if (str && (str.endsWith('.so') || str.includes('lib'))) return 1
                if (str === 'C_GetFunctionList') {
                  // Prefer the traced wrapper so the strongswan-pkcs11 plugin
                  // (which dlsym's its function list) sees the shadow CK_FUNCTION_LIST
                  // with our crypto-op trace shims installed. Falls back to the raw
                  // softhsmv3 export if the wrapper export isn't present (older WASM).
                  const fn =
                    self.Module._pkcs11_wasm_C_GetFunctionList ||
                    self.Module._C_GetFunctionList
                  if (fn && self.Module.addFunction) return self.Module.addFunction(fn, 'ii')
                  return 0
                }
              } catch (_) {}
            }
            return origFn ? origFn(...args) : 0
          }
        }

        fetch('/wasm/strongswan.wasm')
          .then((r) => r.arrayBuffer())
          .then((buf) => WebAssembly.instantiate(buf, imports))
          .then(({ instance, module: wasmMod }) => {
            for (const v of Object.values(instance.exports)) {
              if (v instanceof WebAssembly.Memory) {
                wasmMemory = v
                break
              }
            }
            self._wasmMemory = wasmMemory
            // Set SABs BEFORE successCallback — EM_JS functions read these from Module
            // during onRuntimeInitialized which fires inside successCallback
            if (netInboxSab) self.Module._wasm_net_sab = netInboxSab
            if (pkcs11Sab) self.Module._wasm_pkcs11_sab = pkcs11Sab
            // (dst_ip for inbound packets is now plumbed through the SAB
            // header by bridge.ts case 'PACKET_OUT' + socket_wasm.c
            // wasm_net_receive — no per-worker Module._wasm_local_ip needed.)
            successCallback(instance, wasmMod)
          })
          .catch((err) => self.postMessage({ type: 'ERROR', payload: `WASM setup failed: ${err}` }))
        return {}
      },

      onRuntimeInitialized: () => {
        self.postMessage({ type: 'READY' })
      },
      onExit: (code) => {
        self.postMessage({
          type: 'LOG',
          payload: { level: 'error', text: `[WASM] charon exited with code ${code}` },
        })
      },
      onAbort: (reason) => {
        self.postMessage({
          type: 'LOG',
          payload: { level: 'error', text: `[WASM] charon ABORTED: ${reason}` },
        })
      },
    }

    importScripts('/wasm/strongswan.js')
  } catch (err) {
    self.postMessage({ type: 'ERROR', payload: `Init error: ${err.message ?? err}` })
  }
}
