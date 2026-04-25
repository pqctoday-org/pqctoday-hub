// SPDX-License-Identifier: GPL-3.0-only
//
// Cross-CSV dedup pass — bounded scope (3 of 5 deferred from v3.5.14):
//   1. ANSSI-PQC-Position-2022 → ANSSI PQC Position Paper (3 cites in library deps)
//   2. India-DST-NQM-Roadmap → India-DST-Quantum-Safe-Roadmap-2026 (5 cites: library deps + compliance)
//   3. NIST SP 800-53 → FISMA-NIST-SP-800-53r5 (6 cites in compliance)
//
// Inputs:
//   - src/data/library_04252026_r3.csv (corrected r3 from v3.5.15)
//   - src/data/compliance_04242026.csv (latest compliance)
//
// Outputs:
//   - src/data/library_04252026_r4.csv (drops 3 rows + updates dependencies cites)
//   - src/data/compliance_04252026.csv (updates library_refs cites)
//
// Deferred (still): NIST SP 800-90 family (touches older governance CSVs);
//   NIST-FIPS140-3-IG-PQC vs NIST-FIPS-140-3-IG-Sep-2025-PQC (37 vs 38 cites
//   across many CSVs).
//
// CONTRACT WITH v3.5.15 BUG FIX: reference_id is treated as IMMUTABLE here too.
// We never overwrite it during merge; only drop dropped-id rows after copying
// missing fields into the canonical.

const fs = require('node:fs')
const path = require('node:path')
const Papa = require('papaparse')

const ROOT = path.resolve(__dirname, '..')

// drop_id → keep_id (canonical)
const RENAMES = {
  'ANSSI-PQC-Position-2022': 'ANSSI PQC Position Paper',
  'India-DST-NQM-Roadmap': 'India-DST-Quantum-Safe-Roadmap-2026',
  'NIST SP 800-53': 'FISMA-NIST-SP-800-53r5',
}

const IMMUTABLE_FIELDS = new Set(['reference_id'])
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

function mergeRowInto(a, b) {
  for (const k of Object.keys(b)) {
    if (IMMUTABLE_FIELDS.has(k)) continue
    const av = (a[k] ?? '').toString()
    const bv = (b[k] ?? '').toString()
    if (MULTI_VALUE_FIELDS.has(k)) {
      a[k] = unionSemicolons(av, bv)
    } else if (DATE_FIELDS.has(k)) {
      a[k] = pickLatestDate(av, bv)
    } else if (!av.trim() && bv.trim()) {
      a[k] = bv
    } else if (av.trim() && bv.trim() && av !== bv && bv.length > av.length) {
      a[k] = bv
    }
  }
  return a
}

// Replace any occurrence of a drop_id token (semicolon-delimited) with its
// canonical keep_id. Returns { value, replacedCount }.
function replaceCitesInField(rawValue) {
  if (!rawValue) return { value: rawValue, replacedCount: 0 }
  const parts = rawValue.split(';').map((p) => p.trim())
  let replaced = 0
  const out = parts.map((p) => {
    if (Object.prototype.hasOwnProperty.call(RENAMES, p)) {
      replaced++
      return RENAMES[p]
    }
    return p
  })
  // Dedup after replacement (avoid creating duplicates in the cite list)
  const dedup = Array.from(new Set(out.filter((p) => p)))
  return { value: dedup.join(';'), replacedCount: replaced }
}

function processLibrary() {
  const SRC = path.join(ROOT, 'src/data/library_04252026_r3.csv')
  const DST = path.join(ROOT, 'src/data/library_04252026_r4.csv')

  const csv = fs.readFileSync(SRC, 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = parsed.data
  const headerOrder = parsed.meta.fields

  console.log(`\n=== library_04252026_r3.csv → _r4 ===`)
  console.log(`Read: ${rows.length} rows`)

  // Build map by reference_id
  const byId = new Map()
  for (const row of rows) {
    const id = (row['reference_id'] || '').trim()
    if (!id) continue
    if (byId.has(id)) {
      console.warn(`Unexpected duplicate in r3: ${id}`)
      continue
    }
    byId.set(id, { ...row })
  }
  console.log(`Unique IDs: ${byId.size}`)

  // Phase 1: merge dropped row's missing fields into canonical, then delete drop
  const merges = []
  for (const [dropId, keepId] of Object.entries(RENAMES)) {
    const dropRow = byId.get(dropId)
    const keepRow = byId.get(keepId)
    if (!dropRow) {
      console.warn(`  drop ID not in r3: ${dropId}`)
      continue
    }
    if (!keepRow) {
      console.warn(`  keep ID not in r3: ${keepId} — preserving ${dropId}`)
      continue
    }
    mergeRowInto(keepRow, dropRow)
    byId.delete(dropId)
    merges.push(`${dropId} → ${keepId}`)
  }
  console.log(`Phase 1: ${merges.length} rows dropped + merged`)
  for (const m of merges) console.log(`  ${m}`)

  // Phase 2: rewrite `dependencies` field on every remaining row to replace
  // any cite of a dropped ID with its canonical
  let depReplacedCount = 0
  let depRowsAffected = 0
  for (const row of byId.values()) {
    const { value, replacedCount } = replaceCitesInField(row.dependencies)
    if (replacedCount > 0) {
      row.dependencies = value
      depReplacedCount += replacedCount
      depRowsAffected++
    }
  }
  console.log(
    `Phase 2: rewrote ${depReplacedCount} dependency cites across ${depRowsAffected} rows`
  )

  const finalRows = Array.from(byId.values())
  const out = Papa.unparse(finalRows, {
    columns: headerOrder,
    quotes: true,
    newline: '\n',
  })
  fs.writeFileSync(DST, out + '\n', 'utf8')
  console.log(`Wrote: ${finalRows.length} rows → library_04252026_r4.csv`)
}

function processCompliance() {
  const SRC = path.join(ROOT, 'src/data/compliance_04242026.csv')
  const DST = path.join(ROOT, 'src/data/compliance_04252026.csv')

  const csv = fs.readFileSync(SRC, 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = parsed.data
  const headerOrder = parsed.meta.fields

  console.log(`\n=== compliance_04242026.csv → 04252026 ===`)
  console.log(`Read: ${rows.length} rows`)

  let replacedCount = 0
  let rowsAffected = 0
  for (const row of rows) {
    const { value, replacedCount: rc } = replaceCitesInField(row.library_refs)
    if (rc > 0) {
      row.library_refs = value
      replacedCount += rc
      rowsAffected++
    }
  }
  console.log(`Rewrote ${replacedCount} library_refs cites across ${rowsAffected} rows`)

  const out = Papa.unparse(rows, {
    columns: headerOrder,
    quotes: true,
    newline: '\n',
  })
  fs.writeFileSync(DST, out + '\n', 'utf8')
  console.log(`Wrote: ${rows.length} rows → compliance_04252026.csv`)
}

processLibrary()
processCompliance()
