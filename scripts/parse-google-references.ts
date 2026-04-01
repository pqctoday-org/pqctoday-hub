#!/usr/bin/env npx tsx
/* eslint-disable */
/**
 * parse-google-references.ts
 *
 * Parses pqcreferences03302026google.md and:
 * 1. Extracts all 416 records (Code, Subcategory, Product, PQC Status, Evidence URL)
 * 2. Unwraps Google Search redirect URLs to get the real URL
 * 3. Classifies each record by target source (migrate, library, timeline, compliance)
 * 4. Flags duplicates against existing CSVs
 * 5. Outputs scripts/google-refs-manifest.json
 *
 * Usage: npx tsx scripts/parse-google-references.ts [--dry-run]
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const INPUT = path.join(ROOT, 'src/data/pqcreferences03302026google.md')
const OUTPUT = path.join(ROOT, 'scripts/google-refs-manifest.json')

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedRecord {
  batch: number
  row: number
  code: string
  subcategory: string
  productName: string
  pqcStatus: string
  evidenceUrl: string
  evidenceLabel: string
  rawUrl: string
  urlType: 'direct' | 'google-redirect' | 'homepage' | 'pdf' | 'github'
  targetSources: string[]
  existingMatch: string | null
  matchType: 'exact' | 'fuzzy' | 'none'
  downloadable: boolean
  skipReason: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unwrapGoogleUrl(url: string): string {
  if (!url.includes('google.com/search?q=')) return url
  try {
    const u = new URL(url)
    const q = u.searchParams.get('q')
    if (q && (q.startsWith('http://') || q.startsWith('https://'))) {
      return q
    }
  } catch {
    // Fall through
  }
  // Fallback: regex extract
  const match = url.match(/[?&]q=(https?[^&]+)/)
  if (match) {
    try {
      return decodeURIComponent(match[1])
    } catch {
      return match[1]
    }
  }
  return url
}

function classifyUrl(url: string): ParsedRecord['urlType'] {
  if (url.includes('google.com/search?q=')) return 'google-redirect'
  if (url.match(/\.pdf(\?|$)/i) || url.includes('/pdf/')) return 'pdf'
  if (url.includes('github.com')) return 'github'
  // Homepage detection: domain root with no meaningful path
  try {
    const u = new URL(url)
    const p = u.pathname.replace(/\/+$/, '')
    if (p === '' || p === '/en' || p === '/us' || p === '/en-us') return 'homepage'
  } catch {
    // ignore
  }
  return 'direct'
}

function isDownloadable(url: string, urlType: string): { ok: boolean; reason: string | null } {
  if (urlType === 'homepage') return { ok: false, reason: 'generic-homepage' }
  if (!url.startsWith('http')) return { ok: false, reason: 'invalid-url' }
  return { ok: true, reason: null }
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyTargetSources(code: string, subcategory: string): string[] {
  const sources: string[] = []

  // Product/migrate codes
  const productCodes = [
    'QSP',
    'QSH',
    'QSL',
    'QGS',
    'QWP',
    'QID',
    'QOS',
    'QCG',
    'QSS',
    'QER',
    'QPF',
    'QMI',
    'QNE',
    'QKD',
    'QOT',
    'QVT',
    'QOB',
    'QVA',
    'QML',
    'QRA',
    'QDB',
    'QSC',
    'QFC',
    'QDS',
    'QBP',
    'QDE',
    'QDR',
    'QCP',
    'QCV',
    'QCN',
    'QWB',
    'QPV',
    'QED',
    'QMD',
    'QTI',
    'QAS',
    'QEM',
    'QAC',
  ]
  if (productCodes.includes(code)) sources.push('migrate')

  // Library codes (standards, tools, frameworks)
  const libraryCodes = ['QRF', 'QCT', 'QST']
  if (libraryCodes.includes(code)) sources.push('library')

  // Research that could be library
  if (code === 'QRS') sources.push('library')

  // Policy/compliance codes
  if (code === 'QGS' && subcategory.toLowerCase().includes('policy')) sources.push('compliance')
  if (code === 'QAL') sources.push('compliance')
  if (code === 'QCP' && subcategory.toLowerCase().includes('compliance')) sources.push('compliance')

  // Timeline candidates (product launches, standards releases, government policies)
  if (code === 'QGD' && subcategory.toLowerCase().includes('government')) sources.push('timeline')
  if (code === 'QGD' && subcategory.toLowerCase().includes('defense')) sources.push('timeline')
  if (code === 'QL1') sources.push('timeline') // Blockchain milestones

  // Standards that are also library records
  if (code === 'QST') {
    if (!sources.includes('library')) sources.push('library')
  }

  // Default to migrate if nothing else matched
  if (sources.length === 0) sources.push('migrate')

  return [...new Set(sources)]
}

// ─── Parse Markdown ──────────────────────────────────────────────────────────

function parseMarkdownTables(content: string): ParsedRecord[] {
  const records: ParsedRecord[] = []
  const lines = content.split('\n')
  let batch = 0
  let row = 0

  for (const line of lines) {
    // Detect batch headers
    const batchMatch = line.match(/^###?\s+\*\*Batch\s+(\d+)/)
    if (batchMatch) {
      batch = parseInt(batchMatch[1], 10)
      continue
    }

    // Skip separator/header rows
    if (line.startsWith('| :---') || line.startsWith('| Code')) continue

    // Parse table rows: | Code | Subcategory | [Product](url) | Status | [Label](url) |
    const tableMatch = line.match(
      /^\|\s*\*\*(\w+)\*\*\s*\|\s*\*\*([^|]+?)\*\*\s*\|\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*(?:\[cite[^\]]*\])?\s*\|/
    )

    if (tableMatch) {
      row++
      const [, code, subcategory, productName, productUrl, pqcStatus, evidenceLabel, evidenceUrl] =
        tableMatch

      const cleanSubcat = subcategory.replace(/\*\*/g, '').trim()
      const cleanStatus = pqcStatus.replace(/\*\*/g, '').trim()
      const cleanProduct = productName.replace(/\*\*/g, '').trim()

      // Unwrap Google URL
      const realUrl = unwrapGoogleUrl(evidenceUrl.trim())
      const rawUrlType = classifyUrl(evidenceUrl.trim())
      const cleanUrlType = classifyUrl(realUrl)

      const { ok, reason } = isDownloadable(realUrl, cleanUrlType)

      records.push({
        batch,
        row,
        code: code.trim(),
        subcategory: cleanSubcat,
        productName: cleanProduct,
        pqcStatus: cleanStatus,
        evidenceUrl: realUrl,
        evidenceLabel: evidenceLabel.trim(),
        rawUrl: evidenceUrl.trim(),
        urlType: rawUrlType === 'google-redirect' ? 'google-redirect' : cleanUrlType,
        targetSources: classifyTargetSources(code.trim(), cleanSubcat),
        existingMatch: null,
        matchType: 'none',
        downloadable: ok,
        skipReason: reason,
      })
    }
  }

  return records
}

// ─── Load Existing Product Names ─────────────────────────────────────────────

function loadExistingProductNames(): Map<string, string> {
  const catalogGlob = path.join(ROOT, 'src/data')
  const files = fs.readdirSync(catalogGlob).filter((f) => f.startsWith('pqc_product_catalog_'))
  if (files.length === 0) return new Map()

  // Use the latest catalog
  files.sort()
  const latest = files[files.length - 1]
  const content = fs.readFileSync(path.join(catalogGlob, latest), 'utf-8')
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true })

  const nameMap = new Map<string, string>()
  for (const row of parsed.data as Record<string, string>[]) {
    const name = row.software_name?.trim()
    if (name) {
      nameMap.set(normalizeProductName(name), name)
    }
  }
  return nameMap
}

function loadExistingLibraryIds(): Set<string> {
  const dir = path.join(ROOT, 'src/data')
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('library_') && f.endsWith('.csv'))
  if (files.length === 0) return new Set()

  files.sort()
  const latest = files[files.length - 1]
  const content = fs.readFileSync(path.join(dir, latest), 'utf-8')
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true })

  const ids = new Set<string>()
  for (const row of parsed.data as Record<string, string>[]) {
    const id = row.reference_id?.trim()
    if (id) ids.add(id.toLowerCase())
  }
  return ids
}

// ─── Match Records Against Existing Data ─────────────────────────────────────

function matchProducts(records: ParsedRecord[], existingNames: Map<string, string>): void {
  for (const rec of records) {
    if (!rec.targetSources.includes('migrate')) continue

    const normalized = normalizeProductName(rec.productName)

    // Exact match
    if (existingNames.has(normalized)) {
      rec.existingMatch = existingNames.get(normalized)!
      rec.matchType = 'exact'
      continue
    }

    // Fuzzy match: check if any existing name contains or is contained by this name
    for (const [key, original] of existingNames) {
      if (
        (key.length > 5 && normalized.includes(key)) ||
        (normalized.length > 5 && key.includes(normalized))
      ) {
        rec.existingMatch = original
        rec.matchType = 'fuzzy'
        break
      }
    }
  }
}

// ─── Dedup within the reference file itself ──────────────────────────────────

function flagInternalDuplicates(records: ParsedRecord[]): Map<string, number[]> {
  const seen = new Map<string, number[]>()
  for (let i = 0; i < records.length; i++) {
    const key = normalizeProductName(records[i].productName)
    if (!seen.has(key)) {
      seen.set(key, [])
    }
    seen.get(key)!.push(i)
  }
  return new Map([...seen].filter(([, indices]) => indices.length > 1))
}

// ─── Generate Report ─────────────────────────────────────────────────────────

function generateReport(records: ParsedRecord[], dupes: Map<string, number[]>) {
  const total = records.length
  const byUrlType = {
    direct: records.filter((r) => r.urlType === 'direct').length,
    'google-redirect': records.filter((r) => r.urlType === 'google-redirect').length,
    homepage: records.filter((r) => r.urlType === 'homepage').length,
    pdf: records.filter((r) => r.urlType === 'pdf').length,
    github: records.filter((r) => r.urlType === 'github').length,
  }
  const downloadable = records.filter((r) => r.downloadable).length
  const exactMatches = records.filter((r) => r.matchType === 'exact').length
  const fuzzyMatches = records.filter((r) => r.matchType === 'fuzzy').length
  const newRecords = records.filter(
    (r) => r.matchType === 'none' && r.targetSources.includes('migrate')
  ).length
  const multiSource = records.filter((r) => r.targetSources.length > 1).length
  const internalDupes = dupes.size

  console.log('\n═══════════════════════════════════════════════════')
  console.log(' PQC Google References — Parse Report')
  console.log('═══════════════════════════════════════════════════\n')
  console.log(`Total records parsed:      ${total}`)
  console.log(`
URL Types:`)
  console.log(`  Direct:                  ${byUrlType.direct}`)
  console.log(`  Google redirect:         ${byUrlType['google-redirect']} (URLs extracted)`)
  console.log(`  Homepage (skip):         ${byUrlType.homepage}`)
  console.log(`  PDF:                     ${byUrlType.pdf}`)
  console.log(`  GitHub:                  ${byUrlType.github}`)
  console.log(`
Downloadable:              ${downloadable}`)
  console.log(`Non-downloadable:          ${total - downloadable}`)
  console.log(`
Product Matching:`)
  console.log(`  Exact matches:           ${exactMatches} (existing products — new evidence)`)
  console.log(`  Fuzzy matches:           ${fuzzyMatches} (likely existing — verify)`)
  console.log(`  New products:            ${newRecords} (not in current catalog)`)
  console.log(`  Multi-source records:    ${multiSource}`)
  console.log(`  Internal duplicates:     ${internalDupes} product names appear >1 time`)

  // Show target source breakdown
  const bySource: Record<string, number> = {}
  for (const rec of records) {
    for (const src of rec.targetSources) {
      bySource[src] = (bySource[src] || 0) + 1
    }
  }
  console.log(`
By Target Source:`)
  for (const [src, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src.padEnd(20)} ${count}`)
  }

  // Show new products
  const newProducts = records.filter(
    (r) => r.matchType === 'none' && r.targetSources.includes('migrate')
  )
  if (newProducts.length > 0) {
    console.log(`
── New Products (not in catalog) ──`)
    for (const p of newProducts) {
      console.log(`  [${p.code}] ${p.productName} — ${p.pqcStatus}`)
    }
  }

  // Show internal duplicates
  if (dupes.size > 0) {
    console.log(`
── Internal Duplicates (same product, different rows) ──`)
    for (const [name, indices] of dupes) {
      const rows = indices
        .map((i) => `row ${records[i].row} (batch ${records[i].batch})`)
        .join(', ')
      console.log(`  "${records[indices[0]].productName}" appears ${indices.length}x: ${rows}`)
    }
  }

  // Show fuzzy matches for review
  const fuzzy = records.filter((r) => r.matchType === 'fuzzy')
  if (fuzzy.length > 0) {
    console.log(`
── Fuzzy Matches (verify manually) ──`)
    for (const f of fuzzy) {
      console.log(`  "${f.productName}" ≈ "${f.existingMatch}"`)
    }
  }

  console.log('\n═══════════════════════════════════════════════════\n')
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('Reading', INPUT)
  const content = fs.readFileSync(INPUT, 'utf-8')

  console.log('Parsing markdown tables...')
  const records = parseMarkdownTables(content)
  console.log(`Parsed ${records.length} records`)

  console.log('Loading existing product catalog...')
  const existingNames = loadExistingProductNames()
  console.log(`Loaded ${existingNames.size} existing products`)

  console.log('Loading existing library IDs...')
  const libraryIds = loadExistingLibraryIds()
  console.log(`Loaded ${libraryIds.size} existing library references`)

  console.log('Matching records against existing data...')
  matchProducts(records, existingNames)

  const dupes = flagInternalDuplicates(records)

  generateReport(records, dupes)

  if (!dryRun) {
    // Build manifest
    const manifest = {
      generated: new Date().toISOString(),
      source: 'src/data/pqcreferences03302026google.md',
      totalRecords: records.length,
      summary: {
        downloadable: records.filter((r) => r.downloadable).length,
        skipped: records.filter((r) => !r.downloadable).length,
        exactMatches: records.filter((r) => r.matchType === 'exact').length,
        fuzzyMatches: records.filter((r) => r.matchType === 'fuzzy').length,
        newRecords: records.filter((r) => r.matchType === 'none').length,
        internalDuplicates: dupes.size,
      },
      records: records.map((r) => ({
        code: r.code,
        subcategory: r.subcategory,
        productName: r.productName,
        pqcStatus: r.pqcStatus,
        evidenceUrl: r.evidenceUrl,
        evidenceLabel: r.evidenceLabel,
        rawUrl: r.rawUrl !== r.evidenceUrl ? r.rawUrl : undefined,
        urlType: r.urlType,
        targetSources: r.targetSources,
        existingMatch: r.existingMatch,
        matchType: r.matchType,
        downloadable: r.downloadable,
        skipReason: r.skipReason,
      })),
    }

    fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2))
    console.log(`Manifest written to ${OUTPUT}`)
  } else {
    console.log('[dry-run] Would write manifest to', OUTPUT)
  }
}

main()
