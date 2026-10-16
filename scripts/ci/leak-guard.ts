#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * scripts/ci/leak-guard.ts — warn when a change would publish private
 * internals (owner decision 2026-10-02/03).
 *
 * WHAT IT CHECKS. Lines a pull request ADDS, its commit messages, its title
 * and body, and any new `.gitignore` re-include (`!path`). Existing content is
 * not rescanned: the rule applies going forward only.
 *
 * WHAT IT MATCHES. Only generic leak patterns: references to the private
 * companion repository, local home-directory paths, temporary session paths,
 * the evidence-cache folder, internal run identifiers and internal folder
 * paths. A broader private check runs outside this repository.
 *
 * OUTPUT IS REDACTED. A finding names the rule and the location, never the
 * matched text, so a CI log cannot itself publish what it caught.
 *
 * MODES. `report` (default): always exits 0 and writes a summary — this is
 * how it ships first, so it cannot block anyone. `enforce`: exits 1 on
 * findings (to be enabled later as a required check).
 *
 * TREE MODE (`--tree <dir> --baseline <file>`). Scans a whole directory (the
 * source checkout with `--tracked`, or the built site) instead of a diff, and
 * compares per-file, per-rule COUNTS with a committed baseline. Findings that
 * already exist are frozen in the baseline (they are accepted as they are);
 * any new file, new rule or higher count fails in `enforce` mode. The baseline
 * only ever shrinks: `--update-baseline` keeps the lower of the two counts and
 * refuses to raise one unless `--allow-increase` is given (first creation, or
 * a reviewed move). The baseline holds paths, rule ids and counts only, never
 * matched text.
 *
 * Usage:
 *   tsx scripts/ci/leak-guard.ts --range origin/main...HEAD
 *   tsx scripts/ci/leak-guard.ts --message-file .git/COMMIT_EDITMSG
 *   PR_TITLE=... PR_BODY=... tsx scripts/ci/leak-guard.ts --pr-text
 *   tsx scripts/ci/leak-guard.ts --tree . --tracked --baseline scripts/ci/leak-baseline-source.json
 *   tsx scripts/ci/leak-guard.ts --tree dist --baseline scripts/ci/leak-baseline-dist.json
 *   add --mode enforce to fail on findings
 */
import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export interface LeakRule {
  id: string
  pattern: RegExp
}

export const RULES: LeakRule[] = [
  { id: 'private-repo', pattern: /pqctoday-(priv|admin)\b/i },
  { id: 'evidence-cache', pattern: /local-evidence-cache/i },
  { id: 'home-path', pattern: /\/Users\/[^/\r\n]+\//i },
  { id: 'session-tmp-path', pattern: /\/private\/tmp\/claude-/i },
  { id: 'run-id', pattern: /\bcx-20\d{6}T\d{6}Z/i },
  { id: 'internal-log', pattern: /\bcodex-log\b/i },
  { id: 'internal-folder', pattern: /(?<![\w-])maintenance\/(lineage|runs|goldens|runbooks)\b/i },
  { id: 'agent-config-path', pattern: /\.claude\/(skills|agents|projects)\b/i },
]

/** Files that necessarily contain the patterns themselves. */
const SELF = new Set(['scripts/ci/leak-guard.ts', 'scripts/ci/leak-guard.test.ts'])

/** Baselines list paths, rule ids and counts only; a path is never content. */
const BASELINE_FILE = /^scripts\/ci\/leak-baseline[^/]*\.json$/

function isSelf(file: string): boolean {
  return SELF.has(file) || BASELINE_FILE.test(file)
}

export interface Finding {
  rule: string
  where: string
}

export function scanText(text: string, where: string): Finding[] {
  const out: Finding[] = []
  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.pattern.test(line)) out.push({ rule: r.id, where: `${where}:${i + 1}` })
    }
  })
  return out
}

/** Added lines per file from a unified diff, with their new line numbers. */
export function addedLines(diff: string): { file: string; line: number; text: string }[] {
  const out: { file: string; line: number; text: string }[] = []
  let file = ''
  let n = 0
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw.slice(4).replace(/^b\//, '')
      continue
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw)
    if (hunk) {
      n = Number(hunk[1])
      continue
    }
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      out.push({ file, line: n, text: raw.slice(1) })
      n += 1
    } else if (!raw.startsWith('-')) {
      n += 1
    }
  }
  return out
}

export function scanDiff(diff: string): Finding[] {
  const out: Finding[] = []
  for (const a of addedLines(diff)) {
    if (isSelf(a.file) || a.file === '/dev/null') continue
    for (const r of RULES) {
      if (r.pattern.test(a.text)) out.push({ rule: r.id, where: `${a.file}:${a.line}` })
    }
    if (a.file === '.gitignore' && a.text.trim().startsWith('!')) {
      out.push({ rule: 'gitignore-reinclude', where: `${a.file}:${a.line}` })
    }
  }
  return out
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

/** Per-file diff limit. Larger files (regenerated corpora, bundles) are
 * listed as not scanned, never silently passed; the private check covers them. */
const MAX_FILE_DIFF = 32 * 1024 * 1024

export const notScanned: { file: string; reason: string }[] = []

const DATED = /^(?<stem>.+?)_\d{8}(?:_r\d+)?\.csv$/

function isNewFile(base: string, file: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', `${base}:${file}`], { stdio: 'ignore' })
    return false
  } catch {
    return true
  }
}

/** Newest dated file with the same stem in the same folder at `base`. */
export function previousDated(base: string, file: string): string | undefined {
  const slash = file.lastIndexOf('/')
  const dir = slash >= 0 ? file.slice(0, slash + 1) : ''
  const name = file.slice(slash + 1)
  const m = DATED.exec(name)
  if (!m?.groups) return undefined
  const stem = m.groups.stem
  const listing = git(['ls-tree', '--name-only', base, dir || '.'])
  const key = (n: string) => {
    const d = /_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(n)
    return d ? `${d[3]}${d[1]}${d[2]}${(d[4] ?? '0').padStart(4, '0')}` : ''
  }
  const same = listing
    .split('\n')
    .map((p) => p.slice(p.lastIndexOf('/') + 1))
    .filter((n) => DATED.exec(n)?.groups?.stem === stem && n !== name)
    .sort((a, b) => key(a).localeCompare(key(b)))
  return same.length ? `${dir}${same[same.length - 1]}` : undefined
}

export function scanRange(range: string): Finding[] {
  const findings: Finding[] = []
  const [left, right] = range.split('...')
  const head = right || 'HEAD'
  const base = git(['merge-base', left, head]).trim()
  // Rename detection: a pure move (R100, e.g. a data file moved into the
  // archive) adds no content and is skipped; a partial rename is diffed
  // against its source by `git diff -M`.
  const status = git(['diff', '--name-status', '-M', '--diff-filter=ACMRT', range])
  const pureMoves = new Set<string>()
  const renamedFrom = new Map<string, string>()
  for (const row of status.split('\n')) {
    const cols = row.split('\t')
    if (cols[0]?.startsWith('R')) {
      renamedFrom.set(cols[2], cols[1])
      if (cols[0] === 'R100') pureMoves.add(cols[2])
    }
  }
  const numstat = git(['diff', '--numstat', '--diff-filter=ACMRT', range])
  for (const row of numstat.split('\n')) {
    if (!row.trim()) continue
    const [added, , ...rest] = row.split('\t')
    const file = rest.join('\t')
    if (isSelf(file) || pureMoves.has(file)) continue
    if (added === '-') {
      notScanned.push({ file, reason: 'binary' })
      continue
    }
    let diff: string
    try {
      // A new dated copy of a data file (`name_MMDDYYYY[_rN].csv`) is compared
      // with the previous dated version in the base, so rows carried forward
      // unchanged are not "added" (existing content is out of scope).
      const src = renamedFrom.get(file)
      const prev = src ?? (isNewFile(base, file) ? previousDated(base, file) : undefined)
      const args = prev
        ? ['diff', '--no-color', '--unified=0', `${base}:${prev}`, `${head}:${file}`]
        : ['diff', '--no-color', '--unified=0', range, '--', file]
      diff = execFileSync('git', args, { encoding: 'utf8', maxBuffer: MAX_FILE_DIFF })
      if (prev) diff = diff.replace(/^\+\+\+ .*$/m, `+++ b/${file}`)
    } catch {
      notScanned.push({ file, reason: 'too large to diff' })
      continue
    }
    findings.push(...scanDiff(diff))
  }
  const logRange = range.replace('...', '..')
  const log = git(['log', '--format=%H%x00%B%x1e', logRange])
  for (const entry of log.split('\x1e')) {
    const [sha, body] = entry.trim().split('\x00')
    if (sha && body) findings.push(...scanText(body, `commit ${sha.slice(0, 12)}`))
  }
  return findings
}

export function format(findings: Finding[], mode: string): string {
  if (findings.length === 0) return 'leak-guard: clean'
  const head = `leak-guard: ${findings.length} finding(s)${mode === 'report' ? ' (report-only, not blocking)' : ''}`
  return [head, ...findings.map((f) => `  ${f.rule} @ ${f.where}`)].join('\n')
}

// ---------------------------------------------------------------------------
// Tree mode: whole-tree scan against a frozen baseline (owner decision
// 2026-10-11: freeze what exists, block anything new).
// ---------------------------------------------------------------------------

/** Per-file, per-rule finding counts. Never holds matched text. */
export type TreeCounts = Record<string, Record<string, number>>

export interface Baseline {
  version: 1
  rules: string[]
  files: TreeCounts
}

export interface Regression {
  file: string
  rule: string
  was: number
  now: number
}

/** Larger files are listed as not scanned, never silently passed. */
const MAX_TREE_FILE = 256 * 1024 * 1024
const SKIP_DIRS = new Set(['.git', 'node_modules'])
const BINARY_EXT =
  /\.(wasm|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|gz|br|zip|pdf|mp4|webm|mp3|onnx|bin)$/i

/**
 * Baseline key for a file. Bundler content hashes (`index-D3FGcMe6.js`) and
 * dated copies of a data file (`leaders_09302026.csv`, `..._r2.csv`) change
 * name on every build or data release, so both are replaced by `#`. Files that
 * share a key are one family; its count is the HIGHEST of its members, so a
 * rotation that carries existing findings forward changes nothing, while a
 * new finding in any member still raises the count.
 */
export function baselineKey(file: string): string {
  return file
    .replace(/-[A-Za-z0-9_-]{8}(?=\.(?:js|mjs|css)$)/, '-#')
    .replace(/_\d{8}(?:_r\d+)?(?=(?:-#)?\.[A-Za-z0-9]+$)/, '_#')
}

export function countText(text: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const line of text.split(/\r?\n/)) {
    for (const r of RULES) {
      if (r.pattern.test(line)) out[r.id] = (out[r.id] ?? 0) + 1
    }
  }
  return out
}

function listTree(root: string, dir = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    const rel = dir ? `${dir}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...listTree(root, rel))
    } else if (entry.isFile()) {
      out.push(rel)
    }
  }
  return out
}

function listTracked(root: string): string[] {
  const raw = execFileSync('git', ['-C', root, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  return raw.split('\0').filter(Boolean)
}

export function scanTree(
  root: string,
  opts: { tracked?: boolean } = {}
): { counts: TreeCounts; notScanned: { file: string; reason: string }[] } {
  const counts: TreeCounts = {}
  const skipped: { file: string; reason: string }[] = []
  const files = opts.tracked ? listTracked(root) : listTree(root)
  for (const file of files) {
    if (isSelf(file)) continue
    if (BINARY_EXT.test(file)) continue
    const full = join(root, file)
    let size: number
    try {
      const st = statSync(full)
      if (!st.isFile()) continue // a submodule entry or a directory
      size = st.size
    } catch {
      continue // listed by git but absent from the working tree
    }
    if (size > MAX_TREE_FILE) {
      skipped.push({ file, reason: 'too large' })
      continue
    }
    const buf = readFileSync(full)
    if (buf.subarray(0, 8192).includes(0)) continue // binary
    const found = countText(buf.toString('utf8'))
    const key = baselineKey(file)
    for (const [rule, n] of Object.entries(found)) {
      const family = (counts[key] ??= {})
      family[rule] = Math.max(family[rule] ?? 0, n)
    }
  }
  return { counts, notScanned: skipped }
}

/** Entries that rose (or are new) compared with the baseline, and entries that fell. */
export function compareToBaseline(
  now: TreeCounts,
  base: TreeCounts
): { regressions: Regression[]; improved: Regression[] } {
  const regressions: Regression[] = []
  const improved: Regression[] = []
  for (const [file, rules] of Object.entries(now)) {
    for (const [rule, n] of Object.entries(rules)) {
      const was = base[file]?.[rule] ?? 0
      if (n > was) regressions.push({ file, rule, was, now: n })
    }
  }
  for (const [file, rules] of Object.entries(base)) {
    for (const [rule, was] of Object.entries(rules)) {
      const n = now[file]?.[rule] ?? 0
      if (n < was) improved.push({ file, rule, was, now: n })
    }
  }
  return { regressions, improved }
}

/** The lower of the two counts for every baseline entry; entries that reached 0 drop out. */
export function ratchet(now: TreeCounts, base: TreeCounts): TreeCounts {
  const out: TreeCounts = {}
  for (const [file, rules] of Object.entries(base)) {
    for (const [rule, was] of Object.entries(rules)) {
      const n = Math.min(was, now[file]?.[rule] ?? 0)
      if (n > 0) (out[file] ??= {})[rule] = n
    }
  }
  return out
}

function sortedBaseline(files: TreeCounts): Baseline {
  const sorted: TreeCounts = {}
  for (const file of Object.keys(files).sort()) {
    sorted[file] = {}
    for (const rule of Object.keys(files[file]).sort()) sorted[file][rule] = files[file][rule]
  }
  return { version: 1, rules: RULES.map((r) => r.id), files: sorted }
}

function readBaseline(path: string): TreeCounts {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Baseline
  if (parsed.version !== 1 || typeof parsed.files !== 'object') {
    throw new Error(`${path}: not a version 1 leak baseline`)
  }
  return parsed.files
}

export function formatTree(
  cmp: { regressions: Regression[]; improved: Regression[] },
  mode: string,
  notScanned: { file: string; reason: string }[]
): string {
  const lines: string[] = []
  const n = cmp.regressions.length
  lines.push(
    n === 0
      ? 'leak-guard (tree): no new findings against the baseline'
      : `leak-guard (tree): ${n} new or increased finding(s)${mode === 'report' ? ' (report-only, not blocking)' : ''}`
  )
  for (const r of cmp.regressions) lines.push(`  ${r.rule} @ ${r.file}: ${r.was} -> ${r.now}`)
  if (cmp.improved.length) {
    lines.push(
      `${cmp.improved.length} baseline entr${cmp.improved.length === 1 ? 'y' : 'ies'} fell; run with --update-baseline to ratchet down`
    )
  }
  if (notScanned.length) {
    lines.push(
      `not scanned (${notScanned.length}): ${notScanned.map((s) => `${s.file} [${s.reason}]`).join(', ')}`
    )
  }
  return lines.join('\n')
}

function mainTree(
  treeDir: string,
  argv: string[],
  arg: (name: string) => string | undefined
): number {
  const baselinePath = arg('--baseline')
  if (!baselinePath) {
    console.error('leak-guard --tree needs --baseline <file>')
    return 2
  }
  const mode = arg('--mode') ?? 'report'
  const { counts, notScanned: skipped } = scanTree(treeDir, { tracked: argv.includes('--tracked') })
  const exists = existsSync(baselinePath)
  if (argv.includes('--update-baseline')) {
    const allowIncrease = argv.includes('--allow-increase')
    if (!exists && !allowIncrease) {
      console.error('leak-guard: no baseline yet; create the first one with --allow-increase')
      return 2
    }
    const base = exists ? readBaseline(baselinePath) : {}
    const cmp = compareToBaseline(counts, base)
    if (cmp.regressions.length && !allowIncrease) {
      console.log(formatTree(cmp, 'enforce', skipped))
      console.error(
        'leak-guard: refusing to raise the baseline; fix the findings or use --allow-increase'
      )
      return 1
    }
    writeFileSync(
      baselinePath,
      `${JSON.stringify(sortedBaseline(allowIncrease ? counts : ratchet(counts, base)), null, 2)}\n`
    )
    const total = Object.values(allowIncrease ? counts : ratchet(counts, base)).reduce(
      (s, r) => s + Object.values(r).reduce((a, b) => a + b, 0),
      0
    )
    console.log(`leak-guard: baseline written (${total} finding(s) frozen)`)
    return 0
  }
  if (!exists) {
    console.error(`leak-guard: baseline ${baselinePath} not found`)
    return 2
  }
  const cmp = compareToBaseline(counts, readBaseline(baselinePath))
  const text = formatTree(cmp, mode, skipped)
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${text}\n`)
  return mode === 'enforce' && cmp.regressions.length > 0 ? 1 : 0
}

function main(argv: string[]): number {
  const arg = (name: string) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const treeDir = arg('--tree')
  if (treeDir) return mainTree(treeDir, argv, arg)
  const mode = arg('--mode') ?? 'report'
  let findings: Finding[] = []
  const range = arg('--range')
  const messageFile = arg('--message-file')
  if (range) findings = scanRange(range)
  else if (messageFile) findings = scanText(readFileSync(messageFile, 'utf8'), 'commit message')
  else if (argv.includes('--pr-text')) {
    findings = [
      ...scanText(process.env.PR_TITLE ?? '', 'PR title'),
      ...scanText(process.env.PR_BODY ?? '', 'PR body'),
    ]
  } else {
    console.error(
      'usage: leak-guard.ts --range <a...b> | --message-file <f> | --pr-text | --tree <dir> [--tracked] --baseline <f> [--update-baseline [--allow-increase]] [--mode report|enforce]'
    )
    return 2
  }
  let text = format(findings, mode)
  if (notScanned.length) {
    text +=
      `\nnot scanned here (${notScanned.length}): ` +
      notScanned.map((n) => `${n.file} [${n.reason}]`).join(', ')
  }
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${text}\n`)
  return mode === 'enforce' && findings.length > 0 ? 1 : 0
}

if (process.argv[1] && /leak-guard\.ts$/.test(process.argv[1])) {
  process.exit(main(process.argv.slice(2)))
}
