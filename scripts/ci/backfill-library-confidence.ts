#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * backfill-library-confidence.ts
 *
 * Reads the latest library CSV, computes confidence_score from existing
 * peer_reviewed / vetting_body / trusted_source_id values, and writes a new
 * dated copy alongside the source.
 *
 * Confidence rules:
 *   peer_reviewed=yes  AND  vetting_body non-empty  →  85 (high)
 *   peer_reviewed=yes  only                          →  70
 *   trusted_source_id  non-empty (any peer_reviewed) →  60 (medium)
 *   default                                          →  30 (low)
 *
 * Usage: npx tsx scripts/ci/backfill-library-confidence.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { glob } from 'glob'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const DRY_RUN = process.argv.includes('--dry-run')

function computeScore(row: Record<string, string>): number {
  const reviewed = (row['peer_reviewed'] ?? '').toLowerCase().trim()
  const vetBody = (row['vetting_body'] ?? '').trim()
  const trustedId = (row['trusted_source_id'] ?? '').trim()

  if (reviewed === 'yes' && vetBody.length > 0) return 85
  if (reviewed === 'yes') return 70
  if (trustedId.length > 0) return 60
  return 30
}

function getOutputPath(latestPath: string): string {
  const dir = path.dirname(latestPath)
  const base = path.basename(latestPath)
  // Replace date portion (MMDDYYYY) with 05072026
  const newBase = base.replace(/\d{8}(\.csv)$/, '05072026$1')
  return newBase === base ? path.join(dir, base.replace('.csv', '_05072026.csv')) : path.join(dir, newBase)
}

async function main() {
  const files = await glob('library_*.csv', { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    console.error('No library CSV found in', DATA_DIR)
    process.exit(1)
  }

  const latestPath = path.join(DATA_DIR, latest)
  const outPath = getOutputPath(latestPath)

  if (outPath === latestPath) {
    console.log('Source is already today\'s version — no new file needed.')
    process.exit(0)
  }

  const raw = fs.readFileSync(latestPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })

  if (parsed.errors.length > 0) {
    console.error('Parse errors:', parsed.errors)
    process.exit(1)
  }

  const headers = parsed.meta.fields ?? []
  const alreadyHas = headers.includes('confidence_score')

  const rows = parsed.data.map((row) => {
    if (alreadyHas) return row
    return { ...row, confidence_score: String(computeScore(row)) }
  })

  const outputHeaders = alreadyHas ? headers : [...headers, 'confidence_score']
  const csv = Papa.unparse(rows, { columns: outputHeaders })

  if (DRY_RUN) {
    console.log(`[dry-run] Would write ${rows.length} rows → ${path.basename(outPath)}`)
    console.log('First row preview:', rows[0])
  } else {
    fs.writeFileSync(outPath, csv, 'utf8')
    console.log(`Wrote ${rows.length} rows → ${outPath}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
