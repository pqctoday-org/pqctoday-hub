// SPDX-License-Identifier: GPL-3.0-only
/**
 * PKCS#11 v3.2 parameter decoder — no React, no side effects.
 *
 * Reads WASM heap memory to decode CK_MECHANISM, CK_ATTRIBUTE templates, and
 * CK_SIGN_ADDITIONAL_CONTEXT into human-readable structures for the inspect panel.
 *
 * All WASM memory reads are wrapped in try/catch — the heap may have been freed
 * by the time the UI renders, so failures degrade gracefully to 'unknown'.
 *
 * Memory layout (32-bit Emscripten WASM):
 *   CK_ATTRIBUTE:               12 bytes  { type i32 @0, pValue i32 @4, ulValueLen i32 @8 }
 *   CK_MECHANISM:               12 bytes  { mechanism i32 @0, pParameter i32 @4, ulParameterLen i32 @8 }
 *   CK_SIGN_ADDITIONAL_CONTEXT: 12 bytes  { hedgeVariant i32 @0, pContext i32 @4, ulContextLen i32 @8 }
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

// ── Exported types ────────────────────────────────────────────────────────────

export interface DecodedValue {
  kind: 'bool' | 'ulong' | 'constant' | 'bytes' | 'null'
  display: string // e.g. "CKO_PUBLIC_KEY (0x02)", "true", "1088 bytes"
  description?: string
}

export interface DecodedAttribute {
  typeHex: string // "0x00000000"
  typeName: string // "CKA_CLASS"
  typeDescription?: string
  value: DecodedValue
}

export interface DecodedSignParam {
  hedgeName: string
  hedgeDescription: string
  contextLen: number
  contextHex?: string // first 16 hex chars if contextLen > 0
}

export interface DecodedMechanism {
  typeHex: string
  name: string
  description?: string
  param?: DecodedSignParam
}

export interface InspectSection {
  label: string
  mechanism?: DecodedMechanism
  attributes?: DecodedAttribute[]
  primitives?: Array<{ name: string; value: string; note?: string }>
}

export interface Pkcs11LogInspect {
  inputs: InspectSection[]
  outputs?: Array<{ name: string; value: string; note?: string }>
  spec?: string
}

// ── Private constant tables ───────────────────────────────────────────────────

interface ConstEntry {
  name: string
  description?: string
}

// CKA_ attribute types
const CKA_TABLE: Record<number, ConstEntry> = {
  0x00000000: { name: 'CKA_CLASS', description: 'Object class (CKO_*)' },
  0x00000001: { name: 'CKA_TOKEN', description: 'Persistent token object vs session object' },
  0x00000002: { name: 'CKA_PRIVATE', description: 'Access requires authentication' },
  0x00000011: { name: 'CKA_VALUE', description: 'Raw key bytes' },
  0x00000100: { name: 'CKA_KEY_TYPE', description: 'Key type (CKK_*)' },
  0x00000103: { name: 'CKA_SENSITIVE', description: 'Key cannot be extracted in plaintext' },
  0x00000108: { name: 'CKA_SIGN', description: 'Key can be used to create signatures' },
  0x0000010a: { name: 'CKA_VERIFY', description: 'Key can be used to verify signatures' },
  0x00000161: { name: 'CKA_VALUE_LEN', description: 'Key length in bytes' },
  0x00000162: { name: 'CKA_EXTRACTABLE', description: 'Key can be wrapped and extracted' },
  0x0000061d: { name: 'CKA_PARAMETER_SET', description: 'PQC parameter set (CKP_*)' },
  0x00000633: {
    name: 'CKA_ENCAPSULATE',
    description: 'Key can be used for encapsulation (ML-KEM)',
  },
  0x00000634: {
    name: 'CKA_DECAPSULATE',
    description: 'Key can be used for decapsulation (ML-KEM)',
  },
  0x0000062a: {
    name: 'CKA_ENCAPSULATE_TEMPLATE',
    description: 'Template for auto-generated shared-secret key (ML-KEM encapsulate)',
  },
  0x0000062b: {
    name: 'CKA_DECAPSULATE_TEMPLATE',
    description: 'Template for auto-generated shared-secret key (ML-KEM decapsulate)',
  },
}

// CKM_ mechanism types
const CKM_TABLE: Record<number, ConstEntry> = {
  0x0000000f: {
    name: 'CKM_ML_KEM_KEY_PAIR_GEN',
    description: 'ML-KEM key pair generation (FIPS 203 Algorithm 15/16)',
  },
  0x00000017: {
    name: 'CKM_ML_KEM',
    description: 'ML-KEM encapsulation / decapsulation (FIPS 203 Algorithm 17/18)',
  },
  0x0000001c: {
    name: 'CKM_ML_DSA_KEY_PAIR_GEN',
    description: 'ML-DSA key pair generation (FIPS 204 Algorithm 6/7)',
  },
  0x0000001d: {
    name: 'CKM_ML_DSA',
    description: 'ML-DSA pure signing / verification (FIPS 204 Algorithm 2/3)',
  },
  0x00000024: {
    name: 'CKM_HASH_ML_DSA_SHA256',
    description: 'HashML-DSA with SHA-256 (FIPS 204 Algorithm 4/5)',
  },
  0x00000026: {
    name: 'CKM_HASH_ML_DSA_SHA512',
    description: 'HashML-DSA with SHA-512 (FIPS 204 Algorithm 4/5)',
  },
  0x00000028: {
    name: 'CKM_HASH_ML_DSA_SHA3_256',
    description: 'HashML-DSA with SHA3-256 (FIPS 204 Algorithm 4/5)',
  },
  // ML-DSA hash variants — FIPS 204 Algorithm 4/5 (missing from initial table)
  0x0000001f: {
    name: 'CKM_HASH_ML_DSA',
    description: 'HashML-DSA generic pre-hash (FIPS 204 Algorithm 4/5)',
  },
  0x00000023: {
    name: 'CKM_HASH_ML_DSA_SHA224',
    description: 'HashML-DSA with SHA-224 (FIPS 204 Algorithm 4/5)',
  },
  0x00000025: {
    name: 'CKM_HASH_ML_DSA_SHA384',
    description: 'HashML-DSA with SHA-384 (FIPS 204 Algorithm 4/5)',
  },
  0x00000027: {
    name: 'CKM_HASH_ML_DSA_SHA3_224',
    description: 'HashML-DSA with SHA3-224 (FIPS 204 Algorithm 4/5)',
  },
  0x00000029: {
    name: 'CKM_HASH_ML_DSA_SHA3_384',
    description: 'HashML-DSA with SHA3-384 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002a: {
    name: 'CKM_HASH_ML_DSA_SHA3_512',
    description: 'HashML-DSA with SHA3-512 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002b: {
    name: 'CKM_HASH_ML_DSA_SHAKE128',
    description: 'HashML-DSA with SHAKE128 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002c: {
    name: 'CKM_HASH_ML_DSA_SHAKE256',
    description: 'HashML-DSA with SHAKE256 (FIPS 204 Algorithm 4/5)',
  },
  // SLH-DSA — FIPS 205 (Stateless Hash-Based Digital Signature Standard)
  0x0000002d: {
    name: 'CKM_SLH_DSA_KEY_PAIR_GEN',
    description: 'SLH-DSA key pair generation (FIPS 205)',
  },
  0x0000002e: {
    name: 'CKM_SLH_DSA',
    description: 'SLH-DSA pure signing / verification (FIPS 205)',
  },
  0x00000034: {
    name: 'CKM_HASH_SLH_DSA',
    description: 'HashSLH-DSA generic pre-hash (FIPS 205)',
  },
  0x00000036: {
    name: 'CKM_HASH_SLH_DSA_SHA224',
    description: 'HashSLH-DSA with SHA-224 (FIPS 205)',
  },
  0x00000037: {
    name: 'CKM_HASH_SLH_DSA_SHA256',
    description: 'HashSLH-DSA with SHA-256 (FIPS 205)',
  },
  0x00000038: {
    name: 'CKM_HASH_SLH_DSA_SHA384',
    description: 'HashSLH-DSA with SHA-384 (FIPS 205)',
  },
  0x00000039: {
    name: 'CKM_HASH_SLH_DSA_SHA512',
    description: 'HashSLH-DSA with SHA-512 (FIPS 205)',
  },
  0x0000003a: {
    name: 'CKM_HASH_SLH_DSA_SHA3_224',
    description: 'HashSLH-DSA with SHA3-224 (FIPS 205)',
  },
  0x0000003b: {
    name: 'CKM_HASH_SLH_DSA_SHA3_256',
    description: 'HashSLH-DSA with SHA3-256 (FIPS 205)',
  },
  0x0000003c: {
    name: 'CKM_HASH_SLH_DSA_SHA3_384',
    description: 'HashSLH-DSA with SHA3-384 (FIPS 205)',
  },
  0x0000003d: {
    name: 'CKM_HASH_SLH_DSA_SHA3_512',
    description: 'HashSLH-DSA with SHA3-512 (FIPS 205)',
  },
  0x0000003e: {
    name: 'CKM_HASH_SLH_DSA_SHAKE128',
    description: 'HashSLH-DSA with SHAKE128 (FIPS 205)',
  },
  0x0000003f: {
    name: 'CKM_HASH_SLH_DSA_SHAKE256',
    description: 'HashSLH-DSA with SHAKE256 (FIPS 205)',
  },
}

// CKO_ object classes
const CKO_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKO_DATA', description: 'Opaque data object' },
  0x01: { name: 'CKO_CERTIFICATE', description: 'Certificate object' },
  0x02: { name: 'CKO_PUBLIC_KEY', description: 'Public key — encapsulate / verify operations' },
  0x03: { name: 'CKO_PRIVATE_KEY', description: 'Private key — decapsulate / sign operations' },
  0x04: { name: 'CKO_SECRET_KEY', description: 'Symmetric / shared-secret key' },
}

// CKK_ key types
const CKK_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKK_RSA' },
  0x03: { name: 'CKK_EC' },
  0x49: { name: 'CKK_ML_KEM', description: 'ML-KEM (FIPS 203)' },
  0x4a: { name: 'CKK_ML_DSA', description: 'ML-DSA (FIPS 204)' },
  0x4b: { name: 'CKK_SLH_DSA', description: 'SLH-DSA (FIPS 205)' },
}

// CKH_ hedging variants
const CKH_TABLE: Record<number, ConstEntry> = {
  0x00: {
    name: 'CKH_HEDGE_PREFERRED',
    description: 'Hedged randomness used if available; deterministic fallback allowed',
  },
  0x01: {
    name: 'CKH_HEDGE_REQUIRED',
    description: 'Hedged randomness required — deterministic forbidden (FIPS 204 §3.5)',
  },
  0x02: {
    name: 'CKH_DETERMINISTIC_REQUIRED',
    description: 'Deterministic signing required — no randomness injected',
  },
}

// CKU_ user types
const CKU_TABLE: Record<number, ConstEntry> = {
  0: { name: 'CKU_SO', description: 'Security Officer — initialises tokens and user PINs' },
  1: { name: 'CKU_USER', description: 'Normal user — cryptographic operations' },
  2: { name: 'CKU_CONTEXT_SPECIFIC', description: 'Context-specific login (two-factor)' },
}

// CKP_ ML-KEM parameter sets
const CKP_ML_KEM: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_ML_KEM_512', description: 'NIST Level 1 — 800-byte ciphertext, 1632-byte key' },
  0x2: {
    name: 'CKP_ML_KEM_768',
    description: 'NIST Level 3 — 1088-byte ciphertext, 2400-byte key',
  },
  0x3: {
    name: 'CKP_ML_KEM_1024',
    description: 'NIST Level 5 — 1568-byte ciphertext, 3168-byte key',
  },
}

// CKP_ ML-DSA parameter sets
const CKP_ML_DSA: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_ML_DSA_44', description: 'NIST Level 2 — 2420-byte signature' },
  0x2: { name: 'CKP_ML_DSA_65', description: 'NIST Level 3 — 3309-byte signature' },
  0x3: { name: 'CKP_ML_DSA_87', description: 'NIST Level 5 — 4627-byte signature' },
}

// CKP_ SLH-DSA parameter sets (pkcs11t.h ordering: interleaved SHA2/SHAKE per security level)
const CKP_SLH_DSA: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_SLH_DSA_SHA2_128S', description: 'NIST Level 1 — 7856-byte signature, SHA2' },
  0x2: { name: 'CKP_SLH_DSA_SHAKE_128S', description: 'NIST Level 1 — 7856-byte signature, SHAKE' },
  0x3: {
    name: 'CKP_SLH_DSA_SHA2_128F',
    description: 'NIST Level 1 — 17088-byte signature, SHA2 (fast)',
  },
  0x4: {
    name: 'CKP_SLH_DSA_SHAKE_128F',
    description: 'NIST Level 1 — 17088-byte signature, SHAKE (fast)',
  },
  0x5: { name: 'CKP_SLH_DSA_SHA2_192S', description: 'NIST Level 3 — 16224-byte signature, SHA2' },
  0x6: {
    name: 'CKP_SLH_DSA_SHAKE_192S',
    description: 'NIST Level 3 — 16224-byte signature, SHAKE',
  },
  0x7: {
    name: 'CKP_SLH_DSA_SHA2_192F',
    description: 'NIST Level 3 — 35664-byte signature, SHA2 (fast)',
  },
  0x8: {
    name: 'CKP_SLH_DSA_SHAKE_192F',
    description: 'NIST Level 3 — 35664-byte signature, SHAKE (fast)',
  },
  0x9: { name: 'CKP_SLH_DSA_SHA2_256S', description: 'NIST Level 5 — 29792-byte signature, SHA2' },
  0xa: {
    name: 'CKP_SLH_DSA_SHAKE_256S',
    description: 'NIST Level 5 — 29792-byte signature, SHAKE',
  },
  0xb: {
    name: 'CKP_SLH_DSA_SHA2_256F',
    description: 'NIST Level 5 — 49856-byte signature, SHA2 (fast)',
  },
  0xc: {
    name: 'CKP_SLH_DSA_SHAKE_256F',
    description: 'NIST Level 5 — 49856-byte signature, SHAKE (fast)',
  },
}

// CKF_ session flags bitmask (CK_FLAGS)
const CKF_SESSION_FLAGS: Array<{ bit: number; name: string; description?: string }> = [
  { bit: 0x0002, name: 'CKF_RW_SESSION', description: 'Read/write session' },
  { bit: 0x0004, name: 'CKF_SERIAL_SESSION', description: 'Serial session (required by PKCS#11)' },
]

// ── Private helpers ───────────────────────────────────────────────────────────

/** Safely read a 32-bit little-endian integer from WASM heap. Returns null on failure. */
const safeRead32 = (M: SoftHSMModule, ptr: number): number | null => {
  try {
    if (!ptr || !M.HEAPU8) return null
    return M.getValue(ptr, 'i32') >>> 0
  } catch {
    return null
  }
}

/** Decode a CK_FLAGS bitmask into flag names. */
const decodeFlagsBitmask = (flags: number): string => {
  const active = CKF_SESSION_FLAGS.filter((f) => flags & f.bit).map((f) => f.name)
  const raw = `0x${flags.toString(16).padStart(8, '0')}`
  return active.length > 0 ? `${active.join(' | ')} (${raw})` : raw
}

/** Determine algo context from mechanism type (for CKP_ dispatch). */
type AlgoContext = 'ml-kem' | 'ml-dsa' | 'slh-dsa' | undefined

const algoFromMechType = (mechType: number): AlgoContext => {
  if (mechType === 0x0000000f || mechType === 0x00000017) return 'ml-kem'
  if (mechType >= 0x0000001c && mechType <= 0x0000002c) return 'ml-dsa'
  if (mechType >= 0x0000002d && mechType <= 0x0000003f) return 'slh-dsa'
  return undefined
}

/**
 * Decode a ulong attribute value into a symbolic constant where applicable.
 * `algo` provides context for CKA_PARAMETER_SET dispatch.
 */
const decodeUlongAttr = (attrType: number, v: number, algo: AlgoContext): DecodedValue => {
  const hex = `0x${v.toString(16).padStart(2, '0')}`
  if (attrType === 0x00000000 /* CKA_CLASS */) {
    const entry = CKO_TABLE[v]
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  if (attrType === 0x00000100 /* CKA_KEY_TYPE */) {
    const entry = CKK_TABLE[v]
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  if (attrType === 0x0000061d /* CKA_PARAMETER_SET */) {
    const table =
      algo === 'ml-kem'
        ? CKP_ML_KEM
        : algo === 'ml-dsa'
          ? CKP_ML_DSA
          : algo === 'slh-dsa'
            ? CKP_SLH_DSA
            : null
    const entry = table ? table[v] : null
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  return { kind: 'ulong', display: `${v} (${hex})` }
}

// ── WASM memory readers ───────────────────────────────────────────────────────

/**
 * Read a CK_SIGN_ADDITIONAL_CONTEXT from WASM heap.
 * Layout: hedgeVariant i32 @0, pContext i32 @4, ulContextLen i32 @8
 */
const readSignParam = (M: SoftHSMModule, ptr: number, len: number): DecodedSignParam | null => {
  if (!ptr || len < 12) return null
  try {
    const hedgeVariant = safeRead32(M, ptr)
    const contextPtr = safeRead32(M, ptr + 4)
    const contextLen = safeRead32(M, ptr + 8)
    if (hedgeVariant === null || contextLen === null) return null

    const hedgeEntry = CKH_TABLE[hedgeVariant]
    const result: DecodedSignParam = {
      hedgeName: hedgeEntry?.name ?? `0x${hedgeVariant.toString(16).padStart(2, '0')}`,
      hedgeDescription: hedgeEntry?.description ?? 'Unknown hedge variant',
      contextLen: contextLen ?? 0,
    }

    if (contextLen && contextLen > 0 && contextPtr) {
      try {
        const bytes = M.HEAPU8.slice(contextPtr, contextPtr + Math.min(contextLen, 8))
        result.contextHex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      } catch {
        // context bytes unavailable
      }
    }

    return result
  } catch {
    return null
  }
}

/**
 * Read a CK_MECHANISM struct from WASM heap.
 * Layout: mechanism i32 @0, pParameter i32 @4, ulParameterLen i32 @8
 */
const readMechanism = (M: SoftHSMModule, ptr: number): DecodedMechanism | null => {
  if (!ptr) return null
  try {
    const mechType = safeRead32(M, ptr)
    const paramPtr = safeRead32(M, ptr + 4)
    const paramLen = safeRead32(M, ptr + 8)
    if (mechType === null) return null

    const mechHex = `0x${mechType.toString(16).padStart(8, '0')}`
    const entry = CKM_TABLE[mechType]
    const result: DecodedMechanism = {
      typeHex: mechHex,
      name: entry?.name ?? mechHex,
      description: entry?.description,
    }

    // Attempt to read CK_SIGN_ADDITIONAL_CONTEXT from mechanism parameter
    if (paramPtr && paramLen && paramLen >= 12) {
      result.param = readSignParam(M, paramPtr, paramLen) ?? undefined
    }

    return result
  } catch {
    return null
  }
}

/**
 * Read N × CK_ATTRIBUTE structs from WASM heap.
 * Layout per entry: type i32 @0, pValue i32 @4, ulValueLen i32 @8
 */
const CK_ATTR_SIZE = 12
const readTemplate = (
  M: SoftHSMModule,
  ptr: number,
  count: number,
  algo: AlgoContext = undefined
): DecodedAttribute[] => {
  if (!ptr || count <= 0 || count > 64) return []
  const result: DecodedAttribute[] = []
  try {
    for (let i = 0; i < count; i++) {
      const base = ptr + i * CK_ATTR_SIZE
      const attrType = safeRead32(M, base)
      const valPtr = safeRead32(M, base + 4)
      const valLen = safeRead32(M, base + 8)
      if (attrType === null) continue

      const typeHex = `0x${attrType.toString(16).padStart(8, '0')}`
      const typeEntry = CKA_TABLE[attrType]
      let value: DecodedValue

      if (valLen === null || valLen === 0 || !valPtr) {
        value = { kind: 'null', display: '— (size query / empty)' }
      } else if (valLen === 1) {
        // bool
        try {
          const b = M.HEAPU8[valPtr]
          value = { kind: 'bool', display: b ? 'true' : 'false' }
        } catch {
          value = { kind: 'null', display: 'unreadable' }
        }
      } else if (valLen === 4) {
        // ulong — may encode a constant
        const v = safeRead32(M, valPtr)
        if (v !== null) {
          value = decodeUlongAttr(attrType, v, algo)
        } else {
          value = { kind: 'null', display: 'unreadable' }
        }
      } else {
        // raw bytes
        const maxPreview = 8
        const preview = Math.min(valLen, maxPreview)
        let hexSnippet = ''
        try {
          hexSnippet = Array.from(M.HEAPU8.slice(valPtr, valPtr + preview))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          if (valLen > maxPreview) hexSnippet += '…'
        } catch {
          hexSnippet = '(unreadable)'
        }
        value = { kind: 'bytes', display: `${valLen} bytes  [${hexSnippet}]` }
      }

      result.push({
        typeHex,
        typeName: typeEntry?.name ?? `CKA_0x${attrType.toString(16)}`,
        typeDescription: typeEntry?.description,
        value,
      })
    }
  } catch {
    // partial read — return what we have
  }
  return result
}

// ── Per-function decoders ─────────────────────────────────────────────────────

/** C_OpenSession(slotID, flags, pApp, Notify, phSession) */
const decodeOpenSession = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const flags = args[1] ?? 0
  const phSession = args[4] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'slotID', value: String(args[0] ?? '?') },
        { name: 'flags', value: decodeFlagsBitmask(flags) },
      ],
    },
  ]
  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && phSession) {
    const hSession = safeRead32(M, phSession)
    if (hSession !== null) outputs.push({ name: '*phSession', value: String(hSession) })
  }
  return { inputs, outputs: outputs.length ? outputs : undefined }
}

/** C_Login(hSession, userType, pPin, ulPinLen) */
const decodeLogin = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const userType = args[1] ?? 0
  const entry = CKU_TABLE[userType]
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'hSession', value: String(args[0] ?? '?') },
          {
            name: 'userType',
            value: entry ? `${entry.name} (${userType})` : `${userType}`,
            note: entry?.description,
          },
          { name: 'ulPinLen', value: String(args[3] ?? '?') },
        ],
      },
    ],
  }
}

/** C_InitToken(slotID, pPin, ulPinLen, pLabel) */
const decodeInitToken = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const labelPtr = args[3] ?? 0
  let label = '?'
  if (labelPtr) {
    try {
      const bytes = M.HEAPU8.slice(labelPtr, labelPtr + 32)
      label = `"${new TextDecoder().decode(bytes).replace(/\x00/g, '').trimEnd()}"`
    } catch {
      label = '(unreadable)'
    }
  }
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'slotID', value: String(args[0] ?? '?') },
          { name: 'ulPinLen', value: String(args[2] ?? '?') },
          { name: 'pLabel', value: label, note: '32-byte blank-padded UTF-8 field' },
        ],
      },
    ],
  }
}

/**
 * C_GenerateKeyPair(hSession, pMechanism, pPubTemplate, ulPubCount,
 *                   pPrvTemplate, ulPrvCount, phPubKey, phPrvKey)
 */
const decodeGenerateKeyPair = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const algo = mech ? algoFromMechType(parseInt(mech.typeHex, 16)) : undefined

  const pubTmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0, algo)
  const prvTmpl = readTemplate(M, args[4] ?? 0, args[5] ?? 0, algo)

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  if (pubTmpl.length) inputs.push({ label: 'Public Key Template', attributes: pubTmpl })
  if (prvTmpl.length) inputs.push({ label: 'Private Key Template', attributes: prvTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0) {
    const phPub = args[6] ?? 0
    const phPrv = args[7] ?? 0
    if (phPub) {
      const h = safeRead32(M, phPub)
      if (h !== null) outputs.push({ name: '*phPubKey', value: String(h) })
    }
    if (phPrv) {
      const h = safeRead32(M, phPrv)
      if (h !== null) outputs.push({ name: '*phPrivKey', value: String(h) })
    }
  }

  const algoSpecMap: Record<string, string> = {
    'ml-kem': 'PKCS#11 v3.2 §5.14 · FIPS 203 §4 (ML-KEM key generation)',
    'ml-dsa': 'PKCS#11 v3.2 §5.14 · FIPS 204 §5 (ML-DSA key generation)',
    'slh-dsa': 'PKCS#11 v3.2 §5.14 · FIPS 205 (SLH-DSA key generation)',
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: algo ? algoSpecMap[algo] : 'PKCS#11 v3.2 §5.14',
  }
}

/**
 * C_EncapsulateKey(hSession, pMechanism, hPublicKey, pTemplate, ulAttrCount,
 *                  pCiphertext, pulCiphertextLen, phKey)
 * Note: pCiphertext=0 on the size-query call; pulCiphertextLen is always a valid pointer.
 */
const decodeEncapsulateKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hPublicKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0, 'ml-kem')
  const ctPtr = args[5] ?? 0
  const ctLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hPublicKey', value: String(hPublicKey) },
      {
        name: 'pCiphertext',
        value: ctPtr === 0 ? 'NULL (size query)' : `0x${ctPtr.toString(16)}`,
        note: ctPtr === 0 ? 'Two-step: call with NULL first to get ciphertext length' : undefined,
      },
    ],
  })
  if (secretTmpl.length) inputs.push({ label: 'Secret Key Template', attributes: secretTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  // rv=0 (CKR_OK) on real encapsulation; rv=0x150 (CKR_BUFFER_TOO_SMALL) on size query
  const isOk = rv === 0 || rv === 0x150
  if (isOk && ctLenPtr) {
    const ctLen = safeRead32(M, ctLenPtr)
    if (ctLen !== null) outputs.push({ name: '*pulCiphertextLen', value: `${ctLen} bytes` })
  }
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({ name: '*phKey', value: String(phKey), note: 'Shared secret handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.25 (new in v3.2) · FIPS 203 Algorithm 17 (ML-KEM.Encaps)',
  }
}

/**
 * C_DecapsulateKey(hSession, pMechanism, hPrivateKey, pTemplate, ulAttrCount,
 *                  pCiphertext, ulCiphertextLen, phKey)
 * Note: args[6] is a VALUE (not a pointer) — direct ciphertext length.
 */
const decodeDecapsulateKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hPrivateKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0, 'ml-kem')
  const ctLen = args[6] ?? 0 // direct value, not pointer

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hPrivateKey', value: String(hPrivateKey) },
      { name: 'ulCiphertextLen', value: `${ctLen} bytes` },
    ],
  })
  if (secretTmpl.length) inputs.push({ label: 'Secret Key Template', attributes: secretTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({ name: '*phKey', value: String(phKey), note: 'Shared secret handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.26 (new in v3.2) · FIPS 203 Algorithm 18 (ML-KEM.Decaps)',
  }
}

/**
 * C_GetAttributeValue(hSession, hObject, pTemplate, ulCount)
 * Reads the template attributes (post-call, may contain output sizes).
 */
const decodeGetAttributeValue = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const hObject = args[1] ?? 0
  const tmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0)
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [{ name: 'hObject', value: String(hObject) }],
      },
      ...(tmpl.length ? [{ label: 'Attribute Template', attributes: tmpl }] : []),
    ],
  }
}

/**
 * C_MessageSignInit(hSession, pMechanism, hKey)
 * C_MessageVerifyInit(hSession, pMechanism, hKey)
 * The CK_SIGN_ADDITIONAL_CONTEXT (hedge + context) is embedded in pMechanism.pParameter.
 */
const decodeSignVerifyInit = (
  M: SoftHSMModule,
  args: number[],
  isVerify: boolean
): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: isVerify ? 'hVerifyKey' : 'hSignKey', value: String(hKey) }],
  })
  return {
    inputs,
    spec: isVerify
      ? 'PKCS#11 v3.2 §5.21 · FIPS 204 Algorithm 3 (ML-DSA.Verify)'
      : 'PKCS#11 v3.2 §5.20 · FIPS 204 Algorithm 2 (ML-DSA.Sign)',
  }
}

/**
 * C_SignMessage(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, pulSignatureLen)
 * In this codebase pParameter=0/ulParameterLen=0 (sign context is in mechanism, not here).
 */
const decodeSignMessage = (_M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[4] ?? 0
  const pSignature = args[5] ?? 0
  const sigLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        {
          name: 'pSignature',
          value: pSignature === 0 ? 'NULL (size query)' : `0x${pSignature.toString(16)}`,
          note:
            pSignature === 0
              ? 'Two-step: call with NULL pSignature first to get signature length'
              : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && sigLenPtr) {
    const sigLen = safeRead32(_M, sigLenPtr)
    if (sigLen !== null) outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.20 · FIPS 204 Algorithm 2 (ML-DSA.Sign)',
  }
}

/**
 * C_VerifyMessage(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, ulSignatureLen)
 */
const decodeVerifyMessage = (_M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[4] ?? 0
  const sigLen = args[6] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'ulSignatureLen', value: `${sigLen} bytes` },
      ],
    },
  ]
  return {
    inputs,
    outputs:
      rv === 0
        ? [{ name: 'Verification', value: 'VALID — signature matches message', note: 'CKR_OK' }]
        : rv === 0xc0
          ? [
              {
                name: 'Verification',
                value: 'INVALID — signature does not match',
                note: 'CKR_SIGNATURE_INVALID',
              },
            ]
          : undefined,
    spec: 'PKCS#11 v3.2 §5.21 · FIPS 204 Algorithm 3 (ML-DSA.Verify)',
  }
}

/**
 * C_MessageSignFinal(hSession, pParameter, ulParameterLen, pulSignatureLen)
 * Completes a multi-part message signing sequence.
 */
const decodeSignFinal = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const sigLenPtr = args[3] ?? 0
  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && sigLenPtr) {
    const sigLen = safeRead32(M, sigLenPtr)
    if (sigLen !== null) outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
  }
  return {
    inputs: [{ label: 'Parameters', primitives: [{ name: '(multi-part finalize)', value: '' }] }],
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.20',
  }
}

// ── Session lifecycle decoders (Gap 1 — previously unhandled) ─────────────

/** C_Initialize(pInitArgs) — §5.1 */
const decodeInitialize = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'pInitArgs',
          value: args[0] ? `0x${(args[0] >>> 0).toString(16)}` : 'NULL',
          note: args[0]
            ? 'CK_C_INITIALIZE_ARGS pointer'
            : 'Default initialization (no threading callbacks)',
        },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.1 (C_Initialize)',
})

/** C_Finalize(pReserved) — §5.2 */
const decodeFinalize = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'pReserved',
          value: args[0] ? `0x${(args[0] >>> 0).toString(16)}` : 'NULL',
          note: 'Must be NULL in PKCS#11 v3.2',
        },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.2 (C_Finalize)',
})

/** C_GetSlotList(tokenPresent, pSlotList, pulCount) — §5.3 */
const decodeGetSlotList = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const tokenPresent = args[0] ?? 0
  const pSlotList = args[1] ?? 0
  const pulCount = args[2] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'tokenPresent',
          value: tokenPresent ? 'CK_TRUE' : 'CK_FALSE',
          note: tokenPresent ? 'Only slots with initialized tokens' : 'All slots',
        },
        {
          name: 'pSlotList',
          value: pSlotList === 0 ? 'NULL (count query)' : `0x${pSlotList.toString(16)}`,
          note: pSlotList === 0 ? 'Two-step: call with NULL first to get slot count' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && pulCount) {
    const count = safeRead32(M, pulCount)
    if (count !== null)
      outputs.push({ name: '*pulCount', value: String(count), note: 'Number of slots' })
  }
  if (rv === 0 && pSlotList) {
    const firstSlot = safeRead32(M, pSlotList)
    if (firstSlot !== null) outputs.push({ name: 'pSlotList[0]', value: String(firstSlot) })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.3 (C_GetSlotList)',
  }
}

/** C_CloseSession(hSession) — §5.6 */
const decodeCloseSession = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.6 (C_CloseSession)',
})

/** C_InitPIN(hSession, pPin, ulPinLen) — §5.8 */
const decodeInitPIN = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        { name: 'hSession', value: String(args[0] ?? '?') },
        { name: 'ulPinLen', value: String(args[2] ?? '?') },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.8 (C_InitPIN — sets normal user PIN)',
})

/** C_Logout(hSession) — §5.10 */
const decodeLogout = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.10 (C_Logout)',
})

/** C_MessageVerifyFinal(hSession) — §5.21 */
const decodeVerifyFinal = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.21 (C_MessageVerifyFinal — closes multi-message verify context)',
})

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a structured inspect payload for a PKCS#11 call.
 *
 * Called from `createLoggingProxy` in softhsm.ts BEFORE the TypeScript caller
 * frees WASM heap memory — so heap reads are valid at this point.
 *
 * @param M        Live SoftHSMModule (not the proxy wrapper)
 * @param fn       PKCS#11 function name e.g. "C_GenerateKeyPair"
 * @param args     Raw numeric arguments passed to the WASM function
 * @param rv       Return value (already unsigned)
 * @returns        Structured inspect data, or undefined for unhandled functions
 */
export const buildInspect = (
  M: SoftHSMModule,
  fn: string,
  args: number[],
  rv: number
): Pkcs11LogInspect | undefined => {
  try {
    switch (fn) {
      // Session lifecycle
      case 'C_Initialize':
        return decodeInitialize(M, args)
      case 'C_Finalize':
        return decodeFinalize(M, args)
      case 'C_GetSlotList':
        return decodeGetSlotList(M, args, rv)
      case 'C_OpenSession':
        return decodeOpenSession(M, args, rv)
      case 'C_CloseSession':
        return decodeCloseSession(M, args)
      case 'C_Login':
        return decodeLogin(M, args)
      case 'C_Logout':
        return decodeLogout(M, args)
      case 'C_InitToken':
        return decodeInitToken(M, args)
      case 'C_InitPIN':
        return decodeInitPIN(M, args)
      // Key generation
      case 'C_GenerateKeyPair':
        return decodeGenerateKeyPair(M, args, rv)
      // KEM (FIPS 203)
      case 'C_EncapsulateKey':
        return decodeEncapsulateKey(M, args, rv)
      case 'C_DecapsulateKey':
        return decodeDecapsulateKey(M, args, rv)
      // Attribute query
      case 'C_GetAttributeValue':
        return decodeGetAttributeValue(M, args)
      // Message signing / verification (FIPS 204/205)
      case 'C_MessageSignInit':
        return decodeSignVerifyInit(M, args, false)
      case 'C_MessageVerifyInit':
        return decodeSignVerifyInit(M, args, true)
      case 'C_SignMessage':
        return decodeSignMessage(M, args, rv)
      case 'C_VerifyMessage':
        return decodeVerifyMessage(M, args, rv)
      case 'C_MessageSignFinal':
        return decodeSignFinal(M, args, rv)
      case 'C_MessageVerifyFinal':
        return decodeVerifyFinal(M, args)
      default:
        return undefined
    }
  } catch {
    // Never let inspect errors surface to users
    return undefined
  }
}
