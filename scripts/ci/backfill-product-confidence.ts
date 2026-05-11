#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * backfill-product-confidence.ts
 *
 * Adds confidence_score and cswp39_tags columns to the latest product catalog CSV.
 *
 * Usage: npx tsx scripts/ci/backfill-product-confidence.ts [--dry-run]
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
  const proofUrl = (row['proof_url'] ?? '').trim()
  const validationResult = (row['validation_result'] ?? '').trim()

  if (reviewed === 'yes' && vetBody.length > 0) return 85
  if (reviewed === 'yes') return 70
  // Products with documented proof get a boost
  if (proofUrl.length > 0 && validationResult === 'VALIDATED') return 75
  if (trustedId.length > 0) return 60
  return 30
}

async function main() {
  const files = await glob('pqc_product_catalog_*.csv', { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    console.error('No product catalog CSV found')
    process.exit(1)
  }

  const latestPath = path.join(DATA_DIR, latest)
  const outName = latest.replace(/\d{8}\.csv$/, '05072026.csv')
  const outPath = path.join(DATA_DIR, outName)

  if (outPath === latestPath) {
    console.log("Source is already today's version — no new file needed.")
    process.exit(0)
  }

  const raw = fs.readFileSync(latestPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) {
    console.error('Parse errors:', parsed.errors)
    process.exit(1)
  }

  const headers = parsed.meta.fields ?? []
  const hasConfidence = headers.includes('confidence_score')
  const hasCswp39 = headers.includes('cswp39_tags')
  const newHeaders = [
    ...headers,
    ...(hasConfidence ? [] : ['confidence_score']),
    ...(hasCswp39 ? [] : ['cswp39_tags']),
  ]

  const rows = parsed.data.map((row) => ({
    ...row,
    ...(hasConfidence ? {} : { confidence_score: String(computeScore(row)) }),
    ...(hasCswp39 ? {} : { cswp39_tags: '' }),
  }))

  if (DRY_RUN) {
    console.log(`[dry-run] Would write ${rows.length} rows → ${outName}`)
  } else {
    fs.writeFileSync(outPath, Papa.unparse(rows, { columns: newHeaders }), 'utf8')
    console.log(`Wrote ${rows.length} rows → ${outPath}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
