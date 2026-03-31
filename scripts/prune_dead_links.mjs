import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

// Paths
const basePath = '/Users/ericamador/antigravity/pqc-timeline-app'
const failedLinksPath = path.join(basePath, 'scripts', 'google-refs-failed-links.md')
const refsMdPath = path.join(basePath, 'src', 'data', 'pqcreferences03302026google.md')
const catalogCsvPath = path.join(basePath, 'src', 'data', 'pqc_product_catalog_03302026.csv')

console.log('--- Step 1: Extract 104 dead links ---')
const failedLinksContent = fs.readFileSync(failedLinksPath, 'utf-8')
const urlRegex = /https?:\/\/[^\s"'>\]]+/g
const allUrls = failedLinksContent.match(urlRegex) || []
// Get unique valid URLs and remove exceptions
const deadLinks = [...new Set(allUrls)].filter(
  (u) => !u.includes('keysight.com') && !u.includes('nordvpn.com')
)
console.log(`Found ${deadLinks.length} dead links to prune.`)

// Helper to check if a string contains any dead link
const containsDeadLink = (str) => {
  return deadLinks.some((link) => str.includes(link))
}

console.log('--- Step 2: Prune Markdown References ---')
if (fs.existsSync(refsMdPath)) {
  const refsLines = fs.readFileSync(refsMdPath, 'utf-8').split('\n')
  const prunedMdLines = refsLines.filter((line) => !containsDeadLink(line))
  fs.writeFileSync(refsMdPath, prunedMdLines.join('\n'))
  console.log(`Pruned ${refsLines.length - prunedMdLines.length} lines from Markdown.`)
}

console.log('--- Step 3: Prune CSV Catalog ---')
if (fs.existsSync(catalogCsvPath)) {
  const csvContent = fs.readFileSync(catalogCsvPath, 'utf-8')
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: false })
  console.log(`Original CSV rows: ${parsed.data.length}`)

  // Filter out rows containing any of the dead links in ANY cell
  const prunedCsvData = parsed.data.filter((row) => {
    return !Object.values(row).some((cell) => typeof cell === 'string' && containsDeadLink(cell))
  })

  console.log(`Pruned ${parsed.data.length - prunedCsvData.length} rows from CSV.`)

  // Custom logic to format the CSV properly matching original style.
  const csvOutput = Papa.unparse(prunedCsvData, {
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: true,
    newline: '\n',
    skipEmptyLines: false, // Maintain empty lines if any
    columns: parsed.meta.fields,
  })

  fs.writeFileSync(catalogCsvPath, csvOutput)
  console.log(`CSV updated.`)
}
