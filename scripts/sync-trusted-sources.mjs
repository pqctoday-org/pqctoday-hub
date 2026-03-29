#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
/**
 * sync-trusted-sources.mjs
 *
 * Updates local_doc_count, last_download_date, and download_status in the
 * trusted_sources CSV based on actual downloaded files on disk.
 *
 * Data sources:
 *   - Library:  library CSV `local_file` column (NOT the manifest — manifest
 *               only reflects the most recent download run; the CSV has the
 *               full historical record)
 *   - Threats:  public/threats/manifest.json entries with status=downloaded
 *   - Timeline: public/timeline/manifest.json entries with
 *               status=downloaded OR reason=already-exists
 *
 * Usage:
 *   node scripts/sync-trusted-sources.mjs [--dry-run] [--verbose]
 *
 * Outputs: src/data/trusted_sources_MMDDYYYY.csv (or _rN if same-day)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Papa = require('papaparse')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')
const PUBLIC_DIR = path.join(ROOT, 'public')

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')

// Same aliases as generate-trusted-source-xref.mjs for org → source_id mapping
const ALIASES = {
  NIST: 'nist-csrc',
  'NIST CSRC': 'nist-csrc',
  'NIST NCCoE': 'nist-csrc',
  'NIST IR': 'nist-ir',
  'NIST IR Publications': 'nist-ir',
  CMVP: 'cmvp',
  FIPS: 'fips-repo',
  IETF: 'ietf',
  'IETF LAMPS': 'ietf',
  'IETF TLS WG': 'ietf',
  'IETF CFRG': 'ietf',
  'IETF PQUIP': 'ietf',
  'IETF IPSECME WG': 'ietf',
  ANSSI: 'anssi',
  'ANSSI France': 'anssi',
  BSI: 'bsi',
  'BSI Germany': 'bsi',
  ENISA: 'enisa',
  NSA: 'nsa-advisory',
  'NSA CNSA 2.0': 'nsa-advisory',
  CISA: 'cisa',
  'CISA/NSA': 'cisa',
  'NCSC UK': 'ncsc-uk',
  'NCSC-UK': 'ncsc-uk',
  'UK NCSC': 'ncsc-uk',
  ACSC: 'acsc',
  CCCS: 'cccs',
  CSE: 'cccs',
  'CSE Canada': 'cccs',
  CRYPTREC: 'cryptrec',
  'Japan CRYPTREC': 'cryptrec',
  KISA: 'kisa',
  'Korea KISA': 'kisa',
  'CSA Singapore': 'csa-singapore',
  'Singapore CSA': 'csa-singapore',
  MAS: 'csa-singapore',
  'NCSC Netherlands': 'ncsc-nl',
  'NCSC-NL': 'ncsc-nl',
  'G7 Cyber Expert Group': 'g7-ceg',
  'G7 CEG': 'g7-ceg',
  'Federal Reserve': 'fed-reserve',
  Bundesdruckerei: 'bundesdruckerei',
  ETSI: 'etsi-cyber',
  'ETSI ISG QSC': 'etsi-cyber',
  'ETSI ISG QKD': 'etsi-cyber',
  IEEE: 'ieee-sa',
  'IEEE SA': 'ieee-sa',
  'ISO/IEC': 'iso-iec-sc27',
  'PKI Consortium': 'pki-consortium',
  PKIC: 'pki-consortium',
  PQCA: 'pqca',
  TCG: 'tcg',
  'Trusted Computing Group': 'tcg',
  'ASC X9': 'ascx9',
  X9: 'ascx9',
  'FS-ISAC': 'fs-isac',
  IBM: 'ibm-research',
  'IBM Research': 'ibm-research',
  PQShield: 'pqshield',
  SandboxAQ: 'sandboxaq',
  Thales: 'thales-research',
  'Cloud Security Alliance': 'csa-cloud',
  'Open Quantum Safe': 'oqs-project',
  OQS: 'oqs-project',
  'Ethereum Foundation': 'eth-foundation',
}

// ── Utilities ────────────────────────────────────────────────────────────────

function readCSV(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = Papa.parse(content.trim(), { header: true, skipEmptyLines: true })
  return data
}

function findLatestCSV(prefix) {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (!files.length) return null
  const parsed = files
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      return {
        file: f,
        date: new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
        rev: m[4] ? parseInt(m[4]) : 0,
      }
    })
    .filter(Boolean)
  parsed.sort((a, b) => b.date - a.date || b.rev - a.rev)
  return path.join(DATA_DIR, parsed[0].file)
}

function resolveOrg(rawOrg) {
  const val = rawOrg?.trim()
  if (!val) return null
  return ALIASES[val] ?? ALIASES[val.toLowerCase()] ?? null
}

function today() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}${dd}${d.getFullYear()}`
}

function formatDate(d) {
  if (!d) return ''
  if (typeof d === 'string') return d
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── Trusted sources loader ───────────────────────────────────────────────────

const trustedPath = findLatestCSV('trusted_sources_')
if (!trustedPath) {
  console.error('ERROR: No trusted_sources_*.csv found')
  process.exit(1)
}

const trustedRows = readCSV(trustedPath)
console.log(`Loaded ${trustedRows.length} trusted sources from ${path.basename(trustedPath)}`)

// Build mutable counts per source_id
const docCounts = new Map() // source_id → number
const downloadDates = new Map() // source_id → most recent date string
for (const row of trustedRows) {
  docCounts.set(row.source_id, 0)
  downloadDates.set(row.source_id, '')
}

function addDoc(sourceId, dateStr) {
  if (!sourceId || !docCounts.has(sourceId)) return
  docCounts.set(sourceId, (docCounts.get(sourceId) ?? 0) + 1)
  const existing = downloadDates.get(sourceId) ?? ''
  if (!existing || dateStr > existing) {
    downloadDates.set(sourceId, dateStr)
  }
}

// ── 1. Library docs — use library CSV local_file column ──────────────────────

const libPath = findLatestCSV('library_')
if (libPath) {
  const libRows = readCSV(libPath)
  let libMatched = 0
  for (const row of libRows) {
    if (!row.local_file) continue
    const orgs = (row.authors_or_organization ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    const date = row.last_update_date ?? row.initial_publication_date ?? ''
    let matched = false
    for (const org of orgs) {
      const sid = resolveOrg(org)
      if (sid) {
        addDoc(sid, date)
        matched = true
      }
    }
    if (!matched) {
      // Try reference_id prefix matching (e.g. NIST-, IETF-, BSI-, etc.)
      const refId = row.reference_id ?? ''
      const prefixMap = {
        NIST: 'nist-csrc',
        RFC: 'ietf',
        FIPS: 'fips-repo',
        ANSSI: 'anssi',
        BSI: 'bsi',
        ENISA: 'enisa',
        ETSI: 'etsi-cyber',
        IEEE: 'ieee-sa',
        ISO: 'iso-iec-sc27',
        'ASC-X9': 'ascx9',
        TCG: 'tcg',
        PKIC: 'pki-consortium',
      }
      for (const [prefix, sid] of Object.entries(prefixMap)) {
        if (refId.startsWith(prefix)) {
          addDoc(sid, date)
          break
        }
      }
    } else {
      libMatched++
    }
  }
  console.log(
    `Library: processed ${libRows.filter((r) => r.local_file).length} local docs from ${path.basename(libPath)}`
  )
} else {
  console.warn('Library CSV not found — skipping library doc count')
}

// ── 2. Threats docs — use manifest.json ─────────────────────────────────────

const threatsManifest = path.join(PUBLIC_DIR, 'threats', 'manifest.json')
if (fs.existsSync(threatsManifest)) {
  const manifest = JSON.parse(fs.readFileSync(threatsManifest, 'utf-8'))
  const threatsPath = findLatestCSV('quantum_threats_hsm_industries_')
  const threatsRows = threatsPath ? readCSV(threatsPath) : []
  const threatIdToSource = new Map(
    threatsRows.map((r) => [r.threat_id, (r.main_source ?? '').split(';')[0].trim()])
  )

  let threatsMatched = 0
  for (const entry of manifest.entries ?? []) {
    if (entry.status !== 'downloaded') continue
    const threatId = entry.threatId
    const srcOrg = threatIdToSource.get(threatId) ?? ''
    const sid = resolveOrg(srcOrg)
    if (sid) {
      const date = manifest.generated ? manifest.generated.split('T')[0] : ''
      addDoc(sid, date)
      threatsMatched++
    }
  }
  console.log(`Threats: ${threatsMatched} downloaded docs matched to sources`)
} else {
  console.warn('Threats manifest not found — skipping threat doc count')
}

// ── 3. Timeline docs — use manifest.json ─────────────────────────────────────

const timelineManifest = path.join(PUBLIC_DIR, 'timeline', 'manifest.json')
if (fs.existsSync(timelineManifest)) {
  const manifest = JSON.parse(fs.readFileSync(timelineManifest, 'utf-8'))
  const timelinePath = findLatestCSV('timeline_')
  const timelineRows = timelinePath ? readCSV(timelinePath) : []
  // Build title→OrgName map (timeline uses label like "Country:Org — Title")
  const orgByTitle = new Map(timelineRows.map((r) => [r.Title, r.OrgName]))

  let timelineMatched = 0
  for (const entry of manifest.entries ?? []) {
    if (entry.status !== 'downloaded' && entry.reason !== 'already-exists') continue
    // Parse the label: "Country:OrgName — Event Title"
    const label = entry.label ?? ''
    let orgName = ''
    const labelMatch = label.match(/^[^:]+:([^—]+)/)
    if (labelMatch) {
      orgName = labelMatch[1].trim()
    }
    const sid = resolveOrg(orgName)
    if (sid) {
      const date = manifest.generated ? manifest.generated.split('T')[0] : ''
      addDoc(sid, date)
      timelineMatched++
    }
  }
  console.log(`Timeline: ${timelineMatched} docs matched to sources`)
} else {
  console.warn('Timeline manifest not found — skipping timeline doc count')
}

// ── 4. Derive download_status ────────────────────────────────────────────────

function deriveDownloadStatus(row) {
  const count = docCounts.get(row.source_id) ?? 0
  const existing = row.download_status

  // Keep Blocked status — we know these can't be downloaded
  if (existing === 'Blocked') return 'Blocked'
  // Sources with no doc_collection expectation stay None
  if (existing === 'None' || row.doc_collection === 'none') {
    return count > 0 ? 'Active' : 'None'
  }
  if (count > 0) return 'Active'
  if (existing === 'Partial') return 'Partial'
  return existing // keep existing status if we couldn't determine
}

// ── 5. Write updated CSV ─────────────────────────────────────────────────────

const updatedRows = trustedRows.map((row) => ({
  ...row,
  local_doc_count: String(docCounts.get(row.source_id) ?? 0),
  last_download_date: downloadDates.get(row.source_id) ?? row.last_download_date ?? '',
  download_status: deriveDownloadStatus(row),
}))

if (VERBOSE) {
  console.log('\nSource doc counts:')
  for (const row of updatedRows) {
    if (parseInt(row.local_doc_count) > 0) {
      console.log(`  ${row.source_id}: ${row.local_doc_count} docs (${row.download_status})`)
    }
  }
}

const totalDocs = updatedRows.reduce((sum, r) => sum + parseInt(r.local_doc_count), 0)
console.log(`\nTotal docs counted: ${totalDocs}`)

if (DRY_RUN) {
  console.log('DRY RUN: no file written')
  process.exit(0)
}

const outBase = `trusted_sources_${today()}`
let outFile = `${outBase}.csv`
let finalPath = path.join(DATA_DIR, outFile)

// Avoid overwriting same-day file — use revision suffix
if (fs.existsSync(finalPath)) {
  let rev = 1
  while (fs.existsSync(path.join(DATA_DIR, `${outBase}_r${rev}.csv`))) rev++
  outFile = `${outBase}_r${rev}.csv`
  finalPath = path.join(DATA_DIR, outFile)
}

const csv = Papa.unparse(updatedRows, { header: true })
fs.writeFileSync(finalPath, csv + '\n')
console.log(`Wrote: ${outFile}`)
