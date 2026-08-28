// PKCS#11 v3.2 Profiles — OASIS mandatory conformance test case executor.
//
// Runs one of the OASIS-published mandatory XML test cases (BL-M-1-32.xml
// etc., vendored verbatim in src/data/pkcs11-profiles/test-cases/) against
// a live SoftHSMModule by driving the raw _C_* WASM exports directly — the
// same exports both the C++ and Rust engines expose identically.
//
// Format reference: PKCS #11 Profiles v3.2 §3 (Conformance Test Cases) and
// §4 (PKCS#11 XML Representation). Each test case is a flat sequence of
// request/response element pairs sharing one tag name (the PKCS#11 function
// name); the response carries the expected return value as an `rv`
// attribute (macro name, CKR_ prefix omitted) and expected output values.
// `${symbolic}` references bind response outputs from one call into later
// calls' inputs.
//
// Known parser quirk (confirmed against the real vendored files): the XML
// contains bare `#`-prefixed comment lines that are not valid XML — these
// are stripped in a pre-pass before DOMParser sees the text.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { RV_NAMES, buildTemplate, freeTemplate, buildMech, type AttrDef } from '../softhsm'

// ── §3.1.1 permitted variations — provider-identity fields the spec says
// MAY legitimately differ from the example XML. Everything else in a
// response is compared for real; a mismatch outside this list is a genuine
// finding, not a bug in this executor. Deliberately does NOT include
// Flags anywhere (Info/SlotInfo/TokenInfo) — §3.1.1 never lists Flags as
// variable, so a Flags mismatch is meant to surface, not be excused here.
const EXEMPT_FIELDS = new Set([
  'Info.ManufacturerID',
  'Info.LibraryDescription',
  'Info.LibraryVersion',
  'SlotInfo.SlotDescription',
  'SlotInfo.ManufacturerID',
  'SlotInfo.HardwareVersion',
  'SlotInfo.FirmwareVersion',
  'TokenInfo.label',
  'TokenInfo.ManufacturerID',
  'TokenInfo.model',
  'TokenInfo.serialNumber',
  'TokenInfo.HardwareVersion',
  'TokenInfo.FirmwareVersion',
  'TokenInfo.utcTime',
  // Session/Object/SlotID handle VALUES are provider-assigned per §3.1.1
  // ("Session specific information" / "Object specific information") —
  // their presence/shape is checked, never their concrete number.
  'SlotID',
  'Session',
  'Object',
])

// ── CK constant tables needed by the 4 vendored test cases only — not a
// general PKCS#11-XML-representation library. Extend as more test cases'
// element vocabulary is wired in.
const CKF_SERIAL_SESSION = 0x00000004
const CKF_RW_SESSION = 0x00000002
const SESSION_FLAG_NAMES: Record<string, number> = {
  SERIAL_SESSION: CKF_SERIAL_SESSION,
  RW_SESSION: CKF_RW_SESSION,
}

const CKU_NAMES: Record<string, number> = { SO: 0, USER: 1, CONTEXT_SPECIFIC: 2 }

// Mechanism types (§4.3.1 enumerated-type names) used by the vendored test
// cases' C_GetMechanismInfo requests.
const MECHANISM_TYPE_NAMES: Record<string, number> = {
  RSA_PKCS_KEY_PAIR_GEN: 0x00000000,
  RSA_PKCS: 0x00000001,
  SHA256_RSA_PKCS: 0x00000040,
  SHA512: 0x00000270,
}

// CK_MECHANISM_INFO.flags names (§6, pkcs11t.h CKF_* mechanism-info bits —
// a different bit space from session/token-info CKF_* flags above).
const MECHANISM_INFO_FLAG_NAMES: Record<string, number> = {
  ENCRYPT: 0x00000100,
  DECRYPT: 0x00000200,
  DIGEST: 0x00000400,
  SIGN: 0x00000800,
  SIGN_RECOVER: 0x00001000,
  VERIFY: 0x00002000,
  VERIFY_RECOVER: 0x00004000,
  GENERATE: 0x00008000,
  GENERATE_KEY_PAIR: 0x00010000,
  WRAP: 0x00020000,
  UNWRAP: 0x00040000,
  DERIVE: 0x00080000,
}

const ATTR_TYPE_NAMES: Record<string, number> = {
  CLASS: 0x00000000,
  TOKEN: 0x00000001,
  PRIVATE: 0x00000002,
  LABEL: 0x00000003,
  VALUE: 0x00000011,
  KEY_TYPE: 0x00000100,
  ID: 0x00000102,
  SUBJECT: 0x00000101,
  ISSUER: 0x00000081,
  SERIAL_NUMBER: 0x00000082,
  CERTIFICATE_TYPE: 0x00000080,
  MODULUS: 0x00000120,
  PUBLIC_EXPONENT: 0x00000122,
}

// Attribute values the vendored test cases' Templates encode as UTF-8 text
// (e.g. LABEL="testrsa-pub") rather than hex — everything else that isn't
// TRUE/FALSE or an object-class name is hex (ID, VALUE, MODULUS,
// PUBLIC_EXPONENT, SUBJECT, ISSUER, SERIAL_NUMBER).
const TEXT_ATTR_NAMES = new Set(['LABEL'])

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.trim()
  const out = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

// WS-11 Phase 4 (2026-08-28) fixture provisioning — "Mozilla Builtin Roots"
// is 21 ASCII characters, but the OASIS example this executor replays
// (CERT-M-1-32) expects `length="22"`: the NSS module OASIS captured it
// from stores the label NUL-terminated on disk. The fixture stores the
// same 22 bytes; this strips exactly one trailing NUL before a text
// compare so the *value* check still reads the human label, not the NUL.
const decodeAttrText = (bytes: Uint8Array): string => {
  const s = new TextDecoder().decode(bytes)
  return s.endsWith('\u0000') ? s.slice(0, -1) : s
}

const OBJECT_CLASS_NAMES: Record<string, number> = {
  DATA: 0x00000000,
  CERTIFICATE: 0x00000001,
  PUBLIC_KEY: 0x00000002,
  PRIVATE_KEY: 0x00000003,
  SECRET_KEY: 0x00000004,
}

// ── D1 independent verification (AUTH-M-1-32's Signature) ─────────────────
// OASIS publishes AUTH-M-1-32's expected MODULUS/Signature bytes but never
// the private key that produced them — unreproducible by any implementation
// (see the WS-11 plan's decision D1). Rather than byte-compare against the
// unreproducible example, or silently skip the check, this executor
// provisions its own RSA-2048 fixture key and verifies the *real* signature
// cryptographically against that key's *real* public modulus, using an
// engine-independent verifier (WebCrypto, not either PKCS#11 engine).
const hexToBase64Url = (hex: string): string => {
  const bytes = hexToBytes(hex)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Copies into a fresh Uint8Array — WASM heap views (M.HEAPU8.slice(...))
// type as Uint8Array<ArrayBufferLike>, which lib.dom's BufferSource
// rejects at the TYPE level only (ArrayBufferLike also admits
// SharedArrayBuffer, which Uint8Array.from's return type still carries in
// this TS lib version even after copying). At the VALUE level a plain
// Uint8Array view is always correct — pass the view itself, never
// `.buffer`/`new ArrayBuffer()`: under Vitest's jsdom pool (a separate
// vm.Context) Node's webidl BufferSource converter rejects an ArrayBuffer
// constructed in that context even though `instanceof ArrayBuffer`
// reports true, while a plain Uint8Array view is accepted there and in a
// real browser alike.
const toUint8Array = (bytes: Uint8Array): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(bytes) as Uint8Array<ArrayBuffer>

const verifyRsaPkcs1Sha256 = async (
  nHex: string,
  eHex: string,
  data: Uint8Array,
  signature: Uint8Array
): Promise<boolean> => {
  const jwk: JsonWebKey = {
    kty: 'RSA',
    n: hexToBase64Url(nHex),
    e: hexToBase64Url(eHex),
    alg: 'RS256',
    ext: true,
  }
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, toUint8Array(signature), toUint8Array(data))
}

// ── XML text pre-processing ────────────────────────────────────────────────

const stripHashComments = (xml: string): string =>
  xml
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')

// ── Symbolic bindings (§3 "flow of identifiers between tests") ────────────

type BindingValue = number | number[] | string

class BindingStore {
  private map = new Map<string, BindingValue>()

  set(path: string, value: BindingValue): void {
    this.map.set(path, value)
  }

  /** Resolve a literal or `${path[idx]}` expression to a number. */
  resolveNumber(raw: string): number {
    const m = /^\$\{([\w.]+)(?:\[(\d+)\])?\}$/.exec(raw)
    if (!m) {
      if (/^0x[0-9a-fA-F]+$/.test(raw)) return parseInt(raw, 16)
      if (/^-?\d+$/.test(raw)) return parseInt(raw, 10)
      throw new Error(`unresolvable value: ${raw}`)
    }
    const [, path, idxStr] = m
    const val = this.map.get(path)
    if (val === undefined) throw new Error(`unbound reference: \${${raw}}`)
    if (idxStr !== undefined) {
      if (!Array.isArray(val)) throw new Error(`binding "${path}" is not indexable`)
      return val[Number(idxStr)]
    }
    return Number(val)
  }

  /**
   * Resolve a literal or `${path}` expression to a string. Used for values
   * §3 describes as symbolic placeholders the implementation must supply
   * "a reasonable appearing datum of the expected type" for (e.g. `${Pin}`)
   * — these aren't bound from a prior response, so `set()` must be called
   * with the real value (e.g. the PIN the test's own token was set up
   * with) before the test case runs, via `runXmlTestCase`'s
   * `initialBindings` parameter.
   */
  resolveString(raw: string): string {
    const m = /^\$\{([\w.]+)\}$/.exec(raw)
    if (!m) return raw
    const val = this.map.get(m[1])
    if (val === undefined) throw new Error(`unbound reference: \${${raw}}`)
    return String(val)
  }

  /** Look up a binding by its raw path (no `${...}` unwrapping), returning
   * `undefined` if unbound — used where a caller needs to know whether a
   * value was supplied at all (e.g. a fixture's binding) rather than
   * throwing. */
  get(path: string): BindingValue | undefined {
    return this.map.get(path)
  }
}

// ── Flags / enumerated-name decoding (§4.3.1, §4.3.3) ──────────────────────

const parseFlagExpr = (raw: string, table: Record<string, number>): number =>
  raw
    .split(/[|\s]+/)
    .filter(Boolean)
    .reduce((acc, name) => acc | (table[name] ?? 0), 0)

// ── Struct decoders — offsets match hsm_getTokenInfo/hsm_getSessionInfo's
// already-established layout (softhsm.ts) and the Rust engine's C_GetInfo/
// C_GetSlotInfo bodies (rust/src/ffi.rs), which the C++ engine matches —
// both expose the same standardized CK_* struct wire format. ────────────

const readFixedStr = (M: SoftHSMModule, ptr: number, offset: number, len: number): string =>
  new TextDecoder().decode(M.HEAPU8.subarray(ptr + offset, ptr + offset + len)).replace(/\s+$/, '')

const readU32 = (M: SoftHSMModule, ptr: number): number => M.getValue(ptr, 'i32') >>> 0

interface DecodedInfo {
  cryptokiMajor: number
  cryptokiMinor: number
  manufacturerID: string
  flags: number
  libraryDescription: string
  libraryVersionMajor: number
  libraryVersionMinor: number
}

// CK_INFO is the one struct in these test cases where the two engines'
// WASM layouts genuinely diverge, verified 2026-08-28 by probing raw bytes
// with a sentinel fill: Rust hand-packs every field with zero padding
// (cryptokiVersion(2) + manufacturerID[32] + flags @34 + libraryDescription
// @38 + libraryVersion @70 = 72 bytes total), but the C++ engine's `CK_INFO
// pInfo` is a normal compiler-laid-out struct with NO `#pragma pack(1)`
// anywhere in this project's pkcs11.h/pkcs11t.h (grepped, confirmed absent)
// — natural 4-byte alignment inserts 2 bytes of padding before the 4-byte
// `flags` field (offset 34 is not 4-aligned; manufacturerID ends there),
// shifting flags to 36 and everything after it by +2 (libraryDescription
// @40, libraryVersion @72..73, 74 bytes total). CK_SLOT_INFO/CK_TOKEN_INFO
// don't have this problem — their fields before the first CK_ULONG happen
// to sum to a multiple of 4 for both engines, so one offset table suffices
// (see decodeCkSlotInfo/decodeCkTokenInfo below).
const decodeCkInfo = (M: SoftHSMModule, ptr: number, engineName: string): DecodedInfo => {
  const flagsOff = engineName === 'cpp' ? 36 : 34
  const descOff = engineName === 'cpp' ? 40 : 38
  const verOff = engineName === 'cpp' ? 72 : 70
  return {
    cryptokiMajor: M.HEAPU8[ptr],
    cryptokiMinor: M.HEAPU8[ptr + 1],
    manufacturerID: readFixedStr(M, ptr, 2, 32),
    flags: readU32(M, ptr + flagsOff),
    libraryDescription: readFixedStr(M, ptr, descOff, 32),
    libraryVersionMajor: M.HEAPU8[ptr + verOff],
    libraryVersionMinor: M.HEAPU8[ptr + verOff + 1],
  }
}

interface DecodedSlotInfo {
  slotDescription: string
  manufacturerID: string
  flags: number
  hwMajor: number
  hwMinor: number
  fwMajor: number
  fwMinor: number
}

const decodeCkSlotInfo = (M: SoftHSMModule, ptr: number): DecodedSlotInfo => ({
  slotDescription: readFixedStr(M, ptr, 0, 64),
  manufacturerID: readFixedStr(M, ptr, 64, 32),
  flags: readU32(M, ptr + 96),
  hwMajor: M.HEAPU8[ptr + 100],
  hwMinor: M.HEAPU8[ptr + 101],
  fwMajor: M.HEAPU8[ptr + 102],
  fwMinor: M.HEAPU8[ptr + 103],
})

interface DecodedTokenInfo {
  label: string
  manufacturerID: string
  model: string
  serialNumber: string
  flags: number
  maxSessionCount: number
  sessionCount: number
  maxRwSessionCount: number
  rwSessionCount: number
  maxPinLen: number
  minPinLen: number
  totalPublicMemory: number
  freePublicMemory: number
  totalPrivateMemory: number
  freePrivateMemory: number
  hwMajor: number
  hwMinor: number
  fwMajor: number
  fwMinor: number
  utcTime: string
}

const decodeCkTokenInfo = (M: SoftHSMModule, ptr: number): DecodedTokenInfo => ({
  label: readFixedStr(M, ptr, 0, 32),
  manufacturerID: readFixedStr(M, ptr, 32, 32),
  model: readFixedStr(M, ptr, 64, 16),
  serialNumber: readFixedStr(M, ptr, 80, 16),
  flags: readU32(M, ptr + 96),
  maxSessionCount: readU32(M, ptr + 100),
  sessionCount: readU32(M, ptr + 104),
  maxRwSessionCount: readU32(M, ptr + 108),
  rwSessionCount: readU32(M, ptr + 112),
  maxPinLen: readU32(M, ptr + 116),
  minPinLen: readU32(M, ptr + 120),
  totalPublicMemory: readU32(M, ptr + 124),
  freePublicMemory: readU32(M, ptr + 128),
  totalPrivateMemory: readU32(M, ptr + 132),
  freePrivateMemory: readU32(M, ptr + 136),
  hwMajor: M.HEAPU8[ptr + 140],
  hwMinor: M.HEAPU8[ptr + 141],
  fwMajor: M.HEAPU8[ptr + 142],
  fwMinor: M.HEAPU8[ptr + 143],
  utcTime: readFixedStr(M, ptr, 144, 16),
})

// ── Report types ────────────────────────────────────────────────────────

export interface ComparisonFinding {
  field: string
  expected: string
  actual: string
  exempt: boolean
}

export interface StepResult {
  fn: string
  rvExpected: string
  rvActual: string
  rvOk: boolean
  findings: ComparisonFinding[]
  error?: string
}

export interface TestCaseExecutionResult {
  testCase: string
  engine: string
  steps: StepResult[]
  /** true iff every step's rv matched and every non-exempt finding matched */
  pass: boolean
}

// ── Comparison helper ───────────────────────────────────────────────────

const compareField = (
  findings: ComparisonFinding[],
  scope: string,
  field: string,
  expected: string | number,
  actual: string | number
): void => {
  const key = `${scope}.${field}`
  const exempt = EXEMPT_FIELDS.has(key) || EXEMPT_FIELDS.has(field)
  const expStr = String(expected)
  const actStr = String(actual)
  if (expStr !== actStr) {
    findings.push({ field: key, expected: expStr, actual: actStr, exempt })
  }
}

// ── Per-function step handlers ──────────────────────────────────────────
// Each handler executes the raw _C_* call(s) for one request/response
// element pair, returns the actual numeric rv, and populates `findings`
// for any expected-vs-actual mismatch plus any `${...}` bindings the
// response is documented to produce.

type StepHandler = (
  M: SoftHSMModule,
  req: Element,
  res: Element,
  bindings: BindingStore,
  findings: ComparisonFinding[],
  engineName: string
) => number | Promise<number>

const childText = (el: Element, tag: string, attr = 'value'): string | undefined =>
  el.querySelector(`:scope > ${tag}`)?.getAttribute(attr) ?? undefined

/** Compare a §4.3.3 flag expression (e.g. "TOKEN_PRESENT") against the
 * raw bit value the engine returned, resolving the expected side through
 * the same name table rather than string-comparing a macro name to hex. */
/**
 * mode 'exact': every bit must match — for Info/SlotInfo/TokenInfo flags,
 * which describe present-tense FACTS (is a PIN set, is RNG hardware
 * present) where an implementation reporting something other than the
 * true state is wrong in either direction.
 *
 * mode 'superset': the actual value may set MORE bits than expected, never
 * fewer — for CK_MECHANISM_INFO.flags, which describes optional CAPABILITY
 * support. Real implementations legitimately support more operations for a
 * mechanism than a minimal illustrative example lists (RSA_PKCS commonly
 * also supports sign/verify-with-recovery, for instance) — Profiles §5.1/
 * §5.2 condition 8/9's "optionally supports any clause not listed above"
 * spirit applies here even though this specific field isn't in §3.1's
 * enumerated variable-items list. Missing an expected bit is still a real
 * finding either way.
 */
const compareFlags = (
  findings: ComparisonFinding[],
  scope: string,
  field: string,
  expectedExpr: string,
  actualFlags: number,
  table: Record<string, number>,
  mode: 'exact' | 'superset' = 'exact'
): void => {
  const expectedFlags = parseFlagExpr(expectedExpr, table)
  if (mode === 'superset' && (actualFlags & expectedFlags) === expectedFlags) return
  compareField(
    findings,
    scope,
    field,
    `0x${expectedFlags.toString(16)}`,
    `0x${actualFlags.toString(16)}`
  )
}

const SLOT_INFO_FLAG_NAMES: Record<string, number> = {
  TOKEN_PRESENT: 0x00000001,
  REMOVABLE_DEVICE: 0x00000002,
  HW_SLOT: 0x00000004,
}

const HANDLERS: Record<string, StepHandler> = {
  C_Initialize: (M) => M._C_Initialize(0) >>> 0,

  C_GetInfo: (M, _req, res, _b, findings, engineName) => {
    // 80 bytes: safe upper bound for both engines' CK_INFO layouts (Rust
    // needs 72, C++ needs 74 with its alignment padding — see decodeCkInfo).
    const ptr = M._malloc(80)
    try {
      const rv = M._C_GetInfo(ptr) >>> 0
      if (rv === 0) {
        const info = decodeCkInfo(M, ptr, engineName)
        const infoEl = res.querySelector(':scope > Info')
        if (infoEl) {
          const cv = infoEl.querySelector('CryptokiVersion')
          if (cv) {
            compareField(
              findings,
              'Info',
              'CryptokiVersion.major',
              cv.getAttribute('major')!,
              info.cryptokiMajor
            )
            compareField(
              findings,
              'Info',
              'CryptokiVersion.minor',
              cv.getAttribute('minor')!,
              info.cryptokiMinor
            )
          }
          const flags = childText(infoEl, 'Flags')
          if (flags !== undefined)
            compareField(findings, 'Info', 'Flags', flags, `0x${info.flags.toString(16)}`)
          const mfr = childText(infoEl, 'ManufacturerID')
          if (mfr !== undefined)
            compareField(findings, 'Info', 'ManufacturerID', mfr, info.manufacturerID)
        }
      }
      return rv
    } finally {
      M._free(ptr)
    }
  },

  C_GetSlotList: (M, req, res, bindings, findings) => {
    const tokenPresent = childText(req, 'TokenPresent') === 'true' ? 1 : 0
    const reqSlotListEl = req.querySelector(':scope > SlotList')
    const reqLengthAttr = reqSlotListEl?.getAttribute('length')
    if (reqLengthAttr === null || reqLengthAttr === undefined) {
      // Phase 1: count-only call (pSlotList = NULL)
      const countPtr = M._malloc(4)
      try {
        const rv = M._C_GetSlotList(tokenPresent, 0, countPtr) >>> 0
        if (rv === 0) {
          const count = readU32(M, countPtr)
          bindings.set('SlotList.length', count)
          const respLen = res.querySelector(':scope > SlotList')?.getAttribute('length')
          if (respLen !== undefined && respLen !== null) {
            // respLen is itself "${SlotList.length}" in every vendored case —
            // nothing concrete to compare against; the count IS the value.
          }
        }
        return rv
      } finally {
        M._free(countPtr)
      }
    }
    // Phase 2: fill call
    const count = bindings.resolveNumber(reqLengthAttr)
    const listPtr = M._malloc(4 * Math.max(count, 1))
    const countPtr = M._malloc(4)
    M.setValue(countPtr, count, 'i32')
    try {
      const rv = M._C_GetSlotList(tokenPresent, listPtr, countPtr) >>> 0
      if (rv === 0) {
        const actualCount = readU32(M, countPtr)
        const slotIds: number[] = []
        for (let i = 0; i < actualCount; i++) slotIds.push(readU32(M, listPtr + i * 4))
        bindings.set('SlotList.SlotID', slotIds)
        // §3.1.2(3): list order/count may vary as long as at least one
        // entry matches the logical context — not compared strictly here.
        if (actualCount === 0) {
          findings.push({
            field: 'SlotList',
            expected: '>=1 slot',
            actual: '0 slots',
            exempt: false,
          })
        }
      }
      return rv
    } finally {
      M._free(listPtr)
      M._free(countPtr)
    }
  },

  C_GetSlotInfo: (M, req, res, bindings, findings) => {
    const slotId = bindings.resolveNumber(childText(req, 'SlotID')!)
    const ptr = M._malloc(104)
    try {
      const rv = M._C_GetSlotInfo(slotId, ptr) >>> 0
      if (rv === 0) {
        const info = decodeCkSlotInfo(M, ptr)
        const el = res.querySelector(':scope > SlotInfo')
        const flags = el ? childText(el, 'Flags') : undefined
        if (flags !== undefined) {
          compareFlags(findings, 'SlotInfo', 'Flags', flags, info.flags, SLOT_INFO_FLAG_NAMES)
        }
      }
      return rv
    } finally {
      M._free(ptr)
    }
  },

  C_GetTokenInfo: (M, req, res, bindings, findings) => {
    const slotId = bindings.resolveNumber(childText(req, 'SlotID')!)
    const ptr = M._malloc(160)
    try {
      const rv = M._C_GetTokenInfo(slotId, ptr) >>> 0
      if (rv === 0) {
        const info = decodeCkTokenInfo(M, ptr)
        const el = res.querySelector(':scope > TokenInfo')
        const flagsExpr = el ? childText(el, 'Flags') : undefined
        if (flagsExpr !== undefined) {
          compareFlags(findings, 'TokenInfo', 'Flags', flagsExpr, info.flags, TOKEN_INFO_FLAG_NAMES)
        }
      }
      return rv
    } finally {
      M._free(ptr)
    }
  },

  C_OpenSession: (M, req, _res, bindings) => {
    const slotId = bindings.resolveNumber(childText(req, 'SlotID')!)
    const flagsExpr = childText(req, 'Flags') ?? ''
    const flags = parseFlagExpr(flagsExpr, SESSION_FLAG_NAMES)
    const hPtr = M._malloc(4)
    try {
      const rv = M._C_OpenSession(slotId, flags, 0, 0, hPtr) >>> 0
      if (rv === 0) bindings.set('Session', readU32(M, hPtr))
      return rv
    } finally {
      M._free(hPtr)
    }
  },

  C_FindObjectsInit: (M, req, _res, bindings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const tmplEl = req.querySelector(':scope > Template')
    const attrEls = tmplEl ? Array.from(tmplEl.querySelectorAll(':scope > Attribute')) : []
    const auxPtrs: number[] = []
    const defs: AttrDef[] = attrEls.map((a) => {
      const attrName = a.getAttribute('type')!
      const type = ATTR_TYPE_NAMES[attrName]
      const value = a.getAttribute('value')!
      if (value === 'TRUE' || value === 'FALSE') return { type, boolVal: value === 'TRUE' }
      if (value in OBJECT_CLASS_NAMES) return { type, ulongVal: OBJECT_CLASS_NAMES[value] }
      const bytes = TEXT_ATTR_NAMES.has(attrName)
        ? new TextEncoder().encode(value)
        : hexToBytes(value)
      const ptr = M._malloc(Math.max(bytes.length, 1))
      M.HEAPU8.set(bytes, ptr)
      auxPtrs.push(ptr)
      return { type, bytesPtr: ptr, bytesLen: bytes.length }
    })
    const tmpl = buildTemplate(M, defs)
    try {
      return M._C_FindObjectsInit(hSession, tmpl.ptr, defs.length) >>> 0
    } finally {
      freeTemplate(M, tmpl, defs.length)
      auxPtrs.forEach((p) => M._free(p))
    }
  },

  C_FindObjects: (M, req, res, bindings, findings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const maxCount = Number(req.querySelector(':scope > Object')?.getAttribute('length') ?? '1')
    const objPtr = M._malloc(4 * Math.max(maxCount, 1))
    const countPtr = M._malloc(4)
    try {
      const rv = M._C_FindObjects(hSession, objPtr, maxCount, countPtr) >>> 0
      if (rv === 0) {
        const count = readU32(M, countPtr)
        const handles: number[] = []
        for (let i = 0; i < count; i++) handles.push(readU32(M, objPtr + i * 4))
        bindings.set('Object.count', count)
        bindings.set('Object.Object', handles)
        // §3: "may reference array or list items by index number" — bind
        // the whole handle array so `${Object.Object[i]}` resolves
        // positionally in later steps, not just the count.
        const expectedWrapperEl = res.querySelector(':scope > Object')
        const expectedCount = expectedWrapperEl
          ? expectedWrapperEl.querySelectorAll(':scope > Object').length
          : 0
        if (expectedCount > 0 && count < expectedCount) {
          findings.push({
            field: 'Object.count',
            expected: `>=${expectedCount}`,
            actual: String(count),
            exempt: false,
          })
        }
      }
      return rv
    } finally {
      M._free(objPtr)
      M._free(countPtr)
    }
  },

  C_FindObjectsFinal: (M, req, _res, bindings) =>
    M._C_FindObjectsFinal(bindings.resolveNumber(childText(req, 'Session')!)) >>> 0,

  C_CloseSession: (M, req, _res, bindings) =>
    M._C_CloseSession(bindings.resolveNumber(childText(req, 'Session')!)) >>> 0,

  C_CloseAllSessions: (M, req, _res, bindings) =>
    M._C_CloseAllSessions(bindings.resolveNumber(childText(req, 'SlotID')!)) >>> 0,

  C_Finalize: (M) => M._C_Finalize(0) >>> 0,

  C_Login: (M, req, _res, bindings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const userType = CKU_NAMES[childText(req, 'UserType') ?? 'USER']
    const pinEl = req.querySelector(':scope > Pin')
    const pin = bindings.resolveString(pinEl?.getAttribute('value') ?? '')
    const pinBytes = new TextEncoder().encode(pin)
    const pinPtr = M._malloc(Math.max(pinBytes.length, 1))
    M.HEAPU8.set(pinBytes, pinPtr)
    try {
      return M._C_Login(hSession, userType, pinPtr, pinBytes.length) >>> 0
    } finally {
      M._free(pinPtr)
    }
  },

  C_Logout: (M, req, _res, bindings) =>
    M._C_Logout(bindings.resolveNumber(childText(req, 'Session')!)) >>> 0,

  C_GetMechanismList: (M, req, res, bindings, findings) => {
    const slotId = bindings.resolveNumber(childText(req, 'SlotID')!)
    const countPtr = M._malloc(4)
    try {
      let rv = M._C_GetMechanismList(slotId, 0, countPtr) >>> 0
      if (rv !== 0) return rv
      const count = readU32(M, countPtr)
      const listPtr = M._malloc(4 * Math.max(count, 1))
      try {
        rv = M._C_GetMechanismList(slotId, listPtr, countPtr) >>> 0
        if (rv === 0) {
          const actualCount = readU32(M, countPtr)
          bindings.set('MechanismList.length', actualCount)
          const actualTypes = new Set<number>()
          for (let i = 0; i < actualCount; i++) actualTypes.add(readU32(M, listPtr + i * 4))
          // Every mechanism named in the response's expected list must
          // actually be present — stricter than §3.1.2(3)'s "at least one
          // entry" minimum, and what the test's later C_GetMechanismInfo
          // calls then rely on.
          const listEl = res.querySelector(':scope > MechanismList')
          const expectedTypeEls = listEl ? Array.from(listEl.querySelectorAll(':scope > Type')) : []
          for (const typeEl of expectedTypeEls) {
            const typeName = typeEl.getAttribute('value')!
            const type = MECHANISM_TYPE_NAMES[typeName]
            if (type === undefined || !actualTypes.has(type)) {
              findings.push({
                field: 'MechanismList.Type',
                expected: typeName,
                actual:
                  type === undefined
                    ? '(unknown mechanism name — extend MECHANISM_TYPE_NAMES)'
                    : 'not present in list',
                exempt: false,
              })
            }
          }
        }
        return rv
      } finally {
        M._free(listPtr)
      }
    } finally {
      M._free(countPtr)
    }
  },

  C_GetMechanismInfo: (M, req, res, bindings, findings) => {
    const slotId = bindings.resolveNumber(childText(req, 'SlotID')!)
    const typeName = childText(req, 'Type')!
    const type = MECHANISM_TYPE_NAMES[typeName]
    if (type === undefined) {
      findings.push({
        field: 'C_GetMechanismInfo.Type',
        expected: typeName,
        actual: '(unknown mechanism name — extend MECHANISM_TYPE_NAMES)',
        exempt: false,
      })
      return 0xffffffff
    }
    const ptr = M._malloc(12)
    try {
      const rv = M._C_GetMechanismInfo(slotId, type, ptr) >>> 0
      if (rv === 0) {
        const minKeySize = readU32(M, ptr)
        const maxKeySize = readU32(M, ptr + 4)
        const flags = readU32(M, ptr + 8)
        const infoEl = res.querySelector(':scope > MechanismInfo')
        if (infoEl) {
          const minExp = childText(infoEl, 'MinKeySize')
          if (minExp !== undefined)
            compareField(findings, 'MechanismInfo', 'MinKeySize', minExp, minKeySize)
          const maxExp = childText(infoEl, 'MaxKeySize')
          if (maxExp !== undefined)
            compareField(findings, 'MechanismInfo', 'MaxKeySize', maxExp, maxKeySize)
          const flagsExpr = childText(infoEl, 'Flags')
          if (flagsExpr !== undefined) {
            compareFlags(
              findings,
              'MechanismInfo',
              'Flags',
              flagsExpr,
              flags,
              MECHANISM_INFO_FLAG_NAMES,
              'superset'
            )
          }
        }
      }
      return rv
    } finally {
      M._free(ptr)
    }
  },

  // §4.3 two-phase attribute protocol: `<Attribute type="X"/>` (no
  // length/value) is a size query — pValue=NULL, compare the response's
  // `length`; `<Attribute type="X" length="n"/>` is a fetch into an
  // n-byte buffer — compare the response's `value`. MODULUS gets D1
  // treatment: OASIS's static example modulus is unreproducible (the
  // signing key that goes with it was never published), so its *value* is
  // checked against the fixture's own real generated key
  // (`Fixture.Modulus`, supplied via initialBindings) instead of the XML,
  // with an exempt ledger entry recording that substitution — never a
  // silent skip, and a real mismatch against the fixture is still a hard
  // failure.
  C_GetAttributeValue: (M, req, res, bindings, findings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const hObject = bindings.resolveNumber(childText(req, 'Object')!)
    const reqTmplEl = req.querySelector(':scope > Template')
    const reqAttrEls = reqTmplEl ? Array.from(reqTmplEl.querySelectorAll(':scope > Attribute')) : []
    const resTmplEl = res.querySelector(':scope > Template')
    const resAttrEls = resTmplEl ? Array.from(resTmplEl.querySelectorAll(':scope > Attribute')) : []
    const auxPtrs: number[] = []
    const defs: AttrDef[] = reqAttrEls.map((a) => {
      const attrName = a.getAttribute('type')!
      const type = ATTR_TYPE_NAMES[attrName]
      const lengthAttr = a.getAttribute('length')
      if (lengthAttr === null) return { type } // size query: pValue=NULL, ulValueLen=0
      const bufLen = Number(lengthAttr)
      const ptr = M._malloc(Math.max(bufLen, 1))
      auxPtrs.push(ptr)
      return { type, bytesPtr: ptr, bytesLen: bufLen }
    })
    const tmpl = buildTemplate(M, defs)
    try {
      const rv = M._C_GetAttributeValue(hSession, hObject, tmpl.ptr, defs.length) >>> 0
      if (rv === 0) {
        reqAttrEls.forEach((a, i) => {
          const attrName = a.getAttribute('type')!
          const base = tmpl.ptr + i * 12
          const actualLen = readU32(M, base + 8)
          const resAttrEl = resAttrEls.find((e) => e.getAttribute('type') === attrName)
          if (!resAttrEl) return
          const expLenAttr = resAttrEl.getAttribute('length')
          const expValAttr = resAttrEl.getAttribute('value')
          if (expValAttr === null) {
            // size-query response: only a length is expected
            if (expLenAttr !== null) {
              compareField(findings, 'Template', `${attrName}.length`, expLenAttr, actualLen)
            }
            return
          }
          // fetch response: a concrete value is expected
          const bytesPtr = defs[i].bytesPtr!
          const actualBytes = M.HEAPU8.slice(bytesPtr, bytesPtr + actualLen)
          const isText = TEXT_ATTR_NAMES.has(attrName)
          const actualStr = isText ? decodeAttrText(actualBytes) : bytesToHex(actualBytes)
          if (attrName === 'MODULUS') {
            compareField(findings, 'Template', 'MODULUS.length', expValAttr.length / 2, actualLen)
            const fixtureModulus = bindings.get('Fixture.Modulus') as string | undefined
            if (fixtureModulus === undefined) {
              findings.push({
                field: 'Template.MODULUS.value',
                expected: '(a provisioned fixture key — see Phase 4 fixture provisioning)',
                actual: '(no Fixture.Modulus binding supplied)',
                exempt: false,
              })
            } else if (actualStr === fixtureModulus) {
              findings.push({
                field: 'Template.MODULUS.value',
                expected: fixtureModulus,
                actual:
                  "matches — verified against the provisioned key's real modulus, not the OASIS static example (D1)",
                exempt: true,
              })
            } else {
              findings.push({
                field: 'Template.MODULUS.value',
                expected: fixtureModulus,
                actual: actualStr,
                exempt: false,
              })
            }
          } else {
            compareField(findings, 'Template', `${attrName}.value`, expValAttr, actualStr)
          }
        })
      }
      return rv
    } finally {
      freeTemplate(M, tmpl, defs.length)
      auxPtrs.forEach((p) => M._free(p))
    }
  },

  C_SignInit: (M, req, _res, bindings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const mechEl = req.querySelector(':scope > Mechanism')
    const typeName = mechEl ? childText(mechEl, 'Type') : undefined
    if (!typeName) throw new Error('C_SignInit: missing Mechanism/Type')
    const type = MECHANISM_TYPE_NAMES[typeName]
    if (type === undefined) throw new Error(`C_SignInit: unknown mechanism "${typeName}"`)
    const hKey = bindings.resolveNumber(childText(req, 'Key')!)
    const mech = buildMech(M, type)
    try {
      return M._C_SignInit(hSession, mech, hKey) >>> 0
    } finally {
      M._free(mech)
    }
  },

  // D1: the OASIS example's expected Signature bytes are unreproducible
  // (no published private key), so this handler never byte-compares them.
  // It checks the returned length, then independently verifies the real
  // signature with WebCrypto against the fixture's real public key — an
  // engine-independent verifier, not either PKCS#11 engine under test. A
  // verification failure is always a hard, non-exempt finding.
  C_Sign: async (M, req, res, bindings, findings) => {
    const hSession = bindings.resolveNumber(childText(req, 'Session')!)
    const dataBytes = hexToBytes(childText(req, 'Data')!)
    const dataPtr = M._malloc(Math.max(dataBytes.length, 1))
    M.HEAPU8.set(dataBytes, dataPtr)
    const sigLenPtr = M._malloc(4)
    let sigPtr = 0
    try {
      let rv = M._C_Sign(hSession, dataPtr, dataBytes.length, 0, sigLenPtr) >>> 0
      if (rv !== 0) return rv
      const sigLen = readU32(M, sigLenPtr)
      sigPtr = M._malloc(Math.max(sigLen, 1))
      M.setValue(sigLenPtr, sigLen, 'i32')
      rv = M._C_Sign(hSession, dataPtr, dataBytes.length, sigPtr, sigLenPtr) >>> 0
      if (rv === 0) {
        const actualLen = readU32(M, sigLenPtr)
        const sigBytes = M.HEAPU8.slice(sigPtr, sigPtr + actualLen)
        const sigEl = res.querySelector(':scope > Signature')
        const expLenAttr = sigEl?.getAttribute('length')
        if (expLenAttr !== null && expLenAttr !== undefined) {
          compareField(findings, 'Signature', 'length', expLenAttr, actualLen)
        }
        const nHex = bindings.get('Fixture.Modulus') as string | undefined
        const eHex = bindings.get('Fixture.PublicExponent') as string | undefined
        if (!nHex || !eHex) {
          findings.push({
            field: 'Signature.verify',
            expected: 'a provisioned public key to verify against',
            actual: '(no Fixture.Modulus/Fixture.PublicExponent binding supplied)',
            exempt: false,
          })
        } else {
          const ok = await verifyRsaPkcs1Sha256(nHex, eHex, dataBytes, sigBytes)
          if (ok) {
            findings.push({
              field: 'Signature.value',
              expected: '(unreproducible — OASIS publishes no private key for AUTH-M-1-32)',
              actual:
                'verified with WebCrypto RSASSA-PKCS1-v1_5/SHA-256 against the provisioned public key (D1)',
              exempt: true,
            })
          } else {
            findings.push({
              field: 'Signature.value',
              expected: 'a signature verifiable under the provisioned public key',
              actual: 'WebCrypto verification FAILED',
              exempt: false,
            })
          }
        }
      }
      return rv
    } finally {
      M._free(dataPtr)
      M._free(sigLenPtr)
      if (sigPtr) M._free(sigPtr)
    }
  },
}

// A handful of TokenInfo.Flags macro names appear across the vendored test
// cases; kept separate from SESSION_FLAG_NAMES since the bit values differ.
const TOKEN_INFO_FLAG_NAMES: Record<string, number> = {
  RNG: 0x00000001,
  LOGIN_REQUIRED: 0x00000004,
  USER_PIN_INITIALIZED: 0x00000008,
  RESTORE_KEY_NOT_NEEDED: 0x00000020,
  TOKEN_INITIALIZED: 0x00000400,
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export const runXmlTestCase = async (
  M: SoftHSMModule,
  testCaseName: string,
  rawXml: string,
  engineName: string,
  /**
   * Values for symbolic placeholders §3 says the implementation must
   * supply (e.g. `${Pin}`) — not derived from any prior response, so
   * they can't be discovered by the executor itself. The caller knows
   * them because it set the token up (e.g. the user PIN it called
   * hsm_openUserSession with, or a fixture's provisioned key's real
   * `Fixture.Modulus`/`Fixture.PublicExponent`).
   */
  initialBindings: Record<string, string | number> = {}
): Promise<TestCaseExecutionResult> => {
  const cleaned = stripHashComments(rawXml)
  const doc = new DOMParser().parseFromString(cleaned, 'text/xml')
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error(`XML parse error in ${testCaseName}: ${parserError.textContent}`)
  }
  const root = doc.documentElement
  const children = Array.from(root.children)
  const bindings = new BindingStore()
  for (const [k, v] of Object.entries(initialBindings)) bindings.set(k, v)
  const steps: StepResult[] = []

  for (let i = 0; i < children.length; i += 2) {
    const req = children[i]
    const res = children[i + 1]
    const fn = req.tagName
    if (!res || res.tagName !== fn) {
      throw new Error(`${testCaseName}: malformed request/response pair at index ${i} (${fn})`)
    }
    const handler = HANDLERS[fn]
    const rvExpectedName = res.getAttribute('rv') ?? 'OK'
    if (!handler) {
      steps.push({
        fn,
        rvExpected: rvExpectedName,
        rvActual: 'UNSUPPORTED',
        rvOk: false,
        findings: [],
        error: `no handler wired for ${fn} yet`,
      })
      continue
    }
    const findings: ComparisonFinding[] = []
    try {
      const rvActual = await handler(M, req, res, bindings, findings, engineName)
      const rvActualName = (RV_NAMES[rvActual] ?? `0x${rvActual.toString(16)}`).replace(/^CKR_/, '')
      steps.push({
        fn,
        rvExpected: rvExpectedName,
        rvActual: rvActualName,
        rvOk: rvActualName === rvExpectedName,
        findings,
      })
    } catch (e) {
      steps.push({
        fn,
        rvExpected: rvExpectedName,
        rvActual: 'THROW',
        rvOk: false,
        findings,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const pass = steps.every((s) => s.rvOk && !s.error && s.findings.every((f) => f.exempt))

  return { testCase: testCaseName, engine: engineName, steps, pass }
}
