// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-release-evidence — the release evidence report (ACVP validation
 * remediation plan 2026-09-24, WS-J J-6; with the J-5 review check and the
 * §10.1 conference definition-of-done checklist).
 *
 * Every public validation figure is READ from a generated source; nothing in
 * the report is typed by hand:
 *
 *   vector counts ............ src/data/validation/validation-counts.generated.json
 *   coverage (num/denom) ..... public/data/validation/coverage-matrix.json (== the src copy)
 *   waivers .................. src/data/validation/coverage-waivers.json
 *   open gaps ................ the coverage matrix's openGaps (curated + generated)
 *   native suites ............ src/data/validation/native-conformance.generated.json
 *   recorded runs ............ src/data/validation/run-results/*.json
 *   cross-target runs ........ evidence/acvp-xplat/<run>/{matrix,targets}.json
 *   reviews (J-5) ............ src/data/validation/reviews/*.review.json
 *   workbench groups ......... CATEGORIES in src/components/Playground/hsm/acvp/useAcvpSuite.ts
 *
 * Stale inputs (a coverage matrix or counts file older than its own inputs)
 * fail --check first, naming the generator to run; nothing is regenerated here.
 *
 *   npx tsx scripts/generate-release-evidence.ts            # (re)write the report
 *   npx tsx scripts/generate-release-evidence.ts --check    # gate: exit 1 on drift
 *   npx tsx scripts/generate-release-evidence.ts --check -- ../presentations/fipsandchips2026
 *        # also lint the deck/script/README (banned claims + NIST ACVP-Server count +
 *        # workbench test groups/families,
 *        # reused from audit-validation-claims) and check every other bound figure
 *   npx tsx scripts/generate-release-evidence.ts --print-review-items
 *        # item ids + subject hashes a reviewer needs to write a review record
 *
 * Outputs (deterministic — no timestamps, no commit of its own):
 *   public/data/validation/release-evidence.json
 *   public/data/validation/release-evidence.md
 *
 * The hub commit is NOT in the report: a file cannot name the commit that
 * contains it. `npm run release:freeze` binds the exact hub commit, engine
 * commits, artifact hashes and this report's SHA-256 into a freeze manifest.
 *
 * --check fails when: the committed report differs from a fresh generation; the
 * published coverage matrix differs from the generated one; a review record is
 * invalid (J-5); or a bound figure in the root docs (README/TESTING/GATES/
 * CONTRIBUTING) or any given presentation path differs from its generated
 * value.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import { VALIDATION_DISCLAIMER } from '../src/data/validationDisclaimer'
import { EVIDENCE_CLASS_IDS } from '../src/data/validation/evidenceClasses'
import {
  evaluateReviews,
  type ReviewItem,
  type ReviewItemStatus,
} from '../src/data/validation/reviewRecords'
import {
  countWorkbenchGroups,
  listFiles,
  runAudit,
  scanWorkbenchCountDrift,
  type ClaimFinding,
  type WorkbenchGroups,
} from './audit-validation-claims'
import { TEST_REGISTRY } from '../src/data/validation/testRegistry'

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
export const REPORT_JSON_REL = 'public/data/validation/release-evidence.json'
export const REPORT_MD_REL = 'public/data/validation/release-evidence.md'
export const REPORT_SCHEMA = 'pqctoday.release-evidence/v1'

export const IN = {
  counts: 'src/data/validation/validation-counts.generated.json',
  manifest: 'src/data/validation/vector-manifest.json',
  matrix: 'src/data/validation/coverage-matrix.generated.json',
  publicMatrix: 'public/data/validation/coverage-matrix.json',
  waivers: 'src/data/validation/coverage-waivers.json',
  openGaps: 'src/data/validation/open-gaps.json',
  native: 'src/data/validation/native-conformance.generated.json',
  runResults: 'src/data/validation/run-results',
  xplat: 'evidence/acvp-xplat',
  reviews: 'src/data/validation/reviews',
  freeze: 'evidence/release-freeze',
  lm065Manifest: 'src/components/PKILearning/modules/AcvpLabWorkflow/manifest.ts',
  lm065Status: 'src/components/PKILearning/modules/AcvpLabWorkflow/data/reviewStatus.ts',
  lm065Content: 'src/components/PKILearning/modules/AcvpLabWorkflow/content.ts',
  /** CATEGORIES table: workbench test groups and families (parsed, not imported). */
  workbenchSuite: 'src/components/Playground/hsm/acvp/useAcvpSuite.ts',
} as const

/** Surfaces that must render the §2.2 disclaimer (A-4), checked by source scan. */
export const DISCLAIMER_SURFACES = [
  'src/components/Playground/dev/pipeline/suites/AcvpSuiteWorkbench.tsx',
  'src/components/Algorithms/KATView.tsx',
  'src/components/Algorithms/CoverageMatrixView.tsx',
] as const

/** Evidence classes whose expected values come from outside the implementation. */
const TRUSTED_SOURCE_CLASSES = new Set([
  'nist-acvp-reference-sample',
  'acvts-issued-vector',
  'published-standard-kat',
  'independent-oracle',
])

const ROOT_DOCS = ['README.md', 'TESTING.md', 'GATES.md', 'CONTRIBUTING.md']

// ── small helpers ────────────────────────────────────────────────────────────

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
type Obj = Record<string, unknown>

export const sha256 = (b: string | Buffer): string => createHash('sha256').update(b).digest('hex')

export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  const o = v as Obj
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(',')}}`
}

interface Ctx {
  root: string
  /** relative path → sha256 of the raw bytes, for every input actually read */
  inputs: Record<string, string>
}

function readJson<T = Obj>(ctx: Ctx, relPath: string): T {
  const abs = path.join(ctx.root, relPath)
  const raw = fs.readFileSync(abs)
  ctx.inputs[relPath] = sha256(raw)
  return JSON.parse(raw.toString('utf8')) as T
}

function readText(ctx: Ctx, relPath: string, record = true): string | null {
  const abs = path.join(ctx.root, relPath)
  if (!fs.existsSync(abs)) return null
  const raw = fs.readFileSync(abs)
  if (record) ctx.inputs[relPath] = sha256(raw)
  return raw.toString('utf8')
}

const listDir = (root: string, relDir: string, filter: (n: string) => boolean): string[] => {
  const abs = path.join(root, relDir)
  if (!fs.existsSync(abs)) return []
  return fs
    .readdirSync(abs)
    .filter(filter)
    .sort()
    .map((n) => `${relDir}/${n}`)
}

// ── input shapes (only the fields this report reads) ─────────────────────────

interface CountsFile {
  manifestCanonicalSha256: string
  vectorFiles: { total: number; active: number; quarantined: number }
  nistReferenceSampleFileCount: number
  nistReferenceSampleCaseCount: number
  filesByClass: Record<string, number>
  cases: { total: number; active: number; quarantined: number }
  activeCasesByClass: Record<string, number>
  activeCasesByExpectation: { positive: number; negative: number }
  filesWithPublishabilityGap: Record<string, number>
}

interface ManifestFile {
  files: Array<{
    id: string
    path: string
    sha256: string
    status: string
    evidenceClass: string
    source: { kind: string; citation: string }
    cases: Array<{ caseId: string; algorithm: { name: string } }>
  }>
}

type PolarityTotals = {
  covered: number
  sampled: number
  untested: number
  byStatus: Record<string, number>
}
interface EngineTotals {
  advertisedCells: number
  unsupportedCells: number
  overall: { covered: number; sampled: number; untested: number }
  byPolarity: Record<string, PolarityTotals>
  byArtifact: Record<
    string,
    { status: string; registeredCells: number; passedCells: number; failedCells: number }
  >
}
interface MatrixFile {
  statuses: string[]
  polarities: string[]
  definitions: { numerator: string; denominator: string; coveredMinCases: number }
  rules: Record<string, string>
  engines: Record<
    string,
    {
      label: string
      mechanismCount: number
      inventorySha256: string
      sourceCommit: string
      artifacts: Array<{ path: string; sha256: string }>
    }
  >
  artifactKinds: Record<string, { status: string; note: string }>
  totals: {
    rows: number
    byEngine: Record<string, EngineTotals>
    parity: Record<string, Record<string, number>>
    waivers: { waivedCells: number; pendingReviewCells: number; staleCells: number }
  }
  openGaps: Array<{
    id: string
    title: string
    status: string
    planItem: string
    owner: string
    origin: string
  }>
  cases: Array<{
    id: string
    caseId: string
    evidenceClass: string
    polarity: string
    engines: string[]
  }>
}

interface WaiverFile {
  waivers: Array<{
    id: string
    mechanism: string
    engines: string[]
    cells: string[]
    status: string
  }>
}

interface NativeFile {
  hsm: { pinnedCommit: string; pinnedCommitDate: string; pinnedCommitPublished: boolean }
  suites: Array<{
    id: string
    name: string
    engine: string
    sourceFile: string
    reportFiles: number
    openGaps: number
    report: null | {
      reportCommit: string
      reportDate: string
      engineCommit: string
      engineCommitDate: string
      target: string
      hostPlatform: string
      counts: {
        pass: number
        fail: number
        skip: number | null
        xfail: number | null
        total: number
      }
      groups: number
      caseIdentity: string
      staleness: { commitsFromEngineToPinnedMain: number; engineCommitOnPinnedMainHistory: boolean }
      wasm: {
        bundle: string
        bundleHsmCommit: string
        engineCommitEqualsBundleCommit: boolean
        commitsFromEngineToBundle: number
        commitsFromBundleToEngine: number
      }
    }
  }>
}

interface RunResultsFile {
  runner: string
  artifactKind: string
  host: string
  hubCommit: string
  recordedAt: string
  results: Array<{ engine: string; registryCase: string; status: string; artifactSha256: string }>
}

interface XplatMatrix {
  runId: string
  statuses: string[]
  comparatorPolicyVersion: string
  baselineTarget: string
  targets: Array<{
    id: string
    label: string
    class: string
    engine: string
    declaredStatus: string
    reason: string | null
    publishable: boolean | null
    unmetIdentity: string[]
    arch?: string
    emulated?: boolean | null
    artifactSha256?: string | null
    sourceCommit?: string | null
  }>
  fixtures: Array<{ name: string; vsId: number; bundleManifestSha256: string; caseIds: string[] }>
  totals: Record<string, Record<string, number>>
  divergences: unknown[]
}

// ── the report model ─────────────────────────────────────────────────────────

export type DodStatus = 'PASS' | 'FAIL' | 'HUMAN-REQUIRED'
export interface DodItem {
  n: number
  item: string
  status: DodStatus
  evidence: string[]
  basis: string
}

export interface ReleaseEvidence {
  $comment: string
  schema: typeof REPORT_SCHEMA
  disclaimer: string
  hubIdentity: string
  inputs: Record<string, string>
  vectors: Json
  coverage: Json
  waivers: Json
  nativeSuites: Json
  recordedRuns: Json
  crossTarget: Json
  openGaps: Json
  workbench: Json
  reviews: {
    rule: string
    validRecords: number
    statusCounts: Record<string, number>
    awaiting: Record<string, number>
    items: Array<{ id: string; kind: string; title: string; requirement: string; status: string }>
  }
  definitionOfDone: DodItem[]
}

// ── builders ─────────────────────────────────────────────────────────────────

function buildVectors(counts: CountsFile) {
  return {
    source: IN.counts,
    manifestCanonicalSha256: counts.manifestCanonicalSha256,
    nistReferenceSampleFiles: counts.nistReferenceSampleFileCount,
    nistReferenceSampleCases: counts.nistReferenceSampleCaseCount,
    vectorFiles: counts.vectorFiles,
    filesByClass: counts.filesByClass,
    cases: counts.cases,
    activeCasesByClass: counts.activeCasesByClass,
    activeCasesByExpectation: counts.activeCasesByExpectation,
    filesWithPublishabilityGap: counts.filesWithPublishabilityGap,
  }
}

function buildCoverage(m: MatrixFile) {
  const byEngine: Record<string, Json> = {}
  for (const [id, e] of Object.entries(m.engines)) {
    const t = m.totals.byEngine[id]
    const byPolarity: Record<string, Json> = {}
    for (const p of m.polarities) {
      const pt = t.byPolarity[p]
      byPolarity[p] = {
        covered: pt.covered,
        sampled: pt.sampled,
        untested: pt.untested,
        denominator: t.advertisedCells,
        byStatus: pt.byStatus,
      }
    }
    byEngine[id] = {
      label: e.label,
      mechanismCount: e.mechanismCount,
      advertisedCells: t.advertisedCells,
      unsupportedCells: t.unsupportedCells,
      overall: t.overall,
      byPolarity,
      byArtifact: t.byArtifact,
    }
  }
  return {
    source: IN.publicMatrix,
    definitions: {
      denominator: m.definitions.denominator,
      numerator: m.definitions.numerator,
      covered: m.rules.covered ?? null,
      sampled: m.rules.sampled ?? null,
    },
    statuses: m.statuses,
    polarities: m.polarities,
    matrixRows: m.totals.rows,
    byEngine,
    parity: m.totals.parity,
    artifactKinds: m.artifactKinds,
  }
}

function buildEngines(m: MatrixFile) {
  return Object.fromEntries(
    Object.entries(m.engines).map(([id, e]) => [
      id,
      {
        label: e.label,
        sourceCommit: e.sourceCommit,
        inventorySha256: e.inventorySha256,
        artifacts: e.artifacts,
      },
    ])
  )
}

function buildWaivers(w: WaiverFile, m: MatrixFile) {
  const byStatus: Record<string, number> = {}
  for (const x of w.waivers) byStatus[x.status] = (byStatus[x.status] ?? 0) + 1
  const approved = w.waivers.filter((x) => x.status === 'approved').length
  const pending = byStatus['baseline-pending-review'] ?? 0
  return {
    source: IN.waivers,
    entries: w.waivers.length,
    byStatus,
    approvedEntries: approved,
    waivedCells: m.totals.waivers.waivedCells,
    pendingReviewCells: m.totals.waivers.pendingReviewCells,
    staleCells: m.totals.waivers.staleCells,
    statement:
      pending === w.waivers.length
        ? `All ${w.waivers.length} waivers are baseline-pending-review. None is an approval: they record, at the WS-C baseline, capabilities advertised without any registered test, so that the coverage gate fails on NEW untested capabilities. Each awaits two-person review (plan J-5).`
        : `${pending} of ${w.waivers.length} waivers are baseline-pending-review (not approvals); ${approved} approved.`,
  }
}

function buildNative(n: NativeFile) {
  return {
    source: IN.native,
    executedByHub: false,
    note: 'Imported from the reports pqctoday-hsm committed; nothing here was executed by the Hub or in a browser.',
    hsmPinnedCommit: n.hsm.pinnedCommit,
    hsmPinnedCommitDate: n.hsm.pinnedCommitDate,
    hsmPinnedCommitPublished: n.hsm.pinnedCommitPublished,
    suites: n.suites.map((s) => ({
      id: s.id,
      name: s.name,
      engine: s.engine,
      sourceFile: s.sourceFile,
      reportFiles: s.reportFiles,
      openGaps: s.openGaps,
      report: s.report
        ? {
            counts: s.report.counts,
            groups: s.report.groups,
            caseIdentity: s.report.caseIdentity,
            engineCommit: s.report.engineCommit,
            engineCommitDate: s.report.engineCommitDate,
            reportCommit: s.report.reportCommit,
            reportDate: s.report.reportDate,
            target: s.report.target,
            hostPlatform: s.report.hostPlatform,
            commitsBehindPinnedHsmMain: s.report.staleness.commitsFromEngineToPinnedMain,
            engineCommitOnPinnedMainHistory: s.report.staleness.engineCommitOnPinnedMainHistory,
            wasmBundle: s.report.wasm.bundle,
            wasmBundleHsmCommit: s.report.wasm.bundleHsmCommit,
            engineCommitEqualsWasmBundleCommit: s.report.wasm.engineCommitEqualsBundleCommit,
            commitsFromEngineToWasmBundle: s.report.wasm.commitsFromEngineToBundle,
            commitsFromWasmBundleToEngine: s.report.wasm.commitsFromBundleToEngine,
          }
        : null,
    })),
  }
}

function buildRecordedRuns(files: Array<{ rel: string; data: RunResultsFile }>) {
  return files.map(({ rel: r, data }) => {
    const byEngine: Record<string, Record<string, number>> = {}
    for (const x of data.results) {
      const e = (byEngine[x.engine] ??= {})
      e[x.status] = (e[x.status] ?? 0) + 1
    }
    return {
      file: r,
      runner: data.runner,
      artifactKind: data.artifactKind,
      host: data.host,
      hubCommit: data.hubCommit,
      recordedAt: data.recordedAt,
      results: data.results.length,
      byEngine,
      failures: data.results
        .filter((x) => x.status === 'fail')
        .map((x) => ({ engine: x.engine, registryCase: x.registryCase })),
    }
  })
}

function buildCrossTarget(ctx: Ctx, runs: Array<{ dir: string; m: XplatMatrix }>) {
  return {
    source: IN.xplat,
    latestRun: runs.length ? runs[runs.length - 1].m.runId : null,
    runs: runs.map(({ dir, m }) => ({
      runId: m.runId,
      dir,
      matrixSha256: ctx.inputs[`${dir}/matrix.json`],
      comparatorPolicyVersion: m.comparatorPolicyVersion,
      baselineTarget: m.baselineTarget,
      fixtures: m.fixtures.map((f) => ({
        name: f.name,
        vsId: f.vsId,
        bundleManifestSha256: f.bundleManifestSha256,
        cases: f.caseIds.length,
      })),
      divergences: m.divergences.length,
      targets: m.targets.map((t) => ({
        id: t.id,
        label: t.label,
        class: t.class,
        engine: t.engine,
        declaredStatus: t.declaredStatus,
        publishable: t.publishable,
        reason: t.reason,
        unmetIdentity: t.unmetIdentity,
        emulated: t.emulated ?? null,
        artifactSha256: t.artifactSha256 ?? null,
        sourceCommit: t.sourceCommit ?? null,
        totals: m.totals[t.id] ?? null,
      })),
    })),
  }
}

function buildOpenGaps(m: MatrixFile) {
  const byStatus: Record<string, number> = {}
  const byOrigin: Record<string, number> = {}
  for (const g of m.openGaps) {
    byStatus[g.status] = (byStatus[g.status] ?? 0) + 1
    byOrigin[g.origin] = (byOrigin[g.origin] ?? 0) + 1
  }
  return {
    source: `${IN.publicMatrix} (openGaps; curated entries from ${IN.openGaps})`,
    total: m.openGaps.length,
    byStatus,
    byOrigin,
    unassignedOwner: m.openGaps.filter((g) => g.owner === 'unassigned').length,
    curated: m.openGaps
      .filter((g) => g.origin === 'curated')
      .map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status,
        planItem: g.planItem,
        owner: g.owner,
      })),
  }
}

// ── review items (J-5) ───────────────────────────────────────────────────────

const LM_ID_RE = /lm_id:\s*'([^']+)'/
const REVIEW_STATE_RE = /state:\s*'([^']+)'/

export function buildReviewItems(
  ctx: Ctx,
  manifest: ManifestFile,
  waivers: WaiverFile,
  claimsSha: string
): ReviewItem[] {
  const items: ReviewItem[] = []
  for (const f of manifest.files) {
    if (f.status !== 'active' || !TRUSTED_SOURCE_CLASSES.has(f.evidenceClass)) continue
    items.push({
      id: `vector-source:${f.id}`,
      kind: 'vector-source',
      title: `${f.path} — ${f.evidenceClass} (${f.source.citation})`,
      requirement:
        'Two distinct named reviewers: source verification (the expected values come from the cited source) and implementation review (the test executes and labels them as the manifest says).',
      subjectSha256: sha256(canonical(f)),
    })
  }
  for (const w of waivers.waivers) {
    items.push({
      id: `coverage-waiver:${w.id}`,
      kind: 'coverage-waiver',
      title: `${w.mechanism} (${w.engines.join(', ')}): ${w.cells.length} cell pattern(s), status ${w.status}`,
      requirement:
        'Two distinct named reviewers confirm the untested cells may stay untested for this release (or reject the waiver).',
      subjectSha256: sha256(canonical(w)),
    })
  }
  const pub = (id: string, title: string, subject: string) =>
    items.push({
      id: `public-claim:${id}`,
      kind: 'public-claim',
      title,
      requirement:
        'Two distinct named reviewers: source verification (each figure traces to its generated source) and claim review (the wording claims no more than the evidence).',
      subjectSha256: subject,
    })
  pub(
    'coverage-matrix',
    `Published coverage matrix (${IN.publicMatrix})`,
    ctx.inputs[IN.publicMatrix]
  )
  pub('open-gaps-register', `Open-gaps register (${IN.openGaps})`, ctx.inputs[IN.openGaps])
  pub(
    'release-claims',
    `Release evidence figures — the claims matrix the deck, script and site quote (${REPORT_JSON_REL})`,
    claimsSha
  )
  const manifestTs = readText(ctx, IN.lm065Manifest, false) ?? ''
  const content = readText(ctx, IN.lm065Content, false)
  if (content !== null) {
    const lm = LM_ID_RE.exec(manifestTs)?.[1] ?? 'LM-066'
    items.push({
      id: 'learn-module-practitioner:acvp-lab-workflow',
      kind: 'learn-module-practitioner',
      title: `Learn module ${lm} acvp-lab-workflow (draft)`,
      requirement:
        'Plan WS-I: reviewed by at least one validation-lab practitioner before it is described as a lab training resource; recorded in the same two-reviewer format.',
      subjectSha256: sha256(content),
    })
  }
  return items
}

function readReviewRecords(root: string): Array<{ file: string; record: unknown }> {
  return listDir(root, IN.reviews, (n) => n.endsWith('.review.json')).map((r) => {
    let record: unknown
    try {
      record = JSON.parse(fs.readFileSync(path.join(root, r), 'utf8'))
    } catch (e) {
      record = { __parseError: e instanceof Error ? e.message : String(e) }
    }
    return { file: r, record }
  })
}

// ── §10.1 conference definition of done ──────────────────────────────────────

interface DodInputs {
  root: string
  counts: CountsFile
  manifest: ManifestFile
  matrix: MatrixFile
  runs: Array<{ rel: string; data: RunResultsFile }>
  xplat: Array<{ dir: string; m: XplatMatrix }>
  reviewStatus: Record<string, ReviewItemStatus>
  reviewItems: ReviewItem[]
}

const exists = (root: string, r: string) => fs.existsSync(path.join(root, r))

export function evaluateDod(d: DodInputs): DodItem[] {
  const out: DodItem[] = []
  const classOk = new Set<string>(EVIDENCE_CLASS_IDS)

  // 1 — evidence-class labels
  {
    const badCase = d.matrix.cases.filter((c) => !classOk.has(c.evidenceClass))
    const unverified = d.counts.activeCasesByClass.unverified ?? 0
    const ok = badCase.length === 0 && unverified === 0
    out.push({
      n: 1,
      item: 'Every visible test has a correct evidence-class label',
      status: ok ? 'PASS' : 'FAIL',
      evidence: [IN.matrix, IN.counts, 'src/utils/katEvidence.test.ts'],
      basis: ok
        ? `All ${d.matrix.cases.length} registered cases carry one of the ${EVIDENCE_CLASS_IDS.length} plan §2.1 classes and 0 active cases are unverified. UI wording is held to those classes by the static guards in src/utils/katEvidence.test.ts (unit suite, not re-run here).`
        : `${badCase.length} registered case(s) carry an unknown class; ${unverified} active case(s) are unverified.`,
    })
  }

  // 2 — provenance or quarantine
  {
    const unverifiedFiles = d.counts.filesByClass.unverified ?? 0
    const activeUnverified = d.manifest.files.filter(
      (f) => f.status === 'active' && f.evidenceClass === 'unverified'
    ).length
    const gaps = Object.entries(d.counts.filesWithPublishabilityGap)
      .map(([k, v]) => `${k} ×${v}`)
      .join(', ')
    const ok = activeUnverified === 0
    out.push({
      n: 2,
      item: 'All active vectors have provenance or are blocked/quarantined',
      status: ok ? 'PASS' : 'FAIL',
      evidence: [IN.manifest, IN.counts],
      basis: ok
        ? `${d.counts.vectorFiles.active} active vector files, 0 without provenance${unverifiedFiles ? ` (${unverifiedFiles} unverified file(s), all quarantined)` : ''}; ${d.counts.cases.quarantined} case(s) quarantined. Recorded publishability gaps (provenance present but incomplete): ${gaps || 'none'}.`
        : `${activeUnverified} active vector file(s) have no verified provenance.`,
    })
  }

  // 3 — counts from one manifest (deck/script outside this repo)
  out.push({
    n: 3,
    item: 'Deck, script, UI and report counts are generated from the same manifest',
    status: 'HUMAN-REQUIRED',
    evidence: [IN.counts, REPORT_JSON_REL, 'scripts/audit-validation-claims.ts'],
    basis:
      'This report and the UI read the generated counts (validation-counts.generated.json). The deck and script live outside this repo, so a person must run `npm run gen:release-evidence:check -- <presentation dir>` on the FINAL deck; `npm run release:freeze -- --presentation <dir>` records that result in the freeze manifest.',
  })

  // 4 — disclaimer visible in workbench and report
  {
    const missing = DISCLAIMER_SURFACES.filter((f) => {
      const src = exists(d.root, f) ? fs.readFileSync(path.join(d.root, f), 'utf8') : ''
      return !/<ValidationDisclaimer\b/.test(src)
    })
    const exportsMissing = ['md', 'html']
      .map((ext) => `public/data/validation/coverage-matrix.${ext}`)
      .filter((f) => {
        if (!exists(d.root, f)) return true
        return !fs.readFileSync(path.join(d.root, f), 'utf8').includes(VALIDATION_DISCLAIMER)
      })
    const ok = missing.length === 0 && exportsMissing.length === 0
    out.push({
      n: 4,
      item: 'The disclaimer is visible in the workbench and the report',
      status: ok ? 'PASS' : 'FAIL',
      evidence: [
        ...DISCLAIMER_SURFACES,
        'public/data/validation/coverage-matrix.{md,html}',
        REPORT_MD_REL,
        'e2e/validation-release-evidence.spec.ts',
      ],
      basis: ok
        ? 'Workbench, Algorithms KAT view and coverage matrix render <ValidationDisclaimer/> (the one shared constant); the coverage exports and this report carry it verbatim; e2e/validation-release-evidence.spec.ts asserts it is visible in a browser.'
        : `Missing on: ${[...missing, ...exportsMissing].join(', ')}.`,
    })
  }

  // 5 — ML-DSA positive + negative on both engines
  {
    const algOf = new Map<string, string>()
    for (const f of d.manifest.files) for (const c of f.cases) algOf.set(c.caseId, c.algorithm.name)
    const results = new Map<string, Map<string, string>>()
    for (const r of d.runs)
      for (const x of r.data.results) {
        const m = results.get(x.registryCase) ?? new Map<string, string>()
        m.set(x.engine, x.status)
        results.set(x.registryCase, m)
      }
    const both = (id: string) =>
      results.get(id)?.get('cpp') === 'pass' && results.get(id)?.get('rust') === 'pass'
    const mldsa = d.matrix.cases.filter(
      (c) => algOf.get(c.caseId) === 'ML-DSA' && c.evidenceClass === 'nist-acvp-reference-sample'
    )
    const pos = mldsa.filter((c) => c.polarity === 'positive' && both(c.id))
    const neg = mldsa.filter((c) => c.polarity === 'negative' && both(c.id))
    const hosts = [...new Set(d.runs.map((r) => r.data.host))].join('; ')
    const ok = pos.length > 0 && neg.length > 0
    out.push({
      n: 5,
      item: 'ML-DSA demo: externally expected positive and deliberately invalid negative cases pass on both engines',
      status: ok ? 'PASS' : 'FAIL',
      evidence: [...d.runs.map((r) => r.rel), IN.matrix, 'e2e/acvp-mldsa-evidence.spec.ts'],
      basis: ok
        ? `${pos.length} NIST ACVP-Server reference-sample positive and ${neg.length} negative ML-DSA cases recorded as pass on BOTH the C++ and Rust WASM engines (e.g. ${pos[0].id}; ${neg[0].id}). Recorded host: ${hosts}. The browser path is asserted by e2e/acvp-mldsa-evidence.spec.ts (nightly).`
        : `Recorded passes on both engines: ${pos.length} positive, ${neg.length} negative NIST ML-DSA case(s); both must be ≥ 1.`,
    })
  }

  // 6 — inventory distinguishes advertised / tested / unsupported / skipped / untested
  {
    const t = Object.values(d.matrix.totals.byEngine)
    const hasAdvertised = t.every((e) => typeof e.advertisedCells === 'number')
    const hasUnsupported = t.every((e) => typeof e.unsupportedCells === 'number')
    const hasUntested = d.matrix.statuses.includes('untested')
    const hasTested = t.every((e) =>
      Object.values(e.byArtifact).every((a) => typeof a.passedCells === 'number')
    )
    const hasSkipped = t.every((e) =>
      Object.values(e.byArtifact).every((a) => typeof (a as Obj).skippedCells === 'number')
    )
    const missing = [
      !hasAdvertised && 'advertised',
      !hasTested && 'tested',
      !hasUnsupported && 'unsupported',
      !hasSkipped && 'skipped',
      !hasUntested && 'untested',
    ].filter(Boolean)
    out.push({
      n: 6,
      item: 'Dynamic mechanism inventory distinguishes advertised, tested, unsupported, skipped and untested',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      evidence: [IN.publicMatrix, 'src/data/validation/mechanism-inventory.generated.json'],
      basis:
        missing.length === 0
          ? 'The published matrix counts advertised (denominator), tested (per-status + recorded pass/fail), unsupported, skipped and untested cells separately per engine.'
          : `The published matrix has no separate count for: ${missing.join(', ')}. (Advertised cells, per-status tested cells, recorded pass/fail, unsupported and untested cells are counted; a recorded skip produces no count in totals.byEngine.*.byArtifact, so a skipped cell cannot be told apart from a registered cell that never ran.)`,
    })
  }

  // 7 — frozen hashes + reproducible bundles for every demonstrated target
  {
    const latest = d.xplat[d.xplat.length - 1]
    const notReady = latest
      ? latest.m.targets.filter((t) => !(t.declaredStatus === 'run' && t.publishable === true))
      : []
    const freezes = listDir(d.root, IN.freeze, (n) => n.endsWith('.freeze.json'))
    const problems: string[] = []
    if (!latest) problems.push('no frozen cross-target evidence run')
    if (notReady.length)
      problems.push(
        `${notReady.length} plan §11 Q3 target(s) in run ${latest!.m.runId} have no publishable frozen evidence: ${notReady
          .map(
            (t) =>
              `${t.id} (${t.declaredStatus}${t.declaredStatus === 'run' ? ', non-publishable' : ''})`
          )
          .join(', ')}`
      )
    if (freezes.length === 0)
      problems.push(`no release freeze manifest in ${IN.freeze}/ (plan J-4: freeze by 19 October)`)
    const ready = latest
      ? latest.m.targets
          .filter((t) => t.declaredStatus === 'run' && t.publishable === true)
          .map((t) => t.id)
      : []
    out.push({
      n: 7,
      item: 'All demonstrated artifacts and targets have frozen hashes and reproducible evidence bundles',
      status: problems.length === 0 ? 'PASS' : 'FAIL',
      evidence: [
        ...(latest ? [`${latest.dir}/matrix.json`, `${latest.dir}/targets.json`] : []),
        `${IN.freeze}/`,
      ],
      basis:
        (ready.length ? `Frozen and publishable: ${ready.join(', ')}. ` : '') +
        (problems.length
          ? problems.join('; ') + '.'
          : 'Every Q3 target is frozen and publishable.'),
    })
  }

  // 8 — no slide overclaims
  out.push({
    n: 8,
    item: 'No slide claims ACVTS acceptance, NIST validation, exhaustive ACVP coverage or complete mechanism coverage',
    status: 'HUMAN-REQUIRED',
    evidence: [
      'scripts/audit-validation-claims.ts',
      'scripts/audit-validation-claims.allowlist.json',
    ],
    basis:
      'The banned-claims lint covers UI copy, Learn content and the root docs in every gate run; it reads the deck text only when given the presentation path (`npm run gen:release-evidence:check -- <presentation dir>`). Slide images and the spoken script still need a person to read them.',
  })

  // 9 — technical reviewer sign-off
  {
    const st = d.reviewStatus['public-claim:release-claims'] ?? 'awaiting-review'
    out.push({
      n: 9,
      item: 'A technical reviewer other than the author signs off the claims matrix',
      status: 'HUMAN-REQUIRED',
      evidence: [`${IN.reviews}/`, `${IN.reviews}/review-record.schema.json`],
      basis: `Review item public-claim:release-claims is ${st}. A person must record the sign-off (two named reviewers, J-5); this checklist never marks it PASS.`,
    })
  }

  // 10 — recorded fallback demo
  out.push({
    n: 10,
    item: 'A recorded fallback demo exists',
    status: 'HUMAN-REQUIRED',
    evidence: [],
    basis:
      'Nothing in this repository records a demo video. A person must record it and store it with the frozen evidence (plan Phase 4).',
  })
  return out
}

// ── assemble ─────────────────────────────────────────────────────────────────

/** The figure sections of a report — what a claims review signs and a freeze binds. */
export const CLAIM_SECTIONS = [
  'vectors',
  'coverage',
  'waivers',
  'nativeSuites',
  'recordedRuns',
  'crossTarget',
  'openGaps',
  'workbench',
] as const

/**
 * SHA-256 over the canonical JSON of the figure sections only. Review status
 * and the §10.1 checklist are excluded on purpose: recording a review, or a
 * freeze, must not change the claims that were reviewed or frozen.
 */
export const claimsSha256 = (r: Partial<Record<(typeof CLAIM_SECTIONS)[number], unknown>>) =>
  sha256(canonical(Object.fromEntries(CLAIM_SECTIONS.map((k) => [k, r[k]]))))

export function buildReleaseEvidence(root: string = ROOT): {
  report: ReleaseEvidence
  reviewItems: ReviewItem[]
  reviewProblems: Array<{ file: string; problem: string }>
} {
  const ctx: Ctx = { root, inputs: {} }
  const counts = readJson<CountsFile>(ctx, IN.counts)
  const manifest = readJson<ManifestFile>(ctx, IN.manifest)
  const matrix = readJson<MatrixFile>(ctx, IN.publicMatrix)
  const waiverFile = readJson<WaiverFile>(ctx, IN.waivers)
  readText(ctx, IN.openGaps)
  const native = readJson<NativeFile>(ctx, IN.native)
  const runs = listDir(root, IN.runResults, (n) => n.endsWith('.json')).map((r) => ({
    rel: r,
    data: readJson<RunResultsFile>(ctx, r),
  }))
  const xplat = listDir(root, IN.xplat, (n) =>
    fs.existsSync(path.join(root, IN.xplat, n, 'matrix.json'))
  ).map((dir) => {
    readText(ctx, `${dir}/targets.json`)
    return { dir, m: readJson<XplatMatrix>(ctx, `${dir}/matrix.json`) }
  })

  const vectors = buildVectors(counts)
  const coverage = { ...buildCoverage(matrix), engines: buildEngines(matrix) }
  const waivers = buildWaivers(waiverFile, matrix)
  const nativeSuites = buildNative(native)
  const recordedRuns = buildRecordedRuns(runs)
  const crossTarget = buildCrossTarget(ctx, xplat)
  const openGaps = buildOpenGaps(matrix)
  const wb = countWorkbenchGroups(path.join(root, IN.workbenchSuite))
  const workbench = {
    source: `${IN.workbenchSuite} (CATEGORIES)`,
    note: 'Test groups per family as declared in the workbench CATEGORIES table; the file itself is not hashed here (it changes with every section edit), its parsed table is.',
    families: wb.families,
    groups: wb.groups,
    categories: wb.categories,
  }

  // The claims matrix a reviewer signs off = every figure section.
  const claimsSha = claimsSha256({
    vectors,
    coverage,
    waivers,
    nativeSuites,
    recordedRuns,
    crossTarget,
    openGaps,
    workbench,
  })
  const reviewItems = buildReviewItems(ctx, manifest, waiverFile, claimsSha)
  const records = readReviewRecords(root)
  const today = new Date().toISOString().slice(0, 10)
  const ev = evaluateReviews(reviewItems, records, today)

  const statusCounts: Record<string, number> = {}
  const awaiting: Record<string, number> = {}
  for (const it of reviewItems) {
    const s = ev.status[it.id]
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
    if (s !== 'approved') awaiting[it.kind] = (awaiting[it.kind] ?? 0) + 1
  }
  const lmState = REVIEW_STATE_RE.exec(readText(ctx, IN.lm065Status, false) ?? '')?.[1] ?? null

  const report: ReleaseEvidence = {
    $comment:
      'GENERATED by scripts/generate-release-evidence.ts — do not edit; run npm run gen:release-evidence. Every figure is read from a generated source listed in `inputs` (path → SHA-256 of the bytes read). The hub commit is bound by npm run release:freeze, not stored here.',
    schema: REPORT_SCHEMA,
    disclaimer: VALIDATION_DISCLAIMER,
    hubIdentity:
      'Not recorded in this file (it cannot name the commit that contains it). `npm run release:freeze` binds the hub commit, engine commits, artifact hashes and this report’s SHA-256.',
    inputs: Object.fromEntries(Object.entries(ctx.inputs).sort(([a], [b]) => a.localeCompare(b))),
    vectors,
    coverage: coverage as unknown as Json,
    waivers,
    nativeSuites: nativeSuites as unknown as Json,
    recordedRuns: recordedRuns as unknown as Json,
    crossTarget: crossTarget as unknown as Json,
    openGaps,
    workbench,
    reviews: {
      rule: `Plan J-5: a trusted vector source, a coverage waiver or a public coverage claim counts as reviewed only with a record in ${IN.reviews}/ naming two distinct people (source verification and claim review), bound to the subject's current SHA-256. The draft Learn module ${LM_ID_RE.exec(readText(ctx, IN.lm065Manifest, false) ?? '')?.[1] ?? 'LM-066'} (acvp-lab-workflow, state ${lmState ?? 'unknown'}) additionally needs a validation-lab practitioner (plan WS-I).`,
      validRecords: ev.validRecords.length,
      statusCounts,
      awaiting,
      items: reviewItems.map((i) => ({
        id: i.id,
        kind: i.kind,
        title: i.title,
        requirement: i.requirement,
        status: ev.status[i.id],
      })),
    },
    definitionOfDone: [],
  }
  report.definitionOfDone = evaluateDod({
    root,
    counts,
    manifest,
    matrix,
    runs,
    xplat,
    reviewStatus: ev.status,
    reviewItems,
  })
  return { report, reviewItems, reviewProblems: ev.problems }
}

export const renderJson = (r: ReleaseEvidence): string => JSON.stringify(r, null, 2) + '\n'

/** Both outputs, formatted exactly as the repo's prettier config would (format:check). */
export async function renderOutputs(
  root: string,
  r: ReleaseEvidence
): Promise<{ json: string; md: string }> {
  const fmtFile = async (relPath: string, text: string, parser: 'json' | 'markdown') => {
    const filepath = path.join(root, relPath)
    const config = (await resolveConfig(filepath)) ?? {}
    return format(text, { ...config, filepath, parser })
  }
  return {
    json: await fmtFile(REPORT_JSON_REL, renderJson(r), 'json'),
    md: await fmtFile(REPORT_MD_REL, renderMarkdown(r), 'markdown'),
  }
}

// ── Markdown ─────────────────────────────────────────────────────────────────

const fmt = (n: unknown) => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n ?? '—'))
const short = (s: unknown) => (typeof s === 'string' && s.length >= 12 ? s.slice(0, 12) : fmt(s))

export function renderMarkdown(r: ReleaseEvidence): string {
  const v = r.vectors as Obj & {
    filesByClass: Record<string, number>
    activeCasesByClass: Record<string, number>
    vectorFiles: { total: number; active: number; quarantined: number }
    cases: { total: number; active: number; quarantined: number }
    activeCasesByExpectation: { positive: number; negative: number }
  }
  const cov = r.coverage as unknown as ReturnType<typeof buildCoverage> & {
    engines: ReturnType<typeof buildEngines>
    byEngine: Record<
      string,
      {
        label: string
        mechanismCount: number
        advertisedCells: number
        unsupportedCells: number
        overall: { covered: number; sampled: number; untested: number }
        byPolarity: Record<string, { covered: number; sampled: number; untested: number }>
        byArtifact: Record<
          string,
          { status: string; registeredCells: number; passedCells: number; failedCells: number }
        >
      }
    >
  }
  const w = r.waivers as unknown as ReturnType<typeof buildWaivers>
  const nat = r.nativeSuites as unknown as ReturnType<typeof buildNative>
  const runs = r.recordedRuns as unknown as ReturnType<typeof buildRecordedRuns>
  const xt = r.crossTarget as unknown as ReturnType<typeof buildCrossTarget>
  const og = r.openGaps as unknown as ReturnType<typeof buildOpenGaps>
  const L: string[] = []
  const p = (s = '') => L.push(s)

  p('# Release evidence report')
  p()
  p(
    '<!-- GENERATED by scripts/generate-release-evidence.ts from the files listed under "Inputs" — do not edit; run `npm run gen:release-evidence`. -->'
  )
  p()
  p(`> ${r.disclaimer}`)
  p()
  p(
    'Every number below is read from a generated file; `npm run gen:release-evidence:check` fails if this report, or a bound figure in the docs or the conference deck, drifts from them. The hub commit is bound separately by `npm run release:freeze`.'
  )
  p()

  p('## Headline figures')
  p()
  p('| Figure | Value | Source |')
  p('| --- | ---: | --- |')
  p(
    `| Selected public NIST ACVP-Server reference-sample files | ${fmt(v.nistReferenceSampleFiles)} | \`${IN.counts}\` |`
  )
  p(
    `| NIST ACVP-Server reference-sample cases (active) | ${fmt(v.nistReferenceSampleCases)} | \`${IN.counts}\` |`
  )
  p(
    `| Vector files (active / quarantined / total) | ${fmt(v.vectorFiles.active)} / ${fmt(v.vectorFiles.quarantined)} / ${fmt(v.vectorFiles.total)} | \`${IN.counts}\` |`
  )
  p(
    `| Cases (active / quarantined / total) | ${fmt(v.cases.active)} / ${fmt(v.cases.quarantined)} / ${fmt(v.cases.total)} | \`${IN.counts}\` |`
  )
  p(
    `| Active cases: positive / negative | ${fmt(v.activeCasesByExpectation.positive)} / ${fmt(v.activeCasesByExpectation.negative)} | \`${IN.counts}\` |`
  )
  for (const e of Object.values(cov.byEngine))
    p(
      `| ${e.label}: advertised capability cells (denominator) | ${fmt(e.advertisedCells)} | \`${IN.publicMatrix}\` |`
    )
  p(`| Coverage waivers (entries; all statuses) | ${fmt(w.entries)} | \`${IN.waivers}\` |`)
  p(`| Waivers approved | ${fmt(w.approvedEntries)} | \`${IN.waivers}\` |`)
  p(`| Open gaps (register entries) | ${fmt(og.total)} | \`${IN.publicMatrix}\` |`)
  const wbk = r.workbench as unknown as { groups: number; families: number; source: string }
  p(
    `| Workbench test groups / families | ${fmt(wbk.groups)} / ${fmt(wbk.families)} | \`${wbk.source}\` |`
  )
  p()
  p(`**Waivers:** ${w.statement}`)
  p()

  p('## Vector files and cases by evidence class')
  p()
  p('| Evidence class | Files | Active cases |')
  p('| --- | ---: | ---: |')
  for (const k of Object.keys(v.filesByClass))
    p(`| ${k} | ${fmt(v.filesByClass[k])} | ${fmt(v.activeCasesByClass[k] ?? 0)} |`)
  p()

  p('## Coverage — numerator / denominator per engine and polarity')
  p()
  p(`- **Denominator:** ${cov.definitions.denominator}`)
  p(`- **Numerator:** ${cov.definitions.numerator}`)
  p()
  for (const [id, e] of Object.entries(cov.byEngine)) {
    const eng = cov.engines[id]
    p(`### ${e.label} engine`)
    p()
    p(
      `${fmt(e.mechanismCount)} mechanisms · ${fmt(e.advertisedCells)} advertised cells (denominator) · ${fmt(e.unsupportedCells)} unsupported cells shown separately · source commit \`${eng.sourceCommit}\``
    )
    p()
    p('| Polarity | Covered | Sampled | Untested | Denominator |')
    p('| --- | ---: | ---: | ---: | ---: |')
    for (const [pol, t] of Object.entries(e.byPolarity))
      p(
        `| ${pol} | ${fmt(t.covered)} | ${fmt(t.sampled)} | ${fmt(t.untested)} | ${fmt(e.advertisedCells)} |`
      )
    p(
      `| **overall** | ${fmt(e.overall.covered)} | ${fmt(e.overall.sampled)} | ${fmt(e.overall.untested)} | ${fmt(e.advertisedCells)} |`
    )
    p()
    p('| Artifact kind | Status | Registered cells | Recorded pass | Recorded fail |')
    p('| --- | --- | ---: | ---: | ---: |')
    for (const [k, a] of Object.entries(e.byArtifact))
      p(
        `| ${k} | ${a.status} | ${fmt(a.registeredCells)} | ${fmt(a.passedCells)} | ${fmt(a.failedCells)} |`
      )
    p()
    p('Artifacts:')
    p()
    for (const a of eng.artifacts) p(`- \`${a.path}\` — SHA-256 \`${a.sha256}\``)
    p()
  }

  p('## Recorded runs')
  p()
  for (const run of runs) {
    p(
      `- \`${run.file}\` — ${run.runner}; ${run.artifactKind} on ${run.host}; recorded ${run.recordedAt} at hub \`${short(run.hubCommit)}\`; ${fmt(run.results)} results: ${Object.entries(
        run.byEngine
      )
        .map(
          ([e, s]) =>
            `${e} ${Object.entries(s)
              .map(([k, n]) => `${fmt(n)} ${k}`)
              .join(', ')}`
        )
        .join('; ')}.`
    )
    for (const f of run.failures) p(`  - **fail** on ${f.engine}: \`${f.registryCase}\``)
  }
  p()

  p('## Native engine conformance suites (imported, not executed by the Hub)')
  p()
  p(
    `${nat.note} Pinned hsm commit \`${short(nat.hsmPinnedCommit)}\` (${nat.hsmPinnedCommitDate})${nat.hsmPinnedCommitPublished ? '' : ' — **an unpushed local hsm commit, on no pqctoday-hsm remote: not independently verifiable until pushed**'}.`
  )
  p()
  p(
    '| Suite | Engine | Pass | Fail | Skip | Total | Engine commit | Engine commits behind the pinned hsm commit | Engine = WASM bundle commit? |'
  )
  p('| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- |')
  for (const s of nat.suites) {
    const rp = s.report
    if (!rp) {
      p(`| ${s.name} | ${s.engine} | — | — | — | — | no report committed | — | — |`)
      continue
    }
    p(
      `| ${s.name} | ${s.engine} | ${fmt(rp.counts.pass)} | ${fmt(rp.counts.fail)} | ${rp.counts.skip === null ? 'not reported' : fmt(rp.counts.skip)} | ${fmt(rp.counts.total)} | \`${short(rp.engineCommit)}\` (${rp.engineCommitDate}) | ${fmt(rp.commitsBehindPinnedHsmMain)} | ${rp.engineCommitEqualsWasmBundleCommit ? 'yes' : `no — bundle \`${short(rp.wasmBundleHsmCommit)}\`: ${fmt(rp.commitsFromEngineToWasmBundle)} commit(s) ahead of the engine commit, ${fmt(rp.commitsFromWasmBundleToEngine)} behind it`} |`
    )
  }
  p()

  p('## Cross-target evidence runs')
  p()
  p(
    'Statuses are kept separate: `not run`, `unsupported` and `not comparable` are never a pass. A run target whose execution environment misses identity is **non-publishable**.'
  )
  p()
  for (const run of xt.runs) {
    p(`### Run ${run.runId}${run.runId === xt.latestRun ? ' (latest)' : ''}`)
    p()
    p(
      `\`${run.dir}/matrix.json\` SHA-256 \`${run.matrixSha256}\` · comparator policy \`${run.comparatorPolicyVersion}\` · ${run.divergences} divergence(s) · fixtures: ${run.fixtures
        .map(
          (f) =>
            `${f.name} (vsId ${f.vsId}, ${f.cases} cases, bundle \`${short(f.bundleManifestSha256)}\`)`
        )
        .join('; ')}`
    )
    p()
    p(
      '| Target | Declared | Publishable | Pass | Fail | Unsupported | Not run | Not comparable | Artifact | Source commit |'
    )
    p('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |')
    for (const t of run.targets) {
      const tt = (t.totals ?? {}) as Record<string, number>
      p(
        `| ${t.id} | ${t.declaredStatus}${t.emulated ? ' (emulated)' : ''} | ${t.publishable === null ? '—' : t.publishable ? 'yes' : '**no**'} | ${fmt(tt.pass)} | ${fmt(tt.fail)} | ${fmt(tt.unsupported)} | ${fmt(tt['not run'])} | ${fmt(tt['not comparable'])} | ${t.artifactSha256 ? `\`${short(t.artifactSha256)}\`` : '—'} | ${t.sourceCommit ? `\`${short(t.sourceCommit)}\`` : '—'} |`
      )
    }
    p()
  }

  p('## Open-gaps register')
  p()
  p(
    `${fmt(og.total)} entries — by status: ${Object.entries(og.byStatus)
      .map(([k, n]) => `${k} ${fmt(n)}`)
      .join(', ')}; by origin: ${Object.entries(og.byOrigin)
      .map(([k, n]) => `${k} ${fmt(n)}`)
      .join(', ')}; owner unassigned: ${fmt(og.unassignedOwner)}.`
  )
  p()
  p('| Curated gap | Status | Plan item | Owner |')
  p('| --- | --- | --- | --- |')
  for (const g of og.curated) p(`| ${g.title} | ${g.status} | ${g.planItem} | ${g.owner} |`)
  p()

  p('## Awaiting two-person review (plan J-5)')
  p()
  p(r.reviews.rule)
  p()
  p(`Valid review records: ${fmt(r.reviews.validRecords)}.`)
  p()
  p('| Kind | Items not approved |')
  p('| --- | ---: |')
  for (const [k, n] of Object.entries(r.reviews.awaiting)) p(`| ${k} | ${fmt(n)} |`)
  p()
  p('Public-claim and Learn items:')
  p()
  for (const i of r.reviews.items.filter(
    (x) => x.kind === 'public-claim' || x.kind === 'learn-module-practitioner'
  ))
    p(`- \`${i.id}\` — ${i.title}: **${i.status}**`)
  p()
  p(
    'The full item list (with every vector source and waiver) is in `release-evidence.json` → `reviews.items`; `npm run gen:release-evidence -- --print-review-items` prints the subject hashes a review record must quote.'
  )
  p()

  p('## Conference definition of done (plan §10.1)')
  p()
  p('Machine-evaluated. A human item is never marked PASS.')
  p()
  p('| # | Item | Status | Evidence | Basis |')
  p('| ---: | --- | --- | --- | --- |')
  for (const d of r.definitionOfDone)
    p(
      `| ${d.n} | ${d.item} | **${d.status}** | ${d.evidence.map((e) => `\`${e}\``).join('<br>') || '—'} | ${d.basis.replace(/\|/g, '\\|')} |`
    )
  p()

  p('## Inputs')
  p()
  p('| File | SHA-256 |')
  p('| --- | --- |')
  for (const [f, h] of Object.entries(r.inputs)) p(`| \`${f}\` | \`${h}\` |`)
  p()
  return L.join('\n')
}

// ── figure drift (docs + presentation) ───────────────────────────────────────

const WORD_NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
}
const UNITS = 'one|two|three|four|five|six|seven|eight|nine'
const WORDS = `(?:twenty|thirty|forty|fifty)-(?:${UNITS})|${Object.keys(WORD_NUM).join('|')}`
/** A number: digits (with thousands commas) or an English word up to fifty-nine. */
const NUM = `(?<![\\w-])(\\d{1,3}(?:,\\d{3})+|\\d+|${WORDS})`
/** "18 are …", "four were …" — one linking verb may sit between number and noun. */
const LINK = '(?:(?:are|were|is)\\s+)?'
const toNum = (s: string): number => {
  const k = s.toLowerCase()
  const [tens, unit] = k.split('-')
  if (unit !== undefined) return (WORD_NUM[tens] ?? NaN) + (WORD_NUM[unit] ?? NaN)
  return k in WORD_NUM ? WORD_NUM[k] : Number(s.replace(/,/g, ''))
}

export interface FigureRule {
  id: string
  /** What the number must equal. */
  describe: string
  pattern: RegExp
  /** Allowed values (any match outside this set is drift). */
  allowed: number[]
  /** Only lines matching this are scanned (optional). */
  lineFilter?: RegExp
}

/** Figures a doc or deck may quote, each bound to its generated value. */
export function figureRules(r: ReleaseEvidence): FigureRule[] {
  const v = r.vectors as unknown as ReturnType<typeof buildVectors>
  const cov = r.coverage as unknown as { byEngine: Record<string, { advertisedCells: number }> }
  const w = r.waivers as unknown as ReturnType<typeof buildWaivers>
  const og = r.openGaps as unknown as ReturnType<typeof buildOpenGaps>
  const nat = r.nativeSuites as unknown as ReturnType<typeof buildNative>
  const nativeNums = nat.suites.flatMap((s) =>
    s.report ? [s.report.counts.pass, s.report.counts.total] : []
  )
  const notCases = '(?!\\s+(?:cases?|vectors?|tests?|checks?|rows?))'
  return [
    {
      id: 'standard-kat-files',
      describe: `published-standard-kat vector files (${IN.counts} filesByClass)`,
      pattern: new RegExp(
        `${NUM}\\s+${LINK}(?:selected\\s+)?(?:published[- ])?standard(?:['’]s|&#39;s)?(?:\\s+own)?\\s+KATs?\\b${notCases}`,
        'gi'
      ),
      allowed: [v.filesByClass['published-standard-kat']],
    },
    {
      id: 'oracle-files',
      describe: `independent-oracle vector files (${IN.counts} filesByClass)`,
      pattern: new RegExp(
        `${NUM}\\s+${LINK}(?:OpenSSL[- ])?oracle(?:[- ]comparisons?)?\\b${notCases}`,
        'gi'
      ),
      allowed: [v.filesByClass['independent-oracle']],
    },
    {
      id: 'functional-files',
      describe: `functional-round-trip vector files (${IN.counts} filesByClass)`,
      pattern: new RegExp(
        `${NUM}\\s+${LINK}functional(?:[- ]round[- ]trips?)?\\b${notCases}`,
        'gi'
      ),
      allowed: [v.filesByClass['functional-round-trip']],
    },
    {
      id: 'vector-files-total',
      describe: `vector files in total (${IN.counts} vectorFiles.total)`,
      pattern: new RegExp(`${NUM}\\s+(?:active\\s+)?(?:JSON\\s+)?vector files\\b`, 'gi'),
      allowed: [v.vectorFiles.total, v.vectorFiles.active],
    },
    {
      id: 'vector-files-of-total',
      describe: `"(of N)" next to the NIST ACVP-Server count = vector files in total`,
      pattern: /\(of (\d+)\)/g,
      allowed: [v.vectorFiles.total],
      lineFilter: /NIST ACVP-Server/,
    },
    {
      id: 'native-checks',
      describe: `native conformance counts (${IN.native} pass/total per suite)`,
      pattern:
        /\b(\d{3,}(?:,\d{3})*)(?:\s*\/\s*(\d{3,}(?:,\d{3})*))?\s+(?:native\s+|conformance\s+|engine\s+|PKCS#11\s+)*checks\b/gi,
      allowed: nativeNums,
    },
    {
      id: 'waiver-count',
      describe: `coverage waivers (${IN.waivers} entries)`,
      pattern: new RegExp(`${NUM}\\s+(?:coverage\\s+|baseline\\s+|pending\\s+)*waivers\\b`, 'gi'),
      allowed: [w.entries],
    },
    {
      id: 'open-gap-count',
      describe: `open-gaps register entries (${IN.publicMatrix} openGaps)`,
      pattern: new RegExp(`${NUM}\\s+open[- ]gaps?\\b`, 'gi'),
      allowed: [og.total, og.byStatus.open ?? 0],
    },
    {
      id: 'advertised-cells',
      describe: `advertised capability cells per engine (${IN.publicMatrix})`,
      pattern: /\b(\d{1,3}(?:,\d{3})*|\d+)\s+advertised (?:capability )?cells\b/gi,
      allowed: Object.values(cov.byEngine).map((e) => e.advertisedCells),
    },
  ]
}

const stripMarkup = (line: string) =>
  line
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')

export function scanFigures(text: string, file: string, rules: FigureRule[]): ClaimFinding[] {
  const out: ClaimFinding[] = []
  const lines = text.split('\n')
  lines.forEach((raw, i) => {
    if (/release-evidence-allow:\s*\S/.test(raw)) return
    const line = stripMarkup(raw)
    for (const rule of rules) {
      if (rule.lineFilter && !rule.lineFilter.test(line)) continue
      for (const m of line.matchAll(rule.pattern)) {
        const nums = [m[1], m[2]].filter((x): x is string => typeof x === 'string').map(toNum)
        for (const n of nums) {
          if (rule.allowed.includes(n)) continue
          out.push({
            file,
            line: i + 1,
            rule: `figure-drift:${rule.id}`,
            match: m[0].trim(),
            sentence: `says ${n}; the generated value is ${[...new Set(rule.allowed)].join(' or ')} (${rule.describe})`,
          })
        }
      }
    }
  })
  return out
}

// ── check ────────────────────────────────────────────────────────────────────

/**
 * The generated sources this report reads must themselves be fresh. This check
 * NEVER regenerates them (that would hide the drift); it names the generator
 * to run. Cheap equivalents of gen:coverage-matrix:check / gen:validation-counts:check
 * on the recorded input hashes, so a stale input fails here with a clear cause.
 */
export function staleInputs(root: string = ROOT): string[] {
  const out: string[] = []
  const read = (rel: string) =>
    fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : null
  const matrixText = read(IN.publicMatrix)
  if (matrixText) {
    const recorded = (JSON.parse(matrixText) as { inputs?: Record<string, string> }).inputs ?? {}
    for (const [rel, want] of Object.entries(recorded)) {
      const now =
        rel === 'src/data/validation/testRegistry.ts'
          ? sha256(JSON.stringify(TEST_REGISTRY.map((t) => [t.id, t.engines, t.cases])))
          : read(rel) === null
            ? null
            : sha256(read(rel)!)
      if (now !== want)
        out.push(
          `stale input: ${IN.publicMatrix} was generated from ${rel} ${want.slice(0, 12)}…, which is now ${now ? `${now.slice(0, 12)}…` : 'absent'} — run npm run gen:coverage-matrix and commit it, then npm run gen:release-evidence (this check never regenerates its inputs)`
        )
    }
  }
  const counts = read(IN.counts)
  const manifest = read(IN.manifest)
  if (counts && manifest) {
    const want = (JSON.parse(counts) as { manifestCanonicalSha256?: string })
      .manifestCanonicalSha256
    const now = sha256(JSON.stringify(JSON.parse(manifest)))
    if (want !== now)
      out.push(
        `stale input: ${IN.counts} was generated from a different ${IN.manifest} — run npm run gen:validation-counts and commit it, then npm run gen:release-evidence`
      )
  }
  return out
}

export interface CheckResult {
  errors: string[]
  notes: string[]
}

export async function checkReleaseEvidence(
  root: string = ROOT,
  extraPaths: string[] = []
): Promise<CheckResult> {
  const errors: string[] = [...staleInputs(root)]
  const notes: string[] = []
  const { report, reviewProblems } = buildReleaseEvidence(root)
  const { json, md } = await renderOutputs(root, report)
  for (const [r, want] of [
    [REPORT_JSON_REL, json],
    [REPORT_MD_REL, md],
  ] as const) {
    const abs = path.join(root, r)
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null
    if (cur === null) errors.push(`${r} is missing — run npm run gen:release-evidence`)
    else if (cur !== want) {
      const a = cur.split('\n')
      const b = want.split('\n')
      const i = a.findIndex((l, k) => l !== b[k])
      errors.push(
        `${r} differs from a fresh generation (first difference at line ${i + 1}: committed ${JSON.stringify(a[i] ?? '')} vs generated ${JSON.stringify(b[i] ?? '')}) — run npm run gen:release-evidence`
      )
    }
  }
  // Published matrix must be the generated one.
  const pub = path.join(root, IN.publicMatrix)
  const gen = path.join(root, IN.matrix)
  if (fs.existsSync(gen) && fs.existsSync(pub)) {
    if (sha256(fs.readFileSync(pub)) !== sha256(fs.readFileSync(gen)))
      errors.push(`${IN.publicMatrix} differs from ${IN.matrix} — run npm run gen:coverage-matrix`)
  }
  for (const p of reviewProblems) errors.push(`review record ${p.file}: ${p.problem}`)

  // Bound figures in the root docs and any presentation path.
  const rules = figureRules(report)
  const findings: ClaimFinding[] = []
  for (const d of ROOT_DOCS) {
    const abs = path.join(root, d)
    if (!fs.existsSync(abs)) continue
    const text = fs.readFileSync(abs, 'utf8')
    findings.push(...scanFigures(text, d, rules))
    findings.push(
      ...scanWorkbenchCountDrift(text, d, report.workbench as unknown as WorkbenchGroups)
    )
  }
  if (extraPaths.length) {
    for (const p of extraPaths) {
      const abs = path.resolve(p)
      for (const f of listFiles(abs, abs))
        findings.push(...scanFigures(fs.readFileSync(f, 'utf8'), f, rules))
    }
    // Reuse the claims lint + NIST ACVP-Server count drift for the presentation.
    const audit = runAudit(extraPaths)
    findings.push(...audit.findings)
    const deckOk = findings.length === 0
    notes.push(
      `§10.1 #3 (deck/script counts) and #8 (slide claims, text only): ${deckOk ? 'PASS' : 'FAIL'} for ${extraPaths.join(', ')} — slide images and the spoken words still need a person.`
    )
  }
  for (const f of findings)
    errors.push(`${f.file}:${f.line} [${f.rule}] "${f.match}" — ${f.sentence.slice(0, 240)}`)
  return { errors, notes }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const extra = args.filter((a) => !a.startsWith('--'))
  if (args.includes('--print-review-items')) {
    const { reviewItems } = buildReleaseEvidence(ROOT)
    for (const i of reviewItems) console.warn(`${i.id}\t${i.subjectSha256}`)
    return
  }
  if (args.includes('--check')) {
    for (const p of extra) {
      if (!fs.existsSync(p)) {
        console.error(`[gen:release-evidence] extra path does not exist: ${p}`)
        process.exit(1)
      }
    }
    const { errors, notes } = await checkReleaseEvidence(ROOT, extra)
    for (const n of notes) console.warn(`[gen:release-evidence] ${n}`)
    if (errors.length) {
      console.error(`[gen:release-evidence] FAIL — ${errors.length} problem(s):`)
      for (const e of errors) console.error(`  ${e}`)
      process.exit(1)
    }
    console.warn(
      `[gen:release-evidence] OK — report matches its generated sources${extra.length ? `; ${extra.join(', ')} checked` : ''}`
    )
    return
  }
  const { report, reviewProblems } = buildReleaseEvidence(ROOT)
  fs.mkdirSync(path.join(ROOT, path.dirname(REPORT_JSON_REL)), { recursive: true })
  const { json, md } = await renderOutputs(ROOT, report)
  fs.writeFileSync(path.join(ROOT, REPORT_JSON_REL), json)
  fs.writeFileSync(path.join(ROOT, REPORT_MD_REL), md)
  console.warn(`[gen:release-evidence] wrote ${REPORT_JSON_REL} and ${REPORT_MD_REL}`)
  for (const p of reviewProblems) console.error(`  review record ${p.file}: ${p.problem}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main()
}
