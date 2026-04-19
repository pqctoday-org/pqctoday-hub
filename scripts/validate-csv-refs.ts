#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Validates cross-references between the compliance, library, timeline, and leaders CSVs.
 *
 * Structural checks (fail on break):
 *   1. compliance.library_refs  → library.reference_id  (broken links in UI)
 *   2. compliance.timeline_refs → Country:OrgName pairs in timeline  (broken links in UI)
 *   3. library.dependencies     → library.reference_id  (informational, exits 0)
 *   4. leaders.KeyResourceUrl   → library.reference_id  (broken deep links in UI)
 *
 * Semantic consistency checks (warn only):
 *   5. compliance.deadline_year ↔ timeline event coverage — for each compliance row
 *      with a parseable deadline year, at least one timeline event for a referenced
 *      org must span that year (StartYear ≤ deadline ≤ EndYear). Catches drift when
 *      either CSV is updated without the other.
 *   6. Orphan timeline orgs — informational warning when a timeline org has no
 *      compliance row that references it. Not all timeline events are regulatory
 *      mandates, so this is informational only.
 *
 * Usage:  npx tsx scripts/validate-csv-refs.ts
 * Exit 0: no broken refs in structural checks
 * Exit 1: structural checks failed (semantic checks never fail the run)
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')

// ── File discovery ─────────────────────────────────────────────────────────────

function latestCSV(prefix: string): string {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => new RegExp(`^${prefix}_\\d{8}(?:_r\\d+)?\\.csv$`).test(f))
    .sort((a, b) => {
      // Sort by date first, then by revision number (higher wins)
      const dateA = a.match(/\d{8}/)?.[0] ?? ''
      const dateB = b.match(/\d{8}/)?.[0] ?? ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      const revA = parseInt(a.match(/_r(\d+)/)?.[1] ?? '0', 10)
      const revB = parseInt(b.match(/_r(\d+)/)?.[1] ?? '0', 10)
      return revA - revB
    })
    .reverse()
  if (files.length === 0) throw new Error(`No ${prefix}_YYYYMMDD.csv found in src/data/`)
  return path.join(DATA_DIR, files[0])
}

// ── Quote-aware CSV line parser ────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(filePath: string): string[][] {
  return fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .slice(1) // skip header
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
}

function parseSemicolon(value: string): string[] {
  return value
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ── Loaders ───────────────────────────────────────────────────────────────────

/** Returns Set of all reference_id values from the library CSV. */
function loadLibraryIds(csvPath: string): Set<string> {
  return new Set(
    parseCSV(csvPath)
      .map((cols) => cols[0])
      .filter(Boolean)
  )
}

/**
 * Returns Set of all "Country:OrgName" pairs from the timeline CSV.
 * Timeline CSV header: Country,FlagCode,OrgName,...
 */
function loadTimelinePairs(csvPath: string): Set<string> {
  const pairs = new Set<string>()
  for (const cols of parseCSV(csvPath)) {
    const country = cols[0]?.trim()
    const orgName = cols[2]?.trim()
    if (country && orgName) {
      pairs.add(`${country}:${orgName}`)
    }
  }
  return pairs
}

/**
 * Returns a map from "Country:OrgName" to the list of [startYear, endYear] spans
 * for that org. Used by the semantic deadline-coverage check.
 * Timeline CSV header (positional):
 *   0=Country 1=FlagCode 2=OrgName 3=OrgFullName 4=OrgLogoUrl
 *   5=Type 6=Category 7=StartYear 8=EndYear 9=Title ...
 */
function loadTimelineOrgSpans(csvPath: string): Map<string, Array<[number, number]>> {
  const map = new Map<string, Array<[number, number]>>()
  for (const cols of parseCSV(csvPath)) {
    const country = cols[0]?.trim()
    const orgName = cols[2]?.trim()
    const startYear = parseInt(cols[7] ?? '', 10)
    const endYear = parseInt(cols[8] ?? '', 10)
    if (!country || !orgName || Number.isNaN(startYear) || Number.isNaN(endYear)) continue
    const key = `${country}:${orgName}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push([startYear, endYear])
  }
  return map
}

/**
 * Parse the earliest future (or latest historic) year out of a free-text deadline
 * string. Mirrors src/utils/deadlineUrgency.ts — kept in sync manually.
 */
function parseDeadlineYear(deadline: string, currentYear: number): number | null {
  if (!deadline) return null
  const trimmed = deadline.trim().toLowerCase()
  if (trimmed.startsWith('ongoing') || trimmed.startsWith('annual')) return null
  const matches = deadline.match(/\b(20\d{2})\b/g)
  if (!matches || matches.length === 0) return null
  const years = matches.map((y) => parseInt(y, 10)).sort((a, b) => a - b)
  const future = years.find((y) => y >= currentYear)
  return future ?? years[0]
}

/**
 * Returns compliance rows with their library_refs and timeline_refs.
 * Compliance CSV header: id,label,description,industries,countries,requires_pqc,
 *   deadline,notes,enforcement_body,library_refs,timeline_refs
 */
interface ComplianceRow {
  id: string
  deadline: string
  libraryRefs: string[]
  timelineRefs: string[]
  dependencyRefs: string[]
}

function loadCompliance(csvPath: string): ComplianceRow[] {
  return parseCSV(csvPath).map((cols) => ({
    id: cols[0] ?? '',
    deadline: cols[6] ?? '',
    libraryRefs: parseSemicolon(cols[9] ?? ''),
    timelineRefs: parseSemicolon(cols[10] ?? ''),
    dependencyRefs: [],
  }))
}

/** Returns library rows with their dependency refs. */
function loadLibraryDeps(csvPath: string): Array<{ id: string; deps: string[] }> {
  return parseCSV(csvPath).map((cols) => ({
    id: cols[0] ?? '',
    // dependencies column is index 10 in library CSV
    deps: parseSemicolon(cols[10] ?? ''),
  }))
}

/** Returns leaders rows with their KeyResourceUrl refs (column 10). */
function loadLeaderRefs(csvPath: string): Array<{ name: string; refs: string[] }> {
  return parseCSV(csvPath)
    .map((cols) => ({
      name: cols[0] ?? '',
      refs: parseSemicolon(cols[10] ?? ''),
    }))
    .filter((row) => row.refs.length > 0)
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main(): void {
  const libraryPath = latestCSV('library')
  const timelinePath = latestCSV('timeline')
  const compliancePath = latestCSV('compliance')
  const leadersPath = latestCSV('leaders')

  console.log(`Library:    ${path.basename(libraryPath)}`)
  console.log(`Timeline:   ${path.basename(timelinePath)}`)
  console.log(`Compliance: ${path.basename(compliancePath)}`)
  console.log(`Leaders:    ${path.basename(leadersPath)}`)
  console.log()

  const libraryIds = loadLibraryIds(libraryPath)
  const timelinePairs = loadTimelinePairs(timelinePath)
  const timelineSpans = loadTimelineOrgSpans(timelinePath)
  const complianceRows = loadCompliance(compliancePath)
  const libraryDeps = loadLibraryDeps(libraryPath)
  const leaderRefs = loadLeaderRefs(leadersPath)

  console.log(`Library entries:    ${libraryIds.size}`)
  console.log(`Timeline org pairs: ${timelinePairs.size}`)
  console.log(`Compliance rows:    ${complianceRows.length}`)
  console.log(`Leaders with refs:  ${leaderRefs.length}`)
  console.log()

  let hasErrors = false

  // ── Check 1: compliance.library_refs → library.reference_id ──────────────
  console.log('── Check 1: compliance.library_refs → library.reference_id ──────────')
  const brokenLibraryRefs: Array<{ complianceId: string; ref: string }> = []
  for (const row of complianceRows) {
    for (const ref of row.libraryRefs) {
      if (!libraryIds.has(ref)) {
        brokenLibraryRefs.push({ complianceId: row.id, ref })
      }
    }
  }
  if (brokenLibraryRefs.length === 0) {
    console.log('✓ All library_refs resolve\n')
  } else {
    hasErrors = true
    console.error(`✗ ${brokenLibraryRefs.length} broken library_ref(s):`)
    for (const { complianceId, ref } of brokenLibraryRefs) {
      console.error(`  [${complianceId}] "${ref}" — not found in library CSV`)
    }
    console.error()
  }

  // ── Check 2: compliance.timeline_refs → Country:OrgName pairs ────────────
  console.log('── Check 2: compliance.timeline_refs → timeline Country:OrgName ─────')
  const brokenTimelineRefs: Array<{ complianceId: string; ref: string }> = []
  for (const row of complianceRows) {
    for (const ref of row.timelineRefs) {
      if (!timelinePairs.has(ref)) {
        brokenTimelineRefs.push({ complianceId: row.id, ref })
      }
    }
  }
  if (brokenTimelineRefs.length === 0) {
    console.log('✓ All timeline_refs resolve\n')
  } else {
    hasErrors = true
    console.error(`✗ ${brokenTimelineRefs.length} broken timeline_ref(s):`)
    for (const { complianceId, ref } of brokenTimelineRefs) {
      console.error(`  [${complianceId}] "${ref}" — not found in timeline CSV`)
    }
    console.error()
  }

  // ── Check 3: library.dependencies → library.reference_id (informational) ──
  console.log('── Check 3: library.dependencies → library.reference_id (info) ──────')
  const externalDeps = new Set<string>()
  for (const { deps } of libraryDeps) {
    for (const dep of deps) {
      if (dep && !libraryIds.has(dep)) {
        externalDeps.add(dep)
      }
    }
  }
  if (externalDeps.size === 0) {
    console.log('✓ All library dependencies resolve internally\n')
  } else {
    console.warn(
      `ℹ  ${externalDeps.size} external dependency reference(s) (not in library — informational only):`
    )
    for (const dep of [...externalDeps].sort()) {
      console.warn(`    "${dep}"`)
    }
    console.warn()
  }

  // ── Check 4: leaders.KeyResourceUrl → library.reference_id ────────────────
  console.log('── Check 4: leaders.KeyResourceUrl → library.reference_id ─────────')
  const brokenLeaderRefs: Array<{ leaderName: string; ref: string }> = []
  for (const { name, refs } of leaderRefs) {
    for (const ref of refs) {
      if (!libraryIds.has(ref)) {
        brokenLeaderRefs.push({ leaderName: name, ref })
      }
    }
  }
  if (brokenLeaderRefs.length === 0) {
    console.log('✓ All leader KeyResourceUrl refs resolve\n')
  } else {
    hasErrors = true
    console.error(`✗ ${brokenLeaderRefs.length} broken leader KeyResourceUrl ref(s):`)
    for (const { leaderName, ref } of brokenLeaderRefs) {
      console.error(`  [${leaderName}] "${ref}" — not found in library CSV`)
    }
    console.error()
  }

  // ── Check 5: compliance deadline ↔ timeline event coverage ─────────────────
  console.log('── Check 5: compliance.deadline ↔ timeline event year span (warn) ───')
  const currentYear = new Date().getFullYear()
  const deadlineCoverageGaps: Array<{
    complianceId: string
    deadline: string
    year: number
    ref: string
  }> = []
  for (const row of complianceRows) {
    const year = parseDeadlineYear(row.deadline, currentYear)
    if (year === null) continue
    if (row.timelineRefs.length === 0) continue // no ref to check against
    // At least ONE referenced org must have an event spanning the deadline year.
    const hasCoverage = row.timelineRefs.some((ref) => {
      const spans = timelineSpans.get(ref) ?? []
      return spans.some(([start, end]) => start <= year && year <= end)
    })
    if (!hasCoverage) {
      deadlineCoverageGaps.push({
        complianceId: row.id,
        deadline: row.deadline,
        year,
        ref: row.timelineRefs.join(', '),
      })
    }
  }
  if (deadlineCoverageGaps.length === 0) {
    console.log('✓ Every dated compliance deadline has a timeline event covering its year\n')
  } else {
    console.warn(
      `⚠  ${deadlineCoverageGaps.length} compliance deadline(s) have no matching timeline event:`
    )
    for (const { complianceId, deadline, year, ref } of deadlineCoverageGaps) {
      console.warn(
        `   [${complianceId}] deadline="${deadline}" (year=${year}) — no event in ${ref} spans ${year}`
      )
    }
    console.warn()
  }

  // ── Check 6: orphan timeline orgs — no compliance row references them ──────
  console.log('── Check 6: orphan timeline orgs (info) ─────────────────────────────')
  const referencedPairs = new Set<string>()
  for (const row of complianceRows) {
    for (const ref of row.timelineRefs) referencedPairs.add(ref)
  }
  const orphanPairs = [...timelinePairs].filter((p) => !referencedPairs.has(p)).sort()
  if (orphanPairs.length === 0) {
    console.log('✓ Every timeline org is referenced by at least one compliance row\n')
  } else {
    console.warn(
      `ℹ  ${orphanPairs.length} timeline org(s) are not referenced by any compliance row ` +
        `(informational — not every event must map to a regulation):`
    )
    for (const p of orphanPairs) console.warn(`    ${p}`)
    console.warn()
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (hasErrors) {
    console.error('✗ Cross-reference validation FAILED — fix broken refs above.')
    process.exit(1)
  } else {
    console.log('✓ Cross-reference validation PASSED.')
    process.exit(0)
  }
}

main()
