// SPDX-License-Identifier: GPL-3.0-only
//
// One-shot dedup pass over src/data/library_04252026.csv
// → produces src/data/library_04252026_r2.csv with 12 records consolidated:
//   - 3 hard duplicates collapsed (same referenceId × 2 rows → 1 row)
//   - 9 easy soft duplicates dropped (un-cited side removed)
// Five medium/hard soft-dups requiring cross-CSV citation updates are
// deferred; see /Users/ericamador/.claude/plans/ask-clarifications-sunny-marble.md.

const fs = require('node:fs')
const path = require('node:path')
const Papa = require('papaparse')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src/data/library_04252026.csv')
const DST = path.join(ROOT, 'src/data/library_04252026_r2.csv')

const HARD_DUPS = new Set([
  'G7-CEG-Financial-PQC-2026',
  'Malaysia-NACSA-PQC-2025',
  'AU-ASD-ISM-Crypto-2024',
])

// drop -> keep (canonical)
const SOFT_DROPS = {
  'BSI TR-02102': 'BSI TR-02102-1',
  'Avis-de-lANSSI-sur-la-migration-vers-la-cryptographie': 'ANSSI PQC Position Paper',
  'IETF RFC 9162': 'RFC-9162',
  'IETF RFC 4253': 'RFC 4253',
  'India-TEC-910018-2025': 'IN-TEC-PQC-Migration-Report-2025',
  'draft-ietf-plants-merkle-tree-certs': 'IETF-MTC-Draft-09',
  'ETSI-GS-QKD-016-V2': 'ETSI-GS-QKD-016',
  'draft-ietf-pquip-hybrid-signature-spectrums': 'draft-ietf-pquip-hybrid-signature-spectrums-07',
  'IETF RFC 8555': 'IETF-RFC-8555',
}

// Multi-value fields use semicolon delimiters per CSVmaintenance.md §3.2
const MULTI_VALUE_FIELDS = new Set([
  'dependencies',
  'module_ids',
  'applicable_industries',
  'region_scope',
])

const DATE_FIELDS = new Set(['initial_publication_date', 'last_update_date'])

function unionSemicolons(a, b) {
  const set = new Set()
  for (const part of `${a || ''};${b || ''}`.split(';')) {
    const t = part.trim()
    if (t) set.add(t)
  }
  return Array.from(set).join(';')
}

function pickLatestDate(a, b) {
  const av = (a || '').trim()
  const bv = (b || '').trim()
  if (!av) return bv
  if (!bv) return av
  return av >= bv ? av : bv
}

// Merge `b` into `a` in place — `a` keeps its values where non-empty, `b` fills gaps;
// multi-value fields union; date fields take latest.
function mergeRowInto(a, b) {
  for (const k of Object.keys(b)) {
    const av = (a[k] ?? '').toString()
    const bv = (b[k] ?? '').toString()
    if (MULTI_VALUE_FIELDS.has(k)) {
      a[k] = unionSemicolons(av, bv)
    } else if (DATE_FIELDS.has(k)) {
      a[k] = pickLatestDate(av, bv)
    } else if (!av.trim() && bv.trim()) {
      a[k] = bv
    } else if (av.trim() && bv.trim() && av !== bv && bv.length > av.length) {
      // pick the longer non-empty when both rows differ — typical for `short_description`
      a[k] = bv
    }
  }
  return a
}

function main() {
  const csv = fs.readFileSync(SRC, 'utf8')
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length) {
    console.error('Parse errors:', parsed.errors.slice(0, 5))
  }

  const headerOrder = parsed.meta.fields
  const rows = parsed.data

  console.log(`Read: ${rows.length} rows from library_04252026.csv`)

  // --- Phase 1: collapse hard duplicates (same referenceId twice) ---
  const byId = new Map() // referenceId → row
  const hardCollapsed = []
  for (const row of rows) {
    const id = (row['reference_id'] || '').trim()
    if (!id) continue
    if (HARD_DUPS.has(id) && byId.has(id)) {
      mergeRowInto(byId.get(id), row)
      hardCollapsed.push(id)
    } else if (byId.has(id)) {
      // Should not happen for non-hard-dup IDs; warn and overwrite oldest with longest fields
      console.warn(`Unexpected dup (not in HARD_DUPS): ${id} — merging anyway`)
      mergeRowInto(byId.get(id), row)
    } else {
      byId.set(id, { ...row })
    }
  }

  console.log(
    `Phase 1: collapsed ${hardCollapsed.length} hard duplicates → ${byId.size} unique IDs`
  )

  // --- Phase 2: drop soft duplicates, merging missing fields into canonical ---
  const softDropped = []
  for (const [dropId, keepId] of Object.entries(SOFT_DROPS)) {
    const dropRow = byId.get(dropId)
    const keepRow = byId.get(keepId)
    if (!dropRow) {
      console.warn(`SOFT_DROPS miss — drop ID not found: ${dropId}`)
      continue
    }
    if (!keepRow) {
      console.warn(`SOFT_DROPS miss — keep ID not found: ${keepId} (drop=${dropId} preserved)`)
      continue
    }
    mergeRowInto(keepRow, dropRow)
    byId.delete(dropId)
    softDropped.push(`${dropId} → ${keepId}`)
  }

  console.log(`Phase 2: dropped ${softDropped.length} soft duplicates`)
  for (const line of softDropped) console.log(`  ${line}`)

  // --- Emit ---
  const finalRows = Array.from(byId.values())
  const out = Papa.unparse(finalRows, {
    columns: headerOrder,
    quotes: true, // quote every field for safety vs CSVs with embedded commas/newlines
    newline: '\n',
  })
  fs.writeFileSync(DST, out + '\n', 'utf8')
  console.log(`\nWrote: ${finalRows.length} rows → library_04252026_r2.csv`)
  console.log(`Net: ${rows.length} → ${finalRows.length} (Δ ${rows.length - finalRows.length})`)
}

main()
