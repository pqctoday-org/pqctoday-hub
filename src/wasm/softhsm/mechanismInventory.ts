// SPDX-License-Identifier: GPL-3.0-only
/**
 * mechanismInventory.ts — runtime capture of what a PKCS#11 engine ADVERTISES
 * (C_GetMechanismList + C_GetMechanismInfo), normalized and hashed so every
 * validation run can carry a build-specific denominator.
 *
 * Plan: pqctoday-priv/nextfeature/acvp-validation-remediation-plan-09242026.md
 * WS-G G-1 (capture + hash), G-2 (flag → required-operation mapping, the
 * inventory half only — no probes are written here) and §3.4 items 1–2.
 *
 * What this module deliberately is NOT:
 *  - It does not say a mechanism works. Advertisement is rung 1 of the claim
 *    ladder (plan §2.3); `requiredOperations` lists what a test would have to
 *    exercise before the mechanism could be called covered, nothing more.
 *  - It does not name mechanisms into the hash. `inventorySha256` covers only
 *    what the ENGINE reported (type, C_GetMechanismInfo rv, key-size range,
 *    flags) — a rename in the hub's MECH_TABLE must not change the identity
 *    of an unchanged engine build.
 *
 * Works in both the browser (Playground) and Node (the generator script and
 * *.local.test.ts suites): the only runtime dependency is the raw WASM ABI
 * the engine already exposes and WebCrypto's SHA-256.
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { MECH_TABLE, type MechanismFamily } from './mechanismTable'

export const MECHANISM_INVENTORY_SCHEMA = 'pqctoday.mechanism-inventory/v1'

// ── CKF_ mechanism-info flags (PKCS#11 v3.2 pkcs11t.h, CK_MECHANISM_INFO) ────
//
// Values checked against the canonical OASIS v3.2 header vendored in
// pqctoday-hsm (docs/refs/pkcs11t-canonical-v3.2.h, lines 1278–1317).
// CKF_EC_NAMEDCURVE is a deprecated alias of CKF_EC_OID and CKF_MULTI_MESSGE a
// misspelled alias of CKF_MULTI_MESSAGE — only the primary names are listed.

export interface CkfFlagDef {
  name: string
  bit: number
}

export const CKF_MECHANISM_FLAGS: readonly CkfFlagDef[] = [
  { name: 'CKF_HW', bit: 0x00000001 },
  { name: 'CKF_MESSAGE_ENCRYPT', bit: 0x00000002 },
  { name: 'CKF_MESSAGE_DECRYPT', bit: 0x00000004 },
  { name: 'CKF_MESSAGE_SIGN', bit: 0x00000008 },
  { name: 'CKF_MESSAGE_VERIFY', bit: 0x00000010 },
  { name: 'CKF_MULTI_MESSAGE', bit: 0x00000020 },
  { name: 'CKF_FIND_OBJECTS', bit: 0x00000040 },
  { name: 'CKF_ENCRYPT', bit: 0x00000100 },
  { name: 'CKF_DECRYPT', bit: 0x00000200 },
  { name: 'CKF_DIGEST', bit: 0x00000400 },
  { name: 'CKF_SIGN', bit: 0x00000800 },
  { name: 'CKF_SIGN_RECOVER', bit: 0x00001000 },
  { name: 'CKF_VERIFY', bit: 0x00002000 },
  { name: 'CKF_VERIFY_RECOVER', bit: 0x00004000 },
  { name: 'CKF_GENERATE', bit: 0x00008000 },
  { name: 'CKF_GENERATE_KEY_PAIR', bit: 0x00010000 },
  { name: 'CKF_WRAP', bit: 0x00020000 },
  { name: 'CKF_UNWRAP', bit: 0x00040000 },
  { name: 'CKF_DERIVE', bit: 0x00080000 },
  { name: 'CKF_EC_F_P', bit: 0x00100000 },
  { name: 'CKF_EC_F_2M', bit: 0x00200000 },
  { name: 'CKF_EC_ECPARAMETERS', bit: 0x00400000 },
  { name: 'CKF_EC_OID', bit: 0x00800000 },
  { name: 'CKF_EC_UNCOMPRESS', bit: 0x01000000 },
  { name: 'CKF_EC_COMPRESS', bit: 0x02000000 },
  { name: 'CKF_EC_CURVENAME', bit: 0x04000000 },
  { name: 'CKF_ENCAPSULATE', bit: 0x10000000 },
  { name: 'CKF_DECAPSULATE', bit: 0x20000000 },
  { name: 'CKF_EXTENSION', bit: 0x80000000 },
]

const KNOWN_FLAG_MASK = CKF_MECHANISM_FLAGS.reduce((m, f) => (m | f.bit) >>> 0, 0)

/** Decode a CK_MECHANISM_INFO.flags bitmask into CKF_ names (bit order). */
export const decodeMechanismFlags = (flags: number): string[] =>
  CKF_MECHANISM_FLAGS.filter((f) => ((flags >>> 0) & f.bit) !== 0).map((f) => f.name)

/** Bits set in `flags` that PKCS#11 v3.2 does not define for mechanisms. */
export const unknownFlagBits = (flags: number): number => ((flags >>> 0) & ~KNOWN_FLAG_MASK) >>> 0

// ── G-2: flag → required operation probes ────────────────────────────────────

export type RequiredOperation =
  | 'generate-key'
  | 'generate-key-pair'
  | 'encrypt'
  | 'decrypt'
  | 'sign'
  | 'verify'
  | 'sign-recover'
  | 'verify-recover'
  | 'digest'
  | 'derive'
  | 'wrap'
  | 'unwrap'
  | 'encapsulate'
  | 'decapsulate'
  | 'message-encrypt'
  | 'message-decrypt'
  | 'message-sign'
  | 'message-verify'
  | 'message-encrypt-multipart'
  | 'message-decrypt-multipart'
  | 'message-sign-multipart'
  | 'message-verify-multipart'

export interface OperationProbeDef {
  op: RequiredOperation
  /** The CKF_ flag whose presence makes this probe required. */
  flag: string
  /** PKCS#11 functions a probe for this operation must drive. */
  functions: readonly string[]
}

/**
 * One row per operation-bearing CKF_ flag. A mechanism is not "covered" for an
 * operation until a probe drives these functions with that mechanism — passing
 * key generation, or one direction of a pair, says nothing about the others
 * (plan G-2 acceptance criterion).
 *
 * Deliberately NOT inferred from flags (they are mechanism-specific in the
 * PKCS#11 mechanism tables, so they are not listed as flag-required here):
 * whether multi-part (Update/Final) is supported, and which key sizes /
 * parameter sets a probe must span.
 */
export const OPERATION_PROBES: readonly OperationProbeDef[] = [
  { op: 'generate-key', flag: 'CKF_GENERATE', functions: ['C_GenerateKey'] },
  { op: 'generate-key-pair', flag: 'CKF_GENERATE_KEY_PAIR', functions: ['C_GenerateKeyPair'] },
  { op: 'encrypt', flag: 'CKF_ENCRYPT', functions: ['C_EncryptInit', 'C_Encrypt'] },
  { op: 'decrypt', flag: 'CKF_DECRYPT', functions: ['C_DecryptInit', 'C_Decrypt'] },
  { op: 'sign', flag: 'CKF_SIGN', functions: ['C_SignInit', 'C_Sign'] },
  { op: 'verify', flag: 'CKF_VERIFY', functions: ['C_VerifyInit', 'C_Verify'] },
  {
    op: 'sign-recover',
    flag: 'CKF_SIGN_RECOVER',
    functions: ['C_SignRecoverInit', 'C_SignRecover'],
  },
  {
    op: 'verify-recover',
    flag: 'CKF_VERIFY_RECOVER',
    functions: ['C_VerifyRecoverInit', 'C_VerifyRecover'],
  },
  { op: 'digest', flag: 'CKF_DIGEST', functions: ['C_DigestInit', 'C_Digest'] },
  { op: 'derive', flag: 'CKF_DERIVE', functions: ['C_DeriveKey'] },
  { op: 'wrap', flag: 'CKF_WRAP', functions: ['C_WrapKey'] },
  { op: 'unwrap', flag: 'CKF_UNWRAP', functions: ['C_UnwrapKey'] },
  { op: 'encapsulate', flag: 'CKF_ENCAPSULATE', functions: ['C_EncapsulateKey'] },
  { op: 'decapsulate', flag: 'CKF_DECAPSULATE', functions: ['C_DecapsulateKey'] },
  {
    op: 'message-encrypt',
    flag: 'CKF_MESSAGE_ENCRYPT',
    functions: ['C_MessageEncryptInit', 'C_EncryptMessage', 'C_MessageEncryptFinal'],
  },
  {
    op: 'message-decrypt',
    flag: 'CKF_MESSAGE_DECRYPT',
    functions: ['C_MessageDecryptInit', 'C_DecryptMessage', 'C_MessageDecryptFinal'],
  },
  {
    op: 'message-sign',
    flag: 'CKF_MESSAGE_SIGN',
    functions: ['C_MessageSignInit', 'C_SignMessage', 'C_MessageSignFinal'],
  },
  {
    op: 'message-verify',
    flag: 'CKF_MESSAGE_VERIFY',
    functions: ['C_MessageVerifyInit', 'C_VerifyMessage', 'C_MessageVerifyFinal'],
  },
]

/** CKF_MULTI_MESSAGE turns each advertised message op into a Begin/Next probe too. */
export const MULTI_MESSAGE_PROBES: readonly OperationProbeDef[] = [
  {
    op: 'message-encrypt-multipart',
    flag: 'CKF_MESSAGE_ENCRYPT',
    functions: ['C_EncryptMessageBegin', 'C_EncryptMessageNext'],
  },
  {
    op: 'message-decrypt-multipart',
    flag: 'CKF_MESSAGE_DECRYPT',
    functions: ['C_DecryptMessageBegin', 'C_DecryptMessageNext'],
  },
  {
    op: 'message-sign-multipart',
    flag: 'CKF_MESSAGE_SIGN',
    functions: ['C_SignMessageBegin', 'C_SignMessageNext'],
  },
  {
    op: 'message-verify-multipart',
    flag: 'CKF_MESSAGE_VERIFY',
    functions: ['C_VerifyMessageBegin', 'C_VerifyMessageNext'],
  },
]

/** Flags that describe a capability/property rather than an operation to probe. */
export const NON_OPERATION_FLAGS: readonly string[] = [
  'CKF_HW',
  'CKF_FIND_OBJECTS',
  'CKF_EC_F_P',
  'CKF_EC_F_2M',
  'CKF_EC_ECPARAMETERS',
  'CKF_EC_OID',
  'CKF_EC_UNCOMPRESS',
  'CKF_EC_COMPRESS',
  'CKF_EC_CURVENAME',
  'CKF_EXTENSION',
]

/** G-2: the operation probes a mechanism's advertised flags make required. */
export const requiredOperationsForFlags = (flags: number): RequiredOperation[] => {
  const names = new Set(decodeMechanismFlags(flags))
  const ops: RequiredOperation[] = OPERATION_PROBES.filter((p) => names.has(p.flag)).map(
    (p) => p.op
  )
  if (names.has('CKF_MULTI_MESSAGE')) {
    for (const p of MULTI_MESSAGE_PROBES) if (names.has(p.flag)) ops.push(p.op)
  }
  return ops
}

// ── Inventory types ──────────────────────────────────────────────────────────

export type EngineId = 'cpp' | 'rust'

/** One C_GetMechanismList entry as the engine reported it (no hub decoration). */
export interface RawMechanismRecord {
  type: number
  /** CK_RV from C_GetMechanismInfo for this type (0 = CKR_OK). */
  infoRv: number
  ulMinKeySize: number
  ulMaxKeySize: number
  flags: number
}

export type InventoryFinding =
  | 'mechanism-info-failed'
  | 'no-operation-flags'
  | 'unknown-flag-bits'
  | 'multi-message-without-message-op'
  | 'min-key-size-exceeds-max'
  | 'unnamed-in-mech-table'
  | 'duplicate-in-mechanism-list'

export interface MechanismInventoryEntry extends RawMechanismRecord {
  typeHex: string
  /** Canonical CKM_ name from MECH_TABLE, or null when the hub table lacks it. */
  name: string | null
  family: MechanismFamily | null
  flagsHex: string
  flagNames: string[]
  /** G-2: operation probes these flags require (see OPERATION_PROBES). */
  requiredOperations: RequiredOperation[]
  /** Objective inconsistencies visible from the advertisement alone. */
  findings: InventoryFinding[]
}

export interface MechanismInventory {
  schema: typeof MECHANISM_INVENTORY_SCHEMA
  mechanismCount: number
  /** SHA-256 (hex) over canonicalInventoryJson(raw records). */
  inventorySha256: string
  mechanisms: MechanismInventoryEntry[]
}

// ── Normalization + hashing ──────────────────────────────────────────────────

const hex32 = (n: number): string => `0x${(n >>> 0).toString(16).padStart(8, '0')}`

/**
 * Canonical JSON: object keys sorted, no whitespace. Only plain JSON values
 * (objects, arrays, strings, finite numbers, booleans, null) are accepted.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`canonicalJson: non-finite number ${value}`)
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
  }
  throw new Error(`canonicalJson: unsupported value of type ${typeof value}`)
}

/** Sort raw records by type (stable); u32-normalize every numeric field. */
export const sortRawRecords = (raw: readonly RawMechanismRecord[]): RawMechanismRecord[] =>
  raw
    .map((r) => ({
      type: r.type >>> 0,
      infoRv: r.infoRv >>> 0,
      ulMinKeySize: r.ulMinKeySize >>> 0,
      ulMaxKeySize: r.ulMaxKeySize >>> 0,
      flags: r.flags >>> 0,
    }))
    .sort((a, b) => a.type - b.type)

/**
 * The exact byte string `inventorySha256` is computed over. Order of the
 * engine's list does not matter (sorted by type); duplicates are kept, so a
 * duplicated entry changes the hash.
 */
export const canonicalInventoryJson = (raw: readonly RawMechanismRecord[]): string =>
  canonicalJson({ schema: MECHANISM_INVENTORY_SCHEMA, mechanisms: sortRawRecords(raw) })

export const sha256Hex = async (data: string | Uint8Array): Promise<string> => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

const findingsFor = (r: RawMechanismRecord, duplicate: boolean): InventoryFinding[] => {
  const out: InventoryFinding[] = []
  if (r.infoRv !== 0) out.push('mechanism-info-failed')
  const ops = requiredOperationsForFlags(r.flags)
  const names = decodeMechanismFlags(r.flags)
  const hasMessageOp = names.some((n) => n.startsWith('CKF_MESSAGE_'))
  if (r.infoRv === 0 && ops.length === 0) out.push('no-operation-flags')
  if (unknownFlagBits(r.flags) !== 0) out.push('unknown-flag-bits')
  if (names.includes('CKF_MULTI_MESSAGE') && !hasMessageOp) {
    out.push('multi-message-without-message-op')
  }
  if (r.ulMinKeySize > r.ulMaxKeySize) out.push('min-key-size-exceeds-max')
  if (!MECH_TABLE[r.type]) out.push('unnamed-in-mech-table')
  if (duplicate) out.push('duplicate-in-mechanism-list')
  return out
}

/** Normalize raw engine records into a sorted, hashed inventory. */
export const buildMechanismInventory = async (
  raw: readonly RawMechanismRecord[]
): Promise<MechanismInventory> => {
  const sorted = sortRawRecords(raw)
  const seen = new Map<number, number>()
  for (const r of sorted) seen.set(r.type, (seen.get(r.type) ?? 0) + 1)
  const mechanisms = sorted.map((r): MechanismInventoryEntry => {
    const entry = MECH_TABLE[r.type]
    return {
      ...r,
      typeHex: hex32(r.type),
      name: entry?.name ?? null,
      family: entry?.family ?? null,
      flagsHex: hex32(r.flags),
      flagNames: decodeMechanismFlags(r.flags),
      requiredOperations: requiredOperationsForFlags(r.flags),
      findings: findingsFor(r, (seen.get(r.type) ?? 0) > 1),
    }
  })
  return {
    schema: MECHANISM_INVENTORY_SCHEMA,
    mechanismCount: mechanisms.length,
    inventorySha256: await sha256Hex(canonicalInventoryJson(sorted)),
    mechanisms,
  }
}

// ── Runtime capture (raw WASM ABI) ───────────────────────────────────────────

const u32 = (M: SoftHSMModule, ptr: number): number => M.getValue(ptr, 'i32') >>> 0

const rvHex = (rv: number): string => hex32(rv)

/**
 * C_GetMechanismList (two-call pattern) + C_GetMechanismInfo for every entry,
 * on an already-initialized module. Unlike hsm_getMechanismList — which
 * returns [] on any error — this THROWS on a failed list call or an empty
 * list: an inventory that silently came back empty would read as "engine
 * advertises nothing" and zero every downstream denominator.
 *
 * Per-mechanism C_GetMechanismInfo failures are recorded (infoRv) rather than
 * thrown: a listed mechanism with no info is itself a finding.
 */
export const captureRawMechanisms = (M: SoftHSMModule, slotId: number): RawMechanismRecord[] => {
  const countPtr = M._malloc(4)
  try {
    M.setValue(countPtr, 0, 'i32')
    const rv1 = M._C_GetMechanismList(slotId, 0, countPtr) >>> 0
    if (rv1 !== 0) throw new Error(`C_GetMechanismList(count) → ${rvHex(rv1)}`)
    const count = u32(M, countPtr)
    if (count === 0) throw new Error('C_GetMechanismList returned an empty list')
    const listPtr = M._malloc(count * 4) // CK_MECHANISM_TYPE = CK_ULONG = 4 bytes on wasm32
    const infoPtr = M._malloc(12) // CK_MECHANISM_INFO = 3 × CK_ULONG
    try {
      M.setValue(countPtr, count, 'i32')
      const rv2 = M._C_GetMechanismList(slotId, listPtr, countPtr) >>> 0
      if (rv2 !== 0) throw new Error(`C_GetMechanismList(fill) → ${rvHex(rv2)}`)
      const actual = u32(M, countPtr)
      const out: RawMechanismRecord[] = []
      for (let i = 0; i < actual; i++) {
        const type = u32(M, listPtr + i * 4)
        for (let b = 0; b < 12; b += 4) M.setValue(infoPtr + b, 0, 'i32')
        const infoRv = M._C_GetMechanismInfo(slotId, type, infoPtr) >>> 0
        out.push({
          type,
          infoRv,
          ulMinKeySize: infoRv === 0 ? u32(M, infoPtr) : 0,
          ulMaxKeySize: infoRv === 0 ? u32(M, infoPtr + 4) : 0,
          flags: infoRv === 0 ? u32(M, infoPtr + 8) : 0,
        })
      }
      return out
    } finally {
      M._free(infoPtr)
      M._free(listPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/** Capture + normalize + hash in one call (module must be initialized). */
export const captureMechanismInventory = async (
  M: SoftHSMModule,
  slotId: number
): Promise<MechanismInventory> => buildMechanismInventory(captureRawMechanisms(M, slotId))

// ── Engine identity ──────────────────────────────────────────────────────────

export interface EngineArtifactFile {
  /** Repo-relative path of the file that was hashed. */
  path: string
  sha256: string
}

export interface EngineIdentity {
  engine: EngineId
  /** The files that make up the engine as shipped (wasm + JS glue). */
  artifacts: EngineArtifactFile[]
  /** pqctoday-hsm commit recorded in public/wasm/wasm-provenance.json. */
  sourceCommit: string | null
  sourceRepo: string | null
  builtAt: string | null
  /** Where sourceCommit came from — it is a record, not a verified build. */
  sourceCommitProvenance: 'public/wasm/wasm-provenance.json'
}

/** Per-engine record as written to src/data/validation/mechanism-inventory.generated.json. */
export interface GeneratedEngineInventory {
  identity: EngineIdentity
  capture: {
    method: string
    slotId: number
  }
  inventory: MechanismInventory
}

export interface InventoryInfoDifference {
  typeHex: string
  name: string | null
  /** Only the fields that differ, per engine. */
  cpp: Partial<Pick<MechanismInventoryEntry, 'ulMinKeySize' | 'ulMaxKeySize' | 'flagNames'>>
  rust: Partial<Pick<MechanismInventoryEntry, 'ulMinKeySize' | 'ulMaxKeySize' | 'flagNames'>>
}

/**
 * Advertisement-level disagreement between the two engines (plan G-9 treats a
 * disagreement as a finding). Informational: which engine is "right" is a
 * per-mechanism question for the PKCS#11 spec, not for this diff.
 */
export interface CrossEngineAdvertisementDiff {
  onlyCpp: { typeHex: string; name: string | null }[]
  onlyRust: { typeHex: string; name: string | null }[]
  sameTypeDifferentInfo: InventoryInfoDifference[]
}

export const diffInventories = (
  cpp: MechanismInventory,
  rust: MechanismInventory
): CrossEngineAdvertisementDiff => {
  const byType = (inv: MechanismInventory) => new Map(inv.mechanisms.map((m) => [m.type, m]))
  const c = byType(cpp)
  const r = byType(rust)
  const label = (m: MechanismInventoryEntry) => ({ typeHex: m.typeHex, name: m.name })
  const sameTypeDifferentInfo: InventoryInfoDifference[] = []
  for (const [type, cm] of c) {
    const rm = r.get(type)
    if (!rm) continue
    const cd: InventoryInfoDifference['cpp'] = {}
    const rd: InventoryInfoDifference['rust'] = {}
    if (cm.ulMinKeySize !== rm.ulMinKeySize) {
      cd.ulMinKeySize = cm.ulMinKeySize
      rd.ulMinKeySize = rm.ulMinKeySize
    }
    if (cm.ulMaxKeySize !== rm.ulMaxKeySize) {
      cd.ulMaxKeySize = cm.ulMaxKeySize
      rd.ulMaxKeySize = rm.ulMaxKeySize
    }
    if (cm.flags !== rm.flags) {
      cd.flagNames = cm.flagNames
      rd.flagNames = rm.flagNames
    }
    if (Object.keys(cd).length > 0) {
      sameTypeDifferentInfo.push({ ...label(cm), cpp: cd, rust: rd })
    }
  }
  return {
    onlyCpp: cpp.mechanisms.filter((m) => !r.has(m.type)).map(label),
    onlyRust: rust.mechanisms.filter((m) => !c.has(m.type)).map(label),
    sameTypeDifferentInfo,
  }
}

export interface GeneratedMechanismInventoryFile {
  _comment: string
  schema: string
  generator: string
  engines: Record<EngineId, GeneratedEngineInventory>
  crossEngine: CrossEngineAdvertisementDiff
}

/**
 * Compare a runtime-captured inventory against the generated build record.
 * When the hashes match, the generated record's artifact identity describes
 * the engine that just ran (as far as its advertisement can show); when they
 * differ, the running engine is NOT the recorded build and its artifact
 * identity is unknown.
 */
export const compareToGenerated = (
  runtime: Pick<MechanismInventory, 'inventorySha256'>,
  generated: GeneratedEngineInventory | undefined
): 'matches-generated' | 'differs-from-generated' | 'no-generated-record' => {
  if (!generated) return 'no-generated-record'
  return runtime.inventorySha256 === generated.inventory.inventorySha256
    ? 'matches-generated'
    : 'differs-from-generated'
}
