// SPDX-License-Identifier: GPL-3.0-only
/**
 * ACVP-shaped intermediate representation (IR) for the WS-F bounded
 * ACVP-format import/response-export prototype.
 *
 * The IR is PLAIN JSON — no class instances, no bigint, no Uint8Array; byte
 * strings stay the prompt's own hex text — so the exact same object can be
 * written to disk (CLI `--emit-bundle`) and re-derived by a non-JS runner
 * (the planned Python/ctypes board runner) and compared byte-for-byte via
 * `canonicalJson`.
 *
 * It is deliberately minimal and ACVP-shaped. It is NOT the curated-vector
 * ValidationCaseManifest (WS-B); nothing here imports or assumes that model.
 *
 * ── Prompt → IR rules (normative for every runner) ─────────────────────────
 * P1  Framing: a JSON array of exactly two objects `[{acvVersion}, {vector set}]`
 *     is the ACVTS envelope (framing "envelope", acvVersion kept verbatim); a
 *     bare vector-set object is framing "bare" (acvVersion null — never invented).
 *     Anything else is rejected.
 * P2  The vector set is selected by (algorithm, mode, revision) against the
 *     pinned registry (schemas/registry.ts) and validated against that pinned
 *     prompt schema. Unknown algorithm/mode/revision, a schema violation, or a
 *     duplicate tgId/tcId rejects the WHOLE prompt with path + reason diagnostics.
 * P3  `vectorSet` holds every top-level property except `testGroups`, verbatim.
 * P4  Each group's `properties` holds every group property except `tests`,
 *     verbatim (tgId and testType included); `tgId`/`testType` are copies.
 * P5  Each test is kept verbatim in `fields` (tcId included); `tcId` is a copy.
 * P6  Order of groups and tests is the prompt's order.
 * `irToVectorSet(ir)` inverts P3–P6; the fixture round-trip test proves nothing
 * is dropped.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }
export type JsonObject = { [k: string]: JsonValue }

export const IR_VERSION = 'pqctoday.acvp-ir/1'

export type SupportedSchemaId = 'ML-KEM/encapDecap/FIPS203' | 'ML-DSA/sigVer/FIPS204'

export interface AcvpTestCaseIR {
  tcId: number
  /** The test case object exactly as it appeared in the prompt (tcId included). */
  fields: JsonObject
}

export interface AcvpTestGroupIR {
  tgId: number
  testType: string
  /** Every group property except `tests`, verbatim (tgId + testType included). */
  properties: JsonObject
  tests: AcvpTestCaseIR[]
}

export interface AcvpPromptIR {
  irVersion: typeof IR_VERSION
  schemaId: SupportedSchemaId
  framing: 'envelope' | 'bare'
  /** Envelope acvVersion, verbatim; null for a bare vector set (P1). */
  acvVersion: string | null
  vsId: number
  /** Every top-level vector-set property except `testGroups`, verbatim. */
  vectorSet: JsonObject
  testGroups: AcvpTestGroupIR[]
}

/** Rebuild the vector-set object (without envelope) from the IR — inverse of P3–P6. */
export const irToVectorSet = (ir: AcvpPromptIR): JsonObject => ({
  ...ir.vectorSet,
  testGroups: ir.testGroups.map((g) => ({
    ...g.properties,
    tests: g.tests.map((t) => ({ ...t.fields })),
  })),
})

/** Rebuild the prompt including its original framing. */
export const irToPrompt = (ir: AcvpPromptIR): JsonValue =>
  ir.framing === 'envelope'
    ? [{ acvVersion: ir.acvVersion as string }, irToVectorSet(ir)]
    : irToVectorSet(ir)

/**
 * Canonical JSON: object keys sorted by UTF-16 code unit, no whitespace,
 * JSON.stringify escaping plus every non-ASCII UTF-16 code unit written as a
 * lower-case \uXXXX escape. For integer-only documents (ACVP uses no floats)
 * this is byte-identical to Python's default
 * `json.dumps(o, sort_keys=True, separators=(',', ':'))` (ensure_ascii=True),
 * which is what makes the goldens portable to a non-JS runner.
 */
const asciiEscape = (json: string): string =>
  json.replace(/[\u0080-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)

export const canonicalJson = (v: unknown): string => {
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('canonicalJson: non-finite')
    const s = JSON.stringify(v)
    if (s === undefined) throw new Error('canonicalJson: unsupported value')
    return typeof v === 'string' ? asciiEscape(s) : s
  }
  if (Array.isArray(v)) return `[${v.map((x) => canonicalJson(x)).join(',')}]`
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${asciiEscape(JSON.stringify(k))}:${canonicalJson(obj[k])}`).join(',')}}`
}

/** SHA-256 (lower-case hex) over UTF-8 text or raw bytes, via Web Crypto (browser + Node 22). */
export const sha256Hex = async (data: string | Uint8Array): Promise<string> => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const buf = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) throw new Error('hexToBytes: odd length')
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) throw new Error('hexToBytes: invalid hex')
    out[i] = byte
  }
  return out
}

/** ACVP hex is upper-case (every NIST ACVP-Server sample and example uses it). */
export const bytesToUpperHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
