#!/usr/bin/env node
/**
 * regenerate-kat-csv.mjs — Rebuilds kat/kat_03282026.csv from the actual JSON files
 * on disk. Ensures the CSV index never drifts from the filesystem.
 *
 * Usage: node scripts/regenerate-kat-csv.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KAT_DIR = join(__dirname, '..', 'kat')
const CSV_PATH = join(KAT_DIR, 'kat_03282026.csv')

const FRESHNESS_DATE = '03/2026'

// NIST source URLs per algorithm
const ALGORITHM_URLS = {
  'ML-DSA-44': 'https://csrc.nist.gov/pubs/fips/204/final',
  'ML-DSA-65': 'https://csrc.nist.gov/pubs/fips/204/final',
  'ML-DSA-87': 'https://csrc.nist.gov/pubs/fips/204/final',
  'ML-KEM-512': 'https://csrc.nist.gov/pubs/fips/203/final',
  'ML-KEM-768': 'https://csrc.nist.gov/pubs/fips/203/final',
  'ML-KEM-1024': 'https://csrc.nist.gov/pubs/fips/203/final',
  'AES-256-GCM': 'https://csrc.nist.gov/pubs/sp/800/38/d/final',
  'AES-256-CBC': 'https://csrc.nist.gov/pubs/sp/800/38/a/final',
  'AES-256-CTR': 'https://csrc.nist.gov/pubs/sp/800/38/a/final',
  'AES-256-KW': 'https://www.rfc-editor.org/rfc/rfc3394',
  'HMAC-SHA-256': 'https://csrc.nist.gov/pubs/fips/198-1/final',
  'HMAC-SHA-512': 'https://csrc.nist.gov/pubs/fips/198-1/final',
  'ECDSA-P256': 'https://csrc.nist.gov/pubs/fips/186-5/final',
  EdDSA: 'https://www.rfc-editor.org/rfc/rfc8032',
  'RSA-2048-PSS': 'https://csrc.nist.gov/pubs/fips/186-5/final',
  'SHA-256': 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
  'SLH-DSA-SHA2-128s': 'https://csrc.nist.gov/pubs/fips/205/final',
}

const ALGORITHM_SOURCES = {
  'ML-DSA-44': 'NIST CSRC',
  'ML-DSA-65': 'NIST CSRC',
  'ML-DSA-87': 'NIST CSRC',
  'ML-KEM-512': 'NIST CSRC',
  'ML-KEM-768': 'NIST CSRC',
  'ML-KEM-1024': 'NIST CSRC',
  'AES-256-GCM': 'NIST SP 800-38D',
  'AES-256-CBC': 'NIST SP 800-38A',
  'AES-256-CTR': 'NIST SP 800-38A',
  'AES-256-KW': 'IETF RFC 3394',
  'HMAC-SHA-256': 'NIST FIPS 198-1',
  'HMAC-SHA-512': 'NIST FIPS 198-1',
  'ECDSA-P256': 'NIST FIPS 186-5',
  EdDSA: 'IETF RFC 8032',
  'RSA-2048-PSS': 'NIST FIPS 186-5',
  'SHA-256': 'NIST FIPS 180-4',
  'SLH-DSA-SHA2-128s': 'NIST CSRC',
}

// ── Walk the KAT directory ───────────────────────────────────────────────────
const rows = []
let idCounter = 1

const modules = readdirSync(KAT_DIR)
  .filter((f) => statSync(join(KAT_DIR, f)).isDirectory())
  .sort()

for (const moduleName of modules) {
  const moduleDir = join(KAT_DIR, moduleName)
  const subDirs = readdirSync(moduleDir)
    .filter((f) => statSync(join(moduleDir, f)).isDirectory())
    .sort()

  for (const subDir of subDirs) {
    const subDirPath = join(moduleDir, subDir)
    const files = readdirSync(subDirPath)
      .filter((f) => f.endsWith('.json'))
      .sort()

    // Find keys.json path if it exists
    const keysJsonPath = files.includes('keys.json') ? `/kat/${moduleName}/${subDir}/keys.json` : ''

    for (const file of files) {
      if (file === 'keys.json') continue // keys.json tracked separately

      const filePath = join(subDirPath, file)
      let json
      try {
        json = JSON.parse(readFileSync(filePath, 'utf8'))
      } catch {
        console.warn(`  WARN: Could not parse ${filePath}`)
        continue
      }

      const katId = json.kat_id ?? `KAT-AUTO-${String(idCounter).padStart(3, '0')}`
      const algorithm = json.reference_details?.algorithm ?? 'Unknown'
      const localPath = `/kat/${moduleName}/${subDir}/${file}`
      const source = ALGORITHM_SOURCES[algorithm] ?? json.authoritative_source ?? 'NIST CSRC'
      const url = ALGORITHM_URLS[algorithm] ?? json.reference_details?.standard ?? ''
      const useCase = `${subDir} ${json.step ?? file.replace('.json', '')}`

      rows.push({
        kat_id: katId,
        algorithm,
        local_kat_file: localPath,
        main_site_source: source,
        specific_kat_url: url,
        source_freshness_date: FRESHNESS_DATE,
        learning_module_id: moduleName,
        use_case_validated: useCase,
        integration_status: 'Active',
        keys_json_path: keysJsonPath,
      })

      idCounter++
    }
  }
}

// ── Write CSV ────────────────────────────────────────────────────────────────
const header =
  'kat_id,algorithm,local_kat_file,main_site_source,specific_kat_url,source_freshness_date,learning_module_id,use_case_validated,integration_status,keys_json_path'

function escapeCSV(val) {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const csvLines = [header]
for (const row of rows) {
  csvLines.push(
    [
      row.kat_id,
      row.algorithm,
      row.local_kat_file,
      row.main_site_source,
      row.specific_kat_url,
      row.source_freshness_date,
      row.learning_module_id,
      row.use_case_validated,
      row.integration_status,
      row.keys_json_path,
    ]
      .map(escapeCSV)
      .join(',')
  )
}

writeFileSync(CSV_PATH, csvLines.join('\n') + '\n')
console.log(`CSV written: ${CSV_PATH}`)
console.log(`  Total rows: ${rows.length}`)
console.log(`  Unique algorithms: ${[...new Set(rows.map((r) => r.algorithm))].length}`)
console.log(`  Unique modules: ${[...new Set(rows.map((r) => r.learning_module_id))].length}`)
console.log(`  Rows with keys.json: ${rows.filter((r) => r.keys_json_path).length}`)

// ── Validation ───────────────────────────────────────────────────────────────
const ids = rows.map((r) => r.kat_id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
if (dupes.length > 0) {
  console.error(
    `\n  ERROR: ${dupes.length} duplicate kat_id values: ${[...new Set(dupes)].join(', ')}`
  )
} else {
  console.log(`  Duplicate kat_ids: 0`)
}

const genericCount = rows.filter(
  (r) => r.algorithm === 'Generic-PQC' || r.algorithm === 'Unknown'
).length
if (genericCount > 0) {
  console.warn(`\n  WARN: ${genericCount} rows still have Generic-PQC/Unknown algorithm`)
} else {
  console.log(`  Generic-PQC rows remaining: 0`)
}
