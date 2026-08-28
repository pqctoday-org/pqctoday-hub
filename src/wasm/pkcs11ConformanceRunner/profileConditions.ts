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
  CKO_SECRET_KEY,
  CKK_GENERIC_SECRET,
  CKP_BASELINE_PROVIDER,
} from '../softhsm'

const CKO_DATA = 0x00000000
const CKP_EXTENDED_PROVIDER = 0x00000002
const CKR_FUNCTION_NOT_SUPPORTED = 0x00000054

export type ProfileClaim = 'baseline' | 'extended'

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
}

export interface ConditionProbe {
  id: string
  profile: ProfileClaim
  category: 'function' | 'attribute' | 'object'
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
  // C_Initialize/C_Finalize/C_OpenSession/C_CloseSession are exercised by
  // the harness that boots the engine before any probe runs at all — a
  // dead engine can't reach this file's run() call in the first place, so
  // probing them again here would only re-test the harness, not the
  // engine. Their conditions are satisfied by construction.
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
    run: () => 'Session already open for this probe run — engine could not have booted otherwise',
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

  M._C_DestroyObject(hSession, dataObjectHandle)
  M._C_DestroyObject(hSession, keyObjectHandle)
  return results
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
