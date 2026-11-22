// SPDX-License-Identifier: AGPL-3.0-only
/**
 * TEST GATE-REACHABILITY CHECK  (`npm run audit:test-reachability`)
 *
 * WHY THIS EXISTS
 * ---------------
 * A test file can exist, run, and FAIL, while no gate ever executes it. That is
 * not a hypothetical: on 2026-09-26 three separate misses came from it in one
 * day, and twice an honest "0 failures" was reported by a command that
 * structurally could not execute the file being asked about.
 *
 * WHAT IT DOES
 * ------------
 * 1. Enumerates every test-shaped file in the repo (tinyglobby — the same
 *    globber vitest itself uses — minus git-ignored paths).
 * 2. Validates every declared gate against the ACTUAL workflow YAML jobs,
 *    `.husky/pre-push`, and `package.json` scripts (recursively expanding
 *    `npm run` chains). Listing a deleted CI job, a rerouted hook, or an
 *    unscoped gate whose script was narrowed to a single directory FAILS loud.
 * 3. Asks the REAL tools which files each enforced gate would run:
 *      - `vitest list --filesOnly --json [--config X] [filters…]`
 *      - `playwright test --list --reporter=json --project=P`
 *    We never re-implement glob/filter semantics.
 * 4. Fails, naming every file no enforced gate would run ("orphan"), with the
 *    reason, and every stale allowlist entry.
 * 5. Proves itself non-vacuous on every run (see assertNonVacuous below).
 *
 * AND IT IS ITSELF GATED. `npm run audit:test-reachability` runs in
 * `gate:prepush` (`.husky/pre-push`) and `gate:local`, verifying command wiring
 * and file reachability before push. Its own test file
 * (`scripts/ci/check-test-reachability.test.ts`) runs under `pr-test` and
 * `ci:test`, asserted every run as non-vacuity direction 1.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { glob } from 'tinyglobby'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

/**
 * Where a gate runs:
 * - `github-ci`: runs on GitHub Actions for PRs (`pr-check.yml`) or pushes to `main` (`ci.yml`).
 * - `nightly-ci`: runs on GitHub Actions on a daily schedule and opens/updates an issue when red.
 * - `local-pre-push`: invoked by `.husky/pre-push` on every push (currently no test suites run
 *   directly in `gate:prepush`; the hook runs static checks + `audit:test-reachability`).
 * - `local-release`: release-only local command (`gate:release` / `gate:release-local`) required
 *   before shipping a release; not invoked automatically by `.husky/pre-push`.
 */
export type Tier = 'github-ci' | 'nightly-ci' | 'local-pre-push' | 'local-release'

export type GateWiring =
  | {
      rootKind: 'workflow'
      /** Repo-relative path to the workflow file, e.g. `.github/workflows/ci.yml`. */
      file: string
      /** Exact job key under `jobs:` in the workflow file. */
      job: string
    }
  | {
      rootKind: 'hook'
      /** Repo-relative path to the git hook, e.g. `.husky/pre-push`. */
      file: string
    }
  | {
      rootKind: 'package-script'
      /** Always `package.json`. */
      file: 'package.json'
      /** Root npm script name, e.g. `gate:release` or `gate:release-local`. */
      script: string
    }

export type Gate =
  | {
      kind: 'vitest'
      id: string
      tier: Tier
      /** Human-readable citation of where this invocation lives. */
      source: string
      wiring: GateWiring
      /** vitest --config, or null for the default (vite.config.ts). */
      config: string | null
      /** Positional path filters (empty = unscoped). */
      filters: string[]
    }
  | {
      kind: 'playwright'
      id: string
      tier: Tier
      source: string
      wiring: GateWiring
      project: string
    }

/**
 * THE ENFORCED-GATE TOPOLOGY.
 *
 * Every entry's `wiring` is verified against the actual workflow YAML job,
 * hook file, or `package.json` script on every run (see `validateGateWiring`).
 * Manual-only commands (`gate:cacp`, `gate:pkcs11`) are deliberately excluded.
 */
export const GATES: Gate[] = [
  // PR check (`pr-check.yml`, pull_request -> main)
  {
    kind: 'vitest',
    id: 'pr:pr-test (vitest shards 1-3)',
    tier: 'github-ci',
    source:
      '.github/workflows/pr-check.yml job "pr-test": npx vitest run --shard=${{ matrix.shard }}/3',
    wiring: { rootKind: 'workflow', file: '.github/workflows/pr-check.yml', job: 'pr-test' },
    config: null,
    filters: [],
  },
  {
    kind: 'playwright',
    id: 'pr:pr-check (playwright playground-pr-desktop)',
    tier: 'github-ci',
    source:
      '.github/workflows/pr-check.yml job "pr-check": npx playwright test --project=playground-pr-desktop ...',
    wiring: { rootKind: 'workflow', file: '.github/workflows/pr-check.yml', job: 'pr-check' },
    project: 'playground-pr-desktop',
  },
  {
    kind: 'playwright',
    id: 'pr:pr-check (playwright playground-pr-mobile)',
    tier: 'github-ci',
    source:
      '.github/workflows/pr-check.yml job "pr-check": npx playwright test ... --project=playground-pr-mobile ...',
    wiring: { rootKind: 'workflow', file: '.github/workflows/pr-check.yml', job: 'pr-check' },
    project: 'playground-pr-mobile',
  },
  {
    kind: 'playwright',
    id: 'pr:pr-check (playwright a11y-modules-pr)',
    tier: 'github-ci',
    source:
      '.github/workflows/pr-check.yml job "pr-check": npx playwright test ... --project=a11y-modules-pr',
    wiring: { rootKind: 'workflow', file: '.github/workflows/pr-check.yml', job: 'pr-check' },
    project: 'a11y-modules-pr',
  },

  // Main CI (`ci.yml`, push -> main + workflow_dispatch)
  {
    kind: 'vitest',
    id: 'ci:test (vitest shards 1-3)',
    tier: 'github-ci',
    source: '.github/workflows/ci.yml job "test": npx vitest run --shard=${{ matrix.shard }}/3',
    wiring: { rootKind: 'workflow', file: '.github/workflows/ci.yml', job: 'test' },
    config: null,
    filters: [],
  },
  {
    kind: 'playwright',
    id: 'ci:checks (playwright smoke)',
    tier: 'github-ci',
    source:
      '.github/workflows/ci.yml job "checks": npm run test:e2e:ci-smoke (= playwright test --project=smoke)',
    wiring: { rootKind: 'workflow', file: '.github/workflows/ci.yml', job: 'checks' },
    project: 'smoke',
  },

  // Nightly CI (scheduled + workflow_dispatch, opens/updates GitHub issue on red)
  {
    kind: 'playwright',
    id: 'nightly:e2e-full (playwright chromium)',
    tier: 'nightly-ci',
    source:
      '.github/workflows/e2e-nightly.yml job "e2e-full": npx playwright test --project=chromium --shard',
    wiring: { rootKind: 'workflow', file: '.github/workflows/e2e-nightly.yml', job: 'e2e-full' },
    project: 'chromium',
  },
  {
    kind: 'vitest',
    id: 'nightly:validation-vectors (vitest nightly config)',
    tier: 'nightly-ci',
    source:
      '.github/workflows/validation-nightly.yml job "vectors": npm run test:nightly (= vitest run --config vitest.nightly.config.ts)',
    wiring: {
      rootKind: 'workflow',
      file: '.github/workflows/validation-nightly.yml',
      job: 'vectors',
    },
    config: 'vitest.nightly.config.ts',
    filters: [],
  },

  // Local release-only gates (`package.json`, NOT run by `.husky/pre-push`)
  {
    kind: 'vitest',
    id: 'release:gate:release (vitest default via gate:local)',
    tier: 'local-release',
    source: 'package.json "gate:release": ... -> gate:local -> npm run test',
    wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release' },
    config: null,
    filters: [],
  },
  {
    kind: 'vitest',
    id: 'release:gate:release (vitest local config via gate:local)',
    tier: 'local-release',
    source:
      'package.json "gate:release": ... -> gate:local -> npm run test:local (= vitest run --config vitest.local.config.ts)',
    wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release' },
    config: 'vitest.local.config.ts',
    filters: [],
  },
  {
    kind: 'vitest',
    id: 'release:gate:release-local (vitest local config)',
    tier: 'local-release',
    source:
      'package.json "gate:release-local": npm run test:local (= vitest run --config vitest.local.config.ts)',
    wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release-local' },
    config: 'vitest.local.config.ts',
    filters: [],
  },
  {
    kind: 'playwright',
    id: 'release:gate:release (playwright chromium via gate:e2e)',
    tier: 'local-release',
    source:
      'package.json "gate:release": ... -> gate:e2e -> npm run test:e2e:ci-full (= playwright test --project=chromium)',
    wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release' },
    project: 'chromium',
  },
  {
    kind: 'playwright',
    id: 'release:gate:release (playwright local project)',
    tier: 'local-release',
    source:
      'package.json "gate:release": ... && npm run test:e2e:local-tier (= E2E_SERVER=dev playwright test --project=local)',
    wiring: { rootKind: 'package-script', file: 'package.json', script: 'gate:release' },
    project: 'local',
  },
]

/**
 * ALLOWLIST — files deliberately outside every enforced gate.
 *
 * Keep it SMALL and give every entry a reason plus the decision that made it
 * one. An entry that is actually reached, or that names a file that no longer
 * exists, is reported as a stale allowlist entry and FAILS.
 */
export const ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'e2e/sim-mobile.spec.ts',
    reason:
      'mobile-smoke-only spec; the mobile-smoke playwright project is deliberately not CI-gated (playwright.config.ts)',
  },
]

const SENTINEL_REACHED = 'scripts/ci/check-test-reachability.test.ts'
const SENTINEL_REACHED_E2E = 'e2e/basic.spec.ts'
const SENTINEL_SYNTHETIC_ORPHAN = 'src/__reachability_probe__/synthetic-orphan.test.ts'

// ---------------------------------------------------------------------------
// Command wiring validation (verifies GATES against actual workflows / hooks / package.json)
// ---------------------------------------------------------------------------

/** Matches `npm run <name>` with optional `-- <forwarded args>` inside a single shell segment. */
const NPM_RUN_SEGMENT_RE = /\bnpm\s+run(?:-script)?\s+([A-Za-z0-9:_-]+)(?:\s+--\s+(.+))?$/

/** Split a shell command on `&&`, `||`, `;`, or newlines into individual command segments. */
function splitShellSegments(command: string): string[] {
  return command
    .split(/\s*(?:&&|\|\||;|\n)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('#'))
}

/**
 * Recursively expand `npm run <script>` segments through `package.json`'s `scripts` map,
 * returning all concrete leaf shell commands (with `-- <extraArgs>` appended when forwarded).
 */
export function expandNpmCommands(
  command: string,
  npmScripts: Record<string, string>,
  seen: Set<string> = new Set()
): string[] {
  const leaves: string[] = []
  for (const segment of splitShellSegments(command)) {
    const match = segment.match(NPM_RUN_SEGMENT_RE)
    if (match) {
      const scriptName = match[1]
      const forwardedArgs = match[2]?.trim()
      if (seen.has(scriptName)) continue
      const body = npmScripts[scriptName]
      if (!body) continue
      const nextSeen = new Set(seen)
      nextSeen.add(scriptName)
      const expanded = expandNpmCommands(body, npmScripts, nextSeen)
      if (forwardedArgs && expanded.length > 0) {
        // `npm run x -- args` appends args to the script's command.
        leaves.push(...expanded.map((leaf) => `${leaf} ${forwardedArgs}`))
      } else {
        leaves.push(...expanded)
      }
    } else {
      leaves.push(segment)
    }
  }
  return leaves
}

/**
 * Extract all `run:` step commands belonging to a named job under `jobs:` in a GitHub Actions YAML.
 * Handles single-line `run: ...` and block scalars (`run: |`, `run: >-`, `run: >`).
 */
export function extractWorkflowJobCommands(workflowYaml: string, jobName: string): string[] | null {
  const lines = workflowYaml.split('\n')
  let inJobs = false
  let jobIndent = -1
  let inTargetJob = false
  let foundJob = false
  const commands: string[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const indent = raw.length - raw.trimStart().length

    if (!inJobs) {
      if (indent === 0 && trimmed === 'jobs:') inJobs = true
      continue
    }

    if (indent === 0 && !trimmed.startsWith('-')) {
      // Left the `jobs:` top-level section.
      break
    }

    // Detect job keys directly under `jobs:`.
    const keyMatch = trimmed.match(/^([A-Za-z0-9_-]+):\s*$/)
    if (keyMatch && (jobIndent === -1 || indent === jobIndent)) {
      if (jobIndent === -1) jobIndent = indent
      if (keyMatch[1] === jobName) {
        inTargetJob = true
        foundJob = true
      } else if (inTargetJob) {
        break
      }
      continue
    }

    if (!inTargetJob) continue

    const runMatch = trimmed.match(/^(?:-\s+)?run:\s*(.*)$/)
    if (!runMatch) continue

    const rest = runMatch[1].trim()
    if (/^[|>][-+]?$/.test(rest)) {
      // Block scalar: collect all subsequent lines indented deeper than `run:`.
      const blockLines: string[] = []
      const runIndent = indent
      let j = i + 1
      while (j < lines.length) {
        const nextRaw = lines[j]
        const nextTrimmed = nextRaw.trim()
        if (nextTrimmed === '') {
          j += 1
          continue
        }
        const nextIndent = nextRaw.length - nextRaw.trimStart().length
        if (nextIndent <= runIndent) break
        blockLines.push(nextTrimmed)
        j += 1
      }
      i = j - 1
      commands.push(rest.startsWith('>') ? blockLines.join(' ') : blockLines.join('\n'))
    } else if (rest) {
      commands.push(rest)
    }
  }

  return foundJob ? commands : null
}

/** Extract non-comment command lines from a shell hook script (e.g. `.husky/pre-push`). */
export function extractHookCommands(hookText: string): string[] {
  return hookText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

/** Parse a single leaf `vitest` invocation into its config and positional path filters. */
function parseVitestInvocation(leaf: string): { config: string | null; filters: string[] } | null {
  const normalized = leaf.replace(/\$\{\{[^}]*\}\}/g, '__EXPR__')
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const vitestIdx = tokens.findIndex((t) => t === 'vitest' || t.endsWith('/vitest'))
  if (vitestIdx < 0) return null

  let config: string | null = null
  const filters: string[] = []
  const VALUE_FLAGS = new Set([
    '--config',
    '-c',
    '--shard',
    '--reporter',
    '--outputFile',
    '--pool',
    '--maxWorkers',
    '--minWorkers',
    '--testTimeout',
    '--hookTimeout',
    '--root',
    '-r',
    '--mode',
    '--dir',
  ])

  for (let i = vitestIdx + 1; i < tokens.length; i += 1) {
    const tok = tokens[i]
    if (i === vitestIdx + 1 && (tok === 'run' || tok === 'list' || tok === 'watch')) continue
    if (tok === '--') continue
    if (tok.startsWith('--config=')) {
      config = tok.slice('--config='.length)
      continue
    }
    if (tok === '--config' || tok === '-c') {
      config = tokens[i + 1] ?? null
      i += 1
      continue
    }
    if (tok.startsWith('-')) {
      if (!tok.includes('=') && VALUE_FLAGS.has(tok)) {
        i += 1
      }
      continue
    }
    filters.push(tok)
  }

  return { config, filters }
}

/** Parse a single leaf `playwright test` invocation into its declared `--project` list. */
function parsePlaywrightProjects(leaf: string): string[] | null {
  const normalized = leaf.replace(/\$\{\{[^}]*\}\}/g, '__EXPR__')
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const pwIdx = tokens.findIndex((t) => t === 'playwright' || t.endsWith('/playwright'))
  if (pwIdx < 0 || tokens[pwIdx + 1] !== 'test') return null

  const projects: string[] = []
  for (let i = pwIdx + 2; i < tokens.length; i += 1) {
    const tok = tokens[i]
    if (tok.startsWith('--project=')) {
      projects.push(tok.slice('--project='.length))
    } else if (tok === '--project') {
      if (tokens[i + 1]) projects.push(tokens[i + 1])
      i += 1
    }
  }
  return projects
}

export type WiringProblem = {
  gateId: string
  reason: string
}

/**
 * Verify that every declared gate in `gates` actually exists in its cited workflow job,
 * git hook, or `package.json` script with matching runner, config/project, and filter scope.
 */
export function validateGateWiring(gates: Gate[], rootDir: string = ROOT): WiringProblem[] {
  const pkgPath = path.join(rootDir, 'package.json')
  if (!existsSync(pkgPath)) {
    return [{ gateId: '*', reason: `package.json not found under ${rootDir}` }]
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    scripts?: Record<string, string>
  }
  const npmScripts = pkg.scripts ?? {}
  const problems: WiringProblem[] = []

  for (const gate of gates) {
    const { wiring } = gate
    const fullPath = path.join(rootDir, wiring.file)
    if (!existsSync(fullPath)) {
      problems.push({ gateId: gate.id, reason: `cited file does not exist: ${wiring.file}` })
      continue
    }

    let rawCommands: string[] = []
    if (wiring.rootKind === 'workflow') {
      const yaml = readFileSync(fullPath, 'utf8')
      const jobCmds = extractWorkflowJobCommands(yaml, wiring.job)
      if (!jobCmds) {
        problems.push({
          gateId: gate.id,
          reason: `job "${wiring.job}" not found in ${wiring.file}`,
        })
        continue
      }
      rawCommands = jobCmds
    } else if (wiring.rootKind === 'hook') {
      rawCommands = extractHookCommands(readFileSync(fullPath, 'utf8'))
    } else {
      const scriptBody = npmScripts[wiring.script]
      if (!scriptBody) {
        problems.push({
          gateId: gate.id,
          reason: `npm script "${wiring.script}" not found in package.json`,
        })
        continue
      }
      rawCommands = [scriptBody]
    }

    const leaves = rawCommands.flatMap((cmd) => expandNpmCommands(cmd, npmScripts))

    if (gate.kind === 'vitest') {
      const parsed = leaves
        .map((leaf) => parseVitestInvocation(leaf))
        .filter((v): v is { config: string | null; filters: string[] } => v !== null)

      const matched = parsed.some((inv) => {
        if (inv.config !== gate.config) return false
        if (gate.filters.length === 0) return inv.filters.length === 0
        return (
          inv.filters.length === gate.filters.length &&
          gate.filters.every((f) => inv.filters.includes(f))
        )
      })

      if (!matched) {
        const expectedConfig = gate.config ?? 'default'
        const expectedScope =
          gate.filters.length === 0 ? 'unscoped' : `filters=[${gate.filters.join(', ')}]`
        problems.push({
          gateId: gate.id,
          reason: `no matching vitest invocation (config=${expectedConfig}, ${expectedScope}) reached from ${wiring.file}${wiring.rootKind === 'workflow' ? ` job "${wiring.job}"` : wiring.rootKind === 'package-script' ? ` script "${wiring.script}"` : ''}`,
        })
      }
    } else {
      const projects = leaves
        .map((leaf) => parsePlaywrightProjects(leaf))
        .filter((p): p is string[] => p !== null)
        .flat()

      if (!projects.includes(gate.project)) {
        problems.push({
          gateId: gate.id,
          reason: `no matching playwright invocation (--project=${gate.project}) reached from ${wiring.file}${wiring.rootKind === 'workflow' ? ` job "${wiring.job}"` : wiring.rootKind === 'package-script' ? ` script "${wiring.script}"` : ''}`,
        })
      }
    }
  }

  return problems
}

// ---------------------------------------------------------------------------
// Universe discovery & real-tool resolution
// ---------------------------------------------------------------------------

/** Every test-shaped file in the repo, POSIX-relative to ROOT, git-ignored paths removed. */
export async function enumerateUniverse(): Promise<string[]> {
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
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: process.env.CI ?? '', FORCE_COLOR: '0' },
  })
}

/** Ask vitest itself which files this invocation resolves. */
function resolveVitest(gate: Extract<Gate, { kind: 'vitest' }>): string[] {
  // `--json` MUST be last: it is declared as `--json [path]`, so any positional
  // that follows it is swallowed as an output FILE PATH instead of a test filter.
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

/** Human-readable WHY, derived from the file's own shape + the actual gate table. */
function reasonFor(file: string): string {
  if (/\.local\.test\.(ts|tsx)$/.test(file)) {
    return 'local-tier unit suite: only vitest.local.config.ts includes it. `gate:release` (via `gate:local`) and `gate:release-local` run `npm run test:local` UNSCOPED (release-only; not invoked by `.husky/pre-push` or GitHub CI), so reaching this branch means vitest.local.config.ts excluded the file too (check its include/exclude rules and filename). Note `gate:cacp` and `gate:pkcs11` are manual-only commands.'
  }
  if (/\.local\.spec\.(ts|tsx)$/.test(file)) {
    return "local-tier e2e spec: matched only by the playwright `local` project. `gate:release` runs that project via `test:e2e:local-tier` (release-only), so reaching this branch means the `local` project does not match it either — check playwright.config.ts's testMatch ('**/*.local.spec.ts') and testDir."
  }
  if (file.startsWith('e2e/')) {
    return 'e2e spec matched by no enforced playwright project (not in PR projects, SMOKE_SPECS, or the nightly chromium project).'
  }
  return "no enforced gate's resolved file set contains it (check vite.config.ts `test.exclude` and each gate's positional path filters)."
}

/**
 * NON-VACUITY, asserted on every real run.
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
  const wiringProblems = validateGateWiring(GATES, ROOT)
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
          wiringProblems,
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
    console.log(`WIRING PROBLEMS: ${wiringProblems.length}`)
    for (const w of wiringProblems) console.log(`  ✗ [${w.gateId}] ${w.reason}`)
    console.log(`ORPHANS: ${report.orphans.length}`)
    for (const o of report.orphans) console.log(`  ✗ ${o.file}\n      ${o.reason}`)
    for (const s of report.staleAllowlist)
      console.log(`  ! stale allowlist: ${s.file}\n      ${s.reason}`)
    for (const p of problems) console.log(`  !! ${p}`)
  }

  if (
    wiringProblems.length > 0 ||
    problems.length > 0 ||
    report.orphans.length > 0 ||
    report.staleAllowlist.length > 0
  ) {
    process.exitCode = 1
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.dirname, 'check-test-reachability.ts')
if (invokedDirectly) {
  await main()
}
