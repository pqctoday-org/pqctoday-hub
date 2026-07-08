// SPDX-License-Identifier: GPL-3.0-only
/**
 * N18: Local resource and download status checks.
 * Verifies that files referenced by CSVs exist on disk and reports orphans.
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, LocalResourceEntry } from './types.js'
import { loadCSV, listFiles, readCSV, findLatestCSV, ROOT, isCustomDataDir } from './data-loader.js'

export function runLocalResourceChecks(): {
  results: CheckResult[]
  resources: LocalResourceEntry[]
} {
  const results: CheckResult[] = []
  const resources: LocalResourceEntry[] = []

  // Skip when running against an alternate data dir (e.g., cowork) — public/ is production-only
  if (isCustomDataDir()) {
    results.push({
      id: 'N18-local-resources',
      category: 'local-resource',
      description: 'Local resource checks (skipped — --data-dir mode, public/ not available)',
      sourceA: 'public/',
      sourceB: null,
      severity: 'INFO',
      status: 'SKIP',
      findings: [],
    })
    return { results, resources }
  }

  // ── library.local_file → public/library/ ────────────────────────────────
  {
    const library = loadCSV('library_')
    const findings: Finding[] = []
    const libDir = path.join(ROOT, 'public', 'library')
    const filesOnDisk = new Set(
      fs.existsSync(libDir)
        ? fs
            .readdirSync(libDir)
            .filter((f) => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')
        : []
    )

    const referencedFiles = new Set<string>()
    let expectedCount = 0

    library.rows.forEach((row, i) => {
      const localFileRaw = row.local_file?.trim()
      const downloadable = (row.downloadable || '').toLowerCase()

      if (localFileRaw) {
        // local_file stores relative paths like "public/library/FIPS_203.pdf" — extract filename
        const localFile = localFileRaw.split('/').pop() || localFileRaw
        referencedFiles.add(localFile)
        if (!filesOnDisk.has(localFile)) {
          // Only flag if downloadable=yes
          if (downloadable === 'yes') {
            expectedCount++
            findings.push({
              csv: library.file,
              row: i + 2,
              field: 'local_file',
              value: localFile,
              message: `Library "${row.reference_id}" local_file "${localFile}" not found in public/library/ (downloadable=yes)`,
            })
          }
        } else {
          expectedCount++
        }
      }
    })

    const orphaned = [...filesOnDisk].filter((f) => !referencedFiles.has(f))
    const present = [...referencedFiles].filter((f) => filesOnDisk.has(f)).length

    resources.push({
      directory: 'public/library/',
      expectedFiles: expectedCount,
      presentFiles: present,
      missingFiles: findings.map((f) => f.value),
      orphanedFiles: orphaned.slice(0, 20), // cap at 20
      coverage: expectedCount > 0 ? `${((present / expectedCount) * 100).toFixed(1)}%` : 'N/A',
    })

    results.push({
      id: 'N18-library-local-files',
      category: 'local-resource',
      description: 'library.local_file → public/library/ files',
      sourceA: 'library',
      sourceB: 'public/library/',
      severity: 'WARNING',
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  // ── products evidence coverage ──────────────────────────────────────────
  // Was checking for a per-product SUBDIRECTORY under public/products/, which
  // has never existed -- the real archive (like public/migrate-proofs/) is
  // flat hashed files (e.g. btq-bitcoin-quantum-46a6efc1.html) tracked in
  // public/products/manifest.json, which is what src/data/trustScore/
  // trustScoreData.ts actually reads. The directory check matched nothing,
  // 100% of the time, since the first entry. Fixed 2026-07-07 to check the
  // manifest instead, mirroring the MP-1 pattern used for migrate-proofs.
  {
    const migrate = loadCSV('pqc_product_catalog_')
    const findings: Finding[] = []
    const manifestPath = path.join(ROOT, 'public', 'products', 'manifest.json')
    const downloadedNames = new Set<string>()
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
        entries?: Array<{ softwareName?: string; status?: string }>
      }
      for (const e of manifest.entries || []) {
        if (e.softwareName && e.status === 'downloaded') downloadedNames.add(e.softwareName)
      }
    }

    let expectedCount = 0
    let presentCount = 0

    migrate.rows.forEach((row, i) => {
      // Skip deprecated rows -- verification_status can still say "Verified"
      // on a row that was later deprecated for an unrelated reason (e.g.
      // "not a real product"); it shouldn't need evidence coverage. Fixed
      // 2026-07-07, same gap already found in CM-AT/GC-5/MP-4.
      if ((row.status || '').toLowerCase() === 'deprecated') return
      const status = (row.verification_status || '').toLowerCase()
      if (status !== 'verified') return

      expectedCount++
      const name = row.software_name
      if (downloadedNames.has(name)) {
        presentCount++
      } else {
        findings.push({
          csv: migrate.file,
          row: i + 2,
          field: 'software_name',
          value: name,
          message: `Migrate "${name}" (Verified) has no downloaded evidence entry in public/products/manifest.json`,
        })
      }
    })

    resources.push({
      directory: 'public/products/',
      expectedFiles: expectedCount,
      presentFiles: presentCount,
      missingFiles: findings.map((f) => f.value).slice(0, 30),
      orphanedFiles: [],
      coverage: expectedCount > 0 ? `${((presentCount / expectedCount) * 100).toFixed(1)}%` : 'N/A',
    })

    results.push({
      id: 'N18-products-directory',
      category: 'local-resource',
      description: 'migrate (Verified) → public/products/manifest.json evidence coverage',
      sourceA: 'migrate',
      sourceB: 'public/products/manifest.json',
      severity: 'INFO',
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  // ── timeline + threats local files ──────────────────────────────────────
  for (const dir of ['public/timeline/', 'public/threats/'] as const) {
    const filesOnDisk = listFiles(dir)
    resources.push({
      directory: dir,
      expectedFiles: filesOnDisk.length, // no CSV linkage to check, just report counts
      presentFiles: filesOnDisk.length,
      missingFiles: [],
      orphanedFiles: [],
      coverage: '100%',
    })
  }

  // ── KAT vector coverage per learning module ───────────────────────────
  {
    const katDir = path.join(ROOT, 'kat')
    const katFound = findLatestCSV('kat_', katDir)
    const katRows = katFound ? readCSV(katFound.path) : []
    const katFile = katFound ? path.basename(katFound.path) : ''
    const findings: Finding[] = []

    if (katRows.length > 0) {
      const katModules = new Set<string>()
      for (const row of katRows) {
        const mod = (row.learning_module_id || '').trim()
        if (mod) katModules.add(mod)
      }

      let missingFiles = 0
      for (const row of katRows) {
        const localFile = (row.local_kat_file || '').trim()
        if (localFile) {
          const fullPath = path.join(
            ROOT,
            localFile.startsWith('/') ? localFile.slice(1) : localFile
          )
          if (!fs.existsSync(fullPath)) {
            missingFiles++
            if (findings.length < 20) {
              findings.push({
                csv: katFile,
                row: null,
                field: 'local_kat_file',
                value: localFile,
                message: `KAT file "${localFile}" not found on disk`,
              })
            }
          }
        }
      }

      resources.push({
        directory: 'kat/',
        expectedFiles: katRows.length,
        presentFiles: katRows.length - missingFiles,
        missingFiles: findings.map((f) => f.value),
        orphanedFiles: [],
        coverage:
          katRows.length > 0
            ? `${(((katRows.length - missingFiles) / katRows.length) * 100).toFixed(1)}%`
            : 'N/A',
      })

      results.push({
        id: 'N24-kat-files',
        category: 'local-resource',
        description: `KAT vector files on disk (${katRows.length} vectors, ${katModules.size} modules)`,
        sourceA: katFile,
        sourceB: 'kat/',
        severity: 'WARNING',
        status: findings.length === 0 ? 'PASS' : 'FAIL',
        findings,
      })
    }
  }

  return { results, resources }
}
