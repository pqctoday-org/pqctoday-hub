// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Golden comparison (F-4): a generated response vs. a NIST ACVP-Server
 * `expectedResults.json` for the same prompt. Only possible for PUBLIC sample
 * vector sets — an ACVTS-issued prompt has no local expected results, which is
 * the whole point of a server verdict. This is a local sanity check of the
 * adapter against published sample answers, never an ACVTS verdict, a
 * validation or a certificate.
 *
 * ── Rules (normative for every caller) ─────────────────────────────────────
 * C1  A case matches only when EVERY answer field the reference carries is
 *     present in the response and equal (hex: valid even-length hex, compared
 *     case-insensitively; booleans stay booleans, so a valid `false` is an
 *     answer). Iteration is over the reference's fields, never the response's.
 * C2  A reference case the response does not contain is `unanswered`. Absence
 *     alone does not say why (unsupported, errored or simply left out).
 * C3  A case that is present but has a missing, wrong, wrongly typed or
 *     non-hex answer, or an answer field the case does not carry, is not
 *     matched: one `mismatched` entry per field, tagged with a `problem` that
 *     tells "missing" from "different". `mismatched` counts FIELD differences,
 *     not cases (see `nonmatchingCaseCount`).
 * C4  Identity is vector set → group (tgId) → case (tcId). A duplicate tgId, or
 *     a duplicate tcId inside one group, rejects the comparison even when the
 *     duplicated values agree; the same tcId in two groups is two cases.
 * C5  A structurally malformed response or reference (missing/invalid ids,
 *     null or non-object nodes, malformed envelope, conflicting vector-set
 *     identity or framing version, an empty reference) is rejected with a
 *     `GoldenComparisonError`; it never produces a comparison.
 * C6  Well-formed response cases with no reference counterpart are listed in
 *     `unexpected`; malformed extras are rejected before anything is counted.
 *
 * The permitted answer fields come from the pinned response schemas
 * (schemas/registry.ts) and, for ML-KEM, the per-function rule in response.ts
 * (R4). An optional prompt IR pins the reference to the prompt it answers.
 */
import type { AcvpPromptIR, JsonObject } from './ir'
import { ML_KEM_FUNCTION_OUTPUTS, validateResponse } from './response'
import { PINNED_SCHEMAS, findPinnedSchema, type PinnedVectorSetSchema } from './schemas/registry'
import { validateAgainstSchema, type SchemaDiagnostic } from './schemaValidator'

/**
 * What is wrong with one answer field of a present case:
 * - `missing`: the response case has no such field;
 * - `different`: a well-formed value that is not the published one;
 * - `invalid`: the wrong type, or not valid even-length hex where hex is required;
 * - `unexpected`: a field this case does not carry for its operation.
 */
export type GoldenMismatchProblem = 'missing' | 'different' | 'invalid' | 'unexpected'

export interface GoldenMismatch {
  tgId: number
  tcId: number
  field: string
  expected: string | boolean | null
  actual: string | boolean | null
  problem: GoldenMismatchProblem
}

export interface GoldenComparison {
  /** Expected test cases whose every expected field is present and equal. */
  matched: number
  /** Field differences (not cases): one entry per missing, wrong, invalid or unpermitted field. */
  mismatched: GoldenMismatch[]
  /** Expected test cases the response does not contain (unsupported, errored or left out). */
  unanswered: number
  /** Well-formed response tests with no counterpart in expectedResults. */
  unexpected: Array<{ tgId: number; tcId: number }>
  expectedTotal: number
}

export interface CompareOptions {
  /**
   * The parsed prompt the reference answers. When given, the reference must be
   * for exactly this prompt (same vector set, groups and cases) and each case
   * must carry the answer fields its operation requires.
   */
  prompt?: AcvpPromptIR
}

/** Thrown when a response or the reference cannot be compared at all (rule C5). */
export class GoldenComparisonError extends Error {
  readonly source: 'response' | 'reference'
  readonly diagnostics: SchemaDiagnostic[]

  constructor(source: 'response' | 'reference', diagnostics: SchemaDiagnostic[]) {
    const shown = diagnostics
      .slice(0, 5)
      .map((d) => `${d.path}: ${d.reason}`)
      .join('; ')
    const more = diagnostics.length > 5 ? ` (and ${diagnostics.length - 5} more)` : ''
    super(
      `${source === 'response' ? 'The response' : 'The expected results'} cannot be compared: ${shown}${more}`
    )
    this.name = 'GoldenComparisonError'
    this.source = source
    this.diagnostics = diagnostics
  }
}

/** Expected cases with at least one field difference. `mismatched.length` counts fields, not cases. */
export const nonmatchingCaseCount = (c: GoldenComparison): number =>
  new Set(c.mismatched.map((m) => `${m.tgId}/${m.tcId}`)).size

/** True only when every expected case was answered and equal, and nothing else was reported. */
export const isFullMatch = (c: GoldenComparison): boolean =>
  c.expectedTotal > 0 &&
  c.matched === c.expectedTotal &&
  c.mismatched.length === 0 &&
  c.unanswered === 0 &&
  c.unexpected.length === 0

// ── structure ───────────────────────────────────────────────────────────────

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const has = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)
const isId = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0

const IDENTITY_KEYS: readonly string[] = ['algorithm', 'mode', 'revision']

interface ParsedCase {
  tcId: number
  /** Every property except tcId, in the file's own order. */
  answers: Map<string, unknown>
  path: string
}
interface ParsedGroup {
  tgId: number
  cases: ParsedCase[]
}
interface ParsedVectorSet {
  acvVersion: string | null
  vsId: number
  /** algorithm / mode / revision, only the ones that were supplied. */
  identity: Map<string, string>
  groups: ParsedGroup[]
}

const diag = (path: string, keyword: string, reason: string): SchemaDiagnostic => ({
  path,
  keyword,
  reason,
})

/** Envelope + ids + duplicate rules (C4/C5). Returns every problem found. */
const readVectorSet = (
  doc: unknown
): { parsed: ParsedVectorSet | null; diagnostics: SchemaDiagnostic[] } => {
  const diagnostics: SchemaDiagnostic[] = []
  let acvVersion: string | null = null
  let vs: unknown
  let base: string
  if (Array.isArray(doc)) {
    if (doc.length !== 2) {
      diagnostics.push(
        diag(
          '$',
          'envelope',
          `an ACVP envelope is exactly [{"acvVersion": …}, {vector set}]; got an array of ${doc.length}`
        )
      )
      return { parsed: null, diagnostics }
    }
    const head: unknown = doc[0]
    if (!isObj(head) || typeof head.acvVersion !== 'string' || head.acvVersion === '') {
      diagnostics.push(
        diag('$[0].acvVersion', 'envelope', 'envelope element 0 must carry acvVersion (string)')
      )
    } else {
      acvVersion = head.acvVersion
      const extra = Object.keys(head).find((k) => k !== 'acvVersion')
      if (extra !== undefined) {
        diagnostics.push(
          diag(`$[0].${extra}`, 'envelope', 'envelope element 0 may only carry acvVersion')
        )
      }
    }
    vs = doc[1]
    base = '$[1]'
  } else {
    vs = doc
    base = '$'
  }
  if (!isObj(vs)) {
    diagnostics.push(diag(base, 'type', 'the vector set must be a JSON object'))
    return { parsed: null, diagnostics }
  }

  if (!has(vs, 'vsId')) diagnostics.push(diag(`${base}.vsId`, 'required', 'vsId is missing'))
  else if (!isId(vs.vsId)) {
    diagnostics.push(diag(`${base}.vsId`, 'type', 'vsId must be a non-negative integer'))
  }

  const identity = new Map<string, string>()
  for (const [k, v] of Object.entries(vs)) {
    if (!IDENTITY_KEYS.includes(k)) continue
    if (typeof v === 'string' && v !== '') identity.set(k, v)
    else
      diagnostics.push(diag(`${base}.${k}`, 'type', `${k} must be a non-empty string when given`))
  }

  const groups: ParsedGroup[] = []
  if (!has(vs, 'testGroups')) {
    diagnostics.push(diag(`${base}.testGroups`, 'required', 'testGroups is missing'))
  } else if (!Array.isArray(vs.testGroups)) {
    diagnostics.push(diag(`${base}.testGroups`, 'type', 'testGroups must be an array'))
  } else {
    const seenTg = new Map<number, number>()
    vs.testGroups.forEach((g: unknown, gi) => {
      const gPath = `${base}.testGroups[${gi}]`
      if (!isObj(g)) {
        diagnostics.push(diag(gPath, 'type', 'a test group must be a JSON object'))
        return
      }
      let tgId = -1
      if (!has(g, 'tgId')) diagnostics.push(diag(`${gPath}.tgId`, 'required', 'tgId is missing'))
      else if (!isId(g.tgId)) {
        diagnostics.push(diag(`${gPath}.tgId`, 'type', 'tgId must be a non-negative integer'))
      } else {
        tgId = g.tgId
        const first = seenTg.get(tgId)
        if (first !== undefined) {
          diagnostics.push(
            diag(`${gPath}.tgId`, 'unique', `tgId ${tgId} duplicates testGroups[${first}]`)
          )
        } else seenTg.set(tgId, gi)
      }
      if (!has(g, 'tests')) {
        diagnostics.push(diag(`${gPath}.tests`, 'required', 'tests is missing'))
        return
      }
      if (!Array.isArray(g.tests)) {
        diagnostics.push(diag(`${gPath}.tests`, 'type', 'tests must be an array'))
        return
      }
      if (g.tests.length === 0) {
        diagnostics.push(
          diag(`${gPath}.tests`, 'minItems', 'a group lists at least one test (pinned schema)')
        )
        return
      }
      const cases: ParsedCase[] = []
      const seenTc = new Map<number, number>()
      g.tests.forEach((t: unknown, ti) => {
        const tPath = `${gPath}.tests[${ti}]`
        if (!isObj(t)) {
          diagnostics.push(diag(tPath, 'type', 'a test must be a JSON object'))
          return
        }
        if (!has(t, 'tcId')) {
          diagnostics.push(diag(`${tPath}.tcId`, 'required', 'tcId is missing'))
          return
        }
        if (!isId(t.tcId)) {
          diagnostics.push(diag(`${tPath}.tcId`, 'type', 'tcId must be a non-negative integer'))
          return
        }
        const first = seenTc.get(t.tcId)
        if (first !== undefined) {
          diagnostics.push(
            diag(
              `${tPath}.tcId`,
              'unique',
              `tcId ${t.tcId} duplicates tests[${first}] in the same group`
            )
          )
          return
        }
        seenTc.set(t.tcId, ti)
        cases.push({
          tcId: t.tcId,
          answers: new Map(Object.entries(t).filter(([k]) => k !== 'tcId')),
          path: tPath,
        })
      })
      groups.push({ tgId, cases })
    })
  }

  if (diagnostics.length > 0) return { parsed: null, diagnostics }
  return {
    parsed: { acvVersion, vsId: vs.vsId as number, identity, groups },
    diagnostics,
  }
}

// ── pinned answer fields ────────────────────────────────────────────────────

type SchemaNode = Record<string, unknown>

/** The pinned response schema's per-test object schema. */
const testItemSchema = (schema: PinnedVectorSetSchema): SchemaNode => {
  const testGroups = (schema.responseSchema.properties as SchemaNode).testGroups as SchemaNode
  const group = testGroups.items as SchemaNode
  const tests = (group.properties as SchemaNode).tests as SchemaNode
  return tests.items as SchemaNode
}

/** The vector-set identity a pinned schema stands for, as name/value pairs. */
const schemaIdentity = (schema: PinnedVectorSetSchema): Array<[string, string]> => [
  ['algorithm', schema.algorithm],
  ['mode', schema.mode],
  ['revision', schema.revision],
]

/** Answer-field name → its pinned value schema (tcId excluded). */
const outputFieldSchemas = (schema: PinnedVectorSetSchema): Array<[string, SchemaNode]> =>
  Object.entries(testItemSchema(schema).properties as Record<string, SchemaNode>).filter(
    ([name]) => name !== 'tcId'
  )

/** The answer-field sets (sorted names) a case may carry under one pinned schema. */
const outputSets = (schema: PinnedVectorSetSchema): string[][] => {
  if (schema.id === 'ML-KEM/encapDecap/FIPS203') {
    return Object.values(ML_KEM_FUNCTION_OUTPUTS).map((f) => [...f].sort())
  }
  const required = (testItemSchema(schema).required as string[]).filter((f) => f !== 'tcId')
  return [required.sort()]
}

interface AnswerRules {
  fieldSchemas: Map<string, SchemaNode>
  sets: string[][]
}

/** With no vector-set identity at all, any supported schema's fields and sets are permitted. */
const answerRules = (schema: PinnedVectorSetSchema | null): AnswerRules => {
  const schemas = schema ? [schema] : PINNED_SCHEMAS
  return {
    fieldSchemas: new Map(schemas.flatMap(outputFieldSchemas)),
    sets: schemas.flatMap(outputSets),
  }
}

const echo = (v: unknown): string | boolean | null =>
  typeof v === 'string' ? v.toUpperCase() : typeof v === 'boolean' ? v : null

const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i])

/** Fields a well-formed case may not carry: not permitted, or permitted but wrongly typed. */
const fieldProblems = (
  answers: Map<string, unknown>,
  rules: AnswerRules,
  path: string
): Array<{ field: string; problem: 'invalid' | 'unexpected'; reason: string }> => {
  const out: Array<{ field: string; problem: 'invalid' | 'unexpected'; reason: string }> = []
  for (const [field, value] of answers) {
    const fieldSchema = rules.fieldSchemas.get(field)
    if (!fieldSchema) {
      out.push({
        field,
        problem: 'unexpected',
        reason: `"${field}" is not an answer field of this vector set`,
      })
      continue
    }
    const bad = validateAgainstSchema(fieldSchema, value, `${path}.${field}`)
    if (bad.length > 0) out.push({ field, problem: 'invalid', reason: bad[0].reason })
  }
  return out
}

// ── reference ───────────────────────────────────────────────────────────────

interface Reference {
  parsed: ParsedVectorSet
  schema: PinnedVectorSetSchema | null
  rules: AnswerRules
  keys: Set<string>
}

const caseKey = (tgId: number, tcId: number): string => `${tgId}/${tcId}`

const readReference = (doc: unknown, prompt: AcvpPromptIR | undefined): Reference => {
  const { parsed, diagnostics } = readVectorSet(doc)
  if (!parsed) throw new GoldenComparisonError('reference', diagnostics)

  // Which pinned schema governs the reference: the prompt's, else the supplied triple, else none.
  let schema: PinnedVectorSetSchema | null = null
  if (parsed.identity.size === 3) {
    schema =
      PINNED_SCHEMAS.find((s) =>
        schemaIdentity(s).every(([k, v]) => parsed.identity.get(k) === v)
      ) ?? null
    if (!schema) {
      const triple = [...parsed.identity.values()].join('/')
      diagnostics.push(diag('$', 'unsupported-vector-set', `no pinned schema for ${triple}`))
    }
  } else if (parsed.identity.size > 0) {
    diagnostics.push(
      diag('$', 'identity', 'algorithm, mode and revision must be given together or not at all')
    )
  }
  if (prompt) {
    const promptSchema = findPinnedSchema(prompt.schemaId)
    if (schema && schema.id !== promptSchema.id) {
      diagnostics.push(
        diag(
          '$',
          'conflict',
          `the expected results are for ${schema.id}, the prompt for ${prompt.schemaId}`
        )
      )
    }
    schema = promptSchema
    if (parsed.vsId !== prompt.vsId) {
      diagnostics.push(
        diag('$.vsId', 'conflict', `vsId ${parsed.vsId} does not match the prompt's ${prompt.vsId}`)
      )
    }
    if (
      parsed.acvVersion !== null &&
      prompt.acvVersion !== null &&
      parsed.acvVersion !== prompt.acvVersion
    ) {
      diagnostics.push(
        diag(
          '$',
          'conflict',
          `acvVersion ${parsed.acvVersion} does not match the prompt's ${prompt.acvVersion}`
        )
      )
    }
  }

  const rules = answerRules(schema)
  const total = parsed.groups.reduce((n, g) => n + g.cases.length, 0)
  if (total === 0) diagnostics.push(diag('$.testGroups', 'minItems', 'it contains no test cases'))

  const keys = new Set<string>()
  for (const g of parsed.groups) {
    for (const c of g.cases) {
      keys.add(caseKey(g.tgId, c.tcId))
      if (c.answers.size === 0) {
        diagnostics.push(diag(c.path, 'required', 'a reference case carries no answer field'))
        continue
      }
      for (const p of fieldProblems(c.answers, rules, c.path)) {
        diagnostics.push(diag(`${c.path}.${p.field}`, p.problem, p.reason))
      }
      const sorted = [...c.answers.keys()].sort()
      if (!rules.sets.some((s) => sameSet(s, sorted))) {
        diagnostics.push(
          diag(c.path, 'function-fields', `${sorted.join('+')} is not a permitted set of answers`)
        )
      }
    }
  }

  if (prompt) {
    // The reference must answer exactly this prompt: same cases, and (ML-KEM) the fields each function needs.
    const projection = {
      vsId: parsed.vsId,
      testGroups: parsed.groups.map((g) => ({
        tgId: g.tgId,
        tests: g.cases.map((c) => ({ tcId: c.tcId, ...Object.fromEntries(c.answers) })),
      })),
    } as unknown as JsonObject
    diagnostics.push(...validateResponse(prompt, projection))
    const promptKeys = new Set(
      prompt.testGroups.flatMap((g) => g.tests.map((t) => caseKey(g.tgId, t.tcId)))
    )
    const lacking = [...promptKeys].filter((k) => !keys.has(k))
    const stray = [...keys].filter((k) => !promptKeys.has(k))
    if (lacking.length > 0) {
      diagnostics.push(
        diag(
          '$.testGroups',
          'coverage',
          `no expected answer for ${lacking.length} prompt case(s), first ${lacking[0]}`
        )
      )
    }
    if (stray.length > 0) {
      diagnostics.push(
        diag(
          '$.testGroups',
          'coverage',
          `${stray.length} expected case(s) are not in the prompt, first ${stray[0]}`
        )
      )
    }
  }

  if (diagnostics.length > 0) throw new GoldenComparisonError('reference', diagnostics)
  return { parsed, schema, rules, keys }
}

// ── comparison ──────────────────────────────────────────────────────────────

const readResponse = (
  doc: unknown,
  ref: Reference,
  prompt: AcvpPromptIR | undefined
): ParsedVectorSet => {
  const { parsed, diagnostics } = readVectorSet(doc)
  if (!parsed) throw new GoldenComparisonError('response', diagnostics)

  if (parsed.vsId !== ref.parsed.vsId) {
    diagnostics.push(
      diag(
        '$.vsId',
        'identity',
        `vsId mismatch: response ${parsed.vsId} vs expected ${ref.parsed.vsId}`
      )
    )
  }
  // Response files legitimately omit algorithm/mode/revision; only a supplied value can conflict.
  if (ref.schema) {
    for (const [k, want] of schemaIdentity(ref.schema)) {
      const given = parsed.identity.get(k)
      if (given !== undefined && given !== want) {
        diagnostics.push(
          diag('$', 'identity', `${k} "${given}" conflicts with the expected "${want}"`)
        )
      }
    }
  }
  const framing = ref.parsed.acvVersion ?? prompt?.acvVersion ?? null
  if (parsed.acvVersion !== null && framing !== null && parsed.acvVersion !== framing) {
    diagnostics.push(
      diag('$', 'envelope', `acvVersion ${parsed.acvVersion} is not the expected ${framing}`)
    )
  }
  // A well-formed extra case is reported; a malformed one is rejected before anything is counted.
  for (const g of parsed.groups) {
    for (const c of g.cases) {
      if (ref.keys.has(caseKey(g.tgId, c.tcId))) continue
      for (const p of fieldProblems(c.answers, ref.rules, c.path)) {
        diagnostics.push(diag(`${c.path}.${p.field}`, p.problem, p.reason))
      }
    }
  }

  if (diagnostics.length > 0) throw new GoldenComparisonError('response', diagnostics)
  return parsed
}

export const compareToExpected = (
  responseDoc: unknown,
  expectedDoc: unknown,
  options: CompareOptions = {}
): GoldenComparison => {
  const ref = readReference(expectedDoc, options.prompt)
  const resp = readResponse(responseDoc, ref, options.prompt)

  const respCases = new Map<string, Map<string, unknown>>()
  for (const g of resp.groups) {
    for (const c of g.cases) respCases.set(caseKey(g.tgId, c.tcId), c.answers)
  }

  const out: GoldenComparison = {
    matched: 0,
    mismatched: [],
    unanswered: 0,
    unexpected: [],
    expectedTotal: 0,
  }
  for (const g of ref.parsed.groups) {
    for (const t of g.cases) {
      out.expectedTotal++
      const r = respCases.get(caseKey(g.tgId, t.tcId))
      if (!r) {
        out.unanswered++
        continue
      }
      const before = out.mismatched.length
      const add = (
        field: string,
        problem: GoldenMismatchProblem,
        expected: string | boolean | null,
        actual: string | boolean | null
      ) => out.mismatched.push({ tgId: g.tgId, tcId: t.tcId, field, expected, actual, problem })
      for (const [field, wanted] of t.answers) {
        const expected = echo(wanted)
        if (!r.has(field)) {
          add(field, 'missing', expected, null)
          continue
        }
        const actual = r.get(field)
        const fieldSchema = ref.rules.fieldSchemas.get(field) as SchemaNode
        if (validateAgainstSchema(fieldSchema, actual).length > 0) {
          add(field, 'invalid', expected, echo(actual))
        } else if (echo(actual) !== expected) add(field, 'different', expected, echo(actual))
      }
      for (const [field, actual] of r) {
        if (!t.answers.has(field)) add(field, 'unexpected', null, echo(actual))
      }
      if (out.mismatched.length === before) out.matched++
    }
  }
  for (const g of resp.groups) {
    for (const c of g.cases) {
      if (!ref.keys.has(caseKey(g.tgId, c.tcId)))
        out.unexpected.push({ tgId: g.tgId, tcId: c.tcId })
    }
  }
  return out
}
