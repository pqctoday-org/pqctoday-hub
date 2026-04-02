/**
 * add-quantum-tech-flag.mjs
 *
 * Adds a `quantum_tech` column to the migrate catalog.
 * Values: 'QKD', 'QRNG', 'QKD,QRNG', or '' (empty).
 *
 * Input:  src/data/pqc_product_catalog_04012026_r3.csv
 * Output: src/data/pqc_product_catalog_04012026_r4.csv
 *
 * Usage: node scripts/add-quantum-tech-flag.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const INPUT = resolve(root, 'src/data/pqc_product_catalog_04012026_r3.csv')
const OUTPUT = resolve(root, 'src/data/pqc_product_catalog_04012026_r4.csv')

// ---------------------------------------------------------------------------
// Curated QKD product list
// These products have QKD as a core capability (verified via pqc_capability_description
// or product_brief — not merely mentioned in learning_modules).
// ---------------------------------------------------------------------------
const QKD_PRODUCTS = new Set([
  'ID Quantique Cerberis XGR QKD',
  'Toshiba QKD System',
  'Toshiba Integrated PQC-QKD Platform',
  'evolutionQ BasejumpQDN',
  'evolutionQ BasejumpSKI',
  'Quantum Bridge DSKE',
  'Quantum Xchange Platform',
  'C-DOT Quantum CEM Encryptor',
  'Singtel Quantum-Safe Network',
  'CZQCI Czech Quantum Infrastructure',
  'PIONIER-Q Poland QCI',
  'MadQuantum-CM (Spain)',
  'Sequre Quantum (Chile)',
  'Quantum Leap Africa (AIMS)',
  'Nokia Quantum-Safe Networks',
  'PacketLight PQC Optical Encryption',
  'Ciena WaveLogic 6 Extreme',
  'Senetas CN7000 Series',
  'QuantumCTek PQC Chip',
  'QuintessenceLabs qSOC',
  'QNu Labs QShield', // also QRNG
])

// ---------------------------------------------------------------------------
// Curated QRNG product list
// These products have QRNG as a core capability.
// ---------------------------------------------------------------------------
const QRNG_PRODUCTS = new Set([
  'ID Quantique Quantis QRNG',
  'Quantinuum Quantum Origin',
  'QuintessenceLabs qStream',
  'OVHcloud QRNG SSL',
  'Qrypt BLAST SDK',
  'Qrypt VPN for NVIDIA Jetson',
  'QVerse',
  'Thales Luna T-Series HSM',
  'QNu Labs QShield', // also QKD
])

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const raw = readFileSync(INPUT, 'utf8')
const { data, errors } = Papa.parse(raw, { header: true, skipEmptyLines: true })

if (errors.length) {
  console.error('Parse errors:', errors)
  process.exit(1)
}

let qkdCount = 0
let qrngCount = 0
let bothCount = 0

const updated = data.map((row) => {
  const name = row.software_name
  const isQKD = QKD_PRODUCTS.has(name)
  const isQRNG = QRNG_PRODUCTS.has(name)

  let quantumTech = ''
  if (isQKD && isQRNG) {
    quantumTech = 'QKD,QRNG'
    bothCount++
  } else if (isQKD) {
    quantumTech = 'QKD'
    qkdCount++
  } else if (isQRNG) {
    quantumTech = 'QRNG'
    qrngCount++
  }

  return { ...row, quantum_tech: quantumTech }
})

const csv = Papa.unparse(updated, { newline: '\n' })
writeFileSync(OUTPUT, csv, 'utf8')

console.log(`\nWrote ${OUTPUT}`)
console.log(`  Total rows : ${updated.length}`)
console.log(`  QKD only   : ${qkdCount}`)
console.log(`  QRNG only  : ${qrngCount}`)
console.log(`  QKD+QRNG   : ${bothCount}`)
console.log(`  Columns    : ${Object.keys(updated[0]).join(', ')}`)
