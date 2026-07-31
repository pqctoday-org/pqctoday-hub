#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-compliance-countries.ts
 *
 * CI gate: every country/region token used in the compliance CSV's `countries`
 * column MUST be resolvable through `COUNTRY_CODE_TO_NAME` in
 * `src/data/complianceData.ts`. Unresolved tokens render as bare ISO codes
 * (e.g. "NO", "SE") or as legacy "UNKNOWN:*" strings in the UI, and silently
 * fall out of the Landscape region facet because `regionForCountry()` keys
 * off expanded country names.
 *
 * Also enforces that every resolved country name appears in `COUNTRY_TO_REGION`
 * so the Landscape region facet always classifies it into a real bloc rather
 * than the "Other" fallback.
 *
 * Usage:  npx tsx scripts/audit-compliance-countries.ts
 * Exit 0: every token resolves and every resolved country has a region bloc
 * Exit 1: at least one token is unresolvable or unbucketed
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const REPO_ROOT = process.cwd()
const DATA_DIR = path.resolve(REPO_ROOT, 'src/data')
const LOADER_FILE = path.resolve(REPO_ROOT, 'src/data/complianceData.ts')

function latestCSV(pattern: RegExp, datePattern: RegExp, label: string): string {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(datePattern)
      if (!m) return null
      const month = parseInt(m[1], 10)
      const day = parseInt(m[2], 10)
      const year = parseInt(m[3], 10)
      const rev = m[4] ? parseInt(m[4], 10) : 0
      return { file: f, date: new Date(year, month - 1, day), rev }
    })
    .filter((x): x is { file: string; date: Date; rev: number } => x !== null)
    .sort((a, b) => {
      const d = b.date.getTime() - a.date.getTime()
      if (d !== 0) return d
      return b.rev - a.rev
    })
  if (files.length === 0) {
    throw new Error(`No ${label} CSV found in src/data/`)
  }
  return path.join(DATA_DIR, files[0].file)
}

function latestComplianceCSV(): string {
  return latestCSV(
    /^compliance_\d{8}(?:_r\d+)?\.csv$/,
    /^compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    'compliance_*'
  )
}

/**
 * Build the code→name map from the latest jurisdictions CSV, matching the
 * runtime logic in jurisdictionsData.ts (ACTIVE_ALL → COUNTRY_CODE_TO_NAME).
 * GB is added as an alias for United Kingdom (compliance CSV uses GB, not UK).
 */
function codeToNameFromJurisdictionsCSV(): Map<string, string> {
  const csvPath = latestCSV(
    /^jurisdictions_\d{8}(?:_r\d+)?\.csv$/,
    /^jurisdictions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    'jurisdictions_*'
  )
  const raw = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  const out = new Map<string, string>()
  for (const row of parsed.data) {
    const code = row.code?.trim()
    const name = row.name?.trim()
    const status = row.status?.trim().toLowerCase()
    if (!code || !name || status === 'deprecated') continue
    out.set(code, name)
  }
  out.set('GB', 'United Kingdom') // compliance CSV uses GB; jurisdiction CSV key is UK
  return out
}

/**
 * Country name -> compliance bloc, read from the jurisdictions CSV's
 * `compliance_bloc` column.
 *
 * ADDED 2026-07-31 (WP-0.3). COUNTRY_TO_REGION in complianceData.ts used to be
 * a plain inline literal that plain regex extraction could read. It is now
 * DERIVED from this column, so a regex over the loader would see only the two
 * inline synthetic tokens and report every real country as unbucketed. This
 * mirrors exactly what codeToNameFromJurisdictionsCSV already does for the
 * sibling map, and what the runtime does.
 */
function blocFromJurisdictionsCSV(): Map<string, string> {
  const csvPath = latestCSV(
    /^jurisdictions_\d{8}(?:_r\d+)?\.csv$/,
    /^jurisdictions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    'jurisdictions_*'
  )
  const raw = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  const out = new Map<string, string>()
  for (const row of parsed.data) {
    const name = row.name?.trim()
    const bloc = row.compliance_bloc?.trim()
    const status = row.status?.trim().toLowerCase()
    if (!name || !bloc || status === 'deprecated') continue
    out.set(name, bloc)
  }
  return out
}

/**
 * Pulls out the COUNTRY_CODE_TO_NAME and COUNTRY_TO_REGION maps from source.
 * We avoid importing the module directly — it uses the Vite glob shim.
 *
 * COUNTRY_CODE_TO_NAME spreads JURISDICTION_CODE_TO_NAME (built at runtime from
 * the jurisdictions CSV) plus a few inline PQC-REGION-* tokens. We reconstruct
 * the full set by parsing the jurisdictions CSV directly and merging the inline
 * tokens from complianceData.ts, matching exactly what the runtime does.
 *
 * COUNTRY_TO_REGION is a plain inline literal — plain regex extraction still works.
 */
function readMapsFromLoader(): {
  codeToName: Map<string, string>
  countryToRegion: Map<string, string>
} {
  const src = fs.readFileSync(LOADER_FILE, 'utf8')

  function extractInlineEntries(varName: string): Map<string, string> {
    const re = new RegExp(
      `const ${varName}: Record<string, [A-Za-z()\\-_ ]+> = \\{([\\s\\S]*?)\\n\\}`
    )
    const m = src.match(re)
    if (!m) {
      throw new Error(`Could not locate ${varName} in ${LOADER_FILE}`)
    }
    const body = m[1]
    const entryRe = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z][A-Za-z0-9_]*)):\s*'([^']+)'/gm
    const out = new Map<string, string>()
    let entry
    while ((entry = entryRe.exec(body)) !== null) {
      const key = entry[1] ?? entry[2] ?? entry[3]
      const value = entry[4]
      if (key && !key.startsWith('...')) out.set(key, value)
    }
    return out
  }

  // Start with all codes from the jurisdictions CSV (matches runtime ACTIVE_ALL),
  // then overlay the inline PQC-REGION-* tokens from complianceData.ts.
  const codeToName = codeToNameFromJurisdictionsCSV()
  for (const [k, v] of extractInlineEntries('COUNTRY_CODE_TO_NAME')) {
    codeToName.set(k, v)
  }

  // Same two-part reconstruction as codeToName above: the jurisdictions CSV
  // supplies every real country, the loader's inline literal supplies the
  // PQC-REGION-* synthetic tokens that are not jurisdictions at all.
  const countryToRegion = blocFromJurisdictionsCSV()
  for (const [k, v] of extractInlineEntries('COUNTRY_TO_REGION')) {
    countryToRegion.set(k, v)
  }

  return { codeToName, countryToRegion }
}

function main(): void {
  const csvPath = latestComplianceCSV()
  const raw = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length > 0) {
    console.error(`Parse errors in ${csvPath}:`)
    for (const err of parsed.errors.slice(0, 5)) {
      console.error(`  row ${err.row}: ${err.message}`)
    }
    process.exit(1)
  }

  const { codeToName, countryToRegion } = readMapsFromLoader()

  const unresolved = new Map<string, Set<string>>() // token -> set of row ids
  const unbucketed = new Map<string, Set<string>>() // resolved name -> set of row ids
  let activeRows = 0
  let totalTokens = 0

  for (const row of parsed.data) {
    if ((row.status || '').trim().toLowerCase() !== 'active') continue
    activeRows += 1
    const tokens = (row.countries || '')
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean)

    for (const token of tokens) {
      totalTokens += 1
      const expanded = codeToName.get(token)
      if (!expanded) {
        if (!unresolved.has(token)) unresolved.set(token, new Set())
        unresolved.get(token)!.add(row.id)
        continue
      }
      if (!countryToRegion.has(expanded)) {
        if (!unbucketed.has(expanded)) unbucketed.set(expanded, new Set())
        unbucketed.get(expanded)!.add(row.id)
      }
    }
  }

  const failures: string[] = []

  if (unresolved.size > 0) {
    failures.push(
      `${unresolved.size} country token(s) in ${path.basename(csvPath)} do not resolve via COUNTRY_CODE_TO_NAME:`
    )
    for (const [token, ids] of unresolved) {
      const sample = Array.from(ids).slice(0, 4).join(', ')
      const more = ids.size > 4 ? ` (+${ids.size - 4} more)` : ''
      failures.push(`  ${token}  used in: ${sample}${more}`)
    }
    failures.push(
      `Fix: add the missing key(s) to COUNTRY_CODE_TO_NAME in src/data/complianceData.ts.`
    )
  }

  if (unbucketed.size > 0) {
    failures.push(
      `${unbucketed.size} resolved country name(s) are missing from COUNTRY_TO_REGION (will show as "Other" in the Landscape region facet):`
    )
    for (const [name, ids] of unbucketed) {
      const sample = Array.from(ids).slice(0, 4).join(', ')
      const more = ids.size > 4 ? ` (+${ids.size - 4} more)` : ''
      failures.push(`  ${name}  used in: ${sample}${more}`)
    }
    failures.push(`Fix: add the missing key(s) to COUNTRY_TO_REGION in src/data/complianceData.ts.`)
  }

  if (failures.length > 0) {
    console.error('Compliance country audit FAILED:\n')
    for (const line of failures) console.error(line)
    process.exit(1)
  }

  console.log(
    `Compliance country audit OK — ${activeRows} active row(s), ${totalTokens} country token(s) all resolve.`
  )
  console.log(
    `  COUNTRY_CODE_TO_NAME entries: ${codeToName.size}  COUNTRY_TO_REGION entries: ${countryToRegion.size}`
  )
}

main()
