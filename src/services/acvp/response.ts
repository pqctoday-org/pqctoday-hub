// SPDX-License-Identifier: GPL-3.0-only
/**
 * Response serializer (F-4). Emits ONLY the protocol fields the pinned spec
 * permits: vsId + testGroups[tgId, tests[tcId, <one field>]] — no PQC Today
 * metadata (that goes in the separate evidence sidecar, F-6).
 *
 * ── IR + results → response rules (normative for every runner) ─────────────
 * R1  Framing mirrors the prompt: envelope in → `[{"acvVersion": <same>}, {…}]`
 *     out; bare in → the bare `{vsId, testGroups}` object (acvVersion is never
 *     invented).
 * R2  Only `answered` tests appear; `unsupported`/`error` tests are omitted
 *     (listed in evidence.json instead), and a group with no answered test is
 *     omitted. Nothing is fabricated to fill a gap.
 * R3  Group and test order follow the prompt.
 * R4  Each answered test carries tcId plus exactly its operation's field:
 *     ML-KEM decapsulation → k (upper-case hex); ML-DSA sigVer → testPassed.
 * R5  Serialization: JSON.stringify(response, null, 2) + "\n", keys in the
 *     order above. Semantic comparison uses canonicalJson (ir.ts).
 */
import type { AcvpPromptIR, JsonObject, JsonValue } from './ir'
import type { CaseResult } from './dispatch'
import { findPinnedSchema } from './schemas/registry'
import { validateAgainstSchema, type SchemaDiagnostic } from './schemaValidator'

export interface BuiltResponse {
  /** The vector-set response object (validated against the pinned response schema). */
  vectorSetResponse: JsonObject
  /** What goes into response.json (framing mirrored, R1). */
  document: JsonValue
  /** Exact bytes of response.json (R5). */
  text: string
  answeredCount: number
}

export const buildResponse = (ir: AcvpPromptIR, results: CaseResult[]): BuiltResponse => {
  const byKey = new Map<string, CaseResult>()
  for (const r of results) byKey.set(`${r.tgId}/${r.tcId}`, r)

  let answeredCount = 0
  const testGroups: JsonObject[] = []
  for (const g of ir.testGroups) {
    const tests: JsonObject[] = []
    for (const t of g.tests) {
      const r = byKey.get(`${g.tgId}/${t.tcId}`)
      if (!r || r.disposition !== 'answered' || r.responseField === undefined) continue
      if (r.value === undefined) throw new Error(`answered result ${g.tgId}/${t.tcId} has no value`)
      tests.push({ tcId: t.tcId, [r.responseField]: r.value })
      answeredCount++
    }
    if (tests.length > 0) testGroups.push({ tgId: g.tgId, tests })
  }

  const vectorSetResponse: JsonObject = { vsId: ir.vsId, testGroups }
  const diagnostics = validateResponse(ir, vectorSetResponse)
  if (diagnostics.length > 0) {
    // A response that violates the pinned schema is a bug here, never user error.
    throw new Error(
      `internal: generated response violates the pinned schema: ${diagnostics
        .map((d) => `${d.path} ${d.reason}`)
        .join('; ')}`
    )
  }

  const document: JsonValue =
    ir.framing === 'envelope'
      ? [{ acvVersion: ir.acvVersion as string }, vectorSetResponse]
      : vectorSetResponse
  return {
    vectorSetResponse,
    document,
    text: `${JSON.stringify(document, null, 2)}\n`,
    answeredCount,
  }
}

/**
 * Validate a vector-set response against the pinned response schema, plus the
 * per-function field rule the schema alone cannot express (R4): every test in
 * an ML-KEM decapsulation group carries k and nothing else.
 */
export const validateResponse = (
  ir: AcvpPromptIR,
  vectorSetResponse: JsonObject
): SchemaDiagnostic[] => {
  const schema = findPinnedSchema(ir.schemaId)
  const out = validateAgainstSchema(schema.responseSchema, vectorSetResponse)
  if (out.length > 0 || ir.schemaId !== 'ML-KEM/encapDecap/FIPS203') return out
  const fnByTg = new Map(ir.testGroups.map((g) => [g.tgId, g.properties.function as string]))
  const expectedField: Record<string, string> = {
    encapsulation: 'c+k',
    decapsulation: 'k',
    encapsulationKeyCheck: 'testPassed',
    decapsulationKeyCheck: 'testPassed',
  }
  ;(vectorSetResponse.testGroups as JsonObject[]).forEach((g, gi) => {
    const fn = fnByTg.get(g.tgId as number)
    const want = fn ? expectedField[fn] : undefined
    ;(g.tests as JsonObject[]).forEach((t, ti) => {
      const have = Object.keys(t)
        .filter((k) => k !== 'tcId')
        .sort()
        .join('+')
      if (want !== have) {
        out.push({
          path: `$.testGroups[${gi}].tests[${ti}]`,
          keyword: 'function-fields',
          reason: `function "${fn}" requires field(s) ${want}, got ${have || 'none'}`,
        })
      }
    })
  })
  return out
}
