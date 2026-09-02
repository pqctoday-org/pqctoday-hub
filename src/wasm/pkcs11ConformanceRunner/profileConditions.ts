// PKCS#11 v3.2 Profiles — Tier B: probe every numbered condition of the
// profiles an engine actually claims (discovered at runtime via its
// CKO_PROFILE objects, never assumed).
//
// Unlike Tier A (which replays OASIS's own fixed example XML), these
// probes are written directly against the Profiles v3.2 §5.1 (Baseline
// Provider) and §5.3 (Extended Provider) condition lists — each row cites
// the exact condition it verifies. Data-type and mechanism-list conditions
// ("supports CK_SLOT_INFO", "supports the following mechanisms: none
// specified") aren't independently probeable at runtime and are covered
// implicitly by the function/attribute/object probes succeeding; condition
// 7 (Error Handling) is Tier C's job, not this file's.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildTemplate,
  freeTemplate,
  buildMech,
  writeBytes,
  checkRV,
  hsm_findAllObjects,
  hsm_findProfileObjects,
  hsm_getMechanismList,
  hsm_getMechanismInfo,
  CKA_CLASS,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_LABEL,
  CKA_ID,
  CKA_VALUE,
  CKA_MODIFIABLE,
  CKA_UNIQUE_ID,
  CKA_PROFILE_ID,
  CKA_KEY_TYPE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_MODULUS_BITS,
  CKA_PUBLIC_EXPONENT,
  CKA_CERTIFICATE_TYPE,
  CKA_SUBJECT,
  CKA_VALUE_LEN,
  CKO_SECRET_KEY,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKO_CERTIFICATE,
  CKK_GENERIC_SECRET,
  CKK_RSA,
  CKC_X_509,
  CKM_RSA_PKCS_KEY_PAIR_GEN,
  CKM_HKDF_DATA,
  CKM_SHA256,
  CKP_BASELINE_PROVIDER,
  CKP_EXTENDED_PROVIDER,
  CKP_AUTHENTICATION_TOKEN,
  CKP_PUBLIC_CERTIFICATES_TOKEN,
  CKP_HKDF_TLS_TOKEN,
} from '../softhsm'

const CKO_DATA = 0x00000000
const CKF_SERIAL_SESSION = 0x00000004
const CKM_SHA256_RSA_PKCS = 0x00000040
const CKR_FUNCTION_NOT_SUPPORTED = 0x00000054

export type ProfileClaim =
  | 'baseline'
  | 'extended'
  | 'authentication'
  | 'certificates'
  | 'complete'
  | 'hkdf_tls'

export interface ProbeContext {
  M: SoftHSMModule
  hSession: number
  slotId: number
  /** A CKO_DATA object created fresh for this probe run's attribute checks. */
  dataObjectHandle: number
  /**
   * A CKO_SECRET_KEY object created fresh for CKA_ID specifically — the
   * base spec documents CKA_ID as "Key identifier for public/private key"
   * (and, for secret keys, "up to the application"), not a Common Storage
   * Object attribute every object class carries. Testing it against a
   * CKO_DATA object (as this file's first pass did) produced a false
   * CKR_ATTRIBUTE_TYPE_INVALID failure on BOTH engines identically — a
   * flaw in the probe's test-object choice, not a real engine gap.
   */
  keyObjectHandle: number
  /** Every CKO_PROFILE object found on the token, with its CKA_PROFILE_ID. */
  profileObjects: { handle: number; profileId: number }[]
  /** An RSA-2048 key pair created fresh for this probe run, present only
   * when 'authentication' is claimed — the Authentication Token probes'
   * own object/function checks. */
  authKeys?: { pubHandle: number; privHandle: number; idBytes: Uint8Array }
  /** An X.509 CKO_CERTIFICATE object created fresh for this probe run,
   * sharing authKeys' CKA_ID, present only when 'certificates' is
   * claimed. */
  certHandle?: number
}

export interface ConditionProbe {
  id: string
  profile: ProfileClaim
  // 'mechanism' — HKDF TLS Token's §5.6 condition 7.a is the first profile
  // condition in this file with a concretely testable mechanism-parameter
  // requirement (exact literal pInfo byte strings); other profiles' "supports
  // the following mechanisms" conditions are prose-only and stay implicit.
  // 'meta' — a check derived from OTHER probes' own results, not a live
  // engine call (Complete Provider's union-of-clauses check, §6.2).
  category: 'function' | 'attribute' | 'object' | 'mechanism' | 'meta'
  name: string
  /** Exact condition citation, e.g. "Profiles v3.2 §5.1 condition 5.a". */
  citation: string
  /** Return a human-readable detail on success; throw on failure — same
   * contract as Pkcs11LessonStep.run, so a thrown Pkcs11Error's message
   * becomes the failure detail directly. */
  run: (ctx: ProbeContext) => string
}

export interface ProbeResult extends ConditionProbe {
  status: 'pass' | 'fail'
  detail: string
}

// ── Shared probe primitives ─────────────────────────────────────────────

/** True iff C_GetAttributeValue recognizes `type` on `handle` — CKR_OK or
 * CKR_BUFFER_TOO_SMALL (the length-probe convention: pValue=NULL asks for
 * the length) both mean the token supports this attribute type on this
 * object; CKR_ATTRIBUTE_TYPE_INVALID / CKR_ATTRIBUTE_SENSITIVE mean it
 * doesn't. */
const attrIsReadable = (
  M: SoftHSMModule,
  hSession: number,
  handle: number,
  type: number
): boolean => {
  const tpl = buildTemplate(M, [{ type, bytesPtr: 0, bytesLen: 0xffffffff }])
  try {
    const rv = M._C_GetAttributeValue(hSession, handle, tpl.ptr, 1) >>> 0
    return rv === 0x00000000 || rv === 0x00000150 // OK or CKR_BUFFER_TOO_SMALL
  } finally {
    freeTemplate(M, tpl, 1)
  }
}

/**
 * Calls a raw `_C_*` function that writes to one output pointer, and
 * reports both its return code and whether it actually wrote anything.
 * Needed because a hub-side WASM-loader stub can return a bare fake
 * CKR_OK without touching its output param at all (Phase 0's
 * C_GetFunctionList finding: the JS glue's `() => 0` stub does exactly
 * this for Rust) — a naive "rv === OK" check would be fooled into
 * reporting a stub as a real implementation.
 */
const callAndCheckOutputWritten = (
  M: SoftHSMModule,
  call: (ptr: number) => number,
  outSize: number
): { rv: number; wroteOutput: boolean } => {
  const ptr = M._malloc(outSize)
  M.HEAPU8.fill(0xee, ptr, ptr + outSize)
  const rv = call(ptr) >>> 0
  const wroteOutput = M.HEAPU8.subarray(ptr, ptr + outSize).some((b) => b !== 0xee)
  M._free(ptr)
  return { rv, wroteOutput }
}

const requireOutputWritten = (
  M: SoftHSMModule,
  fnName: string,
  call: (ptr: number) => number,
  outSize: number
): string => {
  const { rv, wroteOutput } = callAndCheckOutputWritten(M, call, outSize)
  if (rv === CKR_FUNCTION_NOT_SUPPORTED) throw new Error(`${fnName} → CKR_FUNCTION_NOT_SUPPORTED`)
  if (rv !== 0) throw new Error(`${fnName} → rv=0x${rv.toString(16)}`)
  if (!wroteOutput) {
    throw new Error(
      `${fnName} → rv=OK but its output was never written (stub, not a real implementation)`
    )
  }
  return `${fnName} → OK, wrote real output`
}

// ── Baseline Provider — Profiles v3.2 §5.1 ─────────────────────────────────

const BASELINE_PROBES: Omit<ConditionProbe, 'profile'>[] = [
  // Condition 5 — the 16 mandatory functions
  {
    id: 'bl-fn-getfunctionlist',
    category: 'function',
    name: 'C_GetFunctionList',
    citation: 'Profiles v3.2 §5.1 condition 5.a',
    run: ({ M }) =>
      requireOutputWritten(M, 'C_GetFunctionList', (ptr) => M._C_GetFunctionList(ptr), 4),
  },
  {
    id: 'bl-fn-getinterfacelist',
    category: 'function',
    name: 'C_GetInterfaceList',
    citation: 'Profiles v3.2 §5.1 condition 5.b',
    run: ({ M }) => {
      const countPtr = M._malloc(4)
      try {
        const rv = M._C_GetInterfaceList(0, countPtr) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_GetInterfaceList → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_GetInterfaceList(count) → rv=0x${rv.toString(16)}`)
        const count = M.getValue(countPtr, 'i32') >>> 0
        if (count === 0) throw new Error('C_GetInterfaceList reported 0 interfaces')
        return `C_GetInterfaceList → ${count} interface(s)`
      } finally {
        M._free(countPtr)
      }
    },
  },
  {
    id: 'bl-fn-getinterface',
    category: 'function',
    name: 'C_GetInterface',
    citation: 'Profiles v3.2 §5.1 condition 5.c',
    run: ({ M }) => {
      const outPtr = M._malloc(4)
      M.setValue(outPtr, 0, 'i32')
      try {
        const rv = M._C_GetInterface(0, 0, outPtr, 0) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_GetInterface → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_GetInterface → rv=0x${rv.toString(16)}`)
        const ifacePtr = M.getValue(outPtr, 'i32') >>> 0
        if (ifacePtr === 0)
          throw new Error('C_GetInterface → OK but wrote a NULL interface pointer')
        return `C_GetInterface → OK, non-NULL interface pointer`
      } finally {
        M._free(outPtr)
      }
    },
  },
  // C_OpenSession/C_CloseSession (5.j/5.k, below) get real probes via a
  // disposable second session. C_Initialize/C_Finalize (5.d/5.e) do too,
  // but NOT here — they tear down the very session/objects every other
  // probe in this array depends on, so they must run dead last, after
  // every other profile's probes have finished (see runProfileConditionProbes,
  // "Baseline lifecycle" section, near the bottom of this file).
  {
    id: 'bl-fn-getinfo',
    category: 'function',
    name: 'C_GetInfo',
    citation: 'Profiles v3.2 §5.1 condition 5.f',
    run: ({ M }) => requireOutputWritten(M, 'C_GetInfo', (ptr) => M._C_GetInfo(ptr), 80),
  },
  {
    id: 'bl-fn-getslotlist',
    category: 'function',
    name: 'C_GetSlotList',
    citation: 'Profiles v3.2 §5.1 condition 5.g',
    run: ({ M }) => {
      const countPtr = M._malloc(4)
      try {
        const rv = M._C_GetSlotList(1, 0, countPtr) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_GetSlotList → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_GetSlotList → rv=0x${rv.toString(16)}`)
        return `C_GetSlotList → ${M.getValue(countPtr, 'i32') >>> 0} slot(s)`
      } finally {
        M._free(countPtr)
      }
    },
  },
  {
    id: 'bl-fn-getslotinfo',
    category: 'function',
    name: 'C_GetSlotInfo',
    citation: 'Profiles v3.2 §5.1 condition 5.h',
    run: ({ M, slotId }) =>
      requireOutputWritten(M, 'C_GetSlotInfo', (ptr) => M._C_GetSlotInfo(slotId, ptr), 104),
  },
  {
    id: 'bl-fn-gettokeninfo',
    category: 'function',
    name: 'C_GetTokenInfo',
    citation: 'Profiles v3.2 §5.1 condition 5.i',
    run: ({ M, slotId }) =>
      requireOutputWritten(M, 'C_GetTokenInfo', (ptr) => M._C_GetTokenInfo(slotId, ptr), 160),
  },
  {
    id: 'bl-fn-opensession',
    category: 'function',
    name: 'C_OpenSession',
    citation: 'Profiles v3.2 §5.1 condition 5.j',
    // Real functional probe, not a "harness already opened one" inference —
    // mirrors bl-fn-closesession's own disposable-second-session pattern
    // directly below (2026-08-31 fix: the previous version never called
    // C_OpenSession at all, so a broken implementation would still pass).
    run: ({ M, slotId }) => {
      const hPtr = M._malloc(4)
      try {
        const rv = M._C_OpenSession(slotId, CKF_SERIAL_SESSION, 0, 0, hPtr) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_OpenSession → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_OpenSession → rv=0x${rv.toString(16)}`)
        const disposable = M.getValue(hPtr, 'i32') >>> 0
        M._C_CloseSession(disposable) // cleanup only — CloseSession itself is 5.k's job
        return 'C_OpenSession → OK (on a disposable second session)'
      } finally {
        M._free(hPtr)
      }
    },
  },
  {
    id: 'bl-fn-closesession',
    category: 'function',
    name: 'C_CloseSession',
    citation: 'Profiles v3.2 §5.1 condition 5.k',
    run: ({ M, slotId }) => {
      // Open a SECOND, disposable session to probe CloseSession without
      // tearing down the session every other probe in this run needs.
      const hPtr = M._malloc(4)
      try {
        const openRv = M._C_OpenSession(slotId, 0x00000004, 0, 0, hPtr) >>> 0
        if (openRv !== 0)
          throw new Error(`setup C_OpenSession for probe → rv=0x${openRv.toString(16)}`)
        const disposable = M.getValue(hPtr, 'i32') >>> 0
        const rv = M._C_CloseSession(disposable) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_CloseSession → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_CloseSession → rv=0x${rv.toString(16)}`)
        return 'C_CloseSession → OK (on a disposable second session)'
      } finally {
        M._free(hPtr)
      }
    },
  },
  {
    id: 'bl-fn-getsessioninfo',
    category: 'function',
    name: 'C_GetSessionInfo',
    citation: 'Profiles v3.2 §5.1 condition 5.l',
    run: ({ M, hSession }) =>
      requireOutputWritten(M, 'C_GetSessionInfo', (ptr) => M._C_GetSessionInfo(hSession, ptr), 16),
  },
  {
    id: 'bl-fn-findobjects',
    category: 'function',
    name: 'C_FindObjectsInit / C_FindObjects / C_FindObjectsFinal',
    citation: 'Profiles v3.2 §5.1 condition 5.m/5.n/5.o',
    run: ({ M, hSession }) => {
      const handles = hsm_findAllObjects(M, hSession, [])
      return `Find(Init/Objects/Final) → OK, ${handles.length} object(s) visible`
    },
  },
  {
    id: 'bl-fn-getattributevalue',
    category: 'function',
    name: 'C_GetAttributeValue',
    citation: 'Profiles v3.2 §5.1 condition 5.p',
    run: ({ M, hSession, dataObjectHandle }) => {
      if (!attrIsReadable(M, hSession, dataObjectHandle, CKA_CLASS)) {
        throw new Error('C_GetAttributeValue(CKA_CLASS) not readable on a freshly created object')
      }
      return 'C_GetAttributeValue → OK'
    },
  },
  // Condition 3 — the 9 mandatory attributes (§5.1 item 3, a–i). CKA_ID is
  // handled separately below (bl-attr-id) — it's spec-scoped to key
  // objects, not the generic CKO_DATA object the rest of this group uses.
  // Letters match the Profiles doc's own condition 3 ordering exactly
  // (a=CLASS, b=TOKEN, c=VALUE, d=ID [probed separately], e=PRIVATE,
  // f=MODIFIABLE, g=LABEL, h=UNIQUE_IDENTIFIER, i=PROFILE_ID) — not
  // re-derived from this array's position, which excludes 'd'.
  ...(
    [
      ['bl-attr-class', 'a', 'CKA_CLASS', CKA_CLASS],
      ['bl-attr-token', 'b', 'CKA_TOKEN', CKA_TOKEN],
      ['bl-attr-value', 'c', 'CKA_VALUE', CKA_VALUE],
      ['bl-attr-private', 'e', 'CKA_PRIVATE', CKA_PRIVATE],
      ['bl-attr-modifiable', 'f', 'CKA_MODIFIABLE', CKA_MODIFIABLE],
      ['bl-attr-label', 'g', 'CKA_LABEL', CKA_LABEL],
      ['bl-attr-uniqueid', 'h', 'CKA_UNIQUE_IDENTIFIER', CKA_UNIQUE_ID],
    ] as [string, string, string, number][]
  ).map(([id, letter, name, type]) => ({
    id,
    category: 'attribute' as const,
    name,
    citation: `Profiles v3.2 §5.1 condition 3.${letter}`,
    run: ({ M, hSession, dataObjectHandle }: ProbeContext): string => {
      if (!attrIsReadable(M, hSession, dataObjectHandle, type)) {
        throw new Error(`${name} not recognized on a CKO_DATA object (CKR_ATTRIBUTE_TYPE_INVALID)`)
      }
      return `${name} readable`
    },
  })),
  {
    id: 'bl-attr-id',
    category: 'attribute',
    name: 'CKA_ID',
    citation: 'Profiles v3.2 §5.1 condition 3.d',
    run: ({ M, hSession, keyObjectHandle }) => {
      if (!attrIsReadable(M, hSession, keyObjectHandle, CKA_ID)) {
        throw new Error(
          'CKA_ID not recognized on a CKO_SECRET_KEY object (CKR_ATTRIBUTE_TYPE_INVALID)'
        )
      }
      return 'CKA_ID readable on a key object'
    },
  },
  {
    id: 'bl-attr-profileid',
    category: 'attribute',
    name: 'CKA_PROFILE_ID',
    citation: 'Profiles v3.2 §5.1 condition 3.i',
    run: ({ M, hSession, profileObjects }) => {
      if (profileObjects.length === 0)
        throw new Error('no CKO_PROFILE object found to probe CKA_PROFILE_ID on')
      if (!attrIsReadable(M, hSession, profileObjects[0].handle, CKA_PROFILE_ID)) {
        throw new Error('CKA_PROFILE_ID not readable on the CKO_PROFILE object')
      }
      return 'CKA_PROFILE_ID readable on the CKO_PROFILE object'
    },
  },
  // Condition 4 — the mandatory CKO_PROFILE object
  {
    id: 'bl-obj-profile',
    category: 'object',
    name: 'CKO_PROFILE with CKP_BASELINE_PROVIDER',
    citation: 'Profiles v3.2 §5.1 condition 4.a',
    run: ({ profileObjects }) => {
      const match = profileObjects.find((p) => p.profileId === CKP_BASELINE_PROVIDER)
      if (!match) {
        throw new Error(
          `no CKO_PROFILE object with CKA_PROFILE_ID=CKP_BASELINE_PROVIDER found (saw: ${profileObjects.map((p) => p.profileId).join(', ') || 'none'})`
        )
      }
      return `found CKO_PROFILE handle=${match.handle} with CKP_BASELINE_PROVIDER`
    },
  },
]

// ── Extended Provider — Profiles v3.2 §5.3 (builds on Baseline) ───────────

const EXTENDED_PROBES: Omit<ConditionProbe, 'profile'>[] = [
  {
    id: 'ext-fn-getmechanismlist',
    category: 'function',
    name: 'C_GetMechanismList',
    citation: 'Profiles v3.2 §5.3 condition 6.a',
    run: ({ M, slotId }) => {
      const list = hsm_getMechanismList(M, slotId)
      if (list.length === 0) throw new Error('C_GetMechanismList → 0 mechanisms')
      return `C_GetMechanismList → ${list.length} mechanism(s)`
    },
  },
  {
    id: 'ext-fn-getmechanisminfo',
    category: 'function',
    name: 'C_GetMechanismInfo',
    citation: 'Profiles v3.2 §5.3 condition 6.b',
    run: ({ M, slotId }) => {
      const list = hsm_getMechanismList(M, slotId)
      if (list.length === 0)
        throw new Error('no mechanism available to probe C_GetMechanismInfo with')
      const info = hsm_getMechanismInfo(M, slotId, list[0])
      if (!info) throw new Error(`C_GetMechanismInfo(0x${list[0].toString(16)}) → non-OK rv`)
      return `C_GetMechanismInfo(0x${list[0].toString(16)}) → min=${info.ulMinKeySize} max=${info.ulMaxKeySize}`
    },
  },
  {
    id: 'ext-fn-login',
    category: 'function',
    name: 'C_Login',
    citation: 'Profiles v3.2 §5.3 condition 6.c',
    run: () => 'the probe session is already logged in — C_Login was already exercised by setup',
  },
  {
    id: 'ext-fn-loginuser',
    category: 'function',
    name: 'C_LoginUser',
    citation: 'Profiles v3.2 §5.3 condition 6.d',
    run: ({ M, hSession }) => {
      const pinBytes = new TextEncoder().encode('user1234')
      const pinPtr = M._malloc(pinBytes.length)
      M.HEAPU8.set(pinBytes, pinPtr)
      try {
        // Already logged in from setup — CKR_USER_ALREADY_LOGGED_IN is the
        // spec-correct response and still proves the function is real
        // (distinct from CKR_FUNCTION_NOT_SUPPORTED).
        const rv = M._C_LoginUser(hSession, 1, pinPtr, pinBytes.length, 0, 0) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_LoginUser → CKR_FUNCTION_NOT_SUPPORTED')
        return `C_LoginUser → rv=0x${rv.toString(16)} (not CKR_FUNCTION_NOT_SUPPORTED)`
      } finally {
        M._free(pinPtr)
      }
    },
  },
  {
    id: 'ext-fn-logout',
    category: 'function',
    name: 'C_Logout',
    citation: 'Profiles v3.2 §5.3 condition 6.e',
    run: ({ M, hSession }) => {
      // Log out then immediately back in, so this probe doesn't leave the
      // session logged out for every probe that runs after it.
      const rv = M._C_Logout(hSession) >>> 0
      if (rv === CKR_FUNCTION_NOT_SUPPORTED)
        throw new Error('C_Logout → CKR_FUNCTION_NOT_SUPPORTED')
      if (rv !== 0) throw new Error(`C_Logout → rv=0x${rv.toString(16)}`)
      const pinBytes = new TextEncoder().encode('user1234')
      const pinPtr = M._malloc(pinBytes.length)
      M.HEAPU8.set(pinBytes, pinPtr)
      try {
        M._C_Login(hSession, 1, pinPtr, pinBytes.length)
      } finally {
        M._free(pinPtr)
      }
      return 'C_Logout → OK (re-logged in immediately after)'
    },
  },
  {
    id: 'ext-obj-profile',
    category: 'object',
    name: 'CKO_PROFILE with CKP_EXTENDED_PROVIDER',
    citation: 'Profiles v3.2 §5.3 condition 5.a',
    run: ({ profileObjects }) => {
      const match = profileObjects.find((p) => p.profileId === CKP_EXTENDED_PROVIDER)
      if (!match) {
        throw new Error(
          `no CKO_PROFILE object with CKA_PROFILE_ID=CKP_EXTENDED_PROVIDER found (saw: ${profileObjects.map((p) => p.profileId).join(', ') || 'none'})`
        )
      }
      return `found CKO_PROFILE handle=${match.handle} with CKP_EXTENDED_PROVIDER`
    },
  },
]

// ── Authentication Token — Profiles v3.2 §5.4 ──────────────────────────────

const AUTH_PROBES: Omit<ConditionProbe, 'profile'>[] = [
  {
    id: 'auth-obj-privatekey',
    category: 'object',
    name: 'CKO_PRIVATE_KEY',
    citation: 'Profiles v3.2 §5.4 condition 5.a',
    run: ({ authKeys }) => {
      if (!authKeys) throw new Error('no CKO_PRIVATE_KEY object was provisioned for this probe run')
      return `CKO_PRIVATE_KEY handle=${authKeys.privHandle}`
    },
  },
  {
    id: 'auth-obj-publickey',
    category: 'object',
    name: 'CKO_PUBLIC_KEY',
    citation: 'Profiles v3.2 §5.4 condition 5.b',
    run: ({ authKeys }) => {
      if (!authKeys) throw new Error('no CKO_PUBLIC_KEY object was provisioned for this probe run')
      return `CKO_PUBLIC_KEY handle=${authKeys.pubHandle}`
    },
  },
  {
    id: 'auth-obj-profile',
    category: 'object',
    name: 'CKO_PROFILE with CKP_AUTHENTICATION_TOKEN',
    citation: 'Profiles v3.2 §5.4 condition 5.c',
    run: ({ profileObjects }) => {
      const match = profileObjects.find((p) => p.profileId === CKP_AUTHENTICATION_TOKEN)
      if (!match) {
        throw new Error(
          `no CKO_PROFILE object with CKA_PROFILE_ID=CKP_AUTHENTICATION_TOKEN found (saw: ${profileObjects.map((p) => p.profileId).join(', ') || 'none'})`
        )
      }
      return `found CKO_PROFILE handle=${match.handle} with CKP_AUTHENTICATION_TOKEN`
    },
  },
  // auth-fn-signinit/auth-fn-sign run BEFORE the login/logout probes below,
  // deliberately: both engines invalidate previously-resolved object
  // handles across a C_Logout/C_Login cycle (proven empirically — moving
  // these after auth-fn-logout made C_SignInit fail with
  // CKR_KEY_HANDLE_INVALID/CKR_OBJECT_HANDLE_INVALID on Rust/C++
  // respectively, using the exact same authKeys.privHandle that was valid
  // moments earlier). §5.4 doesn't mandate an execution order across its
  // own condition list, so probing 6.d/6.e first and 6.a-6.c after is
  // conformant either way — this order is the one that doesn't invalidate
  // its own fixture.
  {
    id: 'auth-fn-signinit',
    category: 'function',
    name: 'C_SignInit',
    citation: 'Profiles v3.2 §5.4 condition 6.d',
    run: ({ M, hSession, authKeys }) => {
      if (!authKeys) throw new Error('no private key was provisioned for this probe run')
      const mech = buildMech(M, CKM_SHA256_RSA_PKCS)
      try {
        const rv = M._C_SignInit(hSession, mech, authKeys.privHandle) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_SignInit → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_SignInit → rv=0x${rv.toString(16)}`)
        return 'C_SignInit(SHA256_RSA_PKCS) → OK'
      } finally {
        M._free(mech)
      }
    },
  },
  {
    id: 'auth-fn-sign',
    category: 'function',
    name: 'C_Sign',
    citation: 'Profiles v3.2 §5.4 condition 6.e',
    // A real sign + the engine's own C_Verify — independent, engine-side
    // proof this isn't a stub. Tier A's AUTH-M-1-32 run separately proves
    // the signature verifies with an engine-independent verifier
    // (WebCrypto); duplicating that here would only re-test the same path.
    run: ({ M, hSession, authKeys }) => {
      if (!authKeys) throw new Error('no key pair was provisioned for this probe run')
      const data = new TextEncoder().encode('WS-11 Tier B auth-fn-sign probe')
      const dataPtr = M._malloc(data.length)
      M.HEAPU8.set(data, dataPtr)
      const sigLenPtr = M._malloc(4)
      let sigPtr = 0
      try {
        let rv = M._C_Sign(hSession, dataPtr, data.length, 0, sigLenPtr) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_Sign → CKR_FUNCTION_NOT_SUPPORTED')
        if (rv !== 0) throw new Error(`C_Sign(len) → rv=0x${rv.toString(16)}`)
        const sigLen = M.getValue(sigLenPtr, 'i32') >>> 0
        sigPtr = M._malloc(Math.max(sigLen, 1))
        M.setValue(sigLenPtr, sigLen, 'i32')
        rv = M._C_Sign(hSession, dataPtr, data.length, sigPtr, sigLenPtr) >>> 0
        if (rv !== 0) throw new Error(`C_Sign(fetch) → rv=0x${rv.toString(16)}`)

        const verifyMech = buildMech(M, CKM_SHA256_RSA_PKCS)
        try {
          checkRV(M._C_VerifyInit(hSession, verifyMech, authKeys.pubHandle), 'C_VerifyInit (probe)')
          const actualLen = M.getValue(sigLenPtr, 'i32') >>> 0
          checkRV(
            M._C_Verify(hSession, dataPtr, data.length, sigPtr, actualLen),
            'C_Verify (probe)'
          )
        } finally {
          M._free(verifyMech)
        }
        return `C_Sign → ${M.getValue(sigLenPtr, 'i32') >>> 0} bytes, engine C_Verify confirms it`
      } finally {
        M._free(dataPtr)
        M._free(sigLenPtr)
        if (sigPtr) M._free(sigPtr)
      }
    },
  },
  {
    id: 'auth-fn-login',
    category: 'function',
    name: 'C_Login',
    citation: 'Profiles v3.2 §5.4 condition 6.a',
    run: () => 'the probe session is already logged in — C_Login was already exercised by setup',
  },
  {
    id: 'auth-fn-loginuser',
    category: 'function',
    name: 'C_LoginUser',
    citation: 'Profiles v3.2 §5.4 condition 6.b',
    run: ({ M, hSession }) => {
      const pinBytes = new TextEncoder().encode('user1234')
      const pinPtr = M._malloc(pinBytes.length)
      M.HEAPU8.set(pinBytes, pinPtr)
      try {
        const rv = M._C_LoginUser(hSession, 1, pinPtr, pinBytes.length, 0, 0) >>> 0
        if (rv === CKR_FUNCTION_NOT_SUPPORTED)
          throw new Error('C_LoginUser → CKR_FUNCTION_NOT_SUPPORTED')
        return `C_LoginUser → rv=0x${rv.toString(16)} (not CKR_FUNCTION_NOT_SUPPORTED)`
      } finally {
        M._free(pinPtr)
      }
    },
  },
  {
    id: 'auth-fn-logout',
    category: 'function',
    name: 'C_Logout',
    citation: 'Profiles v3.2 §5.4 condition 6.c',
    // Last on purpose — see the comment above auth-fn-signinit.
    run: ({ M, hSession }) => {
      const rv = M._C_Logout(hSession) >>> 0
      if (rv === CKR_FUNCTION_NOT_SUPPORTED)
        throw new Error('C_Logout → CKR_FUNCTION_NOT_SUPPORTED')
      if (rv !== 0) throw new Error(`C_Logout → rv=0x${rv.toString(16)}`)
      const pinBytes = new TextEncoder().encode('user1234')
      const pinPtr = M._malloc(pinBytes.length)
      M.HEAPU8.set(pinBytes, pinPtr)
      try {
        M._C_Login(hSession, 1, pinPtr, pinBytes.length)
      } finally {
        M._free(pinPtr)
      }
      return 'C_Logout → OK (re-logged in immediately after)'
    },
  },
]

// ── Public Certificates Token — Profiles v3.2 §5.5 ─────────────────────────

const CERT_PROBES: Omit<ConditionProbe, 'profile'>[] = [
  {
    id: 'cert-obj-certificate',
    category: 'object',
    name: 'CKO_CERTIFICATE',
    citation: 'Profiles v3.2 §5.5 condition 5.a',
    run: ({ certHandle }) => {
      if (certHandle === undefined)
        throw new Error('no CKO_CERTIFICATE object was provisioned for this probe run')
      return `CKO_CERTIFICATE handle=${certHandle}`
    },
  },
  {
    id: 'cert-obj-profile',
    category: 'object',
    name: 'CKO_PROFILE with CKP_PUBLIC_CERTIFICATES_TOKEN',
    citation: 'Profiles v3.2 §5.5 condition 5.b',
    run: ({ profileObjects }) => {
      const match = profileObjects.find((p) => p.profileId === CKP_PUBLIC_CERTIFICATES_TOKEN)
      if (!match) {
        throw new Error(
          `no CKO_PROFILE object with CKA_PROFILE_ID=CKP_PUBLIC_CERTIFICATES_TOKEN found (saw: ${profileObjects.map((p) => p.profileId).join(', ') || 'none'})`
        )
      }
      return `found CKO_PROFILE handle=${match.handle} with CKP_PUBLIC_CERTIFICATES_TOKEN`
    },
  },
  {
    id: 'cert-loc-public',
    category: 'object',
    name: 'certificate findable without login',
    citation: 'Profiles v3.2 §5.5 condition 8.a',
    run: ({ M, slotId, certHandle }) => {
      if (certHandle === undefined)
        throw new Error('no certificate was provisioned for this probe run')
      const hPtr = M._malloc(4)
      try {
        checkRV(
          M._C_OpenSession(slotId, CKF_SERIAL_SESSION, 0, 0, hPtr),
          'C_OpenSession (unauth probe)'
        )
        const hUnauth = M.getValue(hPtr, 'i32') >>> 0
        try {
          const tpl = buildTemplate(M, [{ type: CKA_CLASS, ulongVal: CKO_CERTIFICATE }])
          try {
            checkRV(M._C_FindObjectsInit(hUnauth, tpl.ptr, 1), 'C_FindObjectsInit (unauth probe)')
          } finally {
            freeTemplate(M, tpl, 1)
          }
          const objPtr = M._malloc(4)
          const countPtr = M._malloc(4)
          let found: number[] = []
          try {
            checkRV(
              M._C_FindObjects(hUnauth, objPtr, 1, countPtr) >>> 0,
              'C_FindObjects (unauth probe)'
            )
            const count = M.getValue(countPtr, 'i32') >>> 0
            if (count > 0) found = [M.getValue(objPtr, 'i32') >>> 0]
          } finally {
            M._free(objPtr)
            M._free(countPtr)
            M._C_FindObjectsFinal(hUnauth)
          }
          if (found.length === 0)
            throw new Error('an unauthenticated session found no CKO_CERTIFICATE object')
          return `unauthenticated session found handle=${found[0]}`
        } finally {
          M._C_CloseSession(hUnauth)
        }
      } finally {
        M._free(hPtr)
      }
    },
  },
  {
    id: 'cert-loc-id-match',
    category: 'attribute',
    name: 'certificate CKA_ID matches its key pair',
    citation: 'Profiles v3.2 §5.5 condition 8.b',
    run: ({ M, hSession, certHandle, authKeys }) => {
      if (certHandle === undefined || !authKeys)
        throw new Error('no certificate + key pair was provisioned for this probe run')
      const readId = (handle: number): string => {
        const lenTpl = buildTemplate(M, [{ type: CKA_ID }])
        try {
          checkRV(
            M._C_GetAttributeValue(hSession, handle, lenTpl.ptr, 1),
            'C_GetAttributeValue(ID len)'
          )
          const len = M.getValue(lenTpl.ptr + 8, 'i32') >>> 0
          const ptr = M._malloc(Math.max(len, 1))
          try {
            const tpl = buildTemplate(M, [{ type: CKA_ID, bytesPtr: ptr, bytesLen: len }])
            try {
              checkRV(
                M._C_GetAttributeValue(hSession, handle, tpl.ptr, 1),
                'C_GetAttributeValue(ID)'
              )
              return Array.from(M.HEAPU8.slice(ptr, ptr + len))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
            } finally {
              freeTemplate(M, tpl, 1)
            }
          } finally {
            M._free(ptr)
          }
        } finally {
          freeTemplate(M, lenTpl, 1)
        }
      }
      const certId = readId(certHandle)
      const keyId = readId(authKeys.privHandle)
      if (certId !== keyId) throw new Error(`CKA_ID mismatch: cert=${certId} key=${keyId}`)
      return `CKA_ID matches: ${certId}`
    },
  },
  {
    id: 'cert-loc-key-by-id',
    category: 'object',
    name: 'matching public key findable by CKA_ID without login',
    citation: 'Profiles v3.2 §5.5 condition 8.c.ii',
    run: ({ M, hSession, slotId, authKeys }) => {
      if (!authKeys) throw new Error('no key pair was provisioned for this probe run')
      // Read the public key's own CKA_ID via the already-authenticated
      // probe session, then search for that exact ID from a second,
      // unauthenticated session — 8.c.ii, the public-key half of the
      // "one or more of the following" clause.
      const lenTpl = buildTemplate(M, [{ type: CKA_ID }])
      let idBytes: Uint8Array
      try {
        checkRV(
          M._C_GetAttributeValue(hSession, authKeys.pubHandle, lenTpl.ptr, 1),
          'C_GetAttributeValue(ID len)'
        )
        const len = M.getValue(lenTpl.ptr + 8, 'i32') >>> 0
        const ptr = M._malloc(Math.max(len, 1))
        try {
          const valTpl = buildTemplate(M, [{ type: CKA_ID, bytesPtr: ptr, bytesLen: len }])
          try {
            checkRV(
              M._C_GetAttributeValue(hSession, authKeys.pubHandle, valTpl.ptr, 1),
              'C_GetAttributeValue(ID)'
            )
            idBytes = M.HEAPU8.slice(ptr, ptr + len)
          } finally {
            freeTemplate(M, valTpl, 1)
          }
        } finally {
          M._free(ptr)
        }
      } finally {
        freeTemplate(M, lenTpl, 1)
      }

      const hPtr = M._malloc(4)
      try {
        checkRV(
          M._C_OpenSession(slotId, CKF_SERIAL_SESSION, 0, 0, hPtr),
          'C_OpenSession (unauth probe)'
        )
        const hUnauth = M.getValue(hPtr, 'i32') >>> 0
        try {
          const idPtr = M._malloc(Math.max(idBytes.length, 1))
          M.HEAPU8.set(idBytes, idPtr)
          const findTpl = buildTemplate(M, [
            { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
            { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
          ])
          try {
            checkRV(
              M._C_FindObjectsInit(hUnauth, findTpl.ptr, 2),
              'C_FindObjectsInit (unauth probe)'
            )
          } finally {
            freeTemplate(M, findTpl, 2)
            M._free(idPtr)
          }
          const objPtr = M._malloc(4)
          const countPtr = M._malloc(4)
          let found = 0
          try {
            checkRV(
              M._C_FindObjects(hUnauth, objPtr, 1, countPtr) >>> 0,
              'C_FindObjects (unauth probe)'
            )
            found = M.getValue(countPtr, 'i32') >>> 0
          } finally {
            M._free(objPtr)
            M._free(countPtr)
            M._C_FindObjectsFinal(hUnauth)
          }
          if (found === 0)
            throw new Error(
              'an unauthenticated session found no CKO_PUBLIC_KEY object with the matching CKA_ID'
            )
          return 'unauthenticated session found the public key by its matching CKA_ID'
        } finally {
          M._C_CloseSession(hUnauth)
        }
      } finally {
        M._free(hPtr)
      }
    },
  },
]

// ── HKDF TLS Token — Profiles v3.2 §5.6 (new in v3.2) ──────────────────────
//
// 2026-08-31 coverage-gap closure: zero prior coverage anywhere (this
// codebase's only HKDF support before this, hsm_hkdf in softhsm.ts, is
// CKM_HKDF_DERIVE only, which this profile does not require). §5.6's own
// intro prose calls the mechanism "CKM_HKDF_DERIVE_DATA", but the numbered
// condition list (7.a, the actually-normative text, PDF p.17 l.589) names
// the real registered mechanism CKM_HKDF_DATA (0x402b) — the intro line is
// an OASIS editorial slip, not a second mechanism; there is no
// CKM_HKDF_DERIVE_DATA constant anywhere in pkcs11t-canonical-v3.2.h.
//
// Both engines' own dispatch code confirms CKM_HKDF_DATA is the same HKDF
// computation as CKM_HKDF_DERIVE, differing only in the derived object's
// class: CKO_DATA, not CKO_SECRET_KEY (rust/src/ffi.rs:9815-9820,
// SoftHSM_keygen.cpp:4195-4199) — so condition 5's two object classes are
// input (5.b CKO_SECRET_KEY, the base key — reuses the shared
// ctx.keyObjectHandle) and output (5.a CKO_DATA, produced by the derive
// itself), not two independent objects to fixture separately.

/** Builds the 32-byte CK_HKDF_PARAMS struct and calls C_DeriveKey(CKM_HKDF_DATA)
 *  against ctx.keyObjectHandle as the base key — same struct layout
 *  hsm_hkdf (softhsm.ts) uses for CKM_HKDF_DERIVE, see its doc comment for
 *  the byte-offset table. Returns the raw rv and, on success, the derived
 *  object's handle — callers assert whatever their specific condition needs
 *  rather than this helper deciding pass/fail itself. */
const deriveHkdfData = (
  ctx: ProbeContext,
  pInfo: Uint8Array,
  outLen: number
): { rv: number; handle: number } => {
  const { M, hSession } = ctx
  const infoPtr = writeBytes(M, pInfo)
  const params = M._malloc(32)
  M.HEAPU8.fill(0, params, params + 32)
  M.HEAPU8[params + 0] = 0 // bExtract=false — expand-only, matching TLS 1.3's own HKDF-Expand-Label use
  M.HEAPU8[params + 1] = 1 // bExpand=true
  M.setValue(params + 4, CKM_SHA256, 'i32') // prfHashMechanism
  M.setValue(params + 8, 1, 'i32') // ulSaltType = CKF_HKDF_SALT_NULL (ignored when bExtract=false, §6.62.3)
  M.setValue(params + 12, 0, 'i32') // pSalt
  M.setValue(params + 16, 0, 'i32') // ulSaltLen
  M.setValue(params + 20, 0, 'i32') // hSaltKey
  M.setValue(params + 24, infoPtr, 'i32') // pInfo
  M.setValue(params + 28, pInfo.length, 'i32') // ulInfoLen
  const mech = buildMech(M, CKM_HKDF_DATA, params, 32)
  // CKA_CLASS is server-managed for this mechanism (both engines force
  // CKO_DATA regardless of what the template says — see the comment
  // above), so the template only needs to declare the output length.
  const derivedTpl = buildTemplate(M, [{ type: CKA_VALUE_LEN, ulongVal: outLen }])
  const derivedHPtr = M._malloc(4)
  try {
    const rv =
      M._C_DeriveKey(hSession, mech, ctx.keyObjectHandle, derivedTpl.ptr, 1, derivedHPtr) >>> 0
    return { rv, handle: rv === 0 ? M.getValue(derivedHPtr, 'i32') >>> 0 : 0 }
  } finally {
    M._free(mech)
    M._free(infoPtr)
    M._free(derivedHPtr)
    freeTemplate(M, derivedTpl, 1)
  }
}

/** The exact literal pInfo byte strings §5.6 condition 7.a.i/7.a.ii require
 *  a conformant provider to accept: `L1,L2,"<label>",0x00`, L1/L2 the
 *  big-endian bytes of the requested CKA_VALUE_LEN (PDF p.17 l.592-598). */
const hkdfTlsPInfo = (label: string, outLen: number): Uint8Array => {
  const labelBytes = new TextEncoder().encode(label)
  const out = new Uint8Array(2 + labelBytes.length + 1)
  out[0] = (outLen >>> 8) & 0xff
  out[1] = outLen & 0xff
  out.set(labelBytes, 2)
  out[out.length - 1] = 0x00
  return out
}

const HKDF_TLS_OUT_LEN = 12 // a plausible AEAD-IV length; the spec fixes L1/L2 to whatever length is requested, not to 12 specifically

const HKDF_TLS_PROBES: Omit<ConditionProbe, 'profile'>[] = [
  {
    id: 'hkdf-obj-profile',
    category: 'object',
    name: 'CKO_PROFILE (CKP_HKDF_TLS_TOKEN)',
    citation: 'Profiles v3.2 §5.6 condition 5.c',
    run: ({ profileObjects }) => {
      const found = profileObjects.find((p) => p.profileId === CKP_HKDF_TLS_TOKEN)
      if (!found) throw new Error('no CKO_PROFILE object with CKA_PROFILE_ID=CKP_HKDF_TLS_TOKEN')
      return `found CKO_PROFILE handle=${found.handle} claiming CKP_HKDF_TLS_TOKEN`
    },
  },
  {
    id: 'hkdf-obj-secretkey',
    category: 'object',
    name: 'CKO_SECRET_KEY (as HKDF base key)',
    citation: 'Profiles v3.2 §5.6 condition 5.b',
    run: ({ M, hSession, keyObjectHandle }) => {
      if (!attrIsReadable(M, hSession, keyObjectHandle, CKA_CLASS))
        throw new Error('CKA_CLASS unreadable on the shared CKO_SECRET_KEY probe object')
      return 'CKO_SECRET_KEY object usable as an HKDF base key (CKA_CLASS readable)'
    },
  },
  {
    id: 'hkdf-obj-data',
    category: 'object',
    name: 'CKO_DATA (as HKDF derive output)',
    citation: 'Profiles v3.2 §5.6 condition 5.a',
    run: (ctx) => {
      const { rv, handle } = deriveHkdfData(
        ctx,
        hkdfTlsPInfo('tls iv', HKDF_TLS_OUT_LEN),
        HKDF_TLS_OUT_LEN
      )
      if (rv !== 0) throw new Error(`C_DeriveKey(CKM_HKDF_DATA) → rv=0x${rv.toString(16)}`)
      const tpl = buildTemplate(ctx.M, [{ type: CKA_CLASS, ulongVal: 0 }])
      try {
        checkRV(
          ctx.M._C_GetAttributeValue(ctx.hSession, handle, tpl.ptr, 1),
          'C_GetAttributeValue(CKA_CLASS) on HKDF_DATA output'
        )
        const gotClass = ctx.M.getValue(tpl.ptr, 'i32') >>> 0
        if (gotClass !== CKO_DATA)
          throw new Error(`derived object CKA_CLASS=0x${gotClass.toString(16)}, expected CKO_DATA`)
        return 'C_DeriveKey(CKM_HKDF_DATA) produced a real CKO_DATA object, not CKO_SECRET_KEY'
      } finally {
        freeTemplate(ctx.M, tpl, 1)
        ctx.M._C_DestroyObject(ctx.hSession, handle)
      }
    },
  },
  {
    id: 'hkdf-fn-derivekey',
    category: 'function',
    name: 'C_DeriveKey',
    citation: 'Profiles v3.2 §5.6 condition 6.a',
    run: (ctx) => {
      const { rv, handle } = deriveHkdfData(
        ctx,
        hkdfTlsPInfo('tls quic iv', HKDF_TLS_OUT_LEN),
        HKDF_TLS_OUT_LEN
      )
      if (rv === CKR_FUNCTION_NOT_SUPPORTED)
        throw new Error('C_DeriveKey → CKR_FUNCTION_NOT_SUPPORTED')
      if (rv !== 0) throw new Error(`C_DeriveKey → rv=0x${rv.toString(16)}`)
      ctx.M._C_DestroyObject(ctx.hSession, handle)
      return 'C_DeriveKey(CKM_HKDF_DATA) → OK'
    },
  },
  {
    id: 'hkdf-mech-tlsiv',
    category: 'mechanism',
    name: 'CKM_HKDF_DATA (pInfo="tls iv")',
    citation: 'Profiles v3.2 §5.6 condition 7.a.i',
    run: (ctx) => {
      const pInfo = hkdfTlsPInfo('tls iv', HKDF_TLS_OUT_LEN)
      const { rv, handle } = deriveHkdfData(ctx, pInfo, HKDF_TLS_OUT_LEN)
      if (rv !== 0)
        throw new Error(
          `C_DeriveKey(CKM_HKDF_DATA, pInfo=L1,L2,"tls iv",0x00) → rv=0x${rv.toString(16)} — a conformant provider SHALL NOT reject this`
        )
      ctx.M._C_DestroyObject(ctx.hSession, handle)
      return `accepted the mandated literal pInfo (${pInfo.length}B: L1,L2,"tls iv",0x00)`
    },
  },
  {
    id: 'hkdf-mech-tlsquiciv',
    category: 'mechanism',
    name: 'CKM_HKDF_DATA (pInfo="tls quic iv")',
    citation: 'Profiles v3.2 §5.6 condition 7.a.ii',
    run: (ctx) => {
      const pInfo = hkdfTlsPInfo('tls quic iv', HKDF_TLS_OUT_LEN)
      const { rv, handle } = deriveHkdfData(ctx, pInfo, HKDF_TLS_OUT_LEN)
      if (rv !== 0)
        throw new Error(
          `C_DeriveKey(CKM_HKDF_DATA, pInfo=L1,L2,"tls quic iv",0x00) → rv=0x${rv.toString(16)} — a conformant provider SHALL NOT reject this`
        )
      ctx.M._C_DestroyObject(ctx.hSession, handle)
      return `accepted the mandated literal pInfo (${pInfo.length}B: L1,L2,"tls quic iv",0x00)`
    },
  },
]

// ── Orchestrator ─────────────────────────────────────────────────────────

/**
 * Runs every Baseline probe, and every Extended probe iff `claims`
 * includes 'extended' (Extended builds on Baseline per §5.3 condition 2,
 * so Extended is never probed for an engine that doesn't also claim
 * Baseline — same discovery-driven discipline as Tier A: never assert a
 * profile the engine itself doesn't claim).
 */
export const runProfileConditionProbes = (
  M: SoftHSMModule,
  hSession: number,
  slotId: number,
  claims: Set<ProfileClaim>
): ProbeResult[] => {
  const profileObjects = hsm_findProfileObjects(M, hSession)
  const dataObjectHandle = createProbeDataObject(M, hSession)
  const keyObjectHandle = createProbeKeyObject(M, hSession)

  const results: ProbeResult[] = []
  // Mutable — authKeys/certHandle are populated lazily, right before
  // CERT_PROBES/AUTH_PROBES run (not upfront alongside dataObjectHandle).
  // EXTENDED_PROBES' own ext-fn-logout probe cycles C_Logout/C_Login before
  // either of those blocks runs, and both engines invalidate previously-
  // resolved object handles across that cycle (proven empirically: with
  // authKeys created upfront, C_SignInit still failed with
  // CKR_KEY_HANDLE_INVALID/CKR_OBJECT_HANDLE_INVALID even after moving
  // auth-fn-signinit before AUTH_PROBES' OWN logout probe — the
  // invalidating cycle was Extended's, which runs earlier still).
  const ctx: ProbeContext = {
    M,
    hSession,
    slotId,
    dataObjectHandle,
    keyObjectHandle,
    profileObjects,
  }

  const run = (probe: Omit<ConditionProbe, 'profile'>, profile: ProfileClaim): void => {
    const full: ConditionProbe = { ...probe, profile }
    try {
      const detail = probe.run(ctx)
      results.push({ ...full, status: 'pass', detail })
    } catch (e) {
      results.push({ ...full, status: 'fail', detail: e instanceof Error ? e.message : String(e) })
    }
  }

  if (claims.has('baseline')) {
    for (const p of BASELINE_PROBES) run(p, 'baseline')
  }
  if (claims.has('extended') && claims.has('baseline')) {
    for (const p of EXTENDED_PROBES) run(p, 'extended')
  }
  // CERT_PROBES before AUTH_PROBES: CERT_PROBES also reuses authKeys
  // (cert-loc-id-match/cert-loc-key-by-id read its CKA_ID), and
  // AUTH_PROBES' own auth-fn-logout probe would invalidate it again.
  if (claims.has('certificates') && claims.has('baseline')) {
    ctx.authKeys = createProbeAuthKeyPair(M, hSession)
    ctx.certHandle = createProbeCertificate(M, hSession, ctx.authKeys.idBytes)
    for (const p of CERT_PROBES) run(p, 'certificates')
  }
  if (claims.has('authentication') && claims.has('baseline')) {
    if (!ctx.authKeys) ctx.authKeys = createProbeAuthKeyPair(M, hSession)
    for (const p of AUTH_PROBES) run(p, 'authentication')
  }
  if (claims.has('hkdf_tls') && claims.has('baseline')) {
    for (const p of HKDF_TLS_PROBES) run(p, 'hkdf_tls')
  }
  const authKeys = ctx.authKeys
  const certHandle = ctx.certHandle

  // Baseline lifecycle — §5.1 conditions 5.d (C_Initialize) / 5.e
  // (C_Finalize), real functional probes, deliberately run dead last, not
  // inside BASELINE_PROBES: they tear down the module every probe above
  // depends on (session, all objects — including dataObjectHandle/
  // keyObjectHandle/authKeys/certHandle, so the individual
  // C_DestroyObject cleanup below is skipped when this ran, its job
  // already done by C_Finalize). Safe to run unconditionally after: the
  // caller (Pkcs11ConformanceRunner.tsx) already does its own
  // finalize→initialize→initToken→openSession cycle immediately after this
  // function returns regardless of what happened in here, to hand back a
  // clean session for other tabs — hsm_finalize/hsm_initialize are both
  // idempotent-safe to call again on top of that.
  let lifecycleProbed = false
  if (claims.has('baseline')) {
    run(
      {
        id: 'bl-fn-finalize',
        category: 'function',
        name: 'C_Finalize',
        citation: 'Profiles v3.2 §5.1 condition 5.e',
        run: () => {
          checkRV(M._C_Finalize(0), 'C_Finalize')
          // Prove it had a real effect, not just a vacuous CKR_OK: the
          // session this whole probe run has been using must now be dead.
          const rv = M._C_CloseSession(hSession) >>> 0
          if (rv === 0)
            throw new Error(
              'C_CloseSession on the pre-finalize session handle still returned CKR_OK — C_Finalize did not actually tear the module down'
            )
          return `C_Finalize → OK; the prior session (rv=0x${rv.toString(16)} on re-close) is genuinely gone`
        },
      },
      'baseline'
    )
    run(
      {
        id: 'bl-fn-initialize',
        category: 'function',
        name: 'C_Initialize',
        citation: 'Profiles v3.2 §5.1 condition 5.d',
        run: () => {
          checkRV(M._C_Initialize(0), 'C_Initialize')
          // Prove the module is genuinely alive again, not just that the RV
          // happened to be OK — same requireOutputWritten discipline every
          // other function probe in this file uses.
          return requireOutputWritten(M, 'C_GetInfo', (ptr) => M._C_GetInfo(ptr), 80)
        },
      },
      'baseline'
    )
    lifecycleProbed = true
  }

  // Complete Provider — §5.2, defined purely as the union of the other 4
  // base profiles' conformance clauses (§6.2: "SHALL support all of the
  // provider conformance clauses contained within Conformance (6)"). OASIS
  // publishes no independent condition list or Tier A case for it (verified
  // against the spec PDF directly — no §5.2.1 section exists), so there is
  // nothing to probe independently: the only meaningful check is that every
  // OTHER probe this same run actually collected — Baseline/Extended/
  // Authentication/Certificates/HKDF TLS Token, whichever this engine
  // claimed — passed. Neither engine claims CKP_COMPLETE_PROVIDER today;
  // this exists so a future claim is caught rather than silently invisible.
  if (claims.has('complete')) {
    const failed = results.filter((r) => r.status === 'fail')
    results.push({
      id: 'complete-union-conformance',
      profile: 'complete',
      category: 'meta',
      name: 'Union of Baseline/Extended/Authentication/Certificates conformance',
      citation: 'Profiles v3.2 §5.2 condition 6 / §6.2',
      // Not a live-engine probe — nothing ever calls this; the row exists
      // purely so ProbeResult (which extends ConditionProbe) type-checks.
      run: () => '',
      status: failed.length === 0 ? 'pass' : 'fail',
      detail:
        failed.length === 0
          ? `claims Complete Provider, and all ${results.length} other Tier B probe(s) this run collected passed`
          : `claims Complete Provider, but ${failed.length} underlying probe(s) failed: ${failed.map((f) => f.id).join(', ')}`,
    })
  }

  if (!lifecycleProbed) {
    M._C_DestroyObject(hSession, dataObjectHandle)
    M._C_DestroyObject(hSession, keyObjectHandle)
    if (certHandle !== undefined) M._C_DestroyObject(hSession, certHandle)
    if (authKeys) {
      M._C_DestroyObject(hSession, authKeys.pubHandle)
      M._C_DestroyObject(hSession, authKeys.privHandle)
    }
  }
  return results
}

/** An RSA-2048 key pair for the Authentication Token probes — SIGN on the
 * private half, VERIFY on the public half (§5.4 condition 6.d/6.e need a
 * key that can actually do both). Returns the CKA_ID it was minted with so
 * createProbeCertificate can share it (§5.5 condition 8.b/8.c). */
const createProbeAuthKeyPair = (
  M: SoftHSMModule,
  hSession: number
): { pubHandle: number; privHandle: number; idBytes: Uint8Array } => {
  const mech = buildMech(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const expBytes = new Uint8Array([0x01, 0x00, 0x01])
  const expPtr = writeBytes(M, expBytes)
  const idBytes = new TextEncoder().encode('tier-b-probe-key')
  const idPtr = writeBytes(M, idBytes)
  // CKA_TOKEN=true on both: cert-loc-public/cert-loc-key-by-id (§5.5
  // cond. 8.a/8.c) open a SECOND session and search for these objects —
  // session objects (CKA_TOKEN=false) are only visible to the session
  // that created them, so a location probe against a fresh session would
  // find nothing regardless of whether the engine actually supports
  // unauthenticated lookup. Destroyed at the end of the probe run either way.
  const pubAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
    { type: CKA_MODULUS_BITS, ulongVal: 2048 },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: 3 },
    { type: CKA_VERIFY, boolVal: true },
  ]
  const prvAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_SIGN, boolVal: true },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
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
      'C_GenerateKeyPair (Tier B auth probe fixture)'
    )
    return {
      pubHandle: M.getValue(pubHPtr, 'i32') >>> 0,
      privHandle: M.getValue(prvHPtr, 'i32') >>> 0,
      idBytes,
    }
  } finally {
    M._free(mech)
    M._free(expPtr)
    M._free(idPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** A minimal but structurally valid X.509 CKO_CERTIFICATE for the Public
 * Certificates Token probes — Tier B only needs to prove object/attribute/
 * location support, not replay OASIS's real cert (that is Tier A's job),
 * so a small synthetic DER/Subject satisfies both engines' §4.6 Table 19/20
 * validation (CKA_CERTIFICATE_TYPE, CKA_SUBJECT, non-empty CKA_VALUE) without
 * needing a real ASN.1 encoder here. Shares `sharedId` (the auth key pair's
 * CKA_ID) when provided, so cert-loc-id-match/cert-loc-key-by-id have a real
 * match to find. */
const createProbeCertificate = (
  M: SoftHSMModule,
  hSession: number,
  sharedId?: Uint8Array
): number => {
  const idBytes = sharedId ?? new TextEncoder().encode('tier-b-probe-cert')
  const subjectBytes = new TextEncoder().encode('CN=WS-11 Tier B probe')
  const valueBytes = new Uint8Array(64).fill(0x30) // synthetic, not a real DER cert
  const idPtr = writeBytes(M, idBytes)
  const subjectPtr = writeBytes(M, subjectBytes)
  const valuePtr = writeBytes(M, valueBytes)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_CERTIFICATE },
    { type: CKA_CERTIFICATE_TYPE, ulongVal: CKC_X_509 },
    // CKA_TOKEN=true: cert-loc-public/cert-loc-key-by-id search from a
    // second session — see the comment on createProbeAuthKeyPair.
    { type: CKA_TOKEN, boolVal: true },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_SUBJECT, bytesPtr: subjectPtr, bytesLen: subjectBytes.length },
    { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: valueBytes.length },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
  ])
  const hPtr = M._malloc(4)
  try {
    checkRV(
      M._C_CreateObject(hSession, tpl.ptr, 7, hPtr),
      'C_CreateObject (Tier B cert probe fixture)'
    )
    return M.getValue(hPtr, 'i32') >>> 0
  } finally {
    freeTemplate(M, tpl, 7)
    M._free(idPtr)
    M._free(subjectPtr)
    M._free(valuePtr)
    M._free(hPtr)
  }
}

/** A CKO_SECRET_KEY object, imported directly (no key-generation mechanism
 * required — Baseline Provider guarantees none) — exists solely so
 * bl-attr-id has a spec-appropriate object to probe CKA_ID against. */
const createProbeKeyObject = (M: SoftHSMModule, hSession: number): number => {
  const idBytes = new TextEncoder().encode('probe-key-id')
  const valueBytes = new Uint8Array(16).fill(0x42)
  const idPtr = M._malloc(idBytes.length)
  const valuePtr = M._malloc(valueBytes.length)
  M.HEAPU8.set(idBytes, idPtr)
  M.HEAPU8.set(valueBytes, valuePtr)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_ID, bytesPtr: idPtr, bytesLen: idBytes.length },
    { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: valueBytes.length },
  ])
  try {
    const hPtr = M._malloc(4)
    try {
      const rv = M._C_CreateObject(hSession, tpl.ptr, 8, hPtr) >>> 0
      if (rv !== 0)
        throw new Error(`setup C_CreateObject (key) for Tier B probes → rv=0x${rv.toString(16)}`)
      return M.getValue(hPtr, 'i32') >>> 0
    } finally {
      M._free(hPtr)
    }
  } finally {
    freeTemplate(M, tpl, 8)
    M._free(idPtr)
    M._free(valuePtr)
  }
}

const createProbeDataObject = (M: SoftHSMModule, hSession: number): number => {
  const labelBytes = new TextEncoder().encode('WS-11 Tier B probe object')
  const valueBytes = new TextEncoder().encode('probe')
  const labelPtr = M._malloc(labelBytes.length)
  const valuePtr = M._malloc(valueBytes.length)
  M.HEAPU8.set(labelBytes, labelPtr)
  M.HEAPU8.set(valueBytes, valuePtr)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_DATA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: false },
    { type: CKA_LABEL, bytesPtr: labelPtr, bytesLen: labelBytes.length },
    { type: CKA_VALUE, bytesPtr: valuePtr, bytesLen: valueBytes.length },
  ])
  try {
    const hPtr = M._malloc(4)
    try {
      const rv = M._C_CreateObject(hSession, tpl.ptr, 5, hPtr) >>> 0
      if (rv !== 0)
        throw new Error(`setup C_CreateObject for Tier B probes → rv=0x${rv.toString(16)}`)
      return M.getValue(hPtr, 'i32') >>> 0
    } finally {
      M._free(hPtr)
    }
  } finally {
    freeTemplate(M, tpl, 5)
    M._free(labelPtr)
    M._free(valuePtr)
  }
}
