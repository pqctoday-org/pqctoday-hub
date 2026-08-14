#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-merge-all-coverage.ts
 *
 * Guards the bug class discovered 2026-08-07: `audit-csv-archival.ts` enforces
 * "at most 2 files per prefix in src/data/, archive the rest" — correct for a
 * "newest file wins" loader, but destructive for a loader that MERGES every
 * dated file (maturityGovernanceData.ts and five *EnrichmentData.ts sources).
 * For those, an archived file isn't superseded, it's a document that silently
 * stops loading — no build error, no failing test. The 2026-07-26 archival
 * sweep did exactly that to the CSWP.39 maturity corpus: 189 documents / 1,382
 * requirements collapsed to 1 / 50 for 12 days. See
 * cswp39-maturity-restore-execution-08072026.md and
 * archive-sweep-audit-08072026.md for the incident and the sweep that found it.
 *
 * This does NOT trust a hand-maintained list of "which archive dirs are safe."
 * It parses each registered loader's real `import.meta.glob(...)` calls out of
 * its current source, builds a matcher from them, and checks that literally
 * every file on disk matching that dataset's prefix — anywhere under src/data,
 * recursively — is covered by at least one of the loader's own glob patterns.
 * If a future archive tier appears (archive_v2/, a rename, ...) and the loader
 * isn't updated to glob it, this fails on the very next run. It is inherently
 * self-updating: it re-derives coverage from the loader source every time,
 * rather than encoding "the archive dirs are X, Y, Z" as a second copy of the
 * truth that can drift from the code.
 *
 * Usage:
 *   npx tsx scripts/audit-merge-all-coverage.ts          # human report
 *   npx tsx scripts/audit-merge-all-coverage.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — every merge-all source's on-disk files are fully covered by its loader
 *   1 — one or more files are invisible to their loader
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')

/**
 * Registry of known merge-all sources: a dated-file prefix, and the loader
 * whose `import.meta.glob` calls are the sole source of truth for which
 * files it actually reads. Add an entry here whenever a new loader is built
 * to merge every dated file instead of picking the newest — the coverage
 * check itself needs no other changes; it re-parses the loader's globs live.
 *
 * Only sources where full historical coverage is both real (verified loss)
 * and affordable (eager-loads without ballooning the bundle/test memory) are
 * registered here. The 2026-08-07 sweep found four more merge-all sources —
 * library / catalog / vendor-roadmap / threats doc-enrichments — with the
 * same structural gap, but deliberately left them un-widened:
 *   - catalog / vendor-roadmap / threats: zero net key loss (every archived
 *     key is re-covered by a newer live file) — nothing to gain by asserting
 *     coverage that costs bundle size for no behavioural difference.
 *   - library: 7 keys ARE lost, but all 7 reference reference_ids no longer
 *     in the library catalog (zero live impact) — and widening it costs
 *     ~110 MB eagerly loaded (73 archived files), which OOM'd the Vitest
 *     worker pool when tried. Registering it here would force a choice
 *     between a false-positive-permanent FAIL and reintroducing that OOM.
 * If a future audit finds real loss in one of those four, fix its loader
 * (see timelineEnrichmentData.ts for the reference pattern) and add it here
 * — don't add it here first and then fix the loader to satisfy the gate.
 */
export const MERGE_ALL_SOURCES: {
  name: string
  prefix: string
  ext: '.csv' | '.md'
  loaderFile: string
}[] = [
  {
    name: 'CSWP.39 maturity requirements',
    prefix: 'pqc_maturity_governance_requirements_',
    ext: '.csv',
    loaderFile: 'src/data/maturityGovernanceData.ts',
  },
  {
    name: 'timeline doc enrichments',
    prefix: 'timeline_doc_enrichments_',
    ext: '.md',
    loaderFile: 'src/data/timelineEnrichmentData.ts',
  },
]

/** Every `import.meta.glob(...)`-style string literal pattern in a source file. */
export function extractGlobPatterns(source: string): string[] {
  const patterns: string[] = []
  const re = /import\.meta\.glob(?:<[^>]*>)?\(\s*'([^']+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) patterns.push(m[1])
  return patterns
}

/** Vite glob syntax used by every loader here: single-level `*`, no `**`.
 *  Convert to a RegExp anchored against a path relative to the loader's own
 *  directory (which, for every registered source, is DATA_DIR itself). */
function globToRegExp(glob: string): RegExp {
  const normalized = glob.replace(/^\.\//, '')
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const withWildcard = escaped.replace(/\*/g, '[^/]*')
  return new RegExp(`^${withWildcard}$`)
}

/** Recursively list every file under `dir`, as paths relative to `dir` (posix-style). */
function walk(dir: string, base = dir): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full, base))
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
  return out
}

export interface CoverageFinding {
  source: string
  loaderFile: string
  uncovered: string[]
}

export function findUncovered(
  dataDir: string,
  rootDir: string,
  sources = MERGE_ALL_SOURCES
): CoverageFinding[] {
  const allFiles = walk(dataDir)
  const findings: CoverageFinding[] = []

  for (const { name, prefix, ext, loaderFile } of sources) {
    const loaderPath = path.join(rootDir, loaderFile)
    const source = fs.readFileSync(loaderPath, 'utf-8')
    const patterns = extractGlobPatterns(source)
    const matchers = patterns.map(globToRegExp)

    const relevant = allFiles.filter((f) => path.basename(f).startsWith(prefix) && f.endsWith(ext))
    const uncovered = relevant.filter((f) => !matchers.some((re) => re.test(f)))

    if (uncovered.length > 0) {
      findings.push({ source: name, loaderFile, uncovered: uncovered.sort() })
    }
  }
  return findings
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
function main(): void {
  const wantJson = process.argv.includes('--json')
  const findings = findUncovered(DATA_DIR, ROOT)

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }

  if (findings.length === 0) {
    console.log(
      `PASS merge-all coverage clean — every file for ${MERGE_ALL_SOURCES.length} registered source(s) is reachable by its loader's own glob.`
    )
    process.exit(0)
  }

  console.log(
    `FAIL ${findings.length} merge-all source(s) have files their own loader cannot see:\n`
  )
  for (const f of findings) {
    console.log(`  ${f.source} (${f.loaderFile}) — ${f.uncovered.length} file(s):`)
    for (const u of f.uncovered) console.log(`    ${u}`)
  }
  console.log(
    `\nEach file above will silently vanish from the app until the loader's import.meta.glob\n` +
      `patterns are widened to cover it (see maturityGovernanceData.ts for the reference fix).`
  )
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
