#!/usr/bin/env node
/**
 * Update module cross-references in library and migrate CSVs.
 * Appends module IDs to existing records where gaps were found.
 *
 * Usage: node scripts/update-module-xrefs.mjs
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const DATA_DIR = path.resolve('src/data')

// ── Library: records that need module_ids appended ──
const LIBRARY_ADDITIONS = {
  // P1: emv-payment-pqc (+8)
  'HKMA-Fintech-Blueprint-2026': ['emv-payment-pqc'],
  'G7-Financial-PQC-Roadmap-2026': ['emv-payment-pqc'],
  'UK-CMORG-PQC-Guidance-2025': ['emv-payment-pqc'],
  'SG-MAS-Quantum-Advisory-2024': ['emv-payment-pqc'],
  'SG-MAS-QKD-Sandbox-Report-2025': ['emv-payment-pqc'],
  'ETSI-GS-QKD-002': ['emv-payment-pqc'],
  'ETSI-GR-QSC-004': ['emv-payment-pqc'],
  'GSMA-PQC-Country-Survey-2025': ['emv-payment-pqc', '5g-security'],

  // P2: 5g-security (+3, GSMA already above)
  'UK-DSIT-CNI-PQC-Perspectives-2025': ['5g-security'],
  'NIST-SP-800-232': ['5g-security'],

  // P3: digital-assets (+9)
  'RFC 5652': ['digital-assets'],
  'RFC 7515': ['digital-assets'],
  'RFC 7516': ['digital-assets'],
  'RFC 7517': ['digital-assets'],
  'RFC 7518': ['digital-assets'],
  'RFC 7519': ['digital-assets'],
  'RFC 9629': ['digital-assets'],
  'RFC 9882': ['digital-assets'],
  'KMIP-V2-1-OASIS': ['digital-assets'],
}

// ── Migrate: products that need learning_modules appended ──
const MIGRATE_ADDITIONS = {
  'Thales Luna HSM': ['emv-payment-pqc'],
  'Entrust nShield': ['emv-payment-pqc'],
  'Futurex CryptoHub': ['emv-payment-pqc'],
  'Securosys Primus HSM': ['emv-payment-pqc'],
  'Marvell LiquidSecurity 2': ['emv-payment-pqc'],
  'Galileo FT': ['emv-payment-pqc'],
}

function appendModuleIds(currentValue, newIds) {
  const existing = currentValue
    ? currentValue
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const toAdd = newIds.filter((id) => !existing.includes(id))
  if (toAdd.length === 0) return currentValue
  return [...existing, ...toAdd].join(';')
}

function processCSV(srcPath, destPath, additions, keyColumn, moduleColumn) {
  const raw = fs.readFileSync(srcPath, 'utf-8')
  const { data, meta } = Papa.parse(raw, { header: true, skipEmptyLines: true })

  const keyIdx = meta.fields.indexOf(keyColumn)
  const modIdx = meta.fields.indexOf(moduleColumn)
  if (keyIdx === -1 || modIdx === -1) {
    console.error(`Column not found: ${keyColumn} or ${moduleColumn}`)
    process.exit(1)
  }

  let updated = 0
  const notFound = new Set(Object.keys(additions))

  for (const row of data) {
    const key = row[keyColumn]
    if (additions[key]) {
      const oldVal = row[moduleColumn] || ''
      const newVal = appendModuleIds(oldVal, additions[key])
      if (newVal !== oldVal) {
        row[moduleColumn] = newVal
        updated++
        console.log(`  [${key}] ${oldVal} → ${newVal}`)
      } else {
        console.log(`  [${key}] already has all IDs, skipping`)
      }
      notFound.delete(key)
    }
  }

  if (notFound.size > 0) {
    console.warn(`\n  WARNING: ${notFound.size} records not found:`)
    for (const k of notFound) console.warn(`    - ${k}`)
  }

  const output = Papa.unparse(data, { columns: meta.fields, newline: '\n' })
  fs.writeFileSync(destPath, output + '\n', 'utf-8')
  console.log(`  Written ${destPath} (${updated} records updated)\n`)
  return { updated, notFound: notFound.size }
}

// ── Main ──
console.log('=== Updating Library CSV ===')
const libSrc = path.join(DATA_DIR, 'library_03282026_r3.csv')
const libDst = path.join(DATA_DIR, 'library_03282026_r4.csv')
const libResult = processCSV(libSrc, libDst, LIBRARY_ADDITIONS, 'reference_id', 'module_ids')

console.log('=== Updating Migrate CSV ===')
const migSrc = path.join(DATA_DIR, 'quantum_safe_cryptographic_software_reference_03272026.csv')
const migDst = path.join(DATA_DIR, 'quantum_safe_cryptographic_software_reference_03282026.csv')
const migResult = processCSV(migSrc, migDst, MIGRATE_ADDITIONS, 'software_name', 'learning_modules')

console.log('=== Summary ===')
console.log(`Library: ${libResult.updated} updated, ${libResult.notFound} not found`)
console.log(`Migrate: ${migResult.updated} updated, ${migResult.notFound} not found`)

if (libResult.notFound > 0 || migResult.notFound > 0) {
  console.error('\nERROR: Some records were not found. Check reference IDs / software names.')
  process.exit(1)
}
