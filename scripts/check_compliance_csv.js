const fs = require('fs')

const complianceFile = './src/data/compliance_03212026.csv'
const xrefFiles = fs
  .readdirSync('./src/data')
  .filter((f) => f.startsWith('trusted_source_xref_') && f.endsWith('.csv'))

// Simple regex or split for CSV, but we only need IDs.
function extractIdsFromCSV(filePath, colIndex) {
  if (!fs.existsSync(filePath)) return new Set()
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const ids = new Set()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')
    // Assuming ID is first column normally, but in xref resource_id is second
    if (cols.length > colIndex) {
      ids.add(cols[colIndex].trim())
    }
  }
  return ids
}

// 1. Get all compliance IDs from compliance_03212026.csv
// Columns: id,label,description,industries,countries,requires_pqc,deadline,notes,enforcement_body,library_refs,timeline_refs,body_type,website
const compContent = fs.readFileSync(complianceFile, 'utf-8')
const compLines = compContent.split('\n')
const complianceEntities = []
for (let i = 1; i < compLines.length; i++) {
  const line = compLines[i].trim()
  if (!line) continue
  // Basic CSV split, ignores quotes (sufficient if IDs don't have commas)
  const match = line.match(/^([^,]+),([^,]+)/)
  if (match) {
    complianceEntities.push({ id: match[1].trim(), label: match[2].trim() })
  }
}

// 2. Get all distinct resource_ids from xrefs where resource_type == 'compliance'
// Columns: resource_type,resource_id,source_id,match_method
const hasXref = new Set()
for (const file of xrefFiles) {
  const content = fs.readFileSync('./src/data/' + file, 'utf-8')
  const lines = content.split('\n')
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(',')
    if (cols[0].trim() === 'compliance') {
      hasXref.add(cols[1].trim())
    }
  }
}

// 3. Find gaps
const gaps = []
for (const fw of complianceEntities) {
  if (!hasXref.has(fw.id)) {
    gaps.push(fw)
  }
}

console.log(`Auditing compliance file: ${complianceFile}`)
console.log(`Total compliance entities: ${complianceEntities.length}`)
console.log(`Entities missing trusted source xrefs: ${gaps.length}`)
if (gaps.length > 0) {
  console.log('\nGaps Found:')
  gaps.forEach((g) => console.log(`- ${g.id} (${g.label})`))
}
