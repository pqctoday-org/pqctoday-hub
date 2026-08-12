#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-unused-csv-revisions.ts
 *
 * Every dated-CSV loader in src/data globs its dataset with `eager: true`, so
 * EVERY revision still sitting in src/data is fetched, parsed and held —
 * whether or not anything reads it. `audit-csv-archival.ts` permits two files
 * per prefix, so this is not a rule violation; the rule allows the cost.
 *
 * For most datasets the older revision is then discarded by `loadLatestCSV`.
 * For some it is not: `loadLatestCSV(modules, regex, transform, true)` returns
 * `previousData`, which six loaders diff against the current revision to drive
 * "New" and "Updated" badges. For those, the second file is a feature.
 *
 * Measured 2026-08-12: 13.57 MB of superseded revisions load on every page, of
 * which 8.38 MB is load-bearing and 3.35 MB is discarded. The first pass of
 * that finding claimed the whole 13.57 MB was waste, because it counted what
 * was loaded without reading what it was for — the six previous-consuming
 * datasets are also the six largest.
 *
 * This script exists so that distinction is DERIVED, never hand-kept. A
 * hand-kept list of "datasets safe to archive" is exactly what produced the
 * 2026-07-26 incident, where archiving a merge-all source silently collapsed
 * 189 documents to 1 for twelve days (see audit-merge-all-coverage.ts). Here
 * the answer is re-read from each loader's own source on every run:
 *
 *   latest only       — loadLatestCSV(...) without withPrevious; priors are
 *                       dead weight and safe to archive.
 *   latest + previous — loadLatestCSV(..., true); the prior revision drives
 *                       New/Updated badges and must stay.
 *   unproven          — the loader does not call loadLatestCSV at all, or globs
 *                       several datasets and the call cannot be attributed.
 *                       Counted as fully load-bearing. This is NOT the same as
 *                       "merge-all": timelineData.ts hand-rolls its own
 *                       newest-file selection, so an absent loadLatestCSV
 *                       proves nothing either way. The bucket says what the
 *                       check could not establish, which is the only honest
 *                       thing it can say, and errs toward keeping files.
 *
 * Usage:
 *   npx tsx scripts/audit-unused-csv-revisions.ts          # human report
 *   npx tsx scripts/audit-unused-csv-revisions.ts --json   # machine-readable
 *   npx tsx scripts/audit-unused-csv-revisions.ts --check  # exit 1 if debt grew
 *
 * --check compares against BASELINE_BYTES below rather than demanding zero:
 * the existing debt is real but archiving it is a separate, gated decision.
 * The gate here is that it must not get WORSE.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'src/data')

/**
 * Discarded-revision bytes at the time this check was written. Lower it when
 * revisions are archived; never raise it to make a red run green.
 */
const BASELINE_BYTES = 3_000_000

type Mode = 'unproven' | 'latest+previous' | 'latest-only'

interface Finding {
  prefix: string
  mode: Mode
  loader: string
  files: string[]
  discardedBytes: number
}

function loaderSources(): { file: string; src: string }[] {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.ts') && !f.includes('.test.'))
    .map((f) => ({ file: f, src: readFileSync(join(DATA_DIR, f), 'utf8') }))
    .filter((m) => m.src.includes('import.meta.glob'))
}

/** Prefixes this loader eagerly globs, e.g. "pqcquiz" from './pqcquiz_*.csv'. */
function globbedPrefixes(src: string): string[] {
  const out: string[] = []
  const re = /import\.meta\.glob\(\s*'\.\/([A-Za-z0-9_]+)_\*\.csv'([\s\S]*?)\)/g
  for (const m of src.matchAll(re)) {
    // Only eager globs cost anything at load time.
    if (/eager:\s*true/.test(m[2])) out.push(m[1])
  }
  return out
}

/**
 * Extract the full argument text of every `loadLatestCSV(...)` call, by
 * scanning forward with a paren-depth counter.
 *
 * A regex cannot do this. The first attempt used a lazy `([\s\S]*?)\)` and
 * silently reported ZERO `latest+previous` datasets, because the first `)` it
 * met was inside the CSV filename regex — `(?:_r(\d+))?` — so every call was
 * truncated before its `withPrevious` argument. It looked plausible and was
 * completely wrong, which is the failure mode this whole audit is about.
 */
function loadLatestCalls(src: string): string[] {
  const out: string[] = []
  const needle = 'loadLatestCSV'
  let i = src.indexOf(needle)
  while (i !== -1) {
    const open = src.indexOf('(', i + needle.length)
    if (open === -1) break
    let depth = 0
    let j = open
    let inRegex = false
    for (; j < src.length; j++) {
      const c = src[j]
      // Skip over regex literals so their parens do not move the depth.
      if (!inRegex && c === '/' && src[j - 1] === ' ') inRegex = true
      else if (inRegex && c === '/' && src[j - 1] !== '\\') inRegex = false
      if (inRegex) continue
      if (c === '(') depth++
      else if (c === ')') {
        depth--
        if (depth === 0) break
      }
    }
    out.push(src.slice(open + 1, j))
    i = src.indexOf(needle, j)
  }
  return out
}

/**
 * How this loader treats the prefix.
 *
 * Association is BY FILE, not by matching the prefix against the call's regex
 * literal. That was the second wrong attempt: migrateData.ts globs
 * `pqc_product_catalog_*.csv` but matches it with `/catalog_(\d{2})...`, a
 * shortened prefix, so a text match against the full prefix missed the call and
 * mis-reported a load-bearing dataset as dead weight. Loader files glob a
 * single dataset in every case here; where one ever globs more than one, this
 * returns 'ambiguous' so it is reported rather than guessed.
 */
function modeFor(src: string, prefix: string, prefixesInFile: number): Mode {
  const calls = loadLatestCalls(src)
  if (calls.length === 0) return 'unproven'
  if (prefixesInFile > 1) {
    // Fall back to regex-text association, and say so if it cannot decide.
    const own = calls.filter((c) => c.includes(prefix.split('_').slice(-1)[0] + '_'))
    if (own.length === 0) return 'unproven'
    return own.some((c) => /,\s*true\b/.test(c)) ? 'latest+previous' : 'latest-only'
  }
  return calls.some((c) => /,\s*true\b/.test(c)) ? 'latest+previous' : 'latest-only'
}

function revisionsOnDisk(prefix: string): string[] {
  const re = new RegExp(`^${prefix}_\\d{8}(?:_r\\d+)?\\.csv$`)
  return readdirSync(DATA_DIR)
    .filter((f) => re.test(f))
    .sort()
}

function main(): number {
  const json = process.argv.includes('--json')
  const check = process.argv.includes('--check')

  const findings: Finding[] = []
  const seen = new Set<string>()

  for (const { file, src } of loaderSources()) {
    for (const prefix of globbedPrefixes(src)) {
      if (seen.has(prefix)) continue
      seen.add(prefix)
      const files = revisionsOnDisk(prefix)
      if (files.length < 2) continue
      const mode = modeFor(src, prefix, globbedPrefixes(src).length)
      // merge-all uses every file; latest+previous uses two.
      // 'unproven' counts every file as kept: never propose removing a file
      // the check could not PROVE is unread.
      const kept = mode === 'unproven' ? files.length : mode === 'latest+previous' ? 2 : 1
      const discarded = files.slice(0, Math.max(0, files.length - kept))
      const bytes = discarded.reduce((n, f) => n + statSync(join(DATA_DIR, f)).size, 0)
      findings.push({ prefix, mode, loader: file, files, discardedBytes: bytes })
    }
  }

  const wasteful = findings.filter((f) => f.discardedBytes > 0)
  const total = wasteful.reduce((n, f) => n + f.discardedBytes, 0)

  if (json) {
    console.log(JSON.stringify({ totalDiscardedBytes: total, findings }, null, 2))
    return check && total > BASELINE_BYTES ? 1 : 0
  }

  console.log('\nUnused CSV revisions (eagerly loaded, never read)\n')
  const byMode = (m: Mode) => findings.filter((f) => f.mode === m).length
  console.log(
    `  ${findings.length} eagerly-globbed dataset(s) with more than one revision on disk`
  )
  console.log(
    `    latest-only: ${byMode('latest-only')}   latest+previous: ${byMode('latest+previous')}   unproven: ${byMode('unproven')}\n`
  )

  for (const f of wasteful.sort((a, b) => b.discardedBytes - a.discardedBytes)) {
    console.log(
      `  ${(f.discardedBytes / 1024).toFixed(0).padStart(7)} KB  ${f.prefix}  (${f.mode}, ${f.loader})`
    )
  }

  console.log(`\n  Total discarded: ${(total / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  Baseline:        ${(BASELINE_BYTES / 1024 / 1024).toFixed(2)} MB`)

  if (check && total > BASELINE_BYTES) {
    console.log('\nFAIL — discarded-revision payload grew beyond the baseline.')
    console.log('Archive a superseded revision, or justify and lower BASELINE_BYTES.\n')
    return 1
  }
  console.log(
    total > 0
      ? '\nPASS — existing debt, not growing. Archiving is a separate decision.\n'
      : '\nPASS — no discarded revisions.\n'
  )
  return 0
}

process.exit(main())
