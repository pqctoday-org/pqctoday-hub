// SPDX-License-Identifier: GPL-3.0-only
/**
 * Prompt parser (F-1 + F-2): text → framing → pinned-schema selection →
 * schema validation → uniqueness checks → IR. Implements rules P1–P6
 * documented in ./ir.ts. Pure: no I/O, no engine, no network.
 */
import {
  IR_VERSION,
  type AcvpPromptIR,
  type AcvpTestGroupIR,
  type JsonObject,
  type SupportedSchemaId,
} from './ir'
import { PINNED_SCHEMAS, type PinnedVectorSetSchema } from './schemas/registry'
import { validateAgainstSchema, type SchemaDiagnostic } from './schemaValidator'

export type ParseResult =
  | { ok: true; ir: AcvpPromptIR; schema: PinnedVectorSetSchema }
  | { ok: false; diagnostics: SchemaDiagnostic[] }

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const supportedList = (): string =>
  PINNED_SCHEMAS.map((s) => `${s.algorithm}/${s.mode}/${s.revision}`).join(', ')

const fail = (path: string, keyword: string, reason: string): ParseResult => ({
  ok: false,
  diagnostics: [{ path, keyword, reason }],
})

/** Parse an already-decoded JSON value. */
export const parsePromptValue = (doc: unknown): ParseResult => {
  // ── P1 framing ────────────────────────────────────────────────────────────
  let framing: AcvpPromptIR['framing']
  let acvVersion: string | null
  let vs: unknown
  let vsPath: string
  if (Array.isArray(doc)) {
    if (doc.length !== 2) {
      return fail(
        '$',
        'envelope',
        `an ACVP envelope is exactly [{"acvVersion": …}, {vector set}]; got an array of ${doc.length}`
      )
    }
    const head = doc[0]
    if (!isPlainObject(head) || typeof head.acvVersion !== 'string') {
      return fail(
        '$[0].acvVersion',
        'envelope',
        'envelope element 0 must carry acvVersion (string)'
      )
    }
    const extra = Object.keys(head).filter((k) => k !== 'acvVersion')
    if (extra.length > 0) {
      return fail(`$[0].${extra[0]}`, 'envelope', 'envelope element 0 may only carry acvVersion')
    }
    framing = 'envelope'
    acvVersion = head.acvVersion
    vs = doc[1]
    vsPath = '$[1]'
  } else if (isPlainObject(doc)) {
    framing = 'bare'
    acvVersion = null
    vs = doc
    vsPath = '$'
  } else {
    return fail('$', 'type', 'expected an ACVP vector set object or a [{acvVersion}, {…}] envelope')
  }
  if (!isPlainObject(vs)) return fail(vsPath, 'type', 'the vector set must be a JSON object')

  // ── P2 pinned schema selection ────────────────────────────────────────────
  const { algorithm, mode, revision } = vs
  if (typeof algorithm !== 'string' || typeof mode !== 'string' || typeof revision !== 'string') {
    const missing = (['algorithm', 'mode', 'revision'] as const).find(
      (k) => typeof vs[k] !== 'string'
    ) as string
    return fail(`${vsPath}.${missing}`, 'required', 'must be present as a string')
  }
  const sameAlgMode = PINNED_SCHEMAS.filter((s) => s.algorithm === algorithm && s.mode === mode)
  if (sameAlgMode.length === 0) {
    return fail(
      `${vsPath}.mode`,
      'unsupported-vector-set',
      `no pinned schema for ${algorithm}/${mode}; this prototype supports only ${supportedList()}`
    )
  }
  const schema = sameAlgMode.find((s) => s.revision === revision)
  if (!schema) {
    return fail(
      `${vsPath}.revision`,
      'unsupported-revision',
      `revision "${revision}" is not pinned for ${algorithm}/${mode} (pinned: ${sameAlgMode
        .map((s) => s.revision)
        .join(', ')}); refusing to interpret it under a different revision's rules`
    )
  }

  const diagnostics = validateAgainstSchema(schema.promptSchema, vs, vsPath)
  if (diagnostics.length > 0) return { ok: false, diagnostics }

  // ── uniqueness: the spec tables say tgId and tcId are "unique across the entire vector set"
  const obj = vs as JsonObject
  const groups = obj.testGroups as JsonObject[]
  const seenTg = new Map<number, number>()
  const seenTc = new Map<number, string>()
  const uniq: SchemaDiagnostic[] = []
  groups.forEach((g, gi) => {
    const tgId = g.tgId as number
    if (seenTg.has(tgId)) {
      uniq.push({
        path: `${vsPath}.testGroups[${gi}].tgId`,
        keyword: 'unique',
        reason: `tgId ${tgId} duplicates testGroups[${seenTg.get(tgId)}]`,
      })
    } else seenTg.set(tgId, gi)
    ;(g.tests as JsonObject[]).forEach((t, ti) => {
      const tcId = t.tcId as number
      const here = `${vsPath}.testGroups[${gi}].tests[${ti}].tcId`
      if (seenTc.has(tcId)) {
        uniq.push({
          path: here,
          keyword: 'unique',
          reason: `tcId ${tcId} duplicates ${seenTc.get(tcId)}`,
        })
      } else seenTc.set(tcId, here)
    })
  })
  if (uniq.length > 0) return { ok: false, diagnostics: uniq }

  // ── P3–P6 build the IR, verbatim ─────────────────────────────────────────
  const vectorSet: JsonObject = {}
  for (const [k, v] of Object.entries(obj)) if (k !== 'testGroups') vectorSet[k] = v
  const testGroups: AcvpTestGroupIR[] = groups.map((g) => {
    const properties: JsonObject = {}
    for (const [k, v] of Object.entries(g)) if (k !== 'tests') properties[k] = v
    return {
      tgId: g.tgId as number,
      testType: g.testType as string,
      properties,
      tests: (g.tests as JsonObject[]).map((t) => ({ tcId: t.tcId as number, fields: { ...t } })),
    }
  })

  return {
    ok: true,
    schema,
    ir: {
      irVersion: IR_VERSION,
      schemaId: schema.id as SupportedSchemaId,
      framing,
      acvVersion,
      vsId: obj.vsId as number,
      vectorSet,
      testGroups,
    },
  }
}

/** Parse prompt text (a local file's contents). */
export const parsePromptText = (text: string): ParseResult => {
  let doc: unknown
  try {
    doc = JSON.parse(text)
  } catch (e) {
    return fail('$', 'parse', `not valid JSON: ${(e as Error).message}`)
  }
  return parsePromptValue(doc)
}
