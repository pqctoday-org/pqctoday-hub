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

function latestComplianceCSV(): string {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^compliance_\d{8}(?:_r\d+)?\.csv$/.test(f))
    .map((f) => {
      const m = f.match(/^compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
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
    throw new Error('No compliance_*.csv found in src/data/')
  }
  return path.join(DATA_DIR, files[0].file)
}

/**
 * Pulls out the COUNTRY_CODE_TO_NAME and COUNTRY_TO_REGION maps by parsing the
 * loader file as text. We deliberately avoid importing the module — its TS
 * needs the Vite glob shim — and a regex-on-source check is robust enough
 * because both maps are written as plain object literals in this repo.
 */
function readMapsFromLoader(): {
  codeToName: Map<string, string>
  countryToRegion: Map<string, string>
} {
  const src = fs.readFileSync(LOADER_FILE, 'utf8')

  function extractMap(varName: string): Map<string, string> {
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
      if (key) out.set(key, value)
    }
    return out
  }

  return {
    codeToName: extractMap('COUNTRY_CODE_TO_NAME'),
    countryToRegion: extractMap('COUNTRY_TO_REGION'),
  }
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
