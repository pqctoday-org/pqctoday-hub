// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cross-target comparator (plan WS-H H-4/H-5/H-6). Pure: all file I/O lives in
 * ./node/. For every declared target × fixture × test case it assigns exactly
 * one of five statuses and NEVER collapses them:
 *
 *   pass            target answered and the answer satisfies the operation's
 *                   comparator policy against the reference response
 *   fail            answered differently, or an engine error where the
 *                   reference has an answer (a divergence → minimal case, H-5)
 *   unsupported     the plan (structurally) or the engine (mechanism not
 *                   advertised) declined the case — never counted as pass
 *   not run         the target was not executed, or has no record of the case
 *   not comparable  the result cannot be judged against the reference: the
 *                   target ran different inputs (bundle hash differs), its
 *                   files fail integrity checks, the reference has no answer,
 *                   or the operation's comparator is semantic and no semantic
 *                   verdict was recorded
 *
 * Reference = the WS-F golden response for the fixture (produced identically
 * by both WASM engines and matching NIST expectedResults.json for every
 * answered case). Publishability (H-1) is reported per target alongside the
 * statuses and never changes a status.
 */
import policyV1 from '../../data/validation/acvpComparatorPolicy.v1.json'
import policyV2 from '../../data/validation/acvpComparatorPolicy.v2.json'
import { validateEvidenceDocument } from '../acvp/schemas/evidenceSchemas'
import { sha256Hex, type JsonObject } from '../acvp/ir'
import type { ExecutionPlan } from '../acvp/dispatch'
import {
  diffEnvironments,
  validateExecutionEnvironment,
  type EnvironmentValidation,
} from '../../data/validation/executionEnvironment'
import { BASELINE_TARGET_ID, XPLAT_TARGETS, type DeclaredTarget, type XplatTarget } from './targets'

export const MATRIX_VERSION = 'pqctoday.acvp-xplat-matrix/1'
export const DIVERGENCE_VERSION = 'pqctoday.acvp-xplat-divergence/1'

export const STATUSES = ['pass', 'fail', 'unsupported', 'not run', 'not comparable'] as const
export type CaseStatus = (typeof STATUSES)[number]
/** One-letter codes for the compact per-case strings in matrix.json. */
export const STATUS_CODE: Record<CaseStatus, string> = {
  pass: 'P',
  fail: 'F',
  unsupported: 'U',
  'not run': 'N',
  'not comparable': 'X',
}

export interface OperationPolicy {
  responseField: string
  comparator: 'byte-equal' | 'semantic'
  normalize: 'hex-uppercase' | 'none'
  rationale: string
  semanticCheck?: string
  inScope: boolean
}

export interface ComparatorPolicy {
  policyVersion: string
  operations: Record<string, OperationPolicy>
}

/**
 * Every comparator policy version, pinned (files are never edited). A run
 * selects its version in targets.json `comparatorPolicyVersion`; a run whose
 * targets.json predates that field was produced under version 1.
 */
export const COMPARATOR_POLICIES: Readonly<Record<string, ComparatorPolicy>> = {
  'pqctoday.acvp-comparator-policy/1': policyV1 as unknown as ComparatorPolicy,
  'pqctoday.acvp-comparator-policy/2': policyV2 as unknown as ComparatorPolicy,
}
export const LEGACY_COMPARATOR_POLICY_VERSION = 'pqctoday.acvp-comparator-policy/1'
export const CURRENT_COMPARATOR_POLICY_VERSION = 'pqctoday.acvp-comparator-policy/2'
export const COMPARATOR_POLICY = COMPARATOR_POLICIES[CURRENT_COMPARATOR_POLICY_VERSION]

export const comparatorPolicy = (version: string): ComparatorPolicy => {
  const p = COMPARATOR_POLICIES[version]
  if (!p) throw new Error(`unknown comparatorPolicyVersion "${version}"`)
  return p
}

export const policyFor = (
  operation: string,
  policy: ComparatorPolicy = COMPARATOR_POLICY
): OperationPolicy => {
  const p = policy.operations[operation]
  if (!p) {
    throw new Error(
      `comparator policy ${policy.policyVersion} has no entry for operation "${operation}"`
    )
  }
  return p
}

/**
 * The payload-free skeleton of a plan item, frozen with each run
 * (bundles/<fixture>/plan-index.json), so a committed run stays comparable
 * after the live dispatch rules evolve (e.g. new groups become executable).
 */
export interface PlanIndexItem {
  tgId: number
  tcId: number
  kind: 'execute' | 'unsupported'
  operation?: string
  mechanism?: string
  parameterSet?: string
  hashAlg?: string | null
  responseField?: string
  scope?: 'group' | 'test'
  reason?: string
}

export const planIndexOf = (plan: ExecutionPlan): PlanIndexItem[] =>
  plan.items.map((i) =>
    i.kind === 'execute'
      ? {
          tgId: i.tgId,
          tcId: i.tcId,
          kind: 'execute',
          operation: i.op.operation,
          mechanism: i.op.mechanism,
          parameterSet: i.op.parameterSet,
          ...(i.op.operation === 'ml-dsa.verify' ? { hashAlg: i.op.hashAlg } : {}),
          responseField: i.responseField,
        }
      : { tgId: i.tgId, tcId: i.tcId, kind: 'unsupported', scope: i.scope, reason: i.reason }
  )

/** Everything the comparator needs about one fixture. */
export interface FixtureRef {
  name: string
  schemaId: string
  vsId: number
  bundleManifestSha256: string
  /** Frozen plan skeleton of the run. */
  planIndex: PlanIndexItem[]
  /** Prompt test-case fields by "tgId/tcId" (inputs for divergence export). */
  testFields: Map<string, JsonObject>
  /** Reference response document (the bundle's own response.json). */
  reference: unknown
  /** Public reference sample → inputs may be exported verbatim in a divergence. */
  publicInputs: boolean
}

export interface TargetFixtureFiles {
  responseText: string
  evidence: unknown
  environment: unknown
}

export interface TargetInput {
  target: XplatTarget
  declared: DeclaredTarget
  /** Keyed by fixture name; undefined = no files for that fixture. */
  fixtures: Record<string, TargetFixtureFiles | undefined>
}

export interface CaseResult {
  tgId: number
  tcId: number
  status: CaseStatus
  reason?: string
  expected?: string | boolean | null
  actual?: string | boolean | null
}

export type StatusCounts = Record<CaseStatus, number>

export interface CellResult {
  status: CaseStatus
  counts: StatusCounts
  /** Why the whole cell is not run / not comparable, if it is. */
  reason?: string
  cases: CaseResult[]
  environment?: EnvironmentValidation & { envId: string | null }
}

export interface Divergence {
  divergenceVersion: typeof DIVERGENCE_VERSION
  target: string
  fixture: string
  schemaId: string
  vsId: number
  bundleManifestSha256: string
  tgId: number
  tcId: number
  operation: string
  comparator: string
  input: Record<string, unknown>
  expected: string | boolean | null
  actual: string | boolean | null
  firstDifference: Record<string, unknown>
  targetDisposition: Record<string, unknown>
  environmentDiffVsBaseline: {
    baseline: string
    diff: Array<{ path: string; a: unknown; b: unknown }>
  }
  replay: string[]
}

const emptyCounts = (): StatusCounts => ({
  pass: 0,
  fail: 0,
  unsupported: 0,
  'not run': 0,
  'not comparable': 0,
})

const unwrap = (doc: unknown): JsonObject =>
  (Array.isArray(doc) && doc.length === 2 ? doc[1] : doc) as JsonObject

const responseValues = (doc: unknown): Map<string, JsonObject> => {
  const out = new Map<string, JsonObject>()
  const vs = unwrap(doc)
  for (const g of (vs?.testGroups as JsonObject[] | undefined) ?? []) {
    for (const t of (g.tests as JsonObject[]) ?? []) out.set(`${g.tgId}/${t.tcId}`, t)
  }
  return out
}

const norm = (v: unknown, how: OperationPolicy['normalize']): string | boolean | null => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return how === 'hex-uppercase' ? v.toUpperCase() : v
  return null
}

/** Headline for a cell; the counts beside it always carry all five statuses. */
export const headline = (c: StatusCounts): CaseStatus => {
  const total = STATUSES.reduce((n, s) => n + c[s], 0)
  if (c.fail > 0) return 'fail'
  if (total === 0 || c['not run'] === total) return 'not run'
  if (c['not comparable'] > 0) return 'not comparable'
  if (c['not run'] > 0) return 'not run'
  if (c.pass > 0) return 'pass'
  return 'unsupported'
}

const allCases = (index: PlanIndexItem[], status: CaseStatus, reason: string): CaseResult[] =>
  index.map((i) => ({ tgId: i.tgId, tcId: i.tcId, status, reason }))

const finishCell = (cases: CaseResult[], extra: Partial<CellResult> = {}): CellResult => {
  const counts = emptyCounts()
  for (const c of cases) counts[c.status]++
  return { status: headline(counts), counts, cases, ...extra }
}

/** Compare one target's files for one fixture against the reference. */
export const compareCell = async (
  fx: FixtureRef,
  declared: DeclaredTarget,
  files: TargetFixtureFiles | undefined,
  policy: ComparatorPolicy = COMPARATOR_POLICY
): Promise<CellResult> => {
  if (declared.status === 'not run') {
    return finishCell(allCases(fx.planIndex, 'not run', declared.reason ?? 'declared not run'), {
      reason: declared.reason,
    })
  }
  if (!files) {
    const reason = 'no evidence files for this fixture'
    return finishCell(allCases(fx.planIndex, 'not run', reason), { reason })
  }

  const env = await validateExecutionEnvironment(files.environment)
  const envObj = (files.environment ?? {}) as Record<string, unknown>
  const environment = { ...env, envId: typeof envObj.envId === 'string' ? envObj.envId : null }

  // Integrity: evidence shape, response hash, environment hash, same inputs.
  const problems: string[] = []
  const evDiag = validateEvidenceDocument(files.evidence)
  if (evDiag.length > 0) problems.push(`evidence.json violates its schema (${evDiag[0].path})`)
  const ev = (files.evidence ?? {}) as JsonObject
  const respSha = await sha256Hex(files.responseText)
  if ((ev.response as JsonObject | undefined)?.sha256 !== respSha) {
    problems.push('response.json SHA-256 differs from evidence.json response.sha256')
  }
  if (env.schemaDiagnostics.length > 0)
    problems.push('execution-environment.json violates its schema')
  if (!env.envIdValid) problems.push('execution-environment.json envId does not recompute')
  if (problems.length > 0) {
    const reason = `integrity: ${problems.join('; ')}`
    return finishCell(allCases(fx.planIndex, 'not comparable', reason), { reason, environment })
  }
  const bundleSha = (envObj.fixtureBundle as Record<string, unknown>).manifestSha256
  if (bundleSha !== fx.bundleManifestSha256) {
    const reason = `different inputs: fixture bundle ${String(bundleSha)} ≠ reference ${fx.bundleManifestSha256}`
    return finishCell(allCases(fx.planIndex, 'not comparable', reason), { reason, environment })
  }

  let response: unknown
  try {
    response = JSON.parse(files.responseText)
  } catch {
    const reason = 'integrity: response.json is not JSON'
    return finishCell(allCases(fx.planIndex, 'not comparable', reason), { reason, environment })
  }
  const got = responseValues(response)
  const ref = responseValues(fx.reference)
  const evCases = new Map<string, JsonObject>()
  for (const c of (ev.cases as JsonObject[]) ?? []) evCases.set(`${c.tgId}/${c.tcId}`, c)

  const cases = fx.planIndex.map((item: PlanIndexItem): CaseResult => {
    const key = `${item.tgId}/${item.tcId}`
    const base = { tgId: item.tgId, tcId: item.tcId }
    const tc = evCases.get(key)
    if (!tc) return { ...base, status: 'not run', reason: 'case absent from evidence.json' }
    const disp = tc.disposition as string
    if (item.kind === 'unsupported') {
      if (disp === 'unsupported') return { ...base, status: 'unsupported', reason: item.reason }
      return {
        ...base,
        status: 'not comparable',
        reason: `plan marks the case unsupported but the target reports "${disp}"`,
      }
    }
    const opPolicy = policyFor(item.operation ?? '', policy)
    const field = item.responseField ?? ''
    if (disp === 'unsupported') {
      return { ...base, status: 'unsupported', reason: (tc.reason as string) ?? 'engine' }
    }
    const refVal = norm(ref.get(key)?.[field], opPolicy.normalize)
    if (disp === 'error') {
      return {
        ...base,
        status: refVal === null ? 'not comparable' : 'fail',
        reason: `engine error: ${(tc.reason as string) ?? 'unspecified'}`,
        expected: refVal,
        actual: null,
      }
    }
    const actual = norm(got.get(key)?.[field], opPolicy.normalize)
    if (actual === null) {
      return {
        ...base,
        status: 'fail',
        reason: 'evidence.json says answered but response.json has no value',
        expected: refVal,
        actual,
      }
    }
    if (refVal === null) {
      return { ...base, status: 'not comparable', reason: 'reference has no answer', actual }
    }
    if (opPolicy.comparator === 'semantic') {
      return {
        ...base,
        status: 'not comparable',
        reason: `semantic comparator (${opPolicy.semanticCheck ?? 'unspecified'}) — no semantic verdict recorded`,
        expected: refVal,
        actual,
      }
    }
    return actual === refVal
      ? { ...base, status: 'pass' }
      : {
          ...base,
          status: 'fail',
          reason: 'byte-equal comparator: values differ',
          expected: refVal,
          actual,
        }
  })
  return finishCell(cases, { environment })
}

/** First differing position between two normalised values. */
export const firstDifference = (
  field: string,
  expected: string | boolean | null,
  actual: string | boolean | null
): Record<string, unknown> => {
  if (typeof expected === 'string' && typeof actual === 'string') {
    let i = 0
    while (i < expected.length && i < actual.length && expected[i] === actual[i]) i++
    const byte = Math.floor(i / 2)
    return {
      field,
      kind: 'hex',
      byteOffset: byte,
      expectedByte: expected.slice(byte * 2, byte * 2 + 2) || null,
      actualByte: actual.slice(byte * 2, byte * 2 + 2) || null,
      expectedLengthBytes: expected.length / 2,
      actualLengthBytes: actual.length / 2,
    }
  }
  return { field, kind: typeof expected === 'boolean' ? 'boolean' : 'value', expected, actual }
}

const HEX_INPUTS: Record<string, readonly string[]> = {
  'ml-kem.decapsulate': ['dk', 'c'],
  'ml-dsa.verify': ['pk', 'message', 'signature', 'context'],
}

const inputOf = async (
  item: PlanIndexItem,
  fields: JsonObject | undefined,
  publicInputs: boolean
): Promise<Record<string, unknown>> => {
  const names = HEX_INPUTS[item.operation ?? ''] ?? []
  const hashes: Record<string, { lengthBytes: number; sha256: string } | null> = {}
  const values: Record<string, string> = {}
  for (const f of names) {
    const v = fields?.[f]
    if (typeof v !== 'string') {
      hashes[f] = null
      continue
    }
    hashes[f] = { lengthBytes: v.length / 2, sha256: await sha256Hex(v.toUpperCase()) }
    values[f] = v
  }
  return {
    operation: item.operation,
    mechanism: item.mechanism,
    parameterSet: item.parameterSet,
    ...(item.hashAlg !== undefined ? { hashAlg: item.hashAlg } : {}),
    inputSha256OfUpperHex: hashes,
    // Inputs are exported verbatim only for public reference samples; an issued
    // (possibly controlled) prompt exports identities + hashes only.
    ...(publicInputs ? { values } : {}),
  }
}

export interface TargetSummary {
  id: string
  label: string
  class: string
  engine: string
  declaredStatus: 'run' | 'not run'
  reason: string | null
  publishable: boolean | null
  unmetIdentity: string[]
  envIds: string[]
  arch: string | null
  emulated: boolean | null
  openssl: string | null
  artifactSha256: string | null
  sourceCommit: string | null
}

export interface XplatMatrix {
  matrixVersion: typeof MATRIX_VERSION
  runId: string
  statuses: readonly CaseStatus[]
  statusCodes: Record<CaseStatus, string>
  comparatorPolicyVersion: string
  reference: string
  baselineTarget: string
  targets: TargetSummary[]
  fixtures: Array<{
    name: string
    schemaId: string
    vsId: number
    bundleManifestSha256: string
    caseIds: string[]
    cells: Record<
      string,
      { status: CaseStatus; counts: StatusCounts; reason?: string; cases: string }
    >
  }>
  totals: Record<string, StatusCounts>
  divergences: Array<{ file: string; target: string; fixture: string; tgId: number; tcId: number }>
}

export interface CompareOutput {
  matrix: XplatMatrix
  divergences: Array<{ file: string; doc: Divergence }>
}

/** Validate the declared target list against the Q3 catalog. */
export const checkDeclaredTargets = (declared: DeclaredTarget[]): string[] => {
  const errors: string[] = []
  const ids = new Set(declared.map((d) => d.id))
  for (const t of XPLAT_TARGETS) if (!ids.has(t.id)) errors.push(`target "${t.id}" is not declared`)
  for (const d of declared) {
    if (!XPLAT_TARGETS.some((t) => t.id === d.id)) errors.push(`unknown target "${d.id}"`)
    if (d.status === 'not run' && !d.reason)
      errors.push(`target "${d.id}" is "not run" without a reason`)
  }
  return errors
}

export const compareTargets = async (
  runId: string,
  fixtures: FixtureRef[],
  inputs: TargetInput[],
  replayHint: (target: string, fixture: string) => string[],
  policy: ComparatorPolicy = COMPARATOR_POLICY
): Promise<CompareOutput> => {
  const errors = checkDeclaredTargets(inputs.map((i) => i.declared))
  if (errors.length > 0) throw new Error(`targets.json: ${errors.join('; ')}`)

  const baseline = inputs.find((i) => i.target.id === BASELINE_TARGET_ID)
  const divergences: CompareOutput['divergences'] = []
  const totals: Record<string, StatusCounts> = {}
  const summaries: TargetSummary[] = []
  const fxOut: XplatMatrix['fixtures'] = fixtures.map((f) => ({
    name: f.name,
    schemaId: f.schemaId,
    vsId: f.vsId,
    bundleManifestSha256: f.bundleManifestSha256,
    caseIds: f.planIndex.map((i) => `${i.tgId}/${i.tcId}`),
    cells: {},
  }))

  for (const input of inputs) {
    const t = input.target
    totals[t.id] = emptyCounts()
    const envs: EnvironmentValidation[] = []
    const envIds: string[] = []
    let firstEnv: Record<string, unknown> | null = null
    for (const [fi, fx] of fixtures.entries()) {
      const files = input.fixtures[fx.name]
      const cell = await compareCell(fx, input.declared, files, policy)
      for (const s of STATUSES) totals[t.id][s] += cell.counts[s]
      if (cell.environment) {
        envs.push(cell.environment)
        if (cell.environment.envId) envIds.push(cell.environment.envId)
        firstEnv ??= files?.environment as Record<string, unknown>
      }
      fxOut[fi].cells[t.id] = {
        status: cell.status,
        counts: cell.counts,
        ...(cell.reason ? { reason: cell.reason } : {}),
        cases: cell.cases.map((c) => STATUS_CODE[c.status]).join(''),
      }
      for (const c of cell.cases) {
        if (c.status !== 'fail') continue
        const item = fx.planIndex.find((i) => i.tgId === c.tgId && i.tcId === c.tcId)
        if (!item || item.kind !== 'execute' || !item.operation) continue
        const evCase = ((files?.evidence as JsonObject)?.cases as JsonObject[] | undefined)?.find(
          (x) => x.tgId === c.tgId && x.tcId === c.tcId
        )
        const baseEnv = baseline?.fixtures[fx.name]?.environment as
          Record<string, unknown> | undefined
        const doc: Divergence = {
          divergenceVersion: DIVERGENCE_VERSION,
          target: t.id,
          fixture: fx.name,
          schemaId: fx.schemaId,
          vsId: fx.vsId,
          bundleManifestSha256: fx.bundleManifestSha256,
          tgId: c.tgId,
          tcId: c.tcId,
          operation: item.operation,
          comparator: policyFor(item.operation, policy).comparator,
          input: await inputOf(item, fx.testFields.get(`${c.tgId}/${c.tcId}`), fx.publicInputs),
          expected: c.expected ?? null,
          actual: c.actual ?? null,
          firstDifference: firstDifference(
            item.responseField ?? '',
            c.expected ?? null,
            c.actual ?? null
          ),
          targetDisposition: { ...(evCase ?? {}), comparatorReason: c.reason ?? null },
          environmentDiffVsBaseline: {
            baseline: BASELINE_TARGET_ID,
            diff:
              baseEnv && files?.environment
                ? diffEnvironments(baseEnv, files.environment as Record<string, unknown>)
                : [],
          },
          replay: replayHint(t.id, fx.name),
        }
        const file = `divergences/${t.id}/${fx.name}/tg${c.tgId}-tc${c.tcId}.json`
        divergences.push({ file, doc })
      }
    }
    const env = firstEnv as {
      arch?: { machine?: string }
      emulation?: { emulated?: boolean }
      dependencies?: { openssl?: { linked?: boolean; version?: string } }
      engine?: { artifactSha256?: string; sourceCommit?: string }
    } | null
    const unmet = [...new Set(envs.flatMap((e) => e.unmetIdentity))]
    summaries.push({
      id: t.id,
      label: t.label,
      class: t.class,
      engine: t.engine,
      declaredStatus: input.declared.status,
      reason: input.declared.reason ?? null,
      publishable: envs.length === 0 ? null : envs.every((e) => e.publishable),
      unmetIdentity: unmet,
      envIds,
      arch: env?.arch?.machine ?? null,
      emulated: env?.emulation?.emulated ?? null,
      openssl: env
        ? env.dependencies?.openssl?.linked === false
          ? 'not linked'
          : (env.dependencies?.openssl?.version ?? null)
        : null,
      artifactSha256: env?.engine?.artifactSha256 ?? null,
      sourceCommit: env?.engine?.sourceCommit ?? null,
    })
  }

  return {
    matrix: {
      matrixVersion: MATRIX_VERSION,
      runId,
      statuses: STATUSES,
      statusCodes: STATUS_CODE,
      comparatorPolicyVersion: policy.policyVersion,
      reference:
        'WS-F golden responses (src/services/acvp/__fixtures__/goldens/*.response.json): identical from both WASM engines and equal to NIST ACVP-Server expectedResults.json for every answered case',
      baselineTarget: BASELINE_TARGET_ID,
      targets: summaries,
      fixtures: fxOut,
      totals,
      divergences: divergences.map((d) => ({
        file: d.file,
        target: d.doc.target,
        fixture: d.doc.fixture,
        tgId: d.doc.tgId,
        tcId: d.doc.tcId,
      })),
    },
    divergences,
  }
}

/** Human-readable matrix (matrix.md). All five statuses always shown. */
export const renderMatrixMarkdown = (m: XplatMatrix): string => {
  const lines: string[] = []
  const cnt = (c: StatusCounts) => STATUSES.map((s) => `${s} ${c[s]}`).join(' · ')
  lines.push(`# ACVP cross-target matrix — ${m.runId}`, '')
  lines.push(
    'Statuses are never collapsed: pass / fail / unsupported / not run / not comparable are counted separately. A pass is evidence only for the identified test, operation, parameters, implementation build and target — not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.',
    ''
  )
  lines.push(`Reference: ${m.reference}.`, '')
  lines.push('## Targets', '')
  lines.push(
    '| Target | Run | Publishable | Arch | Emulated | OpenSSL | Engine commit | Artifact SHA-256 |'
  )
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const t of m.targets) {
    const pub =
      t.publishable === null ? '—' : t.publishable ? 'yes' : `no (${t.unmetIdentity.join(', ')})`
    lines.push(
      `| ${t.id} | ${t.declaredStatus}${t.reason ? ` — ${t.reason}` : ''} | ${pub} | ${t.arch ?? '—'} | ${
        t.emulated === null ? '—' : t.emulated ? 'yes' : 'no'
      } | ${t.openssl ?? '—'} | ${t.sourceCommit ? t.sourceCommit.slice(0, 12) : '—'} | ${
        t.artifactSha256 ? `${t.artifactSha256.slice(0, 16)}…` : '—'
      } |`
    )
  }
  for (const f of m.fixtures) {
    lines.push('', `## ${f.name} (vsId ${f.vsId}, ${f.caseIds.length} test cases)`, '')
    lines.push(`Bundle manifest SHA-256: \`${f.bundleManifestSha256}\``, '')
    lines.push('| Target | Headline | Counts |', '|---|---|---|')
    for (const [id, c] of Object.entries(f.cells)) {
      lines.push(`| ${id} | ${c.status} | ${cnt(c.counts)} |`)
    }
  }
  lines.push('', '## Totals per target', '', '| Target | Counts |', '|---|---|')
  for (const [id, c] of Object.entries(m.totals)) lines.push(`| ${id} | ${cnt(c)} |`)
  lines.push('', '## Divergences', '')
  if (m.divergences.length === 0) lines.push('None.')
  for (const d of m.divergences) {
    lines.push(`- ${d.target} ${d.fixture} tg${d.tgId}/tc${d.tcId}: \`${d.file}\``)
  }
  lines.push('')
  return lines.join('\n')
}
