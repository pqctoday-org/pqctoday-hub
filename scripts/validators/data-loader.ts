// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data loading utilities for the unified validator.
 * Mirrors the CSV discovery logic from validate-csv-xrefs.cjs and csvUtils.ts.
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { CsvDataset, CsvRow } from './types.js'

const ROOT = path.resolve(process.cwd())
const DATA_DIR = path.join(ROOT, 'src', 'data')
const PUBLIC_DIR = path.join(ROOT, 'public')

// ── CSV discovery ─────────────────────────────────────────────────────────────

interface ParsedFile {
  file: string
  date: Date
  dateStr: string // YYYY-MM-DD
  rev: number
}

function parseFilename(f: string): ParsedFile | null {
  const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
  if (!m) return null
  const mm = m[1],
    dd = m[2],
    yyyy = m[3]
  return {
    file: f,
    date: new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)),
    dateStr: `${yyyy}-${mm}-${dd}`,
    rev: m[4] ? parseInt(m[4]) : 0,
  }
}

/**
 * Find the latest CSV file matching a prefix in src/data/.
 * Returns null if no file found.
 */
export function findLatestCSV(
  prefix: string,
  dir = DATA_DIR
): { path: string; date: string } | null {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (files.length === 0) return null

  const parsed = files.map(parseFilename).filter((p): p is ParsedFile => p !== null)
  if (parsed.length === 0) return null

  parsed.sort((a, b) => {
    const td = b.date.getTime() - a.date.getTime()
    if (td !== 0) return td
    return b.rev - a.rev
  })

  return { path: path.join(dir, parsed[0].file), date: parsed[0].dateStr }
}

/**
 * Find a non-versioned CSV (no date in filename).
 */
export function findStaticCSV(filename: string, dir = DATA_DIR): string | null {
  const p = path.join(dir, filename)
  return fs.existsSync(p) ? p : null
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

export function readCSV(filePath: string | null): CsvRow[] {
  if (!filePath || !fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = Papa.parse<CsvRow>(content.trim(), { header: true, skipEmptyLines: true })
  return data
}

export function loadCSV(prefix: string): CsvDataset {
  const found = findLatestCSV(prefix)
  if (!found) return { rows: [], file: '', fileDate: null }
  return {
    rows: readCSV(found.path),
    file: path.basename(found.path),
    fileDate: found.date,
  }
}

export function loadStaticCSV(filename: string): CsvDataset {
  const p = findStaticCSV(filename)
  if (!p) return { rows: [], file: '', fileDate: null }
  const stat = fs.statSync(p)
  const d = stat.mtime
  return {
    rows: readCSV(p),
    file: filename,
    fileDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  }
}

// ── JSON loading ──────────────────────────────────────────────────────────────

export function loadJSON<T = unknown>(relativePath: string): T | null {
  const p = path.join(ROOT, relativePath)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
}

// ── Enrichment markdown loading ───────────────────────────────────────────────

export interface EnrichmentEntry {
  id: string
  file: string
}

export interface EnrichmentFileInfo {
  file: string
  date: string | null
  entries: string[]
  model: string | null
  scriptVersion: string | null
}

/**
 * Load all enrichment files for a collection (library, timeline, threats).
 * Returns per-file metadata and a merged set of enriched IDs.
 */
export function loadEnrichments(collection: string): {
  files: EnrichmentFileInfo[]
  allIds: Set<string>
} {
  const enrichDir = path.join(DATA_DIR, 'doc-enrichments')
  if (!fs.existsSync(enrichDir)) return { files: [], allIds: new Set() }

  const prefix = `${collection}_doc_enrichments_`
  const mdFiles = fs
    .readdirSync(enrichDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.md'))
    .sort()

  const allIds = new Set<string>()
  const files: EnrichmentFileInfo[] = []

  for (const f of mdFiles) {
    const content = fs.readFileSync(path.join(enrichDir, f), 'utf-8')
    const entries: string[] = []

    // Extract ## headings as enrichment IDs
    for (const line of content.split('\n')) {
      const match = line.match(/^## (.+)$/)
      if (match) {
        const id = match[1].trim()
        entries.push(id)
        allIds.add(id)
      }
    }

    // Extract date from filename
    const dateMatch = f.match(/(\d{2})(\d{2})(\d{4})/)
    const date = dateMatch ? `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}` : null

    // Extract enrichment metadata from frontmatter or comment header
    let model: string | null = null
    let scriptVersion: string | null = null

    // Check for YAML frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (fmMatch) {
      const fm = fmMatch[1]
      const methodMatch = fm.match(/enrichment_method:\s*(.+)/)
      if (methodMatch) model = methodMatch[1].trim()
    }

    // Check for HTML comment metadata
    const commentMatch = content.match(/<!--\s*enrichment-meta:\s*(.*?)\s*-->/)
    if (commentMatch) {
      const meta = commentMatch[1]
      const modelM = meta.match(/model=([^,]+)/)
      if (modelM) model = modelM[1].trim()
      const verM = meta.match(/version=([^,]+)/)
      if (verM) scriptVersion = verM[1].trim()
    }

    files.push({ file: f, date, entries, model, scriptVersion })
  }

  return { files, allIds }
}

// ── Glossary loading ──────────────────────────────────────────────────────────

export interface GlossaryEntry {
  term: string
  acronym: string | null
  definition: string
  technicalNote: string | null
  relatedModule: string | null
  category: string | null
}

/**
 * Parse glossary entries from glossaryData.ts using regex extraction.
 * Avoids importing from src/ (no Vite dependency).
 */
export function loadGlossary(): GlossaryEntry[] {
  const p = path.join(DATA_DIR, 'glossaryData.ts')
  if (!fs.existsSync(p)) return []
  const content = fs.readFileSync(p, 'utf-8')

  const entries: GlossaryEntry[] = []

  // Split by opening brace of each object in the array
  const blocks = content.split(/\{\s*\n/).slice(1) // skip preamble
  for (const block of blocks) {
    const termMatch = block.match(/term:\s*'([^']+)'/)
    if (!termMatch) continue

    const acronymMatch = block.match(/acronym:\s*'([^']+)'/)
    const moduleMatch = block.match(/relatedModule:\s*'([^']+)'/)
    const categoryMatch = block.match(/category:\s*'([^']+)'/)

    // Definition may span multiple lines with string concatenation
    const defMatch =
      block.match(/definition:\s*\n?\s*'([^']*(?:'\s*\+\s*'[^']*)*)'/) ||
      block.match(/definition:\s*'([^']+)'/)
    const noteMatch =
      block.match(/technicalNote:\s*\n?\s*'([^']*(?:'\s*\+\s*'[^']*)*)'/) ||
      block.match(/technicalNote:\s*'([^']+)'/)

    entries.push({
      term: termMatch[1],
      acronym: acronymMatch ? acronymMatch[1] : null,
      definition: defMatch ? defMatch[1].replace(/'\s*\+\s*'/g, '') : '',
      technicalNote: noteMatch ? noteMatch[1].replace(/'\s*\+\s*'/g, '') : null,
      relatedModule: moduleMatch ? moduleMatch[1] : null,
      category: categoryMatch ? categoryMatch[1] : null,
    })
  }

  return entries
}

// ── Enrichment field loading ─────────────────────────────────────────────────

/**
 * Load all enrichment fields for a collection. Merges across all dated files
 * (later files win on conflict). Returns ref_id → {fieldName: fieldValue}.
 * Ported from generate-rag-corpus.ts:loadEnrichmentFields().
 */
export function loadEnrichmentFields(collection: string): Map<string, Record<string, string>> {
  const enrichDir = path.join(DATA_DIR, 'doc-enrichments')
  if (!fs.existsSync(enrichDir)) return new Map()

  const prefix = `${collection}_doc_enrichments_`
  const files = fs.readdirSync(enrichDir).filter((f) => f.startsWith(prefix) && f.endsWith('.md'))
  if (files.length === 0) return new Map()

  const withDates = files.map((f) => {
    const match = f.match(/(\d{2})(\d{2})(\d{4})(_r(\d+))?\.md$/)
    if (!match) return { file: f, date: 0, rev: 0 }
    const [, mm, dd, yyyy, , rev] = match
    return { file: f, date: parseInt(yyyy + mm + dd), rev: rev ? parseInt(rev) : 0 }
  })
  withDates.sort((a, b) => a.date - b.date || a.rev - b.rev)

  // Merge sections — later files overwrite earlier ones for same refId
  const mergedSections = new Map<string, string>()
  for (const { file } of withDates) {
    const raw = fs.readFileSync(path.join(enrichDir, file), 'utf-8')
    for (const section of raw.split(/\n(?=## )/).filter((s) => s.trimStart().startsWith('## '))) {
      const refId = section
        .split('\n')[0]
        .replace(/^##\s*/, '')
        .trim()
      if (refId && refId !== '---') mergedSections.set(refId, section)
    }
  }

  const result = new Map<string, Record<string, string>>()
  for (const [refId, section] of mergedSections) {
    const fields: Record<string, string> = {}
    for (const line of section.split('\n').slice(1)) {
      const m = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/)
      if (m) fields[m[1].trim()] = m[2].trim()
    }
    result.set(refId, fields)
  }
  return result
}

// ── Product extraction loading ───────────────────────────────────────────────

/**
 * Load all product extraction JSON files. For each CSC prefix, picks latest dated file.
 * Returns Map<cscId, products[]> where cscId is e.g. "csc_001".
 */
export function loadProductExtractions(): Map<string, Array<Record<string, string>>> {
  const extractDir = path.join(DATA_DIR, 'product-extractions')
  if (!fs.existsSync(extractDir)) return new Map()

  const jsonFiles = fs.readdirSync(extractDir).filter((f) => f.endsWith('.json'))

  // Group by CSC prefix, pick latest
  const byCsc = new Map<string, string[]>()
  for (const f of jsonFiles) {
    const m = f.match(/^(csc_\d{3})_extractions_/)
    if (!m) continue
    const csc = m[1]
    if (!byCsc.has(csc)) byCsc.set(csc, [])
    byCsc.get(csc)!.push(f)
  }

  const result = new Map<string, Array<Record<string, string>>>()
  for (const [csc, files] of byCsc) {
    // Sort by date in filename, pick latest
    files.sort((a, b) => {
      const da = a.match(/(\d{8})/) ? parseInt(a.match(/(\d{8})/)![1]) : 0
      const db = b.match(/(\d{8})/) ? parseInt(b.match(/(\d{8})/)![1]) : 0
      return db - da
    })
    try {
      const raw = fs.readFileSync(path.join(extractDir, files[0]), 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) result.set(csc, parsed)
    } catch {
      // Skip unparseable files
    }
  }
  return result
}

// ── Module enrichment matching ───────────────────────────────────────────────

export interface ModuleEnrichmentSet {
  libraryEntries: Array<{
    refId: string
    fields: Record<string, string>
    matchType: 'explicit' | 'keyword'
  }>
  timelineEntries: Array<{
    refId: string
    fields: Record<string, string>
    matchType: 'explicit' | 'keyword'
  }>
  productEntries: Array<{ name: string; fields: Record<string, string>; cscId: string }>
  glossaryEntries: GlossaryEntry[]
}

const SKIP_VALUES = new Set([
  'None detected',
  'Not specified',
  'See document for details.',
  'N/A',
  'None',
])

/**
 * Build a per-module enrichment map matching enrichments to modules via:
 * 1. Library enrichment `Relevant PQC Today Features` field containing module_id
 * 2. Library CSV `module_ids` column
 * 3. Timeline enrichment `Relevant PQC Today Features` field
 * 4. Migrate CSV `learning_modules` → CSC categories → product extractions
 * 5. Glossary `relatedModule` field
 * 6. Keyword fallback: Main Topic token overlap with module title
 */
export function buildModuleEnrichmentMap(): Map<string, ModuleEnrichmentSet> {
  const result = new Map<string, ModuleEnrichmentSet>()

  // Load all data sources
  const libraryFields = loadEnrichmentFields('library')
  const timelineFields = loadEnrichmentFields('timeline')
  const productExtractions = loadProductExtractions()
  const glossary = loadGlossary()

  // Load library CSV for module_ids column
  const libraryCSV = loadCSV('library_')

  // Load migrate CSV for learning_modules → category_id mapping
  const migrateCSV = loadCSV('pqc_product_catalog_')

  // Build CSC category → module_id mapping from migrate CSV
  const cscToModules = new Map<string, Set<string>>()
  const moduleToCscs = new Map<string, Set<string>>()
  for (const row of migrateCSV.rows) {
    const cscId = row.category_id?.trim()
    const modules = row.learning_modules?.trim()
    if (!cscId || !modules) continue
    // Normalize CSC-NNN to csc_nnn for matching product extraction filenames
    const cscNorm = cscId.toLowerCase().replace('-', '_')
    for (const mod of modules
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (!cscToModules.has(cscNorm)) cscToModules.set(cscNorm, new Set())
      cscToModules.get(cscNorm)!.add(mod)
      if (!moduleToCscs.has(mod)) moduleToCscs.set(mod, new Set())
      moduleToCscs.get(mod)!.add(cscNorm)
    }
  }

  // Collect all unique module_ids from various sources
  const allModuleIds = new Set<string>()

  // From library CSV module_ids
  for (const row of libraryCSV.rows) {
    for (const mod of splitSemicolon(row.module_ids)) allModuleIds.add(mod)
  }
  // From migrate learning_modules
  for (const row of migrateCSV.rows) {
    for (const mod of splitSemicolon(row.learning_modules)) allModuleIds.add(mod)
  }
  // From glossary relatedModule
  for (const g of glossary) {
    if (g.relatedModule) {
      const mod = g.relatedModule.replace(/^\/learn\//, '')
      if (mod && !mod.startsWith('/')) allModuleIds.add(mod)
    }
  }

  // Initialize enrichment sets for all known modules
  for (const mod of allModuleIds) {
    result.set(mod, {
      libraryEntries: [],
      timelineEntries: [],
      productEntries: [],
      glossaryEntries: [],
    })
  }

  // Match library enrichments via `Relevant PQC Today Features` field
  for (const [refId, fields] of libraryFields) {
    const features = fields['Relevant PQC Today Features'] || ''
    if (SKIP_VALUES.has(features)) continue
    const mentions = features.split(/[;,]\s*/).map((s) => s.trim().toLowerCase())
    for (const mod of allModuleIds) {
      if (mentions.some((m) => m === mod || m.includes(mod))) {
        result.get(mod)!.libraryEntries.push({ refId, fields, matchType: 'explicit' })
      }
    }
  }

  // Match library enrichments via library CSV module_ids column
  for (const row of libraryCSV.rows) {
    const refId = row.reference_id?.trim() || row.referenceId?.trim()
    if (!refId) continue
    const modules = splitSemicolon(row.module_ids)
    const enrichment = libraryFields.get(refId)
    if (!enrichment) continue
    for (const mod of modules) {
      const set = result.get(mod)
      if (!set) continue
      // Avoid duplicates
      if (!set.libraryEntries.some((e) => e.refId === refId)) {
        set.libraryEntries.push({ refId, fields: enrichment, matchType: 'explicit' })
      }
    }
  }

  // Match timeline enrichments via `Relevant PQC Today Features` field
  for (const [refId, fields] of timelineFields) {
    const features = fields['Relevant PQC Today Features'] || ''
    if (SKIP_VALUES.has(features)) continue
    const mentions = features.split(/[;,]\s*/).map((s) => s.trim().toLowerCase())
    for (const mod of allModuleIds) {
      if (mentions.some((m) => m === mod || m.includes(mod))) {
        result.get(mod)!.timelineEntries.push({ refId, fields, matchType: 'explicit' })
      }
    }
  }

  // Match product extractions via migrate CSV learning_modules → CSC category
  for (const mod of allModuleIds) {
    const cscs = moduleToCscs.get(mod)
    if (!cscs) continue
    const set = result.get(mod)!
    for (const csc of cscs) {
      const products = productExtractions.get(csc)
      if (!products) continue
      for (const prod of products) {
        const name = prod.platform_name || prod.product_name || ''
        if (name) {
          set.productEntries.push({ name, fields: prod, cscId: csc })
        }
      }
    }
  }

  // Match glossary entries via relatedModule
  for (const g of glossary) {
    if (!g.relatedModule) continue
    const mod = g.relatedModule.replace(/^\/learn\//, '')
    const set = result.get(mod)
    if (set) set.glossaryEntries.push(g)
  }

  return result
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function splitSemicolon(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function splitPipe(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function splitComma(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isValidUrl(s: string): boolean {
  try {
    new URL(s)
    return true
  } catch {
    return false
  }
}

// ── Directory listing ─────────────────────────────────────────────────────────

export function listFiles(dir: string): string[] {
  const p = path.join(ROOT, dir)
  if (!fs.existsSync(p)) return []
  return fs
    .readdirSync(p)
    .filter((f) => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')
}

export function dirExists(dir: string): boolean {
  return fs.existsSync(path.join(ROOT, dir))
}

export function fileMtime(relativePath: string): string | null {
  const p = path.join(ROOT, relativePath)
  if (!fs.existsSync(p)) return null
  const d = fs.statSync(p).mtime
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export { DATA_DIR, PUBLIC_DIR, ROOT }
