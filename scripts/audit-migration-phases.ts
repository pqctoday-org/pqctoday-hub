#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-migration-phases.ts
 *
 * Hygiene gate for the Migrate catalog's `migration_phases` column against the
 * 7-step migration framework that the Migrate step-filter uses
 * (`MIGRATION_STEPS` in src/data/migrationWorkflowData.ts).
 *
 * Why this exists: the step filter silently dropped ~41% of the catalog
 * (products with an empty `migration_phases`) and mis-handled both a
 * comma/semicolon delimiter mix and a `prepare` vs `preparation` token/id
 * mismatch — so whole steps appeared emptier than they are. The runtime now
 * tolerates all three (see `matchesMigrationStep` in src/data/migrateData.ts);
 * this audit keeps the DATA honest so the tolerance never hides a regression.
 *
 * Validations performed:
 *
 *  A) VALID TOKENS (error) — every `migration_phases` token is either a
 *     canonical step id or a known alias. Catches typos / new junk tokens.
 *
 *  B) STEP REACHABILITY (error) — every canonical step id is reachable by at
 *     least one product (after alias normalization), so no step filter is
 *     legitimately empty.
 *
 *  C) NON-CANONICAL ALIAS (warn) — tokens that only match via an alias (e.g.
 *     `prepare`) should be canonicalized to their step id (`preparation`) in
 *     the next dated catalog regen.
 *
 *  D) EMPTY RATIO (error past baseline) — the fraction of products with an
 *     empty `migration_phases` must not grow beyond the recorded baseline.
 *
 * Usage:
 *   npx tsx scripts/audit-migration-phases.ts          # human report
 *   npx tsx scripts/audit-migration-phases.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean (warnings allowed)
 *   1 — at least one severity='error' finding
 */

import { fileURLToPath } from 'node:url'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Papa from 'papaparse'

export interface Finding {
  severity: 'error' | 'warn'
  rule: 'valid-tokens' | 'step-reachability' | 'non-canonical-alias' | 'empty-ratio'
  message: string
}

// Keep in sync with MIGRATION_STEPS (src/data/migrationWorkflowData.ts). That
// module can't be imported here because it uses Vite's import.meta.glob.
const VALID_STEP_IDS = ['assess', 'plan', 'preparation', 'test', 'migrate', 'launch', 'rampup']
// Keep in sync with MIGRATION_STEP_ALIASES (src/data/migrateData.ts).
const STEP_ALIASES: Record<string, string> = { prepare: 'preparation' }
// After the 06192026_r3 migration-phase re-tag the empty ratio dropped to ~6.8%
// (the remainder are products the classifier left phase-agnostic). Cap just above
// that so it can't quietly grow back.
const EMPTY_RATIO_BASELINE = 0.08

function findLatestCatalogCsv(dataDir: string): string {
  const re = /^pqc_product_catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const matches = readdirSync(dataDir)
    .map((name) => {
      const m = re.exec(name)
      if (!m) return null
      const [, mm, dd, yyyy, rev] = m
      return { name, key: `${yyyy}${mm}${dd}-${(rev ?? '0').padStart(4, '0')}` }
    })
    .filter((x): x is { name: string; key: string } => x !== null)
    .sort((a, b) => b.key.localeCompare(a.key))
  if (matches.length === 0) throw new Error('No pqc_product_catalog_*.csv found in ' + dataDir)
  return join(dataDir, matches[0].name)
}

function aliasOf(token: string): string {
  return Object.prototype.hasOwnProperty.call(STEP_ALIASES, token) ? STEP_ALIASES[token] : token
}

export function audit(csvPath: string): Finding[] {
  const findings: Finding[] = []
  const raw = readFileSync(csvPath, 'utf8')
  const { data } = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })

  let total = 0
  let empty = 0
  const reachable = new Set<string>()
  const invalidTokens = new Map<string, number>()
  const aliasUse = new Map<string, number>()

  for (const row of data) {
    if (!row || !row.product_id) continue
    total++
    const cell = (row.migration_phases ?? '').trim()
    if (!cell) {
      empty++
      continue
    }
    for (const partRaw of cell.split(/[,;]/)) {
      const tok = partRaw.trim().toLowerCase()
      if (!tok) continue
      const canon = aliasOf(tok)
      if (!VALID_STEP_IDS.includes(canon)) {
        invalidTokens.set(tok, (invalidTokens.get(tok) ?? 0) + 1)
        continue
      }
      if (canon !== tok) aliasUse.set(tok, (aliasUse.get(tok) ?? 0) + 1)
      reachable.add(canon)
    }
  }

  // A) valid tokens
  for (const [tok, n] of invalidTokens) {
    findings.push({
      severity: 'error',
      rule: 'valid-tokens',
      message: `Unknown migration_phases token "${tok}" used by ${n} product(s) — not a step id or known alias.`,
    })
  }

  // B) step reachability
  for (const id of VALID_STEP_IDS) {
    if (!reachable.has(id)) {
      findings.push({
        severity: 'error',
        rule: 'step-reachability',
        message: `Step "${id}" is unreachable — no product maps to it; its step filter would be empty.`,
      })
    }
  }

  // C) non-canonical aliases
  for (const [tok, n] of aliasUse) {
    findings.push({
      severity: 'warn',
      rule: 'non-canonical-alias',
      message: `Token "${tok}" (used ${n}×) only matches via alias → "${aliasOf(tok)}". Canonicalize it in the next catalog regen.`,
    })
  }

  // D) empty ratio
  const ratio = total === 0 ? 0 : empty / total
  if (ratio > EMPTY_RATIO_BASELINE) {
    findings.push({
      severity: 'error',
      rule: 'empty-ratio',
      message: `Empty migration_phases ratio ${(ratio * 100).toFixed(1)}% exceeds baseline ${(EMPTY_RATIO_BASELINE * 100).toFixed(0)}% (${empty}/${total}). Re-tag products before it grows.`,
    })
  } else if (empty > 0) {
    findings.push({
      severity: 'warn',
      rule: 'empty-ratio',
      message: `${empty}/${total} products (${(ratio * 100).toFixed(1)}%) have no migration_phases — shown in every step (phase-agnostic). Re-tagging would sharpen the step filter.`,
    })
  }

  return findings
}

function main(): void {
  const wantJson = process.argv.includes('--json')
  const here = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(here, '..', 'src', 'data')
  const csvPath = findLatestCatalogCsv(dataDir)
  const findings = audit(csvPath)
  const errors = findings.filter((f) => f.severity === 'error')

  if (wantJson) {
    console.log(JSON.stringify({ csv: csvPath, findings }, null, 2))
  } else {
    console.log(`audit:migration-phases — ${csvPath.split('/').pop()}`)
    if (findings.length === 0) {
      console.log('  ✓ clean')
    }
    for (const f of findings) {
      console.log(`  ${f.severity === 'error' ? '✗' : '⚠'} [${f.rule}] ${f.message}`)
    }
    console.log(`\n${errors.length} error(s), ${findings.length - errors.length} warning(s)`)
  }
  process.exit(errors.length > 0 ? 1 : 0)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
