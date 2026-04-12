/**
 * generate-module-issues.ts
 *
 * Regenerates module_issues_04122026_r1.csv by:
 *  1. Preserving all existing rows from module_issues_04122026.csv
 *  2. Adding new rows for any GAP/STALE audit entries that don't already have
 *     a matching issue (matched on module_id + gap_dimension)
 *
 * Usage:
 *   npx tsx scripts/generate-module-issues.ts
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IssueRow {
  lm_id: string
  module_id: string
  module_title: string
  track: string
  issue_number: string
  issue_url: string
  gap_dimension: string
  gap_description: string
  gap_source_ref: string
  severity: string
  status: string
  created_date: string
  closed_date: string
  resolution: string
  notes: string
}

interface AuditRow {
  module_id: string
  module_title: string
  track: string
  audit_date: string
  auditor: string
  dimension: string
  score: string
  status: string
  result_summary: string
  gap_description: string
  gap_source_ref: string
  url_checked: string
  severity: string
  notes: string
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const BASE = '/Users/ericamador/antigravity/pqc-timeline-app/docs/audits'
const ISSUES_IN = path.join(BASE, 'module_issues_04122026.csv')
const AUDIT_IN = path.join(BASE, 'module_audit_04122026.csv')
const ISSUES_OUT = path.join(BASE, 'module_issues_04122026_r1.csv')

const CREATED_DATE = '2026-04-12'

const OUTPUT_HEADERS: (keyof IssueRow)[] = [
  'lm_id',
  'module_id',
  'module_title',
  'track',
  'issue_number',
  'issue_url',
  'gap_dimension',
  'gap_description',
  'gap_source_ref',
  'severity',
  'status',
  'created_date',
  'closed_date',
  'resolution',
  'notes',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
  })
  if (result.errors.length > 0) {
    console.warn(`Parse warnings for ${path.basename(filePath)}:`, result.errors.slice(0, 5))
  }
  return result.data
}

/** Extract the numeric portion of LM-NNN and return as a number */
function parseLmNumber(lmId: string): number {
  const m = lmId.match(/^LM-(\d+)$/)
  return m ? parseInt(m[1], 10) : 0
}

/** Format a number as LM-NNN (zero-padded to 3 digits) */
function formatLmId(n: number): string {
  return `LM-${String(n).padStart(3, '0')}`
}

/** Derive severity from score.  score < 50 → high; 50-79 → medium; ≥80 → low */
function deriveSeverity(scoreStr: string): string {
  const score = parseFloat(scoreStr)
  if (isNaN(score)) return ''
  if (score < 50) return 'high'
  if (score < 80) return 'medium'
  return 'low'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Load existing issues
  const existingIssues = readCsv<IssueRow>(ISSUES_IN)
  const existingCount = existingIssues.length
  console.log(`Loaded ${existingCount} existing issue rows.`)

  // 2. Build lookup maps from existing issues
  //    a) module_id → lm_id  (take first match)
  const moduleToLmId = new Map<string, string>()
  for (const row of existingIssues) {
    if (row.module_id && row.lm_id && !moduleToLmId.has(row.module_id)) {
      moduleToLmId.set(row.module_id, row.lm_id)
    }
  }

  //    b) "module_id|gap_dimension" → true  (existing coverage set)
  const existingKeys = new Set<string>()
  for (const row of existingIssues) {
    if (row.module_id && row.gap_dimension) {
      existingKeys.add(`${row.module_id}|${row.gap_dimension}`)
    }
  }

  // 3. Find max LM number used so far
  let maxLm = 0
  for (const row of existingIssues) {
    const n = parseLmNumber(row.lm_id)
    if (n > maxLm) maxLm = n
  }
  console.log(`Max existing LM number: ${maxLm}`)

  // 4. Load audit rows
  const auditRows = readCsv<AuditRow>(AUDIT_IN)
  console.log(`Loaded ${auditRows.length} audit rows.`)

  // 5. Filter to GAP or STALE rows with non-empty gap_description
  //    NOTE: gap_description in the audit CSV lives in the `notes` column for many rows
  //    (the CSV uses `notes` as the last column for the descriptive text).
  //    We'll treat both `gap_description` and `notes` as candidates.
  const gapOrStale = auditRows.filter((r) => {
    if (r.status !== 'GAP' && r.status !== 'STALE') return false
    // The description may be in gap_description or notes (last column)
    const desc = (r.gap_description || r.notes || '').trim()
    return desc.length > 0
  })
  console.log(`Audit rows with GAP/STALE + non-empty description: ${gapOrStale.length}`)

  // 6. For each gap/stale row, check whether it's already covered
  const newIssues: IssueRow[] = []
  // Track new module_id → lm_id assignments made in this run
  const newModuleToLmId = new Map<string, string>(moduleToLmId)
  // Track modules we couldn't match (shouldn't happen but we'll log)
  const unmatched: string[] = []

  for (const auditRow of gapOrStale) {
    const key = `${auditRow.module_id}|${auditRow.dimension}`
    if (existingKeys.has(key)) {
      // Already tracked — skip
      continue
    }

    // Determine lm_id
    let lmId = newModuleToLmId.get(auditRow.module_id) ?? ''
    if (!lmId) {
      // Assign next available LM number
      maxLm += 1
      lmId = formatLmId(maxLm)
      newModuleToLmId.set(auditRow.module_id, lmId)
      console.log(`  Assigned ${lmId} to new module: ${auditRow.module_id}`)
    }

    // Prefer gap_description; fall back to notes
    const gapDesc = (auditRow.gap_description || auditRow.notes || '').trim()
    const gapSourceRef = (auditRow.gap_source_ref || '').trim()

    // Determine severity: prefer audit row's own severity field; fall back to score
    let severity = (auditRow.severity || '').trim()
    if (!severity) {
      severity = deriveSeverity(auditRow.score)
    }

    const newRow: IssueRow = {
      lm_id: lmId,
      module_id: auditRow.module_id,
      module_title: auditRow.module_title,
      track: auditRow.track,
      issue_number: '',
      issue_url: '',
      gap_dimension: auditRow.dimension,
      gap_description: gapDesc,
      gap_source_ref: gapSourceRef,
      severity,
      status: 'pending',
      created_date: CREATED_DATE,
      closed_date: '',
      resolution: '',
      notes: '',
    }

    newIssues.push(newRow)
    // Mark as covered so we don't add duplicates within the same run
    existingKeys.add(key)
  }

  console.log(`New rows to add: ${newIssues.length}`)

  // 7. Concatenate and write
  const allRows: IssueRow[] = [...existingIssues, ...newIssues]

  const csvOutput = Papa.unparse(allRows, {
    columns: OUTPUT_HEADERS,
    header: true,
    newline: '\n',
  })

  fs.writeFileSync(ISSUES_OUT, csvOutput, 'utf-8')
  console.log(`\nWrote ${ISSUES_OUT}`)
  console.log(`  Existing rows preserved: ${existingCount}`)
  console.log(`  New rows added:          ${newIssues.length}`)
  console.log(`  Total rows (excl header): ${allRows.length}`)

  if (unmatched.length > 0) {
    console.warn('\nModules with GAPs/STALEs that could NOT be matched:')
    for (const m of unmatched) console.warn('  -', m)
  } else {
    console.log('\nNo unmatched modules.')
  }
}

main()
