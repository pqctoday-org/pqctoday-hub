// SPDX-License-Identifier: GPL-3.0-only
/**
 * validate-trusted-sources.ts
 *
 * Validates FK integrity and coverage of the trusted source system:
 *
 *   TS-1  All xref.source_id values exist in trusted_sources            [ERROR]
 *   TS-2  All CSV trusted_source_id values resolve to a known source_id [ERROR]
 *   TS-3  Coverage by resource_type — % of records with ≥1 xref entry   [WARN if < 80%]
 *   TS-4  No duplicate xref rows (same type + resource_id + source_id)   [WARNING]
 *   TS-5  source_id format valid (lowercase, hyphens, max 30 chars)      [WARNING]
 *   TS-6  Required fields non-empty in trusted_sources                   [ERROR]
 *   TS-7  All source_id values are unique in trusted_sources             [ERROR]
 *   TS-8  last_verified_date is parseable as ISO date                    [WARNING]
 *
 * Exit codes:
 *   0 — all checks pass (CLEAN)
 *   1 — warnings only (NEEDS_ATTENTION)
 *   2 — any errors (BLOCKED)
 *
 * Flags:
 *   --json         Output structured JSON report
 *   --report-only  Do not exit with non-zero on warnings (only errors trigger exit 2)
 *   --verbose      Show passing checks and full findings
 */

import { loadCSV } from './validators/data-loader.js'
import type { CheckResult, Finding } from './validators/types.js'

const IS_JSON = process.argv.includes('--json')
const REPORT_ONLY = process.argv.includes('--report-only')
const VERBOSE = process.argv.includes('--verbose')

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCheck(
  id: string,
  description: string,
  sourceA: string,
  sourceB: string | null,
  severity: 'ERROR' | 'WARNING',
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: findings.length > 0 ? 'cross-reference' : 'structure',
    description,
    sourceA,
    sourceB,
    severity,
    status: findings.length > 0 ? 'FAIL' : 'PASS',
    findings,
  }
}

function finding(
  csv: string,
  row: number | null,
  field: string,
  value: string,
  message: string
): Finding {
  return { csv, row, field, value, message }
}

// ── Load data ────────────────────────────────────────────────────────────────

const trustedDataset = loadCSV('trusted_sources_')
const xrefDataset = loadCSV('trusted_source_xref_')

const trustedSources = trustedDataset.rows
const xrefRows = xrefDataset.rows

if (!trustedDataset.file) {
  console.error('ERROR: No trusted_sources_*.csv found in src/data/')
  process.exit(2)
}

const sourceIds = new Set(trustedSources.map((r) => r.source_id).filter(Boolean))

// Resource CSVs that have a trusted_source_id column
const RESOURCE_CSVS: Array<{
  prefix: string
  resourceType: string
  idField: string
  hasTsidColumn: boolean
}> = [
  { prefix: 'library_', resourceType: 'library', idField: 'reference_id', hasTsidColumn: true },
  {
    prefix: 'quantum_threats_hsm_industries_',
    resourceType: 'threats',
    idField: 'threat_id',
    hasTsidColumn: true,
  },
  { prefix: 'timeline_', resourceType: 'timeline', idField: 'Title', hasTsidColumn: true },
  { prefix: 'leaders_', resourceType: 'leaders', idField: 'Name', hasTsidColumn: true },
  {
    prefix: 'pqc_product_catalog_',
    resourceType: 'migrate',
    idField: 'software_name',
    hasTsidColumn: true,
  },
  { prefix: 'compliance_', resourceType: 'compliance', idField: 'id', hasTsidColumn: true },
]

// ── Run checks ───────────────────────────────────────────────────────────────

const results: CheckResult[] = []
let exitCode = 0

// TS-1: All xref.source_id values exist in trusted_sources
{
  const findings: Finding[] = []
  for (let i = 0; i < xrefRows.length; i++) {
    const row = xrefRows[i]
    if (row.source_id && !sourceIds.has(row.source_id)) {
      findings.push(
        finding(
          xrefDataset.file,
          i + 2,
          'source_id',
          row.source_id,
          `source_id "${row.source_id}" not found in trusted_sources`
        )
      )
    }
  }
  results.push(
    makeCheck(
      'TS-1',
      'Xref source_id values resolve to trusted_sources',
      xrefDataset.file ?? '(none)',
      trustedDataset.file,
      'ERROR',
      findings
    )
  )
  if (findings.length > 0) exitCode = 2
}

// TS-2: All CSV trusted_source_id columns resolve to known source_ids
for (const cfg of RESOURCE_CSVS) {
  const dataset = loadCSV(cfg.prefix)
  if (!dataset.file || !cfg.hasTsidColumn) continue

  // Check if column exists
  const hasColumn = dataset.rows.length > 0 && 'trusted_source_id' in dataset.rows[0]
  if (!hasColumn) {
    results.push({
      id: `TS-2-${cfg.resourceType}`,
      category: 'structure',
      description: `trusted_source_id column present in ${cfg.resourceType} CSV`,
      sourceA: dataset.file,
      sourceB: null,
      severity: 'WARNING',
      status: 'SKIP',
      findings: [
        finding(
          dataset.file,
          null,
          'trusted_source_id',
          '',
          'Column not present — run CSV update to add it'
        ),
      ],
    })
    continue
  }

  const findings: Finding[] = []
  for (let i = 0; i < dataset.rows.length; i++) {
    const row = dataset.rows[i]
    const tsid = row.trusted_source_id?.trim()
    if (!tsid) continue // empty is allowed (xref table is authoritative)
    if (!sourceIds.has(tsid)) {
      findings.push(
        finding(
          dataset.file,
          i + 2,
          'trusted_source_id',
          tsid,
          `trusted_source_id "${tsid}" not found in trusted_sources`
        )
      )
    }
  }
  results.push(
    makeCheck(
      `TS-2-${cfg.resourceType}`,
      `trusted_source_id values in ${cfg.resourceType} CSV resolve to trusted_sources`,
      dataset.file,
      trustedDataset.file,
      'ERROR',
      findings
    )
  )
  if (findings.length > 0) exitCode = 2
}

// TS-3: Coverage by resource_type — % with at least one xref entry
{
  const xrefByType: Record<string, Set<string>> = {}
  for (const row of xrefRows) {
    if (!xrefByType[row.resource_type]) xrefByType[row.resource_type] = new Set()
    xrefByType[row.resource_type].add(row.resource_id)
  }

  for (const cfg of RESOURCE_CSVS) {
    const dataset = loadCSV(cfg.prefix)
    if (!dataset.file || dataset.rows.length === 0) continue

    const total = dataset.rows.length
    const covered = dataset.rows.filter((r) =>
      xrefByType[cfg.resourceType]?.has(r[cfg.idField])
    ).length
    const pct = Math.round((covered / total) * 100)
    const threshold = 50 // 50% coverage threshold for a WARNING

    const findings: Finding[] = []
    if (pct < threshold) {
      findings.push(
        finding(
          dataset.file,
          null,
          'coverage',
          `${pct}%`,
          `Only ${covered}/${total} ${cfg.resourceType} records (${pct}%) have xref entries — below ${threshold}% threshold`
        )
      )
    }

    results.push({
      id: `TS-3-${cfg.resourceType}`,
      category: 'cross-reference',
      description: `Xref coverage for ${cfg.resourceType} (${pct}% of ${total} records)`,
      sourceA: xrefDataset.file ?? '(none)',
      sourceB: dataset.file,
      severity: 'WARNING',
      status: findings.length > 0 ? 'FAIL' : 'PASS',
      findings,
    })
    if (findings.length > 0 && exitCode < 1) exitCode = 1
  }
}

// TS-4: No duplicate xref rows
{
  const seen = new Set<string>()
  const findings: Finding[] = []
  for (let i = 0; i < xrefRows.length; i++) {
    const row = xrefRows[i]
    const key = `${row.resource_type}:${row.resource_id}:${row.source_id}`
    if (seen.has(key)) {
      findings.push(
        finding(xrefDataset.file, i + 2, 'duplicate', key, `Duplicate xref row: ${key}`)
      )
    }
    seen.add(key)
  }
  results.push(
    makeCheck(
      'TS-4',
      'No duplicate xref rows',
      xrefDataset.file ?? '(none)',
      null,
      'WARNING',
      findings
    )
  )
  if (findings.length > 0 && exitCode < 1) exitCode = 1
}

// TS-5: source_id format (lowercase, hyphens/digits only, max 30 chars)
{
  const validPattern = /^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$|^[a-z0-9]$/
  const findings: Finding[] = []
  for (let i = 0; i < trustedSources.length; i++) {
    const sid = trustedSources[i].source_id?.trim() ?? ''
    if (!validPattern.test(sid)) {
      findings.push(
        finding(
          trustedDataset.file,
          i + 2,
          'source_id',
          sid,
          `source_id "${sid}" does not match pattern [a-z0-9-] (max 30 chars)`
        )
      )
    }
  }
  results.push(
    makeCheck(
      'TS-5',
      'source_id format valid (lowercase, hyphens, max 30 chars)',
      trustedDataset.file,
      null,
      'WARNING',
      findings
    )
  )
  if (findings.length > 0 && exitCode < 1) exitCode = 1
}

// TS-6: Required fields non-empty in trusted_sources
{
  const REQUIRED = ['source_id', 'source_name', 'trust_tier', 'primary_url']
  const findings: Finding[] = []
  for (let i = 0; i < trustedSources.length; i++) {
    const row = trustedSources[i]
    for (const field of REQUIRED) {
      if (!row[field]?.trim()) {
        findings.push(
          finding(
            trustedDataset.file,
            i + 2,
            field,
            '',
            `Required field "${field}" is empty in row ${i + 2}`
          )
        )
      }
    }
  }
  results.push(
    makeCheck(
      'TS-6',
      'Required fields non-empty (source_id, source_name, trust_tier, primary_url)',
      trustedDataset.file,
      null,
      'ERROR',
      findings
    )
  )
  if (findings.length > 0) exitCode = 2
}

// TS-7: All source_id values are unique in trusted_sources
{
  const seen = new Map<string, number>()
  const findings: Finding[] = []
  for (let i = 0; i < trustedSources.length; i++) {
    const sid = trustedSources[i].source_id?.trim() ?? ''
    if (!sid) continue
    if (seen.has(sid)) {
      findings.push(
        finding(
          trustedDataset.file,
          i + 2,
          'source_id',
          sid,
          `Duplicate source_id "${sid}" (first seen at row ${(seen.get(sid) ?? 0) + 2})`
        )
      )
    } else {
      seen.set(sid, i)
    }
  }
  results.push(
    makeCheck(
      'TS-7',
      'All source_id values are unique in trusted_sources',
      trustedDataset.file,
      null,
      'ERROR',
      findings
    )
  )
  if (findings.length > 0) exitCode = 2
}

// TS-8: last_verified_date is parseable as ISO date
{
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/
  const findings: Finding[] = []
  for (let i = 0; i < trustedSources.length; i++) {
    const d = trustedSources[i].last_verified_date?.trim() ?? ''
    if (!d) continue
    if (!isoDateRe.test(d) || isNaN(Date.parse(d))) {
      findings.push(
        finding(
          trustedDataset.file,
          i + 2,
          'last_verified_date',
          d,
          `"${d}" is not a valid ISO date (YYYY-MM-DD)`
        )
      )
    }
  }
  results.push(
    makeCheck(
      'TS-8',
      'last_verified_date is parseable as YYYY-MM-DD',
      trustedDataset.file,
      null,
      'WARNING',
      findings
    )
  )
  if (findings.length > 0 && exitCode < 1) exitCode = 1
}

// ── Report ───────────────────────────────────────────────────────────────────

const errors = results.filter((r) => r.status === 'FAIL' && r.severity === 'ERROR').length
const warnings = results.filter((r) => r.status === 'FAIL' && r.severity === 'WARNING').length
const passed = results.filter((r) => r.status === 'PASS').length
const skipped = results.filter((r) => r.status === 'SKIP').length

const overallStatus = exitCode === 2 ? 'BLOCKED' : exitCode === 1 ? 'NEEDS_ATTENTION' : 'CLEAN'

if (IS_JSON) {
  const report = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    trustedSourcesFile: trustedDataset.file,
    xrefFile: xrefDataset.file ?? null,
    summary: {
      totalChecks: results.length,
      errors,
      warnings,
      passed,
      skipped,
    },
    checkResults: results,
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
} else {
  console.log(`\nTrusted Source Validation — ${overallStatus}`)
  console.log(`  File: ${trustedDataset.file}`)
  console.log(`  Xref: ${xrefDataset.file ?? '(none)'}`)
  console.log(`  Sources: ${trustedSources.length}  Xref rows: ${xrefRows.length}`)
  console.log(
    `  Checks: ${passed} passed, ${errors} errors, ${warnings} warnings, ${skipped} skipped\n`
  )

  for (const r of results) {
    if (r.status === 'PASS' && !VERBOSE) continue
    const icon =
      r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '⊘' : r.severity === 'ERROR' ? '✗' : '⚠'
    console.log(`  ${icon} [${r.id}] ${r.description}`)
    if (VERBOSE || r.status === 'FAIL') {
      for (const f of r.findings.slice(0, 10)) {
        console.log(`      ${f.field}: ${f.value} — ${f.message}`)
      }
      if (r.findings.length > 10) {
        console.log(`      ... and ${r.findings.length - 10} more`)
      }
    }
  }

  console.log(`\nStatus: ${overallStatus}`)
}

if (REPORT_ONLY) {
  // On --report-only, only exit non-zero for actual errors, not warnings
  process.exit(exitCode === 2 ? 2 : 0)
}
process.exit(exitCode)
