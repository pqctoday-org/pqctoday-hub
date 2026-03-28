// SPDX-License-Identifier: GPL-3.0-only
/**
 * N18: Local resource and download status checks.
 * Verifies that files referenced by CSVs exist on disk and reports orphans.
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, LocalResourceEntry } from './types.js'
import { loadCSV, listFiles, ROOT } from './data-loader.js'

export function runLocalResourceChecks(): { results: CheckResult[]; resources: LocalResourceEntry[] } {
  const results: CheckResult[] = []
  const resources: LocalResourceEntry[] = []

  // ── library.local_file → public/library/ ────────────────────────────────
  {
    const library = loadCSV('library_')
    const findings: Finding[] = []
    const libDir = path.join(ROOT, 'public', 'library')
    const filesOnDisk = new Set(fs.existsSync(libDir)
      ? fs.readdirSync(libDir).filter(f => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')
      : [])

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
              csv: library.file, row: i + 2, field: 'local_file', value: localFile,
              message: `Library "${row.reference_id}" local_file "${localFile}" not found in public/library/ (downloadable=yes)`,
            })
          }
        } else {
          expectedCount++
        }
      }
    })

    const orphaned = [...filesOnDisk].filter(f => !referencedFiles.has(f))
    const present = [...referencedFiles].filter(f => filesOnDisk.has(f)).length

    resources.push({
      directory: 'public/library/',
      expectedFiles: expectedCount,
      presentFiles: present,
      missingFiles: findings.map(f => f.value),
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

  // ── products directory coverage ─────────────────────────────────────────
  {
    const migrate = loadCSV('quantum_safe_cryptographic_software_reference_')
    const findings: Finding[] = []
    const productsDir = path.join(ROOT, 'public', 'products')
    const productDirs = new Set(
      fs.existsSync(productsDir)
        ? fs.readdirSync(productsDir).filter(f => {
            const fullPath = path.join(productsDir, f)
            return fs.statSync(fullPath).isDirectory()
          })
        : []
    )

    let expectedDirs = 0
    let presentDirs = 0

    migrate.rows.forEach((row, i) => {
      const status = (row.verification_status || '').toLowerCase()
      if (status !== 'verified') return

      expectedDirs++
      const name = row.software_name
      // Normalize: lowercase, replace spaces with hyphens
      const normalized = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Check if any directory matches (fuzzy)
      const found = productDirs.has(name) || productDirs.has(normalized) ||
        [...productDirs].some(d => d.toLowerCase() === normalized || d.toLowerCase() === name.toLowerCase())

      if (found) {
        presentDirs++
      } else {
        findings.push({
          csv: migrate.file, row: i + 2, field: 'software_name', value: name,
          message: `Migrate "${name}" (Verified) has no product docs directory in public/products/`,
        })
      }
    })

    resources.push({
      directory: 'public/products/',
      expectedFiles: expectedDirs,
      presentFiles: presentDirs,
      missingFiles: findings.map(f => f.value).slice(0, 30),
      orphanedFiles: [],
      coverage: expectedDirs > 0 ? `${((presentDirs / expectedDirs) * 100).toFixed(1)}%` : 'N/A',
    })

    results.push({
      id: 'N18-products-directory',
      category: 'local-resource',
      description: 'migrate (Verified) → public/products/ directories',
      sourceA: 'migrate',
      sourceB: 'public/products/',
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

  return { results, resources }
}
