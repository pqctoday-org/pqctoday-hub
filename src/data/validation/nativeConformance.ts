// SPDX-License-Identifier: GPL-3.0-only
//
// WS-G G-6 — the engines' own PKCS#11 v3.2 conformance suites, imported from
// the reports pqctoday-hsm commits, so the Hub never hand-writes their counts.
//
// This module holds the TYPES of src/data/validation/
// native-conformance.generated.json and the PURE parsers that turn the
// committed report files into it. All git access (which commit, which blob,
// how stale) lives in the native-conformance importer; everything here
// is text in, data out, so it can be pinned with fixture snippets copied from
// the real reports.
//
// A parser that cannot reconcile a report with itself (row tallies vs the
// report's own summary, JSON vs Markdown) THROWS: an internally inconsistent
// report must not be published as evidence.
//
// Plan: pqctoday-priv/nextfeature/acvp-validation-remediation-plan-09242026.md
// §5 WS-G G-6.

export const NATIVE_CONFORMANCE_SCHEMA = 'pqctoday.native-conformance/v1'

export type NativeCaseStatus = 'pass' | 'fail' | 'skip' | 'xfail'

/** One case: [case id, status]. Tuples keep ~2,000 rows readable in the file. */
export type NativeCaseRow = [id: string, status: NativeCaseStatus]

export interface NativeSuiteCounts {
  pass: number
  fail: number
  /** null when the suite's harness has no skip status at all (not "0 skipped"). */
  skip: number | null
  /** null when the suite's harness has no xfail status. */
  xfail: number | null
  total: number
}

/**
 * How the case ids were obtained:
 *  - 'suite-assigned': the report names every case (C++: category + test).
 *  - 'derived-from-transcript': the harness assigns no ids; each id is
 *    section heading + check label, with an ordinal when a label repeats in
 *    its section. Stable only as long as the harness keeps its labels.
 *  - 'none': counts only.
 */
export type NativeCaseIdentity = 'suite-assigned' | 'derived-from-transcript' | 'none'

export interface NativeSuiteStaleness {
  /**
   * `git rev-list --count <engineCommit>..<pinned hsm commit>`, not counting
   * commits that changed only the report files (the commit storing a fresh
   * report always follows its engine commit).
   */
  commitsFromEngineToPinnedMain: number
  /** Whether the engine commit is in the pinned main's history (false = a branch build). */
  engineCommitOnPinnedMainHistory: boolean
}

export interface NativeSuiteWasmComparison {
  /** Bundle name in public/wasm/wasm-provenance.json. */
  bundle: string
  /** Full commit the Hub's shipped WASM bundle of this engine was built from. */
  bundleHsmCommit: string
  engineCommitEqualsBundleCommit: boolean
  /** `git rev-list --count <engineCommit>..<bundle commit>`: bundle commits the engine commit lacks. */
  commitsFromEngineToBundle: number
  /** `git rev-list --count <bundle commit>..<engineCommit>`: engine commits the bundle lacks (the bundle is older). */
  commitsFromBundleToEngine: number
}

export interface NativeSuiteRecord {
  id: string
  name: string
  engine: 'cpp' | 'rust' | 'cross-engine'
  /** The suite's source in pqctoday-hsm. */
  sourceFile: string
  /** The report file(s) read, in pqctoday-hsm. Empty when nothing is committed. */
  reportFiles: string[]
  /** null → no committed report exists; only `openGaps` is meaningful. */
  report: NativeSuiteReport | null
  openGaps: string[]
}

export interface NativeSuiteReport {
  /** Last hsm commit (at or before the pin) that changed the report file. */
  reportCommit: string
  reportCommitDate: string
  /** The run timestamp the report itself states. */
  reportDate: string
  /** Full engine commit the report says it was produced at. */
  engineCommit: string
  /** The engine commit exactly as the report writes it (may be abbreviated). */
  engineCommitAsStated: string
  engineCommitDate: string
  /** What the report says it ran against — verbatim, never inferred. */
  engineAsStated: string
  /** Build target as the report states it, or "not recorded". */
  target: string
  /** Host OS / architecture — "not recorded" unless the report states it. */
  hostPlatform: string
  counts: NativeSuiteCounts
  /** Sections/categories the report groups its cases into. */
  groups: number
  caseIdentity: NativeCaseIdentity
  caseIdScheme: string
  staleness: NativeSuiteStaleness
  wasm: NativeSuiteWasmComparison | null
  cases: NativeCaseRow[]
}

export interface NativeConformanceFile {
  _comment: string
  schema: typeof NATIVE_CONFORMANCE_SCHEMA
  generator: string
  hsm: {
    repo: string
    /** The pqctoday-hsm commit every report and count was read at. */
    pinnedCommit: string
    pinnedCommitDate: string
    /** false → the pinned commit is on no pqctoday-hsm remote branch (unpushed, local only). */
    pinnedCommitPublished: boolean
  }
  wasmProvenanceFile: string
  suites: NativeSuiteRecord[]
}

// ── Shared helpers ───────────────────────────────────────────────────────────

const HEX_COMMIT = /^[0-9a-f]{7,40}$/

const tally = (cases: NativeCaseRow[]) => {
  const n = { pass: 0, fail: 0, skip: 0, xfail: 0 }
  for (const [, s] of cases) n[s]++
  return n
}

/** Recount a record's cases — what the committed-file consistency test uses. */
export const countCases = (cases: NativeCaseRow[]) => tally(cases)

// ── C++ engine suite: cpp_compliance_report.{json,md} ────────────────────────

const CPP_STATUS: Record<string, NativeCaseStatus> = {
  PASS: 'pass',
  FAIL: 'fail',
  SKIP: 'skip',
  XFAIL: 'xfail',
}

interface CppJsonRow {
  test: string
  status: string
  details?: string
}

export interface ParsedCppReport {
  engineAsStated: string
  engineCommit: string
  reportDate: string
  counts: NativeSuiteCounts
  groups: number
  cases: NativeCaseRow[]
}

const MD_FIELD = (label: string) => new RegExp(`^\\*\\*${label}:\\*\\* (.+)$`, 'm')
const MD_TOTAL = (label: string) => new RegExp(`^- \\*\\*Total ${label}[^*]*:\\*\\* (\\d+)$`, 'm')

const mdField = (md: string, label: string): string => {
  const m = MD_FIELD(label).exec(md)
  if (!m) throw new Error(`cpp_compliance_report.md: no "**${label}:**" line`)
  return m[1].trim()
}
const mdTotal = (md: string, label: string): number => {
  const m = MD_TOTAL(label).exec(md)
  if (!m) throw new Error(`cpp_compliance_report.md: no "- **Total ${label}:**" line`)
  return Number(m[1])
}
const unquote = (s: string) => s.replace(/^`(.*)`$/, '$1')

/**
 * The C++ report: JSON = { <category>: [{test,status,details}], _summary }.
 * Case id = `<category>/<test>`. The Markdown twin supplies the run date and
 * must agree with the JSON on engine commit and every total.
 */
export const parseCppReport = (jsonText: string, mdText: string): ParsedCppReport => {
  const raw = JSON.parse(jsonText) as Record<string, unknown>
  const summary = raw._summary as
    | {
        engine?: string
        engine_commit?: string
        pass?: number
        fail?: number
        skip?: number
        xfail_known_engine_bugs?: number
      }
    | undefined
  if (!summary) throw new Error('cpp_compliance_report.json: no _summary')

  const cases: NativeCaseRow[] = []
  const seen = new Set<string>()
  let groups = 0
  for (const [category, rows] of Object.entries(raw)) {
    if (category === '_summary') continue
    if (!Array.isArray(rows))
      throw new Error(`cpp_compliance_report.json: "${category}" is not a list`)
    groups++
    for (const r of rows as CppJsonRow[]) {
      const status = CPP_STATUS[r.status]
      if (!status) throw new Error(`cpp_compliance_report.json: unknown status "${r.status}"`)
      const id = `${category}/${r.test}`
      if (seen.has(id)) throw new Error(`cpp_compliance_report.json: duplicate case id ${id}`)
      seen.add(id)
      cases.push([id, status])
    }
  }

  const n = tally(cases)
  const want = {
    pass: summary.pass,
    fail: summary.fail,
    skip: summary.skip,
    xfail: summary.xfail_known_engine_bugs,
  }
  for (const k of ['pass', 'fail', 'skip', 'xfail'] as const) {
    if (want[k] !== n[k])
      throw new Error(
        `cpp_compliance_report.json: _summary.${k}=${want[k]} but the rows tally ${n[k]}`
      )
  }

  const engineCommit = summary.engine_commit ?? ''
  if (!HEX_COMMIT.test(engineCommit))
    throw new Error(`cpp_compliance_report.json: engine_commit "${engineCommit}" is not a commit`)

  const mdCommit = unquote(mdField(mdText, 'Engine commit'))
  if (mdCommit !== engineCommit)
    throw new Error(`cpp_compliance_report.md engine commit ${mdCommit} ≠ JSON ${engineCommit}`)
  const mdTotals = {
    pass: mdTotal(mdText, 'PASS'),
    fail: mdTotal(mdText, 'FAIL'),
    skip: mdTotal(mdText, 'SKIP'),
    xfail: mdTotal(mdText, 'XFAIL'),
  }
  for (const k of ['pass', 'fail', 'skip', 'xfail'] as const) {
    if (mdTotals[k] !== n[k])
      throw new Error(
        `cpp_compliance_report.md: Total ${k}=${mdTotals[k]} but JSON tallies ${n[k]}`
      )
  }

  return {
    engineAsStated: summary.engine ?? unquote(mdField(mdText, 'Engine')),
    engineCommit,
    reportDate: mdField(mdText, 'Date'),
    counts: { ...n, total: cases.length },
    groups,
    cases,
  }
}

// ── Rust engine suite: rust/RUST_P11_V32_CONFORMANCE_REPORT.md ───────────────

export interface ParsedRustReport {
  engineAsStated: string
  target: string
  engineCommitAsStated: string
  reportDate: string
  counts: NativeSuiteCounts
  groups: number
  caseIdentity: NativeCaseIdentity
  /** Labels that repeat inside one section and got an ordinal suffix. */
  repeatedLabels: number
  cases: NativeCaseRow[]
}

const RUST_HEADER = /\*\*Engine commit:\*\* `([0-9a-f]+)` · \*\*Generated:\*\* (\S+)/
const RUST_ENGINE = /^\*\*Engine:\*\* (.+)$/m
const RUST_RESULT = /^\*\*(\d+) passed \/ (\d+) failed\*\* across (\d+) sections/m
const RUST_SECTION_SUMMARY = /^- (.+) \((\d+) passed \/ (\d+) failed\)$/
const RUST_TRANSCRIPT_SECTION = /^── (.+) ──$/
// check() in rust/test_p11_conformance.js writes exactly these two shapes:
//   `  ✅ ${label}`   and   `  ❌ ${label}: got 0x…, expected 0x…`
const RUST_PASS = /^ {2}✅ (.+)$/
const RUST_FAIL = /^ {2}❌ (.+?): got 0x[0-9a-f]+, expected 0x[0-9a-f]+$/
const RUST_FINAL = /^═+ RESULT: (\d+) passed, (\d+) failed ═+$/

/**
 * The Rust report has no JSON: per-case identity comes from its "Full
 * transcript" block, which the harness writes one line per check() under a
 * `── <section> ──` heading. Every total the report states (headline, the
 * per-section list, the transcript's own RESULT line) must match the
 * transcript tally, or this throws.
 */
export const parseRustReport = (md: string): ParsedRustReport => {
  const header = RUST_HEADER.exec(md)
  if (!header) throw new Error('RUST report: no "**Engine commit:** … · **Generated:**" header')
  const engine = RUST_ENGINE.exec(md)
  if (!engine) throw new Error('RUST report: no "**Engine:**" line')
  const result = RUST_RESULT.exec(md)
  if (!result) throw new Error('RUST report: no "**N passed / M failed** across K sections" line')

  const lines = md.split('\n')
  const at = (title: string) => lines.findIndex((l) => l.trim() === title)

  // "## Sections covered" — the harness's own per-section counts.
  const sectionsAt = at('## Sections covered')
  if (sectionsAt < 0) throw new Error('RUST report: no "## Sections covered"')
  const declared: { name: string; pass: number; fail: number }[] = []
  for (let i = sectionsAt + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    const m = RUST_SECTION_SUMMARY.exec(lines[i])
    if (m) declared.push({ name: m[1], pass: Number(m[2]), fail: Number(m[3]) })
  }

  // "## Full transcript" — one line per check.
  const transcriptAt = at('## Full transcript')
  if (transcriptAt < 0) throw new Error('RUST report: no "## Full transcript"')
  const cases: NativeCaseRow[] = []
  const observed: { name: string; pass: number; fail: number }[] = []
  let current: { name: string; pass: number; fail: number; labels: Map<string, number> } | null =
    null
  let repeatedLabels = 0
  let finalLine: RegExpExecArray | null = null
  for (let i = transcriptAt + 1; i < lines.length; i++) {
    const line = lines[i]
    const sec = RUST_TRANSCRIPT_SECTION.exec(line)
    if (sec) {
      current = { name: sec[1], pass: 0, fail: 0, labels: new Map() }
      observed.push(current)
      continue
    }
    const pass = RUST_PASS.exec(line)
    const fail = pass ? null : RUST_FAIL.exec(line)
    if (pass || fail) {
      if (!current) throw new Error(`RUST report: check line before any section: ${line}`)
      const label = (pass ?? fail)![1]
      const seen = (current.labels.get(label) ?? 0) + 1
      current.labels.set(label, seen)
      if (seen === 2) repeatedLabels++
      const id = `${current.name} › ${label}${seen > 1 ? ` #${seen}` : ''}`
      cases.push([id, pass ? 'pass' : 'fail'])
      if (pass) current.pass++
      else current.fail++
      continue
    }
    if (line.startsWith('  ✅') || line.startsWith('  ❌'))
      throw new Error(`RUST report: unparseable check line: ${line}`)
    finalLine = RUST_FINAL.exec(line) ?? finalLine
  }

  const n = tally(cases)
  const statedPass = Number(result[1])
  const statedFail = Number(result[2])
  const statedSections = Number(result[3])
  if (n.pass !== statedPass || n.fail !== statedFail)
    throw new Error(
      `RUST report: headline says ${statedPass}/${statedFail}, transcript tallies ${n.pass}/${n.fail}`
    )
  if (observed.length !== statedSections || declared.length !== statedSections)
    throw new Error(
      `RUST report: headline says ${statedSections} sections; list has ${declared.length}, transcript ${observed.length}`
    )
  declared.forEach((d, i) => {
    const o = observed[i]
    if (o.name !== d.name || o.pass !== d.pass || o.fail !== d.fail)
      throw new Error(
        `RUST report: section ${i + 1} "${d.name}" (${d.pass}/${d.fail}) ≠ transcript "${o.name}" (${o.pass}/${o.fail})`
      )
  })
  if (!finalLine) throw new Error('RUST report: transcript has no RESULT line')
  if (Number(finalLine[1]) !== n.pass || Number(finalLine[2]) !== n.fail)
    throw new Error('RUST report: transcript RESULT line disagrees with its own check lines')

  // "wasm32 build with `--features acvp`" — the target, exactly as stated.
  const engineAsStated = engine[1].trim()
  const targetMatch = /(wasm32[^,;]*|native[^,;]*)$/.exec(engineAsStated)

  return {
    engineAsStated,
    target: targetMatch ? targetMatch[1].trim() : 'not recorded',
    engineCommitAsStated: header[1],
    reportDate: header[2],
    // check() records pass or fail only: there is no skip/xfail to count.
    counts: { pass: n.pass, fail: n.fail, skip: null, xfail: null, total: cases.length },
    groups: observed.length,
    caseIdentity: cases.length > 0 ? 'derived-from-transcript' : 'none',
    repeatedLabels,
    cases,
  }
}

// ── Presentation helpers (UI + report text) ──────────────────────────────────

export const shortCommit = (c: string) => c.slice(0, 10)

/** "891 pass · 0 fail · 50 skip" — omits statuses the harness does not have. */
export const formatCounts = (c: NativeSuiteCounts): string =>
  [
    `${c.pass} pass`,
    `${c.fail} fail`,
    c.skip === null ? null : `${c.skip} skip`,
    c.xfail ? `${c.xfail} xfail` : null,
  ]
    .filter(Boolean)
    .join(' · ')
