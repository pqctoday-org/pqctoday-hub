import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const INPUT = resolve(root, 'src/data/pqc_product_catalog_04012026_r4.csv')
const OUTPUT = resolve(root, 'src/data/pqc_product_catalog_04022026_r1.csv')

function classify(row) {
  const layer = (row.infrastructure_layer || '').toLowerCase()
  const catName = (row.category_name || '').toLowerCase()

  // Endpoint Security
  if (catName.includes('endpoint') || catName.includes('antivirus')) {
    return 'Endpoint Security'
  }
  // Computers
  if (catName.includes('os') || catName.includes('operating system') || layer.includes('os')) {
    return 'Computers (Physical and Virtual)'
  }
  // Data / Storage
  if (catName.includes('database') || layer.includes('database')) {
    return 'Data'
  }
  if (catName.includes('storage') || catName.includes('disk')) {
    return 'Storage Area Network'
  }
  // Networking
  if (
    catName.includes('switch') ||
    catName.includes('router') ||
    catName.includes('firewall') ||
    catName.includes('vpn') ||
    layer.includes('network') ||
    catName.includes('gateway')
  ) {
    if (
      layer.includes('hardware') ||
      catName.includes('hardware') ||
      catName.includes('appliance')
    ) {
      return 'Networking Hardware'
    }
    return 'Networking Software'
  }
  // Telecom
  if (catName.includes('telecom') || catName.includes('5g')) {
    return 'Telecommunications Hardware'
  }
  // Identity
  if (
    catName.includes('iam') ||
    catName.includes('identity') ||
    catName.includes('pki') ||
    catName.includes('certificate') ||
    catName.includes('credential')
  ) {
    if (layer.includes('hardware') || catName.includes('smart card') || catName.includes('token')) {
      return 'Identity, Credential, and Access Management (ICAM) Hardware'
    }
    return 'Identity, Credential, and Access Management (ICAM) Software'
  }
  // Cloud
  if (layer.includes('cloud') || catName.includes('cloud')) {
    return 'Cloud Services'
  }
  // Web / Collaboration
  if (catName.includes('browser') || catName.includes('web')) {
    return 'Web Software'
  }
  if (
    catName.includes('collaboration') ||
    catName.includes('messaging') ||
    catName.includes('email')
  ) {
    return 'Collaboration Software'
  }
  // Enterprise Security
  if (layer.includes('security') || catName.includes('security') || layer.includes('secsoftware')) {
    return 'Enterprise Security'
  }
  // Hardware fallbacks
  if (layer.includes('hardware') || catName.includes('hsm') || catName.includes('secure element')) {
    return 'Computer Peripherals'
  }

  return 'Other / Unclassified'
}

const csvText = readFileSync(INPUT, 'utf-8')
const { data, errors, meta } = Papa.parse(csvText, { header: true, skipEmptyLines: true })

if (errors.length > 0) {
  console.warn('Parse warnings:', errors.slice(0, 3))
}

// Re-order headers to put cisa_category next to infrastructure_layer
const fields = meta.fields.filter((f) => f !== 'cisa_category')
const infraIndex = fields.indexOf('infrastructure_layer')
if (infraIndex !== -1) {
  fields.splice(infraIndex + 1, 0, 'cisa_category')
} else {
  fields.push('cisa_category')
}

const transformed = data.map((row) => {
  // Create a new object with the desired key order
  const newRow = {}
  for (const key of fields) {
    if (key === 'cisa_category') {
      newRow[key] = classify(row)
    } else {
      newRow[key] = row[key]
    }
  }
  return newRow
})

const output = Papa.unparse(transformed, {
  header: true,
  newline: '\n',
  columns: fields,
})
writeFileSync(OUTPUT, output, 'utf-8')
console.log(`Generated ${OUTPUT} with ${transformed.length} rows.`)
