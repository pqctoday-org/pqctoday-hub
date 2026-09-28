// SPDX-License-Identifier: GPL-3.0-only
/**
 * TEST GATE-REACHABILITY CHECK  (`npm run audit:test-reachability`)
 *
 * WHY THIS EXISTS
 * ---------------
 * A test file can exist, run, and FAIL, while no gate ever executes it. That is
 * not a hypothetical: on 2026-09-26 three separate misses came from it in one
 * day, and twice an honest "0 failures" was reported by a command that
 * structurally could not execute the file being asked about:
 *
 *   • `npm run test:local` resolves ONLY `**\/*.local.test.{ts,tsx}`
 *     (vitest.local.config.ts `include`), so a plain `*.test.ts` is invisible
 *     to it no matter which path you pass as a positional filter.
 *   • `npm run gate:pkcs11` narrows to
 *     src/components/Playground/{hsm,tabs,dev,learnkit} +
 *     HsmPlayground.test.tsx + src/wasm/softhsm, so anything outside those
 *     paths is invisible to it — e.g.
 *     src/components/PKILearning/modules/HybridCrypto/services/hpkeService.test.ts,
 *     which had 54 genuine failures at the time.
 *   • `gate:pkcs11` itself is wired into NO gate — not ci.yml, not
 *     .husky/pre-push, not gate:local/gate:release. It is a manual command
 *     documented in TESTING.md. Whatever only it covers is covered by nobody.
 *
 * WHAT IT DOES
 * ------------
 * 1. Enumerates every test-shaped file in the repo (tinyglobby — the same
 *    globber vitest itself uses — minus git-ignored paths).
 * 2. Asks the REAL tools which files each enforced gate would run:
 *      - `vitest list --filesOnly --json [--config X] [filters…]`
 *      - `playwright test --list --reporter=json --project=P`
 *    We never re-implement glob/filter semantics. A hand-rolled matcher that is
 *    subtly different produces a wrong answer that looks authoritative, which is
 *    the exact failure mode this check exists to eliminate.
 * 3. Fails, naming every file no enforced gate would run ("orphan"), with the
 *    reason.
 * 4. Proves itself non-vacuous on every run (see assertNonVacuous below): a
 *    sentinel file that MUST be reached is asserted reached, and a synthetic
 *    path that cannot exist is asserted orphaned. A reachability checker that
 *    reports "0 orphans" because its own matching broke would be the same class
 *    of defect it is meant to catch.
 *
 * AND IT IS ITSELF GATED. The obvious irony to avoid was shipping a check for
 * ungated checks as the only ungated check. `npm run audit:test-reachability` is
 * a step of `gate:local` (package.json), i.e. it runs on every push via
 * .husky/pre-push, immediately before the unit suites — so a new test file that
 * no gate would run fails the push that adds it, which is the only moment the
 * information is cheap to act on. Its own test file
 * (check-test-reachability.test.ts) sits under the default vitest include with no
 * positional filter, so `ci:test` runs it too; that is asserted every run as
 * non-vacuity direction 1.
 *
 * The gate table below is derived by READING .github/workflows/*.yml,
 * .husky/pre-push and package.json — not by grepping the workflows for script
 * names. Grep gives false negatives here: ci.yml never mentions `test:local:cacp`
 * or `validate:data`; it invokes `gate:cacp` / `gate:data`, which invoke them.
 * Aggregates must be traced through. `ci.yml → test` (`npx vitest run --shard`)
 * is the positive control: it is visible verbatim in the workflow, and the
 * tracing below must — and does — find it.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { glob } from 'tinyglobby'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

/** Where a gate runs. github-ci/nightly-ci/local-pre-push are ENFORCED on every
 *  push (a push cannot skip the local tier without `--no-verify`).
 *  `local-release` is `npm run gate:release` — not run on every push, because it
 *  needs a production build first, but it IS the gate that has to pass before a
 *  release and it writes the `.gate-ok-<sha>` receipt .husky/pre-push honours.
 *  Anything not in this table is a manual command covered by nobody. */
type Tier = 'github-ci' | 'nightly-ci' | 'local-pre-push' | 'local-release'

type Gate =
  | {
      kind: 'vitest'
      id: string
      tier: Tier
      /** Where this invocation is written down — cite, don't infer. */
      source: string
      /** vitest --config, or null for the default (vite.config.ts). */
      config: string | null
      /** Positional path filters (vitest substring-matches these against file paths). */
      filters: string[]
    }
  | {
      kind: 'playwright'
      id: string
      tier: Tier
      source: string
      project: string
    }

/**
 * THE ENFORCED-GATE TOPOLOGY.
 *
 * Adding a test-running step to CI or to .husky/pre-push without adding it here
 * makes this check UNDER-report reachability (it will call reached files
 * orphans) — which fails loudly. The opposite mistake (listing a gate that no
 * longer runs) makes it OVER-report reachability, which is silent, so keep the
 * `source` field accurate and re-read it when the workflows change.
 */
export const GATES: Gate[] = [
  // ci.yml job `test`, matrix shard 1..2: `npx vitest run --shard=N/2`.
  // Default config, NO positional filter -> every file vitest's own
  // include/exclude resolves. `--shard` only partitions that set, so the union
  // over shards is exactly the unfiltered set. This is the positive control.
  {
    kind: 'vitest',
    id: 'ci:test (vitest shards 1-2)',
    tier: 'github-ci',
    source: '.github/workflows/ci.yml job "test": npx vitest run --shard=${{ matrix.shard }}/2',
    config: null,
    filters: [],
  },
  // ci.yml job `gate-cacp` -> `npm run gate:cacp`, whose FIRST leg is
  // `npm run test -- src/components/Playground/kmip src/wasm/kmip`.
  // A strict subset of the gate above; listed because the gate table must
  // mirror what CI actually invokes, not a minimised equivalent.
  {
    kind: 'vitest',
    id: 'ci:gate-cacp (vitest, kmip paths)',
    tier: 'github-ci',
    source:
      '.github/workflows/ci.yml job "gate-cacp": npm run gate:cacp -> npm run test -- <kmip paths>',
    config: null,
    filters: ['src/components/Playground/kmip', 'src/wasm/kmip'],
  },
  // ci.yml job `gate-cacp` -> `npm run gate:cacp` -> `npm run test:local:cacp`
  // = `vitest run --config vitest.local.config.ts <kmip paths>`.
  // THE ONLY place any CI job runs the *.local.test.* tier. Everything in that
  // tier outside these two paths is CI-unreachable by construction.
  {
    kind: 'vitest',
    id: 'ci:gate-cacp (vitest local config, kmip paths)',
    tier: 'github-ci',
    source:
      '.github/workflows/ci.yml job "gate-cacp": npm run gate:cacp -> npm run test:local:cacp',
    config: 'vitest.local.config.ts',
    filters: ['src/components/Playground/kmip', 'src/wasm/kmip'],
  },
  // ci.yml job `checks` -> `npm run test:e2e:ci-smoke` = `playwright test --project=smoke`.
  {
    kind: 'playwright',
    id: 'ci:checks (playwright smoke)',
    tier: 'github-ci',
    source: '.github/workflows/ci.yml job "checks": npm run test:e2e:ci-smoke',
    project: 'smoke',
  },
  // e2e-nightly.yml (cron 07:00 UTC) -> `npx playwright test --project=chromium --shard`.
  // Scheduled, not a PR gate, but it IS a CI gate that opens/updates an issue
  // when red — so a file it runs is not an orphan.
  {
    kind: 'playwright',
    id: 'nightly:e2e-full (playwright chromium)',
    tier: 'nightly-ci',
    source: '.github/workflows/e2e-nightly.yml: npx playwright test --project=chromium --shard',
    project: 'chromium',
  },
  // ADDED 2026-09-26: validation-nightly.yml (cron 05:00 UTC) -> `npm run
  // test:nightly` = `vitest run --config vitest.nightly.config.ts`, UNSCOPED, so
  // every `*.nightly.test.{ts,tsx}` runs. Opens/updates a "Nightly validation
  // vectors are red" issue when red, so like the e2e nightly a file it runs is
  // reached, not orphaned — but only once a day, which is why the venue is
  // reserved for suites too slow for pre-push (maintainer decision 2026-09-26).
  {
    kind: 'vitest',
    id: 'nightly:validation-vectors (vitest nightly config)',
    tier: 'nightly-ci',
    source: '.github/workflows/validation-nightly.yml: npm run test:nightly',
    config: 'vitest.nightly.config.ts',
    filters: [],
  },
  // .husky/pre-push -> `npm run gate:local` -> ... `&& npm run test` (unfiltered,
  // default config). Same file set as ci:test; encoded so the redundancy between
  // the two tiers is visible rather than assumed.
  {
    kind: 'vitest',
    id: 'local:gate:local (npm run test)',
    tier: 'local-pre-push',
    source: '.husky/pre-push: npm run gate:local -> ... && npm run test',
    config: null,
    filters: [],
  },
  // .husky/pre-push -> `npm run gate:cacp` (same two legs as the CI job above).
  {
    kind: 'vitest',
    id: 'local:gate:cacp (vitest, kmip paths)',
    tier: 'local-pre-push',
    source: '.husky/pre-push: npm run gate:cacp -> npm run test -- <kmip paths>',
    config: null,
    filters: ['src/components/Playground/kmip', 'src/wasm/kmip'],
  },
  {
    kind: 'vitest',
    id: 'local:gate:cacp (vitest local config, kmip paths)',
    tier: 'local-pre-push',
    source: '.husky/pre-push: npm run gate:cacp -> npm run test:local:cacp',
    config: 'vitest.local.config.ts',
    filters: ['src/components/Playground/kmip', 'src/wasm/kmip'],
  },
  // ADDED 2026-09-26, closing the 69-file local-tier hole this check found on
  // its first run: `.husky/pre-push` -> `npm run gate:local` -> ...
  // `&& npm run test:local`, UNSCOPED (no positional filter), so every
  // `*.local.test.{ts,tsx}` in the repo runs on every push. Before this, the
  // ONLY enforced invocation of vitest.local.config.ts was test:local:cacp's
  // two kmip paths, and the other 69 files in that tier were run by nothing.
  // Measured cheap: all of them were already green.
  {
    kind: 'vitest',
    id: 'local:gate:local (npm run test:local, unscoped)',
    tier: 'local-pre-push',
    source: '.husky/pre-push: npm run gate:local -> ... && npm run test:local',
    config: 'vitest.local.config.ts',
    filters: [],
  },
  // ADDED 2026-09-26, closing the local-tier E2E hole: `npm run gate:release`
  // -> `npm run test:e2e:local-tier` = `E2E_SERVER=dev playwright test
  // --project=local` (testMatch '**\/*.local.spec.ts'). On gate:release rather
  // than .husky/pre-push for TIME: 18 WASM/crypto/WebGL specs is minutes, and
  // pre-push already carries the whole unit suite plus test:local. `E2E_SERVER=dev`
  // matches every other local-tier script in package.json — several of these
  // specs `page.evaluate`-import source modules, which resolves under the dev
  // server and not against a `vite preview` bundle. `source` cites package.json
  // rather than a workflow/hook file because gate:release genuinely is not
  // invoked from either; that exception is asserted in the accompanying test.
  {
    kind: 'playwright',
    id: 'release:gate:release (playwright local project)',
    tier: 'local-release',
    source:
      'package.json "gate:release": ... && npm run test:e2e:local-tier (= E2E_SERVER=dev playwright test --project=local)',
    project: 'local',
  },
]

/**
 * ALLOWLIST — files deliberately outside every enforced gate.
 *
 * Keep it SMALL and give every entry a reason plus the decision that made it
 * one. An entry that is actually reached, or that names a file that no longer
 * exists, is reported as a stale allowlist entry and FAILS: a rotting allowlist
 * is how a real orphan gets hidden.
 */
export const ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'e2e/sim-mobile.spec.ts',
    // VERIFIED against playwright.config.ts (2026-09-26), not taken on trust:
    //  - It is in MOBILE_SMOKE_SPECS and NOT in SMOKE_SPECS, so `--project=smoke`
    //    (the PR gate) cannot match it.
    //  - `--project=chromium` (nightly) lists it in `testIgnore`
    //    ('**/sim-mobile.spec.ts') — it has no viewport override of its own and
    //    every test in it failed a nightly run at Desktop Chrome width.
    //  - `--project=mobile-smoke` is the only project that matches it, and that
    //    project is deliberately NOT wired into ci.yml ("NOT yet CI-gated …
    //    that's a separate decision about CI time/cost budget"). Confirmed:
    //    `grep -rn 'mobile-smoke' .github/ .husky/ package.json` -> no hits.
    // Run it explicitly: `npx playwright test --project=mobile-smoke e2e/sim-mobile.spec.ts`.
    reason:
      'mobile-smoke-only spec; the mobile-smoke playwright project is deliberately not CI-gated (playwright.config.ts)',
  },
]

const SENTINEL_REACHED = 'scripts/ci/check-test-reachability.test.ts'
const SENTINEL_REACHED_E2E = 'e2e/basic.spec.ts'
const SENTINEL_SYNTHETIC_ORPHAN = 'src/__reachability_probe__/synthetic-orphan.test.ts'

/** Every test-shaped file in the repo, POSIX-relative to ROOT, git-ignored paths removed. */
export async function enumerateUniverse(): Promise<string[]> {
  // Same pattern shape as vitest's own default `include`, so nothing test-shaped
  // can fall outside the universe while still being matched by some config.
  const files = await glob(['**/*.{test,spec}.?(c|m)[jt]s?(x)'], {
    cwd: ROOT,
    ignore: ['**/node_modules/**'],
    dot: false,
  })
  const normalised = files.map((f) => f.split(path.sep).join('/')).sort()
  return dropGitIgnored(normalised)
}

function dropGitIgnored(files: string[]): string[] {
  if (files.length === 0) return files
  // `git check-ignore --stdin` prints only the ignored paths; exit 1 just means
  // "none matched", which is not an error here.
  let out = ''
  try {
    out = execFileSync('git', ['check-ignore', '--stdin'], {
      cwd: ROOT,
      input: files.join('\n'),
      encoding: 'utf8',
    })
  } catch (err) {
    const e = err as { status?: number; stdout?: string }
    if (e.status === 1) out = e.stdout ?? ''
    else throw err
  }
  const ignored = new Set(out.split('\n').filter(Boolean))
  return files.filter((f) => !ignored.has(f))
}

function run(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // A tool that writes progress to stderr must not pollute the JSON we parse.
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: process.env.CI ?? '', FORCE_COLOR: '0' },
  })
}

/** Ask vitest itself which files this invocation resolves. */
function resolveVitest(gate: Extract<Gate, { kind: 'vitest' }>): string[] {
  // `--json` MUST be last: it is declared as `--json [path]`, so any positional
  // that follows it is swallowed as an output FILE PATH instead of a test filter
  // (with a directory filter that surfaces as `EISDIR … writeFileSync`). With
  // nothing after it, it stays boolean and the list goes to stdout.
  const args = ['vitest', 'list', '--filesOnly']
  if (gate.config) args.push('--config', gate.config)
  args.push(...gate.filters, '--json')
  const raw = run('npx', args)
  const parsed = JSON.parse(sliceJson(raw)) as { file: string }[]
  return parsed.map((e) => path.relative(ROOT, e.file).split(path.sep).join('/'))
}

/** Ask playwright itself which files this project resolves. */
function resolvePlaywright(gate: Extract<Gate, { kind: 'playwright' }>): string[] {
  const raw = run('npx', [
    'playwright',
    'test',
    '--list',
    '--reporter=json',
    `--project=${gate.project}`,
  ])
  const parsed = JSON.parse(sliceJson(raw)) as {
    config: { rootDir: string }
    suites?: { file?: string; specs?: { file?: string }[] }[]
  }
  const rootDir = parsed.config.rootDir
  const files = new Set<string>()
  const walk = (nodes: unknown[]): void => {
    for (const n of nodes) {
      const node = n as { file?: string; specs?: unknown[]; suites?: unknown[] }
      if (node.file) files.add(node.file)
      if (Array.isArray(node.specs)) walk(node.specs)
      if (Array.isArray(node.suites)) walk(node.suites)
    }
  }
  walk(parsed.suites ?? [])
  return [...files].map((f) =>
    path.relative(ROOT, path.resolve(rootDir, f)).split(path.sep).join('/')
  )
}

/** Both CLIs may print a banner before the JSON; take from the first `[`/`{`. */
function sliceJson(raw: string): string {
  const i = raw.search(/[[{]/)
  if (i < 0) throw new Error(`no JSON in tool output:\n${raw.slice(0, 2000)}`)
  return raw.slice(i)
}

export function resolveGate(gate: Gate): string[] {
  return gate.kind === 'vitest' ? resolveVitest(gate) : resolvePlaywright(gate)
}

export type Report = {
  universe: string[]
  /** file -> gate ids that would run it. */
  reached: Map<string, string[]>
  orphans: { file: string; reason: string }[]
  staleAllowlist: { file: string; reason: string }[]
}

/**
 * PURE. Given the universe, each gate's resolved file set, and the allowlist,
 * decide what is orphaned. Kept free of I/O so the accompanying test can prove
 * it in both directions without shelling out.
 */
export function computeReport(
  universe: string[],
  resolved: Map<string, string[]>,
  allowlist: { file: string; reason: string }[] = ALLOWLIST
): Report {
  const reached = new Map<string, string[]>()
  for (const file of universe) reached.set(file, [])
  for (const [gateId, files] of resolved) {
    for (const f of files) {
      const cur = reached.get(f)
      if (cur) cur.push(gateId)
      // A gate resolving a file outside the universe would mean the universe
      // glob is too narrow. Surfaced by assertNonVacuous, not silently dropped.
      else reached.set(f, [gateId])
    }
  }
  const allowed = new Map(allowlist.map((a) => [a.file, a.reason]))
  const orphans: { file: string; reason: string }[] = []
  for (const file of universe) {
    if ((reached.get(file) ?? []).length > 0) continue
    if (allowed.has(file)) continue
    orphans.push({ file, reason: reasonFor(file) })
  }
  const staleAllowlist = allowlist
    .filter((a) => (reached.get(a.file) ?? []).length > 0 || !universe.includes(a.file))
    .map((a) => ({
      file: a.file,
      reason: !universe.includes(a.file)
        ? 'allowlisted file does not exist (or is git-ignored) — drop the entry'
        : `allowlisted but actually reached by: ${(reached.get(a.file) ?? []).join(', ')} — drop the entry`,
    }))
  return { universe, reached, orphans, staleAllowlist }
}

/** Human-readable WHY, derived from the file's own shape + the gate table. */
function reasonFor(file: string): string {
  if (/\.local\.test\.(ts|tsx)$/.test(file)) {
    return 'local-tier unit suite: only vitest.local.config.ts includes it. Since 2026-09-26 `gate:local` runs `npm run test:local` UNSCOPED, so reaching this branch means the file is excluded by that config too (check its exclude list, and that the filename really ends .local.test.ts/.tsx) — not merely that the CI-side invocation (test:local:cacp, scoped to src/components/Playground/kmip + src/wasm/kmip) misses it. Note `gate:pkcs11` is still wired into no gate.'
  }
  if (/\.local\.spec\.(ts|tsx)$/.test(file)) {
    return "local-tier e2e spec: matched only by the playwright `local` project. Since 2026-09-26 `gate:release` runs that project (test:e2e:local-tier), so reaching this branch means the `local` project does not match it either — check playwright.config.ts's testMatch ('**/*.local.spec.ts') and testDir. Neither CI project can match it (both exclude '**/*.local.spec.ts')."
  }
  if (file.startsWith('e2e/')) {
    return 'e2e spec matched by no CI-run playwright project (not in SMOKE_SPECS, and excluded from or unmatched by the chromium project).'
  }
  return "no enforced gate's resolved file set contains it (check vite.config.ts `test.exclude` and each gate's positional path filters)."
}

/**
 * NON-VACUITY, asserted on every real run.
 *
 * Direction 1: a file we KNOW is reached must be reported reached.
 * Direction 2: a path that cannot be reached must be reported orphaned.
 * Direction 3: no gate may resolve a file the universe glob missed.
 * If any of these breaks, the "0 orphans" this tool might otherwise print is
 * worthless, so it is a hard failure rather than a warning.
 */
function assertNonVacuous(report: Report, resolved: Map<string, string[]>): string[] {
  const problems: string[] = []
  for (const sentinel of [SENTINEL_REACHED, SENTINEL_REACHED_E2E]) {
    if (!existsSync(path.join(ROOT, sentinel))) {
      problems.push(`non-vacuity sentinel is missing from the repo: ${sentinel}`)
      continue
    }
    if ((report.reached.get(sentinel) ?? []).length === 0) {
      problems.push(
        `non-vacuity FAILED (direction 1): ${sentinel} must be reached by an enforced gate but resolved to none — this tool's matching is broken, not the repo.`
      )
    }
  }
  const probe = computeReport([...report.universe, SENTINEL_SYNTHETIC_ORPHAN], resolved, ALLOWLIST)
  if (!probe.orphans.some((o) => o.file === SENTINEL_SYNTHETIC_ORPHAN)) {
    problems.push(
      `non-vacuity FAILED (direction 2): the synthetic unreachable path ${SENTINEL_SYNTHETIC_ORPHAN} was not reported as an orphan.`
    )
  }
  const universeSet = new Set(report.universe)
  for (const [gateId, files] of resolved) {
    for (const f of files) {
      if (!universeSet.has(f)) {
        problems.push(
          `non-vacuity FAILED (direction 3): gate "${gateId}" runs ${f}, which the universe glob did not find — the universe pattern is too narrow.`
        )
      }
    }
  }
  return problems
}

async function main(): Promise<void> {
  const asJson = process.argv.includes('--json')
  const universe = await enumerateUniverse()
  const resolved = new Map<string, string[]>()
  for (const gate of GATES) {
    if (!asJson) process.stderr.write(`resolving ${gate.id} …\n`)
    resolved.set(gate.id, resolveGate(gate))
  }
  const report = computeReport(universe, resolved)
  const problems = assertNonVacuous(report, resolved)

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          universeCount: universe.length,
          gates: GATES.map((g) => ({
            id: g.id,
            tier: g.tier,
            source: g.source,
            files: (resolved.get(g.id) ?? []).length,
          })),
          orphans: report.orphans,
          staleAllowlist: report.staleAllowlist,
          nonVacuityProblems: problems,
        },
        null,
        2
      )}\n`
    )
  } else {
    console.log('\n=== Test gate-reachability ===')
    console.log(
      `test-shaped files in repo (git-tracked/untracked, not ignored): ${universe.length}`
    )
    for (const g of GATES) {
      console.log(`  [${g.tier}] ${g.id}: ${(resolved.get(g.id) ?? []).length} files`)
      console.log(`      ${g.source}`)
    }
    const reachedCount = [...report.reached.values()].filter((v) => v.length > 0).length
    console.log(`reached by >=1 enforced gate: ${reachedCount}`)
    console.log(`allowlisted (deliberately ungated): ${ALLOWLIST.length}`)
    console.log(`ORPHANS: ${report.orphans.length}`)
    for (const o of report.orphans) console.log(`  ✗ ${o.file}\n      ${o.reason}`)
    for (const s of report.staleAllowlist)
      console.log(`  ! stale allowlist: ${s.file}\n      ${s.reason}`)
    for (const p of problems) console.log(`  !! ${p}`)
  }

  if (problems.length > 0 || report.orphans.length > 0 || report.staleAllowlist.length > 0) {
    process.exitCode = 1
  }
}

// `import.meta.main` is not available under tsx/node 22 for this entry shape;
// compare the resolved entry path instead so importing this module from a test
// never kicks off a multi-minute tool sweep.
const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.dirname, 'check-test-reachability.ts')
if (invokedDirectly) {
  await main()
}
