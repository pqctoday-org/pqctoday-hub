#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
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
 * Usage:
 *   tsx scripts/ci/leak-guard.ts --range origin/main...HEAD
 *   tsx scripts/ci/leak-guard.ts --message-file .git/COMMIT_EDITMSG
 *   PR_TITLE=... PR_BODY=... tsx scripts/ci/leak-guard.ts --pr-text
 *   add --mode enforce to fail on findings
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

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
    if (SELF.has(a.file) || a.file === '/dev/null') continue
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
    if (SELF.has(file) || pureMoves.has(file)) continue
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

function main(argv: string[]): number {
  const arg = (name: string) => {
    const i = argv.indexOf(name)
    return i >= 0 ? argv[i + 1] : undefined
  }
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
      'usage: leak-guard.ts --range <a...b> | --message-file <f> | --pr-text [--mode report|enforce]'
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
