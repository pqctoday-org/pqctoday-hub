#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * normalize-vocab-tags.ts
 *
 * Normalizes freeform country / industry / region_scope values in CSV data files
 * to ISO 3166-1 alpha-2 country codes and NAICS 2-digit sector codes, using the
 * PQC vocabulary overlay (src/data/pqc-vocab-overlay.json) as the canonical mapping.
 *
 * CSVs targeted:
 *   compliance_*.csv  — `countries` column → ISO 3166 or PQC-REGION-* codes
 *   library_*.csv     — `regionScope` column → ISO 3166 or PQC-REGION-* codes
 *   threats_*.csv     — `affectedIndustries` column → NAICS 2-digit codes
 *
 * During the 90-day grace period (until 2026-08-05):
 *   - Freeform values that map cleanly to a code are replaced
 *   - Values that don't map are left as-is (with a WARNING logged)
 *   - No record is dropped
 *
 * After the grace period:
 *   - Remove the freeform-passthrough branch in applicabilityEngine.ts
 *
 * Usage:
 *   npx tsx scripts/ci/normalize-vocab-tags.ts [--dry-run] [--file compliance]
 *
 * Options:
 *   --dry-run     Print changes without writing files
 *   --file <name> Process only CSVs matching this name prefix (e.g. 'compliance')
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { glob } from 'glob'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const DRY_RUN = process.argv.includes('--dry-run')
const FILE_FILTER = (() => {
  const idx = process.argv.indexOf('--file')
  return idx !== -1 ? process.argv[idx + 1] : null
})()

// ── Vocab overlay ────────────────────────────────────────────────────────────
// `overlay` is parsed for side-effect validation (fail-fast on a malformed
// pqc-vocab-overlay.json) before the rest of this script runs. The current
// normalization path uses the inline `COUNTRY_FREEFORM_MAP` + `NAICS_INDUSTRY_MAP`
// tables below; future revisions are expected to source from `overlay` directly.

const overlayPath = path.resolve(process.cwd(), 'src/data/pqc-vocab-overlay.json')
void JSON.parse(fs.readFileSync(overlayPath, 'utf-8')) as {
  geography: Array<{ code: string; maps_to: string | string[] | null }>
  sectors: Array<{ code: string; maps_to: string }>
}

// Freeform country string → ISO 3166-1 alpha-2 (best-effort)
const COUNTRY_FREEFORM_MAP: Record<string, string> = {
  'United States': 'US',
  'United States of America': 'US',
  USA: 'US',
  'United Kingdom': 'GB',
  UK: 'GB',
  'Great Britain': 'GB',
  Australia: 'AU',
  Canada: 'CA',
  'New Zealand': 'NZ',
  Germany: 'DE',
  France: 'FR',
  Japan: 'JP',
  'South Korea': 'KR',
  Korea: 'KR',
  India: 'IN',
  China: 'CN',
  Netherlands: 'NL',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Switzerland: 'CH',
  Austria: 'AT',
  Belgium: 'BE',
  Spain: 'ES',
  Italy: 'IT',
  Poland: 'PL',
  Singapore: 'SG',
  'European Union': 'PQC-REGION-EU',
  EU: 'PQC-REGION-EU',
  Global: 'PQC-REGION-GLOBAL',
  International: 'PQC-REGION-GLOBAL',
  Worldwide: 'PQC-REGION-GLOBAL',
  'Five Eyes': 'PQC-REGION-FIVEEYES',
  'Five Eyes Alliance': 'PQC-REGION-FIVEEYES',
}

// Freeform industry string → NAICS 2-digit code (best-effort)
const INDUSTRY_NAICS_MAP: Record<string, string> = {
  'Finance & Banking': '52',
  'Finance & Insurance': '52',
  Banking: '52',
  Financial: '52',
  Finance: '52',
  'Government & Defense': '92',
  Government: '92',
  Defense: '92',
  'Public Administration': '92',
  Federal: '92',
  'Public Sector': '92',
  National: '92',
  Technology: '51',
  'Information Technology': '51',
  Software: '51',
  IT: '51',
  Healthcare: '62',
  'Life Sciences': '62',
  Medical: '62',
  Health: '62',
  'Energy & Utilities': '22',
  Energy: '22',
  Utilities: '22',
  'Oil & Gas': '22',
  Transportation: '48',
  Logistics: '48',
  Aviation: '48',
  Maritime: '48',
  'Professional Services': '54',
  Consulting: '54',
  Legal: '54',
  'Administrative Services': '56',
  'Support Services': '56',
  'HSM Vendors': 'PQC-SECTOR-HSM-VENDOR',
  'HSM / Crypto Hardware': 'PQC-SECTOR-HSM-VENDOR',
  'Cloud Key Management': 'PQC-SECTOR-CLOUD-KMS',
  'PQC Library': 'PQC-SECTOR-PQCLIB-VENDOR',
  'PQC Library / SDK Vendor': 'PQC-SECTOR-PQCLIB-VENDOR',
  'All industries': 'All',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeValue(
  raw: string,
  lookupMap: Record<string, string>,
  codePattern: RegExp
): { normalized: string; changed: boolean; unknown: boolean } {
  const trimmed = raw.trim()
  if (!trimmed) return { normalized: trimmed, changed: false, unknown: false }
  if (codePattern.test(trimmed)) return { normalized: trimmed, changed: false, unknown: false }
  if (trimmed.startsWith('PQC-')) return { normalized: trimmed, changed: false, unknown: false }
  // eslint-disable-next-line security/detect-object-injection
  const mapped = lookupMap[trimmed]
  if (mapped) return { normalized: mapped, changed: mapped !== trimmed, unknown: false }
  return { normalized: trimmed, changed: false, unknown: true }
}

function normalizeSemicolonField(
  raw: string,
  lookupMap: Record<string, string>,
  codePattern: RegExp
): { result: string; changed: boolean; unknowns: string[] } {
  if (!raw?.trim()) return { result: raw ?? '', changed: false, unknowns: [] }
  const parts = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  let anyChanged = false
  const unknowns: string[] = []
  const normalized = parts.map((p) => {
    const { normalized, changed, unknown } = normalizeValue(p, lookupMap, codePattern)
    if (changed) anyChanged = true
    if (unknown) unknowns.push(p)
    return normalized
  })
  return { result: normalized.join(';'), changed: anyChanged, unknowns }
}

// ── CSV processing ───────────────────────────────────────────────────────────

interface ProcessStats {
  file: string
  outFile: string
  rowsChanged: number
  unknowns: Map<string, number>
}

/** Returns sibling output path: foo_05072026.csv → foo_05072026_r2.csv */
function outputPath(inputPath: string): string {
  const base = path.basename(inputPath, '.csv')
  const dir = path.dirname(inputPath)
  // Avoid doubling _r2 if re-run on an already-normalized file
  const suffix = base.endsWith('_r2') ? '' : '_r2'
  return path.join(dir, `${base}${suffix}.csv`)
}

function processComplianceCsv(filePath: string): ProcessStats {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, meta } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  const out = outputPath(filePath)
  const stats: ProcessStats = {
    file: path.basename(filePath),
    outFile: path.basename(out),
    rowsChanged: 0,
    unknowns: new Map(),
  }

  const ISO_CODE = /^[A-Z]{2}$/
  const changed = data.map((row) => {
    let modified = false
    const newRow = { ...row }

    if (row['countries'] !== undefined) {
      const {
        result,
        changed: c,
        unknowns,
      } = normalizeSemicolonField(row['countries'], COUNTRY_FREEFORM_MAP, ISO_CODE)
      if (c) {
        newRow['countries'] = result
        modified = true
      }
      unknowns.forEach((u) => stats.unknowns.set(u, (stats.unknowns.get(u) ?? 0) + 1))
    }

    if (modified) stats.rowsChanged++
    return newRow
  })

  if (!DRY_RUN && stats.rowsChanged > 0) {
    const csv = Papa.unparse(changed, { columns: meta.fields })
    fs.writeFileSync(out, csv, 'utf-8')
  }
  return stats
}

function processLibraryCsv(filePath: string): ProcessStats {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, meta } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  const out = outputPath(filePath)
  const stats: ProcessStats = {
    file: path.basename(filePath),
    outFile: path.basename(out),
    rowsChanged: 0,
    unknowns: new Map(),
  }

  const ISO_CODE = /^[A-Z]{2}$/
  const changed = data.map((row) => {
    let modified = false
    const newRow = { ...row }

    if (row['regionScope'] !== undefined) {
      const {
        result,
        changed: c,
        unknowns,
      } = normalizeSemicolonField(row['regionScope'], COUNTRY_FREEFORM_MAP, ISO_CODE)
      if (c) {
        newRow['regionScope'] = result
        modified = true
      }
      unknowns.forEach((u) => stats.unknowns.set(u, (stats.unknowns.get(u) ?? 0) + 1))
    }

    if (modified) stats.rowsChanged++
    return newRow
  })

  if (!DRY_RUN && stats.rowsChanged > 0) {
    const csv = Papa.unparse(changed, { columns: meta.fields })
    fs.writeFileSync(out, csv, 'utf-8')
  }
  return stats
}

function processThreatsCsv(filePath: string): ProcessStats {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, meta } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  const out = outputPath(filePath)
  const stats: ProcessStats = {
    file: path.basename(filePath),
    outFile: path.basename(out),
    rowsChanged: 0,
    unknowns: new Map(),
  }

  const NAICS_CODE = /^\d{2,6}$/
  const changed = data.map((row) => {
    let modified = false
    const newRow = { ...row }

    const industryCol =
      row['affectedIndustries'] !== undefined
        ? 'affectedIndustries'
        : row['industry'] !== undefined
          ? 'industry'
          : null
    if (industryCol) {
      const {
        result,
        changed: c,
        unknowns,
      } = normalizeSemicolonField(row[industryCol], INDUSTRY_NAICS_MAP, NAICS_CODE)
      if (c) {
        newRow[industryCol] = result
        modified = true
      }
      unknowns.forEach((u) => stats.unknowns.set(u, (stats.unknowns.get(u) ?? 0) + 1))
    }

    if (modified) stats.rowsChanged++
    return newRow
  })

  if (!DRY_RUN && stats.rowsChanged > 0) {
    const csv = Papa.unparse(changed, { columns: meta.fields })
    fs.writeFileSync(out, csv, 'utf-8')
  }
  return stats
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const allStats: ProcessStats[] = []

  const shouldProcess = (prefix: string) => FILE_FILTER === null || prefix.startsWith(FILE_FILTER)

  if (shouldProcess('compliance')) {
    const files = await glob(`${DATA_DIR}/compliance_*.csv`)
    files
      .sort()
      .slice(-1)
      .forEach((f) => allStats.push(processComplianceCsv(f)))
  }

  if (shouldProcess('library')) {
    const files = await glob(`${DATA_DIR}/library_*.csv`)
    files
      .sort()
      .slice(-1)
      .forEach((f) => allStats.push(processLibraryCsv(f)))
  }

  if (shouldProcess('threats')) {
    const files = await glob(`${DATA_DIR}/threats_*.csv`)
    files
      .sort()
      .slice(-1)
      .forEach((f) => allStats.push(processThreatsCsv(f)))
  }

  for (const s of allStats) {
    const mode = DRY_RUN ? '[DRY RUN] ' : ''
    const dest = DRY_RUN ? '' : ` → ${s.outFile}`
    console.warn(`${mode}${s.file}${dest}: ${s.rowsChanged} rows updated`)
    if (s.unknowns.size > 0) {
      console.warn(`  WARNING — unmapped values (grace period — left as-is):`)
      for (const [val, count] of s.unknowns.entries()) {
        console.warn(`    "${val}" (${count}×)`)
      }
    }
  }

  const totalChanged = allStats.reduce((sum, s) => sum + s.rowsChanged, 0)
  const totalUnknowns = allStats.reduce((sum, s) => sum + s.unknowns.size, 0)
  console.warn(`\nTotal: ${totalChanged} rows updated, ${totalUnknowns} unmapped value types`)
  if (DRY_RUN) console.warn('(dry run — no files written)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
