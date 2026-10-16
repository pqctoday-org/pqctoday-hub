// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reproduction records (researcher evidence workspace, Layer 2): two saved
 * run records of the same tool compared side by side — what differed in how
 * they ran (tool version, site build, WASM, vectors, inputs) and in what they
 * produced (per case and negative control) — plus a second implementation's
 * result where the user has one, their conclusion and what would falsify it.
 * Saved as a `reproduction-record` document: `inputs` holds the record
 * (with the comparison), `data` its Markdown.
 *
 * A comparison shows agreement between two runs of the code on this site. It
 * is not an independent validation; the record says so.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import type { RunManifest } from '@/services/runManifest'
import { cell, VECTOR_MATCH_SENTENCE } from '@/services/runEvidence'

export const REPRODUCTION_SCHEMA = 'pqctoday.reproduction-record/1'

/** moduleId prefix of saved records: `reproduction-record:<created ms>`. */
export const REPRODUCTION_PREFIX = 'reproduction-record:'

export interface SetupDifference {
  field: string
  a: string
  b: string
}

export type CaseDifferenceKind = 'only-in-a' | 'only-in-b' | 'result' | 'output' | 'expected'

export interface CaseDifference {
  id: string
  kind: CaseDifferenceKind
  a: string
  b: string
}

export interface RunComparison {
  tool: { id: string; title: string }
  /** Both runs came from the same tool. */
  sameTool: boolean
  summary: { a: RunManifest['summary']; b: RunManifest['summary'] }
  setup: SetupDifference[]
  cases: CaseDifference[]
  negativeControls: CaseDifference[]
  /** Same cases, same pass/fail and same outputs. */
  sameResults: boolean
}

const str = (v: unknown): string =>
  v === undefined || v === null ? '' : typeof v === 'string' ? v : JSON.stringify(v)

/** Compare two run records. Run A is the reference, B the reproduction. */
export function compareRuns(a: RunManifest, b: RunManifest): RunComparison {
  const setup: SetupDifference[] = []
  const diff = (field: string, x: unknown, y: unknown) => {
    const sx = str(x)
    const sy = str(y)
    if (sx !== sy) setup.push({ field, a: sx || 'not recorded', b: sy || 'not recorded' })
  }
  diff('Tool', a.tool.id, b.tool.id)
  diff('Tool version', a.tool.version, b.tool.version)
  diff('Site version', a.site.appVersion, b.site.appVersion)
  diff('Site commit', a.site.commit, b.site.commit)
  diff('WASM hash', a.site.wasmHash, b.site.wasmHash)
  diff('How it ran', a.executionMode, b.executionMode)
  diff('Vector source', a.vectors?.source, b.vectors?.source)
  diff('Vector file SHA-256', a.vectors?.sha256, b.vectors?.sha256)
  diff('Vector count', a.vectors?.count, b.vectors?.count)
  const inputKeys = [...new Set([...Object.keys(a.inputs ?? {}), ...Object.keys(b.inputs ?? {})])]
  for (const k of inputKeys.sort()) {
    // eslint-disable-next-line security/detect-object-injection
    diff(`Input: ${k}`, a.inputs?.[k], b.inputs?.[k])
  }

  const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]))
  const cases: CaseDifference[] = []
  const ca = byId(a.cases)
  const cb = byId(b.cases)
  for (const c of a.cases) {
    const o = cb.get(c.id)
    if (!o) {
      cases.push({ id: c.id, kind: 'only-in-a', a: c.pass ? 'PASS' : 'FAIL', b: '' })
      continue
    }
    if (c.pass !== o.pass) {
      cases.push({
        id: c.id,
        kind: 'result',
        a: c.pass ? 'PASS' : 'FAIL',
        b: o.pass ? 'PASS' : 'FAIL',
      })
    } else if (c.actual !== o.actual) {
      cases.push({ id: c.id, kind: 'output', a: c.actual, b: o.actual })
    } else if (str(c.expected) !== str(o.expected)) {
      cases.push({ id: c.id, kind: 'expected', a: str(c.expected), b: str(o.expected) })
    }
  }
  for (const c of b.cases) {
    if (!ca.has(c.id))
      cases.push({ id: c.id, kind: 'only-in-b', a: '', b: c.pass ? 'PASS' : 'FAIL' })
  }

  const negativeControls: CaseDifference[] = []
  const na = byId(a.negativeControls ?? [])
  const nb = byId(b.negativeControls ?? [])
  for (const n of a.negativeControls ?? []) {
    const o = nb.get(n.id)
    if (!o)
      negativeControls.push({ id: n.id, kind: 'only-in-a', a: n.pass ? 'PASS' : 'FAIL', b: '' })
    else if (n.pass !== o.pass) {
      negativeControls.push({
        id: n.id,
        kind: 'result',
        a: n.pass ? 'PASS' : 'FAIL',
        b: o.pass ? 'PASS' : 'FAIL',
      })
    }
  }
  for (const n of b.negativeControls ?? []) {
    if (!na.has(n.id))
      negativeControls.push({ id: n.id, kind: 'only-in-b', a: '', b: n.pass ? 'PASS' : 'FAIL' })
  }

  return {
    tool: { id: a.tool.id, title: a.tool.title },
    sameTool: a.tool.id === b.tool.id,
    summary: { a: a.summary, b: b.summary },
    setup,
    cases,
    negativeControls,
    sameResults: cases.length === 0 && negativeControls.length === 0,
  }
}

const KIND_TEXT: Record<CaseDifferenceKind, string> = {
  'only-in-a': 'only in run A',
  'only-in-b': 'only in run B',
  result: 'result differs',
  output: 'same result, different output',
  expected: 'different expected value',
}

export interface RunRef {
  /** moduleId of the saved run record. */
  moduleId: string
  title: string
  finishedAt: string
}

export interface ReproductionRecord {
  schema: typeof REPRODUCTION_SCHEMA
  runs: [RunRef, RunRef]
  comparison: RunComparison
  /** A second implementation's result, as the user reports it. */
  secondImplementation: string
  conclusion: string
  /** What result would show the conclusion wrong. */
  falsification: string
}

export const REPRODUCTION_LIMITATION = `Both runs used code served by this site; agreement between them shows the result repeats, not that it is independently confirmed. ${VECTOR_MATCH_SENTENCE}`

const orNotStated = (s: string) => s.trim() || '_Not stated._'

export function reproductionMarkdown(r: ReproductionRecord): string {
  const c = r.comparison
  const [a, b] = r.runs
  const lines = [
    `# Reproduction: ${c.tool.title}`,
    '',
    `- Run A: ${a.title} (${a.finishedAt})`,
    `- Run B: ${b.title} (${b.finishedAt})`,
    `- Results: A ${c.summary.a.passed} passed / ${c.summary.a.failed} failed; B ${c.summary.b.passed} passed / ${c.summary.b.failed} failed`,
    `- Outcome: ${c.sameResults ? 'same cases, same results and same outputs' : `${c.cases.length} case difference(s), ${c.negativeControls.length} negative-control difference(s)`}`,
    '',
    '## How the runs differed',
    '',
  ]
  if (c.setup.length === 0) lines.push('Same tool version, site build, vectors and inputs.')
  else {
    lines.push(
      '| What | Run A | Run B |',
      '|---|---|---|',
      ...c.setup.map((d) => `| ${cell(d.field)} | ${cell(d.a)} | ${cell(d.b)} |`)
    )
  }
  lines.push('', '## Differences in results', '')
  const diffs = [
    ...c.cases,
    ...c.negativeControls.map((n) => ({ ...n, id: `${n.id} (negative control)` })),
  ]
  if (diffs.length === 0) lines.push('None.')
  else {
    lines.push(
      '| Case | Difference | Run A | Run B |',
      '|---|---|---|---|',
      ...diffs.map(
        (d) =>
          `| ${cell(d.id)} | ${KIND_TEXT[d.kind]} | ${cell(d.a) || '—'} | ${cell(d.b) || '—'} |`
      )
    )
  }
  lines.push(
    '',
    '## Second implementation',
    '',
    orNotStated(r.secondImplementation),
    '',
    '## Conclusion',
    '',
    orNotStated(r.conclusion),
    '',
    '## What would falsify it',
    '',
    orNotStated(r.falsification),
    '',
    '**What this comparison does not show**',
    '',
    `- ${REPRODUCTION_LIMITATION}`
  )
  return lines.join('\n')
}

const isString = (v: unknown): v is string => typeof v === 'string'

export function readReproduction(
  doc: Pick<ExecutiveDocument, 'type' | 'inputs'>
): ReproductionRecord | null {
  if (doc.type !== 'reproduction-record') return null
  const r = doc.inputs as Partial<ReproductionRecord> | undefined
  if (
    !r ||
    r.schema !== REPRODUCTION_SCHEMA ||
    !Array.isArray(r.runs) ||
    r.runs.length !== 2 ||
    !r.comparison ||
    !Array.isArray(r.comparison.cases)
  ) {
    return null
  }
  return {
    schema: REPRODUCTION_SCHEMA,
    runs: r.runs,
    comparison: {
      ...r.comparison,
      setup: Array.isArray(r.comparison.setup) ? r.comparison.setup : [],
      negativeControls: Array.isArray(r.comparison.negativeControls)
        ? r.comparison.negativeControls
        : [],
    },
    secondImplementation: isString(r.secondImplementation) ? r.secondImplementation : '',
    conclusion: isString(r.conclusion) ? r.conclusion : '',
    falsification: isString(r.falsification) ? r.falsification : '',
  }
}

export function reproductionSaveRequest(r: ReproductionRecord, moduleId: string, edited = false) {
  return {
    type: 'reproduction-record' as const,
    moduleId,
    title: `${r.comparison.tool.title}: ${r.runs[0].finishedAt.slice(0, 10)} vs ${r.runs[1].finishedAt.slice(0, 10)}${r.comparison.sameResults ? ' (same results)' : ' (differences)'}`,
    data: reproductionMarkdown(r),
    inputs: r,
    ...(edited ? { revisionSummary: 'Reproduction record edited' } : {}),
  }
}

export const newReproductionModuleId = (now: Date = new Date()) =>
  `${REPRODUCTION_PREFIX}${now.getTime()}`
