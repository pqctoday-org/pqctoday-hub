#!/usr/bin/env node
// scripts/extract-leader-references.mjs
// Parses enrichment .md files → extracts named individuals → cross-references with library CSV
// Outputs: scripts/leader-enrichment-output.json

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── 1. Parse library CSV to build ref_id → download_url map ────────────────

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ''))
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function findLatestCSV(dir, prefix) {
  try {
    const files = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
    files.sort((a, b) => {
      // Extract date + revision for comparison
      const m = (f) => f.match(/(\d{8})(?:_r(\d+))?\.csv$/)
      const ma = m(a)
      const mb = m(b)
      if (!ma || !mb) return 0
      const dateA = parseInt(ma[1]) * 100 + parseInt(ma[2] ?? '0')
      const dateB = parseInt(mb[1]) * 100 + parseInt(mb[2] ?? '0')
      return dateB - dateA
    })
    return files[0]
  } catch {
    return null
  }
}

const dataDir = join(ROOT, 'src/data')
const libFile = findLatestCSV(dataDir, 'library_')
console.log('Using library CSV:', libFile)
const libRows = libFile ? parseCSV(readFileSync(join(dataDir, libFile), 'utf8')) : []

// Build ref_id → download_url map (library CSV column 1 = reference_id, column 3 = download_url)
const refToUrl = new Map()
for (const row of libRows) {
  const refId = Object.values(row)[0]?.trim()
  const url = Object.values(row)[2]?.trim()
  if (refId && url) refToUrl.set(refId, url)
}
console.log(`Loaded ${refToUrl.size} library URL mappings`)

// ─── 2. Load existing leaders for cross-reference ────────────────────────────

const leadersFile = findLatestCSV(dataDir, 'leaders_')
console.log('Using leaders CSV:', leadersFile)
const leaderRows = leadersFile ? parseCSV(readFileSync(join(dataDir, leadersFile), 'utf8')) : []

// Build normalized name → leader index map
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^(dr\.|prof\.|prof dr\.|dr\. prof\.|prof\.? dr\.?)\s+/i, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

const leaderNameMap = new Map() // normalizedName → leaderRow
for (const lr of leaderRows) {
  const nm = normalizeName(lr.Name ?? '')
  if (nm) leaderNameMap.set(nm, lr)
}
console.log(`Loaded ${leaderRows.length} existing leaders`)

// ─── 3. Parse enrichment .md files ──────────────────────────────────────────

const enrichDir = join(dataDir, 'doc-enrichments')
const enrichFiles = readdirSync(enrichDir)
  .filter((f) => f.endsWith('.md'))
  .sort()

console.log(`Found ${enrichFiles.length} enrichment files`)

// Regex patterns for individual authors
// Matches: "Name (Organization)" or "Dr./Prof. Name (Organization)"
const PERSON_PATTERN =
  /\b([A-ZÁÉÍÓÚÜÀÂÆÇÈÊËÎÏÔŒÙÛÜ][a-záéíóúüàâæçèêëîïôœùûü\-']+(?:\s+[A-ZÁÉÍÓÚÜÀÂÆÇÈÊËÎÏÔŒÙÛÜ][a-záéíóúüàâæçèêëîïôœùûü\-']+)+)\s*\(([^)]+)\)/g
const PREFIX_PERSON_PATTERN =
  /\b(?:Dr\.|Prof\.|Prof\.\s*Dr\.|Dr\.\s*Prof\.)\s+([A-ZÁÉÍÓÚÜÀÂÆÇÈÊËÎÏÔŒÙÛÜ][a-záéíóúüàâæçèêëîïôœùûü\-']+(?:\s+[A-ZÁÉÍÓÚÜÀÂÆÇÈÊËÎÏÔŒÙÛÜ][a-záéíóúüàâæçèêëîïôœùûü\-']+)+)\s*(?:\(([^)]+)\))?/g

// Map: normalizedName → { name, org, refIds: Set, urls: Set, prefix }
const personMap = new Map()

function addPerson(rawName, org, refId, url) {
  const norm = normalizeName(rawName)
  if (!norm || norm.split(' ').length < 2) return // skip single-word names
  if (!personMap.has(norm)) {
    personMap.set(norm, { name: rawName, org: org ?? '', refIds: new Set(), urls: new Set() })
  }
  const entry = personMap.get(norm)
  entry.refIds.add(refId)
  if (url) entry.urls.add(url)
  // Keep longer name (with prefix) as canonical
  if (rawName.length > entry.name.length) entry.name = rawName
  // Keep non-empty org
  if (org && !entry.org) entry.org = org
}

for (const file of enrichFiles) {
  const text = readFileSync(join(enrichDir, file), 'utf8')
  // Split into sections by ## heading
  const sections = text.split(/^## /m)
  for (const section of sections) {
    if (!section.trim()) continue
    const firstLine = section.split('\n')[0].trim()
    const refId = firstLine.replace(/^\*+/, '').trim()

    // Find the Authors line
    const authorsMatch = section.match(/\*\*Authors?\*\*:\s*(.+)/i)
    if (!authorsMatch) continue
    const authorsRaw = authorsMatch[1].trim()
    if (!authorsRaw || authorsRaw === 'See document' || authorsRaw === 'Not specified') continue

    // Resolve URL for this ref_id
    const url = refToUrl.get(refId) ?? ''

    // Parse tokens separated by semicolons
    const tokens = authorsRaw.split(';').map((t) => t.trim())

    for (const token of tokens) {
      // Try "Name (Org)" pattern
      const m = token.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
      if (m) {
        const name = m[1].replace(/^(Dr\.|Prof\.|Prof\.\s*Dr\.|Dr\.\s*Prof\.)\s+/i, '').trim()
        const fullName = m[1].trim()
        const org = m[2].trim()
        // Must look like "First Last" (2+ words, starts with capital)
        if (/^[A-ZÁÉÍÓÚ]/.test(name) && name.includes(' ')) {
          addPerson(fullName, org, refId, url)
        }
        continue
      }

      // Try "Dr./Prof. Name" without parentheses
      const prefixMatch = token.match(/^(Dr\.|Prof\.|Prof\.\s*Dr\.|Dr\.\s*Prof\.)\s+(.+)$/)
      if (prefixMatch) {
        const name = prefixMatch[2].trim()
        if (/^[A-ZÁÉÍÓÚ]/.test(name) && name.includes(' ') && !name.includes(',')) {
          addPerson(token, '', refId, url)
        }
      }
    }
  }
}

console.log(`Found ${personMap.size} unique named individuals across all enrichment files`)

// ─── 4. Match against existing leaders ──────────────────────────────────────

const matched = []
const unmatched = []

for (const [norm, entry] of personMap) {
  const existing = leaderNameMap.get(norm)
  const obj = {
    normalizedName: norm,
    name: entry.name,
    org: entry.org,
    refIds: [...entry.refIds],
    urls: [...entry.urls],
  }
  if (existing) {
    matched.push({
      ...obj,
      currentKeyResourceUrl: existing.KeyResourceUrl ?? '',
      existingLeaderName: existing.Name,
    })
  } else {
    // Try partial last-name match as fallback
    const lastName = norm.split(' ').pop()
    const partialMatch = [...leaderNameMap.entries()].find(([k]) => k.endsWith(lastName))
    if (partialMatch) {
      matched.push({
        ...obj,
        currentKeyResourceUrl: partialMatch[1].KeyResourceUrl ?? '',
        existingLeaderName: partialMatch[1].Name,
        partialMatch: true,
      })
    } else {
      unmatched.push(obj)
    }
  }
}

console.log(`Matched: ${matched.length} existing leaders`)
console.log(`Unmatched (new individuals): ${unmatched.length}`)

// ─── 5. Write output ─────────────────────────────────────────────────────────

const output = {
  generatedAt: new Date().toISOString(),
  libraryCSV: libFile,
  leadersCSV: leadersFile,
  totalIndividualsFound: personMap.size,
  matched,
  unmatched,
}

const outPath = join(__dirname, 'leader-enrichment-output.json')
writeFileSync(outPath, JSON.stringify(output, null, 2))
console.log(`\nOutput written to: ${outPath}`)
console.log(`\nSummary:`)
console.log(`  Individuals found:  ${personMap.size}`)
console.log(`  Matched to leaders: ${matched.length}`)
console.log(`  New individuals:    ${unmatched.length}`)

// Print matched leaders with their URLs
console.log('\n=== MATCHED LEADERS (existing leaders found in enrichments) ===')
for (const m of matched.sort((a, b) => a.existingLeaderName.localeCompare(b.existingLeaderName))) {
  const mark = m.partialMatch ? ' [partial match]' : ''
  console.log(`  ${m.existingLeaderName}${mark}`)
  console.log(`    Current KeyResourceUrl: ${m.currentKeyResourceUrl || '(empty)'}`)
  console.log(`    Found in docs: ${m.refIds.join(', ')}`)
  console.log(`    URLs: ${m.urls.join('; ')}`)
}

// Print new individuals
console.log('\n=== NEW INDIVIDUALS (not in current leaders) ===')
for (const u of unmatched.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`  ${u.name} (${u.org})`)
  console.log(`    Docs: ${u.refIds.join(', ')}`)
  console.log(`    URLs: ${u.urls.join('; ')}`)
}
