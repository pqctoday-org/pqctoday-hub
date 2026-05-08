#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * backfill-xref-confidence.ts
 *
 * Adds confidence_score to the algo_product_xref CSV by mapping
 * verification_status to numeric scores:
 *   VALIDATED | FIPS_VERIFIED  →  85
 *   PARTIALLY_VALIDATED        →  60
 *   NEEDS_REVIEW               →  30
 *   default                    →  30
 *
 * Usage: npx tsx scripts/ci/backfill-xref-confidence.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { glob } from 'glob'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const DRY_RUN = process.argv.includes('--dry-run')

function computeScore(row: Record<string, string>): number {
  const status = (row['verification_status'] ?? '').toUpperCase().trim()
  if (status === 'VALIDATED' || status === 'FIPS_VERIFIED') return 85
  if (status === 'PARTIALLY_VALIDATED') return 60
  return 30
}

async function main() {
  const files = await glob('algo_product_xref_*.csv', { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) { console.error('No algo_product_xref CSV found'); process.exit(1) }

  const latestPath = path.join(DATA_DIR, latest)
  const outName = latest.replace(/\d{8}\.csv$/, '05072026.csv')
  const outPath = path.join(DATA_DIR, outName)

  if (outPath === latestPath) {
    console.log('Source is already today\'s version — no new file needed.')
    process.exit(0)
  }

  const raw = fs.readFileSync(latestPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) { console.error('Parse errors:', parsed.errors); process.exit(1) }

  const headers = parsed.meta.fields ?? []
  const alreadyHas = headers.includes('confidence_score')
  const rows = parsed.data.map((row) => alreadyHas ? row : { ...row, confidence_score: String(computeScore(row)) })
  const outputHeaders = alreadyHas ? headers : [...headers, 'confidence_score']

  if (DRY_RUN) {
    console.log(`[dry-run] Would write ${rows.length} rows → ${outName}`)
  } else {
    fs.writeFileSync(outPath, Papa.unparse(rows, { columns: outputHeaders }), 'utf8')
    console.log(`Wrote ${rows.length} rows → ${outPath}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
