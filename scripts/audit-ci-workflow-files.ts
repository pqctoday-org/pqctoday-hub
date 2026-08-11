#!/usr/bin/env tsx
/**
 * scripts/audit-ci-workflow-files.ts
 *
 * Every file a GitHub Actions step will try to execute must actually be IN the
 * repository.
 *
 * WHY THIS EXISTS. `.gitignore` carries a blanket `scripts/*` — the tooling in
 * there is private by default — with per-file `!` re-includes for the handful
 * that must be public. `git add scripts/whatever.ts` on an ignored path is a
 * SILENT NO-OP. It prints nothing, exits 0, and stages nothing. So the standing
 * failure mode is: a commit adds a ci.yml step and a package.json script entry
 * with no file behind them, every local run is green because the file is on
 * disk, and the first signal is a red CI job naming a file the author can see
 * in their own working tree.
 *
 * That has now happened four times — 2026-07-10 (validators), 2026-08-02
 * (role-board CTAs), 2026-08-09 (role-board coverage) and 2026-08-10 (the three
 * B+ remediation gates). Each time it was diagnosed from scratch, because the
 * error CI gives (`ERR_MODULE_NOT_FOUND`) points at a file that demonstrably
 * exists. This check turns a confusing 20-minute CI round trip into a line of
 * output before the push leaves the machine.
 *
 * DELIBERATELY LOCAL-ONLY. Wired into `.husky/pre-push`, NOT into ci.yml. Two
 * reasons. The obvious one is that a CI step which checks whether CI's own files
 * are present can only run once they are — it is too late to be useful there.
 * The second is the standing preference in this repo to keep the GitHub job
 * lean; the same reasoning already keeps the full data-integrity validator and
 * the WASM provenance check on the developer's machine.
 *
 * WHAT IT CHECKS. Every `run:` line in .github/workflows/*.yml, expanded:
 *
 *   - `npm run <name>` is resolved through package.json, RECURSIVELY, because
 *     composite scripts like `gate:data` chain a dozen others and a missing file
 *     three links down is just as fatal.
 *   - Direct invocations (`npx tsx scripts/x.ts`, `node scripts/y.mjs`) are read
 *     straight off the line.
 *
 * Each resolved path must exist on disk AND be tracked by git. Both halves
 * matter and they fail differently: missing-on-disk is an ordinary typo, while
 * present-but-untracked is the silent-ignore bug this file is named after.
 *
 * WHAT IT DOES NOT CHECK. Scripts referenced only by package.json and never by a
 * workflow. Twelve of those are untracked right now and that is CORRECT — they
 * are private enrichment, scraper and capture tooling that no CI job invokes,
 * and demanding they be public would invert the repo's split. The question this
 * check asks is narrow on purpose: will CI find what CI is about to run.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary
 *
 * Run via:  npm run audit:ci-workflow-files
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const WORKFLOW_DIR = join(ROOT, '.github/workflows')

interface Problem {
  file: string
  workflow: string
  via: string
  reason: 'missing' | 'untracked'
}

/** package.json's scripts block, for resolving `npm run <name>`. */
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
}
const npmScripts = pkg.scripts ?? {}

/**
 * File paths a shell command will execute. Matches repo-relative paths under
 * scripts/ with a runnable extension — deliberately narrow, because the point
 * is executables CI invokes, not every string that resembles a path.
 */
const PATH_RE = /\bscripts\/[A-Za-z0-9_./-]+\.(?:ts|tsx|js|mjs|cjs|py|sh)\b/g

/** `npm run x`, `npm run x -- --flag`, `npm run-script x`. */
const NPM_RUN_RE = /\bnpm\s+run(?:-script)?\s+([A-Za-z0-9:_-]+)/g

/**
 * Every script path a command reaches, following `npm run` chains.
 *
 * `seen` guards against a composite script that (directly or through a cycle)
 * refers back to itself; without it a malformed package.json would hang the
 * pre-push hook rather than failing it.
 */
function resolveCommand(command: string, seen: Set<string>): { path: string; via: string }[] {
  const found: { path: string; via: string }[] = []

  for (const m of command.matchAll(PATH_RE)) {
    found.push({ path: m[0], via: command.trim().slice(0, 80) })
  }

  for (const m of command.matchAll(NPM_RUN_RE)) {
    const name = m[1]
    if (seen.has(name)) continue
    seen.add(name)
    const body = npmScripts[name]
    if (!body) continue
    for (const r of resolveCommand(body, seen)) {
      found.push({ path: r.path, via: `npm run ${name} → ${r.via}` })
    }
  }

  return found
}

/** Files git actually has. One call, so this stays fast enough for a hook. */
const tracked = new Set(
  execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean)
)

const problems: Problem[] = []
let checked = 0

const workflows = existsSync(WORKFLOW_DIR)
  ? readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  : []

for (const wf of workflows) {
  const source = readFileSync(join(WORKFLOW_DIR, wf), 'utf8')

  // `run:` steps, single-line and block scalars alike. Reading every line that
  // follows a `run:` would need a YAML parser to know where the block ends; in
  // practice this repo writes one command per `run:`, and multi-command blocks
  // are still matched line-by-line by the same regexes below.
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const command = line.startsWith('run:') ? line.slice(4).trim() : line
    if (!/\bnpm\s+run|\bnpx\b|\bnode\b|scripts\//.test(command)) continue

    for (const { path, via } of resolveCommand(command, new Set())) {
      checked += 1
      const onDisk = existsSync(join(ROOT, path))
      const inGit = tracked.has(path)
      if (!onDisk) {
        problems.push({ file: path, workflow: wf, via, reason: 'missing' })
      } else if (!inGit) {
        problems.push({ file: path, workflow: wf, via, reason: 'untracked' })
      }
    }
  }
}

// One file can be reached by several workflows or several npm chains; report it
// once, against the first route that found it.
const unique = new Map<string, Problem>()
for (const p of problems) if (!unique.has(p.file)) unique.set(p.file, p)
const offenders = [...unique.values()]

if (process.argv.includes('--json')) {
  process.stdout.write(
    `${JSON.stringify({ ok: offenders.length === 0, workflows: workflows.length, checked, offenders }, null, 2)}\n`
  )
} else {
  process.stdout.write('\nCI workflow files\n')
  process.stdout.write(`  · ${workflows.length} workflow file(s)\n`)
  process.stdout.write(`  · ${checked} script invocation(s) resolved\n`)

  if (offenders.length === 0) {
    process.stdout.write('\n  PASS — every file CI will run is present and tracked.\n\n')
  } else {
    process.stdout.write(`\n  FAIL — ${offenders.length} file(s) CI cannot run:\n\n`)
    for (const o of offenders) {
      process.stdout.write(`  ${o.file}\n`)
      process.stdout.write(`    workflow: ${o.workflow}\n`)
      process.stdout.write(`    invoked:  ${o.via}\n`)
      if (o.reason === 'untracked') {
        process.stdout.write(
          '    → EXISTS on disk but is NOT tracked by git. Almost certainly swallowed by\n' +
            "      .gitignore's blanket `scripts/*`; `git add` on an ignored path is a silent\n" +
            '      no-op. Add a `!` re-include line for it in .gitignore, then git add again.\n'
        )
      } else {
        process.stdout.write('    → does not exist on disk. Wrong path, or never written.\n')
      }
      process.stdout.write('\n')
    }
    process.stdout.write(
      '  CI would fail with ERR_MODULE_NOT_FOUND naming a file you can see locally.\n' +
        '  That is what this check exists to catch before the push leaves the machine.\n\n'
    )
  }
}

process.exit(offenders.length === 0 ? 0 : 1)
