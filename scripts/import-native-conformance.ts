/**
 * import-native-conformance.ts — WS-G G-6 importer.
 *
 * Reads the conformance reports pqctoday-hsm commits for its two engines'
 * own PKCS#11 v3.2 suites — AT A PINNED hsm COMMIT, with `git show
 * <commit>:<path>` (no checkout, nothing built, the hsm working tree is never
 * touched) — and writes src/data/validation/native-conformance.generated.json:
 * per suite, the source file, the report commit, the engine commit the report
 * was produced at, the run date and target exactly as the report states them
 * ("not recorded" otherwise), pass/fail/skip counts, every individual case id
 * with its status, how many hsm main commits the engine commit is behind the
 * pin, and whether it equals the commit the Hub's own WASM bundle of that
 * engine was built from (public/wasm/wasm-provenance.json).
 *
 * This IMPORTS reports; it never runs a suite. Fresh numbers need the suites
 * re-run in pqctoday-hsm (its local gate, in a container) and committed there,
 * then PINNED_HSM_COMMIT below moved to that commit.
 *
 *   npm run import:native-conformance          # write
 *   npm run import:native-conformance:check    # exit 1 if stale; skip if no hsm checkout
 *
 * --check also fails when hsm main has committed a NEWER copy of any report
 * than the pin (re-pin and re-import), and prints — without failing — how far
 * the live hsm main has moved past the pin. `--file <path>` checks a different
 * file than the committed one (the sabotage test uses it on a copy).
 *
 * Override the hsm location with HSM_REPO_PATH=/path/to/pqctoday-hsm.
 * Plan: pqctoday-priv/nextfeature/acvp-validation-remediation-plan-09242026.md §5 WS-G G-6.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import {
  NATIVE_CONFORMANCE_SCHEMA,
  parseCppReport,
  parseRustReport,
  type NativeConformanceFile,
  type NativeSuiteRecord,
  type NativeSuiteWasmComparison,
} from '../src/data/validation/nativeConformance'

/**
 * The pqctoday-hsm commit every report is read at: a22e6ca0838e0b7e0d9cbc6e2a14b4d4df3fdfeb
 * on hsm `origin/main` (2026-09-25), the merge of PR #258 (the last of the 6
 * ACVP gap-closure engine-fix PRs to land: #255/#257/#258/#259/#260 merged,
 * #256 superseded/closed by the root-cause fix #262, OpenMLS hbs-lms breakage
 * separately fixed by #261). Both suites' committed reports at this commit
 * (cpp_compliance_report.json/.md from d6e55d86, RUST_P11_V32_CONFORMANCE_REPORT.md
 * from 37ca1f74) were regenerated AFTER the E1-E19 fixes, at engine commits that
 * are ancestors of this pin — this is the P3 combined rebuild's re-pin, replacing
 * the prior chore/p11-reports-refresh-0925 branch pin (7643d5c0, unpushed local
 * commit) now that hsm main itself carries current, PUBLISHED reports.
 * Move the pin — and re-run the importer — when hsm commits regenerated
 * reports; --check says when that has happened on hsm main.
 *
 * 2026-10-02: moved to b840293655a5f0f46be028b7ba8c5fc71ed72078, hsm main after
 * #314, #312 and #313. #312 regenerated cpp_compliance_report.{json,md} (963 PASS,
 * +2 StatefulThenMac cases for the Session::resetOp fix); the Rust report is
 * unchanged since the previous pin.
 */
export const PINNED_HSM_COMMIT = 'b840293655a5f0f46be028b7ba8c5fc71ed72078'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
export const NATIVE_CONFORMANCE_OUT = join(
  ROOT,
  'src/data/validation/native-conformance.generated.json'
)
const PROVENANCE = join(ROOT, 'public/wasm/wasm-provenance.json')
const HSM = process.env.HSM_REPO_PATH ?? resolve(ROOT, '..', 'pqctoday-hsm')

// ── Git access (read-only, by commit) ────────────────────────────────────────

/** See scripts/ci/check-wasm-provenance.ts: hook env vars would redirect -C. */
const cleanGitEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env }
  for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX', 'GIT_COMMON_DIR'])
    delete env[k]
  return env
}
const git = (...args: string[]): string =>
  execFileSync('git', ['-C', HSM, ...args], {
    encoding: 'utf8',
    env: cleanGitEnv(),
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
const gitOk = (...args: string[]): boolean => {
  try {
    git(...args)
    return true
  } catch {
    return false
  }
}
const resolveCommit = (ref: string): string => git('rev-parse', '--verify', `${ref}^{commit}`).trim()
const commitDate = (commit: string): string => git('log', '-1', '--format=%cs', commit).trim()
const countBetween = (from: string, to: string): number =>
  Number(git('rev-list', '--count', `${from}..${to}`).trim())
/**
 * Like countBetween, but a commit that changed ONLY report files is not
 * counted: the commit that stores a fresh report necessarily comes after the
 * engine commit it was run at, and must not make that report look stale.
 */
const engineCommitsBetween = (from: string, to: string): number =>
  Number(
    git(
      'rev-list',
      '--count',
      `${from}..${to}`,
      '--',
      '.',
      ...REPORT_FILES.map((f) => `:(exclude)${f}`)
    ).trim()
  )
/** Whether any remote-tracking branch of the hsm checkout contains the commit. */
const onAnyRemote = (commit: string): boolean =>
  git('branch', '-r', '--contains', commit).trim().length > 0
const isAncestor = (a: string, b: string): boolean => gitOk('merge-base', '--is-ancestor', a, b)
const showAt = (commit: string, path: string): string => git('show', `${commit}:${path}`)
/** Last commit at or before `at` that changed `path`. */
const lastChange = (at: string, path: string): string =>
  git('log', '-1', '--format=%H', at, '--', path).trim()

// ── Suite definitions (paths in pqctoday-hsm) ────────────────────────────────

const CPP_SOURCE = 'p11_v32_compliance_test.cpp'
const CPP_JSON = 'cpp_compliance_report.json'
const CPP_MD = 'cpp_compliance_report.md'
const RUST_SOURCE = 'rust/test_p11_conformance.js'
const RUST_MD = 'rust/RUST_P11_V32_CONFORMANCE_REPORT.md'
const DIFF_SOURCE = 'tests/differential/p11_diff.cpp'
const DIFF_RUNNER = 'scripts/run-differential-harness.sh'
const REPORT_FILES = [CPP_JSON, CPP_MD, RUST_MD]

interface ProvenanceBundle {
  name: string
  hsmCommit?: string
}

const wasmComparison = (
  engineCommit: string,
  bundleName: string,
  bundles: ProvenanceBundle[]
): NativeSuiteWasmComparison | null => {
  const b = bundles.find((x) => x.name === bundleName)
  if (!b?.hsmCommit) return null
  const bundleHsmCommit = resolveCommit(b.hsmCommit)
  return {
    bundle: bundleName,
    bundleHsmCommit,
    engineCommitEqualsBundleCommit: bundleHsmCommit === engineCommit,
    commitsFromEngineToBundle: countBetween(engineCommit, bundleHsmCommit),
    commitsFromBundleToEngine: countBetween(bundleHsmCommit, engineCommit),
  }
}

/** Gaps that follow from the imported facts — derived, never hand-listed per run. */
const derivedGaps = (
  r: NonNullable<NativeSuiteRecord['report']>,
  engineLabel: string,
  pinnedCommitPublished: boolean
): string[] => {
  const gaps: string[] = []
  if (!pinnedCommitPublished)
    gaps.push(
      'The pinned hsm commit holding this report is an unpushed local commit (on no pqctoday-hsm remote branch): nobody else can fetch or verify it until it is pushed.'
    )
  if (r.hostPlatform === 'not recorded')
    gaps.push('The report does not record the host OS or CPU architecture it ran on.')
  if (r.target === 'not recorded')
    gaps.push('The report does not record the build target (platform/ABI) of the engine under test.')
  if (r.staleness.commitsFromEngineToPinnedMain > 0)
    gaps.push(
      `The report was produced at an engine commit ${r.staleness.commitsFromEngineToPinnedMain} hsm commit(s) behind the pinned hsm commit (report-only commits not counted); re-running the suite in pqctoday-hsm is needed for current results.`
    )
  if (!r.staleness.engineCommitOnPinnedMainHistory)
    gaps.push('The engine commit is not in the pinned hsm commit’s history (a branch build).')
  if (r.wasm && !r.wasm.engineCommitEqualsBundleCommit)
    gaps.push(
      `The engine commit differs from the commit this Hub’s ${engineLabel} WASM bundle was built from, so these results are not results for the engine running in this browser.`
    )
  if (r.caseIdentity === 'derived-from-transcript')
    gaps.push(
      'The harness assigns no case ids: ids are derived from section heading + check label (ordinal-suffixed where a label repeats), and change if the harness rewords a label.'
    )
  if (r.counts.skip === null)
    gaps.push('The harness has no skip status: an unsupported case can only pass or fail.')
  return gaps
}

export const buildNativeConformance = (pin: string): NativeConformanceFile => {
  const provenance = JSON.parse(readFileSync(PROVENANCE, 'utf8')) as {
    hsmRepo: string
    bundles: ProvenanceBundle[]
  }
  const pinned = resolveCommit(pin)
  const pinnedCommitPublished = onAnyRemote(pinned)

  const staleness = (engineCommit: string) => ({
    commitsFromEngineToPinnedMain: engineCommitsBetween(engineCommit, pinned),
    engineCommitOnPinnedMainHistory: isAncestor(engineCommit, pinned),
  })

  // C++ — native suite (dlopen of the built library).
  const cpp = parseCppReport(showAt(pinned, CPP_JSON), showAt(pinned, CPP_MD))
  const cppEngine = resolveCommit(cpp.engineCommit)
  const cppReportCommit = lastChange(pinned, CPP_JSON)
  const cppReport: NonNullable<NativeSuiteRecord['report']> = {
    reportCommit: cppReportCommit,
    reportCommitDate: commitDate(cppReportCommit),
    reportDate: cpp.reportDate,
    engineCommit: cppEngine,
    engineCommitAsStated: cpp.engineCommit,
    engineCommitDate: commitDate(cppEngine),
    engineAsStated: cpp.engineAsStated,
    target: 'not recorded',
    hostPlatform: 'not recorded',
    counts: cpp.counts,
    groups: cpp.groups,
    caseIdentity: 'suite-assigned',
    caseIdScheme: '<category>/<test> from cpp_compliance_report.json',
    staleness: staleness(cppEngine),
    wasm: wasmComparison(cppEngine, 'softhsm-cpp-engine', provenance.bundles),
    cases: cpp.cases,
  }

  // Rust — the harness drives a wasm32 build of the engine outside the browser.
  const rust = parseRustReport(showAt(pinned, RUST_MD))
  const rustEngine = resolveCommit(rust.engineCommitAsStated)
  const rustReportCommit = lastChange(pinned, RUST_MD)
  const rustReport: NonNullable<NativeSuiteRecord['report']> = {
    reportCommit: rustReportCommit,
    reportCommitDate: commitDate(rustReportCommit),
    reportDate: rust.reportDate,
    engineCommit: rustEngine,
    engineCommitAsStated: rust.engineCommitAsStated,
    engineCommitDate: commitDate(rustEngine),
    engineAsStated: rust.engineAsStated,
    target: rust.target,
    hostPlatform: 'not recorded',
    counts: rust.counts,
    groups: rust.groups,
    caseIdentity: rust.caseIdentity,
    caseIdScheme:
      '<section> › <check label>[ #n] from the report’s "Full transcript" (harness assigns no ids)',
    staleness: staleness(rustEngine),
    wasm: wasmComparison(rustEngine, 'softhsmrustv3-engine', provenance.bundles),
    cases: rust.cases,
  }

  // Cross-engine differential harness — reports are written to build_union/,
  // never committed, so there is nothing to import.
  const diffCommitted = git('ls-tree', '-r', '--name-only', pinned)
    .split('\n')
    .filter((p) => /p11_diff_report\.(md|json)$/.test(p))

  const suites: NativeSuiteRecord[] = [
    {
      id: 'cpp-p11-v32-compliance',
      name: 'C++ engine (softhsmv3) PKCS#11 v3.2 compliance suite',
      engine: 'cpp',
      sourceFile: CPP_SOURCE,
      reportFiles: [CPP_JSON, CPP_MD],
      report: cppReport,
      openGaps: derivedGaps(cppReport, 'C++', pinnedCommitPublished),
    },
    {
      id: 'rust-p11-v32-conformance',
      name: 'Rust engine (softhsmrustv3) PKCS#11 v3.2 conformance harness',
      engine: 'rust',
      sourceFile: RUST_SOURCE,
      reportFiles: [RUST_MD],
      report: rustReport,
      openGaps: derivedGaps(rustReport, 'Rust', pinnedCommitPublished),
    },
    {
      id: 'cross-engine-differential',
      name: 'Cross-engine (C++ vs Rust) differential harness',
      engine: 'cross-engine',
      sourceFile: DIFF_SOURCE,
      reportFiles: diffCommitted,
      report: null,
      openGaps:
        diffCommitted.length === 0
          ? [
              `No committed report: ${DIFF_RUNNER} writes build_union/p11_diff_report.{md,json}, which pqctoday-hsm does not check in, so there are no results, counts or case ids to surface.`,
            ]
          : [
              `A differential report is committed (${diffCommitted.join(', ')}) but this importer does not parse it yet.`,
            ],
    },
  ]

  return {
    _comment:
      'GENERATED by scripts/import-native-conformance.ts — do not edit. WS-G G-6: the pqctoday-hsm engines’ own PKCS#11 v3.2 conformance suites, IMPORTED from the reports hsm committed (read with git show at hsm.pinnedCommit). Nothing here was executed by the Hub or in a browser. Target/host fields say "not recorded" unless the report states them. Staleness counts are engine commits (report-only commits excluded) between each report’s engine commit and hsm.pinnedCommit; hsm.pinnedCommitPublished=false means the pinned commit is an unpushed local hsm commit; wasm.* compares each report’s engine commit with the commit the Hub’s own WASM bundle was built from.',
    schema: NATIVE_CONFORMANCE_SCHEMA,
    generator: 'scripts/import-native-conformance.ts',
    hsm: {
      repo: provenance.hsmRepo,
      pinnedCommit: pinned,
      pinnedCommitDate: commitDate(pinned),
      pinnedCommitPublished,
    },
    wasmProvenanceFile: relative(ROOT, PROVENANCE),
    suites,
  }
}

const formatJson = async (value: unknown, filepath: string): Promise<string> => {
  const config = await resolveConfig(filepath)
  return format(JSON.stringify(value, null, 2), { ...config, filepath, parser: 'json' })
}

/** Report files hsm main has committed since the pin (→ re-pin and re-import). */
const newerReportsOnMain = (pin: string, main: string): string[] =>
  REPORT_FILES.filter((f) => lastChange(main, f) !== lastChange(pin, f))

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2)
  const check = argv.includes('--check')
  const fileArg = argv.indexOf('--file')
  const target = fileArg >= 0 ? resolve(argv[fileArg + 1]) : NATIVE_CONFORMANCE_OUT
  const rel = relative(ROOT, target)

  if (!existsSync(join(HSM, '.git'))) {
    const msg = `pqctoday-hsm not found at ${HSM} — cannot read its reports.`
    if (check) {
      console.log(`⏭  ${msg} Skipping ${rel} freshness check.`)
      return
    }
    console.error(`✗ ${msg} Set HSM_REPO_PATH.`)
    process.exit(2)
  }
  if (!gitOk('cat-file', '-e', `${PINNED_HSM_COMMIT}^{commit}`)) {
    const msg = `pinned hsm commit ${PINNED_HSM_COMMIT.slice(0, 10)} is not in ${HSM} — fetch it.`
    if (check) {
      console.log(`⏭  ${msg} Skipping ${rel} freshness check.`)
      return
    }
    console.error(`✗ ${msg}`)
    process.exit(2)
  }

  const file = buildNativeConformance(PINNED_HSM_COMMIT)
  const formatted = await formatJson(file, NATIVE_CONFORMANCE_OUT)
  for (const s of file.suites) {
    const r = s.report
    console.log(
      r
        ? `${s.id}: ${r.counts.pass} pass / ${r.counts.fail} fail / ${r.counts.skip ?? '—'} skip ` +
            `(${r.cases.length} case ids), engine ${r.engineCommit.slice(0, 10)} ` +
            `${r.staleness.commitsFromEngineToPinnedMain} engine commits behind the pin, ` +
            `wasm ${r.wasm?.engineCommitEqualsBundleCommit ? 'same commit' : 'different commit'}`
        : `${s.id}: no committed report`
    )
  }

  if (check) {
    const onDisk = existsSync(target) ? readFileSync(target, 'utf8') : null
    if (onDisk !== formatted) {
      console.error(
        `✗ ${rel} is ${onDisk === null ? 'missing' : 'STALE or hand-edited'}. Run: npm run import:native-conformance`
      )
      process.exit(1)
    }
    const liveMain = gitOk('rev-parse', '--verify', 'origin/main')
      ? resolveCommit('origin/main')
      : null
    if (liveMain && !isAncestor(PINNED_HSM_COMMIT, liveMain))
      console.log(
        `ℹ  the pin ${PINNED_HSM_COMMIT.slice(0, 10)} is not on hsm origin/main (${liveMain.slice(0, 10)})` +
          (file.hsm.pinnedCommitPublished ? ' (a pushed branch commit).' : ' and is on no remote: an unpushed local commit.')
      )
    if (liveMain && liveMain !== PINNED_HSM_COMMIT && isAncestor(PINNED_HSM_COMMIT, liveMain)) {
      const newer = newerReportsOnMain(PINNED_HSM_COMMIT, liveMain)
      if (newer.length > 0) {
        console.error(
          `✗ hsm origin/main (${liveMain.slice(0, 10)}) has newer committed reports than the pin: ${newer.join(', ')}. ` +
            'Move PINNED_HSM_COMMIT in scripts/import-native-conformance.ts and re-import.'
        )
        process.exit(1)
      }
      console.log(
        `ℹ  hsm origin/main is ${countBetween(PINNED_HSM_COMMIT, liveMain)} commit(s) past the pin with no newer reports; ` +
          'staleness counts in the file are relative to the pin.'
      )
    }
    console.log(`✓ ${rel} is current`)
    return
  }
  writeFileSync(target, formatted)
  console.log(`Wrote ${rel}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e)
    process.exit(1)
  })
}
