// SPDX-License-Identifier: GPL-3.0-only
/**
 * N22: Source document content quality checks.
 *
 * Validates files in public/{library,timeline,threats}/ against known bad-source
 * patterns: 404 pages, JS-rendered stubs, Word-exported HTML with no extractable
 * text, and files too small to contain real content.
 *
 * For library/: cross-references CSV to determine if a file is required (downloadable=yes).
 *   ERROR   — CSV marks record as downloadable=yes but the file fails quality
 *   WARNING — file fails quality but is not marked downloadable=yes
 *
 * For timeline/ and threats/: scan files on disk only (no CSV local_file mapping).
 *   WARNING — any quality issue detected
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding } from './types.js'
import { loadCSV, ROOT } from './data-loader.js'

// ── Sentinel strings (case-insensitive, matched in first 500 chars of extracted text)
const SENTINEL_STRINGS = [
  'page not found',
  '404 not found',
  '404 error',
  'this page does not exist',
  'access denied',
  '403 forbidden',
  'under maintenance',
  'maintenance mode',
  'site is currently unavailable',
  'temporarily unavailable',
  'please enable javascript',
  'you need to enable javascript',
  'javascript is required',
]

const MIN_HTML_TEXT_CHARS = 200
const MIN_HTML_TEXT_RATIO = 0.15
const JS_STUB_MAX_FILE_BYTES = 5120      // < 5KB file
const JS_STUB_MAX_TEXT_CHARS = 50        // AND < 50 chars extracted → JS stub
const WORD_HTML_MIN_FILE_BYTES = 1_048_576  // > 1MB
const WORD_HTML_MAX_TEXT_CHARS = 100     // AND < 100 chars → Word-export HTML
const MIN_PDF_BYTES = 10240              // < 10KB PDF = suspicious

// ── HTML text extraction ─────────────────────────────────────────────────────

function stripHtmlTags(html: string): string {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  return text.replace(/\s+/g, ' ').trim()
}

// ── Quality check for a single file ─────────────────────────────────────────

interface QualityIssue {
  reason: string
}

function checkHtmlFile(filePath: string): QualityIssue | null {
  let stat: fs.Stats
  let content: string
  try {
    stat = fs.statSync(filePath)
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  const fileSize = stat.size
  const extractedText = stripHtmlTags(content)
  const textLen = extractedText.length
  const first500Lower = extractedText.slice(0, 500).toLowerCase()

  if (fileSize < JS_STUB_MAX_FILE_BYTES && textLen < JS_STUB_MAX_TEXT_CHARS) {
    return { reason: `JS-rendered stub: ${fileSize}B file, ${textLen} chars extracted` }
  }
  if (fileSize > WORD_HTML_MIN_FILE_BYTES && textLen < WORD_HTML_MAX_TEXT_CHARS) {
    return { reason: `Word-exported HTML: ${(fileSize / 1024 / 1024).toFixed(1)}MB file, ${textLen} chars extracted` }
  }
  if (textLen < MIN_HTML_TEXT_CHARS) {
    return { reason: `Insufficient text: ${textLen} chars extracted (min ${MIN_HTML_TEXT_CHARS})` }
  }
  for (const sentinel of SENTINEL_STRINGS) {
    if (first500Lower.includes(sentinel)) {
      return { reason: `Error page: "${sentinel}" in first 500 chars` }
    }
  }
  const nonWs = extractedText.replace(/\s/g, '').length
  const ratio = textLen > 0 ? nonWs / textLen : 0
  if (ratio < MIN_HTML_TEXT_RATIO) {
    return { reason: `Low content density: ${(ratio * 100).toFixed(0)}% non-whitespace` }
  }
  return null
}

function checkPdfFile(filePath: string): QualityIssue | null {
  let stat: fs.Stats
  let headerBuf: Buffer
  try {
    stat = fs.statSync(filePath)
    const fd = fs.openSync(filePath, 'r')
    headerBuf = Buffer.alloc(4)
    fs.readSync(fd, headerBuf, 0, 4, 0)
    fs.closeSync(fd)
  } catch {
    return null
  }

  if (headerBuf.toString('ascii') !== '%PDF') {
    return { reason: `Not a valid PDF: missing %PDF magic bytes` }
  }
  if (stat.size < MIN_PDF_BYTES) {
    return { reason: `Suspiciously small PDF: ${stat.size}B (min ${MIN_PDF_BYTES}B)` }
  }
  return null
}

// ── Check runners ─────────────────────────────────────────────────────────────

function makeCheck(
  id: string,
  description: string,
  sourceA: string,
  severity: 'ERROR' | 'WARNING',
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'local-resource',
    description,
    sourceA,
    sourceB: null,
    severity,
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }
}

/** Check library files — cross-referenced against CSV for downloadable=yes severity. */
function checkLibraryQuality(): CheckResult {
  const libDir = path.join(ROOT, 'public', 'library')
  const f: Finding[] = []

  if (!fs.existsSync(libDir)) {
    return makeCheck('N22-library', 'Source document quality: public/library/', 'public/library/', 'WARNING', [])
  }

  // Build a map of filename → {id, isRequired}
  const csvData = loadCSV('library_')
  const requiredFiles = new Set<string>()
  const fileToId = new Map<string, string>()

  for (const row of csvData.rows) {
    const localFile = row.local_file?.trim()
    const downloadable = (row.downloadable || '').toLowerCase()
    const id = row.reference_id?.trim() || ''
    if (!localFile) continue
    const filename = localFile.split('/').pop() || localFile
    fileToId.set(filename, id)
    if (downloadable === 'yes') requiredFiles.add(filename)
  }

  const files = fs.readdirSync(libDir)
    .filter(f => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')

  let checked = 0
  let issues = 0
  let errors = 0

  for (const filename of files) {
    const filePath = path.join(libDir, filename)
    const ext = path.extname(filename).toLowerCase()
    let issue: QualityIssue | null = null

    if (ext === '.html' || ext === '.htm') issue = checkHtmlFile(filePath)
    else if (ext === '.pdf') issue = checkPdfFile(filePath)

    checked++
    if (issue) {
      issues++
      const id = fileToId.get(filename) || filename
      const isRequired = requiredFiles.has(filename)
      if (isRequired) errors++
      f.push({
        csv: csvData.file,
        row: null,
        field: 'local_file',
        value: filename,
        message: `[N22][${isRequired ? 'ERROR' : 'WARNING'}] library/${filename} (${id}): ${issue.reason}`,
      })
    }
  }

  const severity: 'ERROR' | 'WARNING' = errors > 0 ? 'ERROR' : 'WARNING'
  return makeCheck(
    'N22-library',
    `Source document quality: public/library/ (${checked} files, ${issues} issues)`,
    'public/library/',
    severity,
    f,
  )
}

/** Check timeline/threats files — no CSV mapping, all issues are WARNING. */
function checkDirectoryQuality(dirName: 'timeline' | 'threats'): CheckResult {
  const dir = path.join(ROOT, 'public', dirName)
  const f: Finding[] = []

  if (!fs.existsSync(dir)) {
    return makeCheck(`N22-${dirName}`, `Source document quality: public/${dirName}/`, `public/${dirName}/`, 'WARNING', [])
  }

  const files = fs.readdirSync(dir)
    .filter(f => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')

  let checked = 0

  for (const filename of files) {
    const filePath = path.join(dir, filename)
    const ext = path.extname(filename).toLowerCase()
    let issue: QualityIssue | null = null

    if (ext === '.html' || ext === '.htm') issue = checkHtmlFile(filePath)
    else if (ext === '.pdf') issue = checkPdfFile(filePath)

    checked++
    if (issue) {
      f.push({
        csv: `public/${dirName}/`,
        row: null,
        field: 'filename',
        value: filename,
        message: `[N22][WARNING] ${dirName}/${filename}: ${issue.reason}`,
      })
    }
  }

  return makeCheck(
    `N22-${dirName}`,
    `Source document quality: public/${dirName}/ (${checked} files, ${f.length} issues)`,
    `public/${dirName}/`,
    'WARNING',
    f,
  )
}

export function runSourceDocumentQualityChecks(): CheckResult[] {
  return [
    checkLibraryQuality(),
    checkDirectoryQuality('timeline'),
    checkDirectoryQuality('threats'),
  ]
}
