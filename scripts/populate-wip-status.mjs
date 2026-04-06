/**
 * populate-wip-status.mjs
 *
 * Reads the latest migrate product catalog CSV and adds a `wip` boolean column.
 *
 * WIP rule:
 *   wip = true  if there is NO local file in public/products/ for the product
 *   wip = false if at least one downloaded proof file exists in public/products/
 *               (proof can confirm PQC presence OR absence — both are valid evidence)
 *
 * File matching: uses the same safeFilename() normalization as download-products.js
 *   name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
 *
 * Usage:
 *   node scripts/populate-wip-status.mjs
 *
 * Output:
 *   src/data/pqc_product_catalog_04052026_r4.csv
 */

import { createRequire } from 'module'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const Papa = require('papaparse')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const INPUT = resolve(ROOT, 'src/data/pqc_product_catalog_04052026_r3.csv')
const OUTPUT = resolve(ROOT, 'src/data/pqc_product_catalog_04052026_r4.csv')
const PRODUCTS_DIR = resolve(ROOT, 'public/products')

/** Same normalization used by download-products.js */
function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, '_')
}

// Build set of safe-names that have at least one file in public/products/
const productFiles = readdirSync(PRODUCTS_DIR).filter((f) => !f.endsWith('.json'))
const safeNamesWithFiles = new Set()
productFiles.forEach((f) => {
  // Strip extension and known suffixes like _doc1, _doc2, _repo
  const base = f.replace(/\.(html|pdf|md)$/, '').replace(/(_doc\d+|_repo|_doc-link-\d+)$/, '')
  safeNamesWithFiles.add(base)
})

const raw = readFileSync(INPUT, 'utf8')
const { data, errors } = Papa.parse(raw, { header: true, skipEmptyLines: true })

if (errors.length > 0) {
  console.error('Parse errors:', errors)
  process.exit(1)
}

let confirmedCount = 0
let wipCount = 0

const enriched = data.map((row) => {
  const safe = safeFilename(row['software_name'] ?? '')
  const wip = !safeNamesWithFiles.has(safe)
  if (wip) wipCount++
  else confirmedCount++
  return { ...row, wip: wip ? 'true' : 'false' }
})

const csv = Papa.unparse(enriched)
writeFileSync(OUTPUT, csv, 'utf8')

console.log(`Done. ${confirmedCount} confirmed, ${wipCount} WIP`)
console.log(`Output: ${OUTPUT}`)
