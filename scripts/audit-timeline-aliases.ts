#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-timeline-aliases.ts
 *
 * Hygiene gate for the Timeline view's country alias map
 * (`src/data/countryAliases.ts`) against the latest Timeline CSV
 * (`src/data/timeline_MMDDYYYY[_rN].csv`).
 *
 * Validations performed:
 *
 *  A) ALIAS RESOLUTION — every alias value must appear in the latest
 *     Timeline CSV's `Country` column. Catches CSV renames / removals
 *     that would silently degrade `?country=UK` deep links.
 *
 *  B) CANONICAL COVERAGE — every distinct CSV Country either matches
 *     itself canonically (already in the dropdown) or is reachable
 *     via at least one alias entry. Pure-soft check today (warn);
 *     promote to error once aliases are exhaustive.
 *
 *  C) NO ORPHANS — no alias key duplicates another alias key
 *     (case-insensitive) and no alias key equals a canonical country
 *     name (which would shadow the literal-match path).
 *
 * Usage:
 *   npx tsx scripts/audit-timeline-aliases.ts          # human report
 *   npx tsx scripts/audit-timeline-aliases.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean (warnings allowed)
 *   1 — at least one severity='error' finding
 */

import { fileURLToPath } from 'node:url'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import Papa from 'papaparse'
import { COUNTRY_ALIASES } from '../src/data/countryAliases'

export interface Finding {
  rule: 'A' | 'B' | 'C'
  field: string
  detail: string
  severity: 'error' | 'warn'
}

// ── A. Alias resolution ─────────────────────────────────────────────────
export function auditAliasesResolve(
  aliases: Record<string, string>,
  knownCountries: Set<string>
): Finding[] {
  const findings: Finding[] = []
  for (const [key, value] of Object.entries(aliases)) {
    if (!knownCountries.has(value)) {
      findings.push({
        rule: 'A',
        field: key,
        detail: `alias "${key}" → "${value}" does not match any Country in the latest Timeline CSV`,
        severity: 'error',
      })
    }
  }
  return findings
}

// ── B. Canonical coverage (warn) ────────────────────────────────────────
export function auditCanonicalCoverage(
  aliases: Record<string, string>,
  knownCountries: Set<string>
): Finding[] {
  const findings: Finding[] = []
  const aliasTargets = new Set(Object.values(aliases))
  for (const country of knownCountries) {
    if (aliasTargets.has(country)) continue
    // Heuristic: warn only when the canonical name contains a space — these
    // benefit most from short-form aliases. Single-word countries (Germany,
    // France) are already typeable without an alias.
    if (country.includes(' ')) {
      findings.push({
        rule: 'B',
        field: country,
        detail: `multi-word country "${country}" has no alias entry`,
        severity: 'warn',
      })
    }
  }
  return findings
}

// ── C. No orphans / no shadowing ────────────────────────────────────────
export function auditNoOrphans(
  aliases: Record<string, string>,
  knownCountries: Set<string>
): Finding[] {
  const findings: Finding[] = []
  const seenLc = new Map<string, string>()
  for (const key of Object.keys(aliases)) {
    const lc = key.toLowerCase()
    if (seenLc.has(lc)) {
      findings.push({
        rule: 'C',
        field: key,
        detail: `alias key "${key}" duplicates "${seenLc.get(lc)}" case-insensitively`,
        severity: 'error',
      })
    } else {
      seenLc.set(lc, key)
    }
    if (knownCountries.has(key)) {
      // Not fatal: resolveCountryParam tries literal-match first, so the
      // alias is effectively a no-op when its key is already canonical.
      // Warn so reviewers can either drop the alias or fix the CSV row
      // (this often signals a duplicate-meaning CSV row, e.g. "US" + "United States").
      findings.push({
        rule: 'C',
        field: key,
        detail: `alias key "${key}" also appears as a canonical Country in the CSV — alias is a no-op (drop the alias, or merge the CSV row into its canonical form)`,
        severity: 'warn',
      })
    }
  }
  return findings
}

// ── CSV discovery + parse ───────────────────────────────────────────────

function findLatestTimelineCsv(dataDir: string): string {
  const entries = readdirSync(dataDir)
  // eslint-disable-next-line security/detect-unsafe-regex
  const re = /^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const matches = entries
    .map((name) => {
      const m = name.match(re)
      if (!m) return null
      const [, mm, dd, yyyy, rev] = m
      const date = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10))
      return { name, date, revision: rev ? parseInt(rev, 10) : 0 }
    })
    .filter((x): x is { name: string; date: Date; revision: number } => x !== null)
  if (matches.length === 0) {
    throw new Error(`No timeline_*.csv files found in ${dataDir}`)
  }
  matches.sort((a, b) => {
    const d = b.date.getTime() - a.date.getTime()
    return d !== 0 ? d : b.revision - a.revision
  })
  return join(dataDir, matches[0].name)
}

function extractCountriesFromCsv(csvPath: string): Set<string> {
  const content = readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length > 0) {
    throw new Error(`PapaParse errors in ${csvPath}: ${JSON.stringify(parsed.errors)}`)
  }
  const countries = new Set<string>()
  for (const row of parsed.data) {
    const c = row.Country?.trim()
    if (c) countries.add(c)
  }
  return countries
}

// ── CLI entry ───────────────────────────────────────────────────────────

function audit(): { findings: Finding[]; csvPath: string; csvCountryCount: number } {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const csvPath = findLatestTimelineCsv(join(repoRoot, 'src', 'data'))
  const knownCountries = extractCountriesFromCsv(csvPath)
  const aliases = COUNTRY_ALIASES as unknown as Record<string, string>
  const findings: Finding[] = [
    ...auditAliasesResolve(aliases, knownCountries),
    ...auditCanonicalCoverage(aliases, knownCountries),
    ...auditNoOrphans(aliases, knownCountries),
  ]
  return { findings, csvPath, csvCountryCount: knownCountries.size }
}

function main(): void {
  const wantJson = process.argv.includes('--json')
  const { findings, csvPath, csvCountryCount } = audit()

  if (wantJson) {
    process.stdout.write(JSON.stringify({ csvPath, csvCountryCount, findings }, null, 2) + '\n')
    process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0)
  }

  const errors = findings.filter((f) => f.severity === 'error')
  const warns = findings.filter((f) => f.severity === 'warn')

  if (errors.length === 0 && warns.length === 0) {
    console.log('PASS Timeline aliases clean.')
    console.log(`     CSV: ${csvPath}`)
    console.log(
      `     Countries: ${csvCountryCount} · Aliases: ${Object.keys(COUNTRY_ALIASES).length}`
    )
    process.exit(0)
  }

  if (errors.length > 0) {
    console.log(`FAIL ${errors.length} timeline-alias error(s):`)
    for (const f of errors) console.log(`   [${f.rule} · ${f.field}] ${f.detail}`)
    console.log()
  }
  if (warns.length > 0) {
    console.log(`WARN ${warns.length} timeline-alias warning(s):`)
    for (const f of warns) console.log(`   [${f.rule} · ${f.field}] ${f.detail}`)
  }
  process.exit(errors.length > 0 ? 1 : 0)
}

// Only execute when invoked directly via tsx. Test imports expose the audit
// functions for synthetic-fixture KATs without running the CLI entry point.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
