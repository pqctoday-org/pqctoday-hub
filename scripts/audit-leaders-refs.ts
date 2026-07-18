#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-leaders-refs.ts
 *
 * Proof-gate for the Leaders / "PQC Community" roster: a hand-curated leader
 * row (sourceKind='curated', i.e. not one of the library-authorship
 * auto-imported stubs) must be an author or contributor of a validated
 * resource already catalogued in the hub — proven by `KeyResourceRefs`
 * resolving to a real, non-deprecated `reference_id` in the library CSV.
 *
 * Why this specific check: the 2026-06-24 content-trust re-audit found 9
 * fully fabricated/misattributed leader profiles. All 9 had an EMPTY
 * `KeyResourceRefs` field — zero exceptions. `KeyResourceRefs` presence
 * doesn't independently prove a row is accurate, but its absence is the
 * single strongest signal this dataset has produced so far for "nobody has
 * ever tied this claim to a hub-validated source."
 *
 * This is a REPORTING gate, not a hard CI gate, by design: at the time this
 * script was written, 137 of 209 curated active rows failed the check —
 * turning it into a hard `process.exit(1)` today would fail CI on a large
 * pre-existing backlog, not a regression. Use --strict once that backlog is
 * worked down (see LEADERS-COMMUNITY-REMEDIATION-PLAN-07172026.md) to make
 * new violations block CI without blocking on old ones yet.
 *
 * Validations performed (curated, active leader rows only — auto-imported
 * stub rows already satisfy this by construction, and deprecated rows are
 * already excluded from the live site):
 *
 *  A) NO_REF (warn, error under --strict) — `KeyResourceRefs` is empty.
 *  B) UNRESOLVED_REF (error) — `KeyResourceRefs` is non-empty but none of
 *     its semicolon-separated ids resolve to an active (non-deprecated)
 *     `reference_id` in the latest library CSV. This is worse than NO_REF:
 *     it's a claim pointing at something that doesn't exist or was retracted.
 *  C) MISFILED_REF (warn) — `KeyResourceRefs` is empty (so this row also
 *     raises NO_REF) but `KeyResourceUrl` holds a value that isn't a URL and
 *     exactly matches a real, active library `reference_id`. Found live
 *     2026-07-17: 58 rows had a genuine hub reference sitting in the wrong
 *     column, inert (the field is documented as URL-only and excluded from
 *     the trust-score lookup) — these are NOT part of the real NO_REF
 *     backlog, they're a one-line column fix each.
 *
 * Usage:
 *   npx tsx scripts/audit-leaders-refs.ts             # human report
 *   npx tsx scripts/audit-leaders-refs.ts --json       # machine-readable
 *   npx tsx scripts/audit-leaders-refs.ts --strict     # NO_REF also fails (exit 1)
 *
 * Exit codes:
 *   0 — clean, or only NO_REF findings without --strict
 *   1 — UNRESOLVED_REF findings present, or NO_REF findings present with --strict
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Repo paths
// ---------------------------------------------------------------------------

const REPO_ROOT = process.cwd()
const DATA_DIR = path.resolve(REPO_ROOT, 'src/data')

// ---------------------------------------------------------------------------
// CSV helpers (same latest-dated-generation convention as audit-vendor-refs.ts)
// ---------------------------------------------------------------------------

function latestCSV(pattern: RegExp, label: string): string {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10)),
        rev: m[4] ? parseInt(m[4], 10) : 0,
      }
    })
    .filter((x): x is { file: string; date: Date; rev: number } => x !== null)
    .sort((a, b) => {
      const d = b.date.getTime() - a.date.getTime()
      return d !== 0 ? d : b.rev - a.rev
    })
  if (files.length === 0) throw new Error(`No ${label} CSV found in src/data/`)
  return path.join(DATA_DIR, files[0].file)
}

function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data
}

function splitSemicolon(value: string): string[] {
  return value
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Core audit
// ---------------------------------------------------------------------------

export interface Finding {
  severity: 'error' | 'warn'
  kind: 'NO_REF' | 'UNRESOLVED_REF' | 'MISFILED_REF'
  name: string
  category: string
  detail: string
}

const isAutoImportedRow = (note: string): boolean => note.includes('auto-imported from library')

export function audit(): Finding[] {
  const leadersPath = latestCSV(/^leaders_\d{8}(?:_r\d+)?\.csv$/, 'leaders')
  const libraryPath = latestCSV(/^library_\d{8}(?:_r\d+)?\.csv$/, 'library')

  const leaders = parseCSV(leadersPath)
  const library = parseCSV(libraryPath)

  const activeLibraryIds = new Set(
    library.filter((r) => (r.status || 'active') === 'active').map((r) => r.reference_id)
  )

  const findings: Finding[] = []

  for (const row of leaders) {
    if (row.status && row.status !== 'active') continue // deprecated, not in scope
    if (isAutoImportedRow(row.data_quality_notes ?? '')) continue // satisfies the rule by construction

    const refs = splitSemicolon(row.KeyResourceRefs ?? '')
    if (refs.length === 0) {
      const misfiled = (row.KeyResourceUrl ?? '').trim()
      if (misfiled && !misfiled.startsWith('http') && activeLibraryIds.has(misfiled)) {
        findings.push({
          severity: 'warn',
          kind: 'MISFILED_REF',
          name: row.Name,
          category: row.Category,
          detail: `KeyResourceUrl="${misfiled}" is a valid library reference_id sitting in the wrong column — move to KeyResourceRefs`,
        })
        continue
      }
      findings.push({
        severity: 'warn',
        kind: 'NO_REF',
        name: row.Name,
        category: row.Category,
        detail: 'KeyResourceRefs is empty — no tie to a hub-validated resource',
      })
      continue
    }
    const resolved = refs.filter((id) => activeLibraryIds.has(id))
    if (resolved.length === 0) {
      findings.push({
        severity: 'error',
        kind: 'UNRESOLVED_REF',
        name: row.Name,
        category: row.Category,
        detail: `KeyResourceRefs=[${refs.join(';')}] — none resolve to an active library reference_id`,
      })
    }
  }

  return findings
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  const wantJson = process.argv.includes('--json')
  const strict = process.argv.includes('--strict')
  const findings = audit()

  const errors = findings.filter((f) => f.severity === 'error')
  const misfiled = findings.filter((f) => f.kind === 'MISFILED_REF')
  const noRef = findings.filter((f) => f.kind === 'NO_REF')
  const warns = findings.filter((f) => f.severity === 'warn')
  const failStrict = strict && warns.length > 0

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings, strict }, null, 2) + '\n')
    process.exit(errors.length > 0 || failStrict ? 1 : 0)
  }

  if (errors.length === 0 && warns.length === 0) {
    console.log('PASS Leaders proof-gate audit clean.')
    process.exit(0)
  }

  if (errors.length > 0) {
    console.log(
      `FAIL ${errors.length} UNRESOLVED_REF error(s) — KeyResourceRefs points at nothing real:\n`
    )
    for (const f of errors) {
      console.log(`  [${f.category}] ${f.name}: ${f.detail}`)
    }
    console.log()
  }

  if (misfiled.length > 0) {
    console.log(
      `${strict ? 'FAIL' : 'WARN'} ${misfiled.length} MISFILED_REF finding(s) — real ref, wrong column, mechanical fix:\n`
    )
    for (const f of misfiled) {
      console.log(`  [${f.category}] ${f.name}: ${f.detail}`)
    }
    console.log()
  }

  if (noRef.length > 0) {
    console.log(
      `${strict ? 'FAIL' : 'WARN'} ${noRef.length} NO_REF finding(s) — no tie to a hub-validated resource${strict ? '' : ' (not failing CI — see --strict)'}:\n`
    )
    for (const f of noRef) {
      console.log(`  [${f.category}] ${f.name}: ${f.detail}`)
    }
    console.log()
  }

  process.exit(errors.length > 0 || failStrict ? 1 : 0)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
