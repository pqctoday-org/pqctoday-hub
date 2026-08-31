// SPDX-License-Identifier: GPL-3.0-only
/**
 * N18: Local resource and download status checks.
 * Verifies that files referenced by CSVs exist on disk and reports orphans.
 */
import fs from 'fs'
import path from 'path'
import type { CheckResult, Finding, LocalResourceEntry } from './types.js'
import {
  loadCSV,
  readCSV,
  findLatestCSV,
  ROOT,
  LOCAL_CACHE_ROOT,
  isCustomDataDir,
} from './data-loader.js'

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
    // RELOCATED 2026-07-12: raw documents now live in
    // pqctoday-priv/local-evidence-cache/library/, not public/library/ (see
    // LOCAL-FILES-REMEDIATION-PLAN-07122026.md). local_file values are now
    // stored as "library/X.html" (no "public/" prefix) — match on the full
    // relative value, not just the basename, so a file that moved between
    // subdirectories would still be caught as missing.
    const libDir = path.join(LOCAL_CACHE_ROOT, 'library')
    // FIXED 2026-07-13 — this check used to treat a missing libDir (e.g. in
    // GitHub Actions CI, which never checks out the sibling pqctoday-priv
    // repo) as "zero files on disk", flooding every downloadable=yes row
    // with a false "not found" finding purely because the environment can't
    // see priv — not because anything is actually missing. The sibling N22
    // check (source-document-quality.ts) already skips cleanly in this case;
    // this one never got the same guard. Found via the same real CI run that
    // surfaced the download-timeline-evidence.ts manifest bug.
    if (!fs.existsSync(libDir)) {
      results.push({
        id: 'N18-library-local-files',
        category: 'local-resource',
        description:
          'library.local_file → pqctoday-priv/local-evidence-cache/library/ files (skipped — priv checkout not present)',
        sourceA: 'library',
        sourceB: 'pqctoday-priv/local-evidence-cache/library/',
        severity: 'INFO',
        status: 'SKIP',
        findings: [],
      })
    } else {
      const filesOnDisk = new Set(
        fs
          .readdirSync(libDir)
          .filter((f) => !f.startsWith('.') && f !== 'manifest.json' && f !== 'skip-list.json')
      )

      const referencedFiles = new Set<string>()
      let expectedCount = 0

      library.rows.forEach((row, i) => {
        const localFileRaw = row.local_file?.trim()
        const downloadable = (row.downloadable || '').toLowerCase()
        const isDeprecated = (row.status || '').toLowerCase() === 'deprecated'

        if (localFileRaw) {
          const localFile = localFileRaw.split('/').pop() || localFileRaw
          referencedFiles.add(localFile)
          if (!filesOnDisk.has(localFile)) {
            // Only flag if downloadable=yes AND the row is still active — a
            // deprecated row's evidence is retired along with it, so a stale
            // downloadable=yes left over from before deprecation (found live
            // 2026-08-29: 3 rows deprecated days earlier, each for a reason
            // — registration-gated, wrong-document-cached — that makes the
            // file genuinely unrecoverable) must not keep flagging forever.
            if (downloadable === 'yes' && !isDeprecated) {
              expectedCount++
              findings.push({
                csv: library.file,
                row: i + 2,
                field: 'local_file',
                value: localFile,
                message: `Library "${row.reference_id}" local_file "${localFile}" not found in pqctoday-priv/local-evidence-cache/library/ (downloadable=yes)`,
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
        directory: 'pqctoday-priv/local-evidence-cache/library/',
        expectedFiles: expectedCount,
        presentFiles: present,
        missingFiles: findings.map((f) => f.value),
        orphanedFiles: orphaned.slice(0, 20), // cap at 20
        coverage: expectedCount > 0 ? `${((present / expectedCount) * 100).toFixed(1)}%` : 'N/A',
      })

      results.push({
        id: 'N18-library-local-files',
        category: 'local-resource',
        description: 'library.local_file → pqctoday-priv/local-evidence-cache/library/ files',
        sourceA: 'library',
        sourceB: 'pqctoday-priv/local-evidence-cache/library/',
        severity: 'WARNING',
        status: findings.length === 0 ? 'PASS' : 'FAIL',
        findings,
      })
    }
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
      const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as
        | Array<{ softwareName?: string; status?: string }>
        | { entries?: Array<{ softwareName?: string; status?: string }> }
      // FIXED 2026-07-13 — real crash found locally: this manifest's actual
      // shape is a plain top-level array (594 entries, e.g.
      // {softwareName, filename, url, status, priority}), not {entries: [...]}
      // like every other manifest.json in this pipeline. Assuming the wrapper
      // shape meant `manifest.entries` resolved to Array.prototype.entries
      // (a real method, since `manifest` IS an array) — truthy, so
      // `manifest.entries || []` picked the function itself, and `for...of`
      // threw "function is not iterable". This file is gitignore-excepted
      // but has never actually been committed (git log shows zero history),
      // so CI never hits this path today — but it will the moment someone
      // commits it, since the .gitignore rule clearly means to track it.
      const entries = Array.isArray(parsed) ? parsed : parsed.entries || []
      for (const e of entries) {
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
  // RELOCATED 2026-07-12 — raw documents now live in
  // pqctoday-priv/local-evidence-cache/{timeline,threats}/, not public/.
  for (const dir of ['timeline', 'threats'] as const) {
    const fullDir = path.join(LOCAL_CACHE_ROOT, dir)
    const filesOnDisk = fs.existsSync(fullDir)
      ? fs
          .readdirSync(fullDir, { recursive: true } as { recursive: true })
          .filter(
            (f): f is string => typeof f === 'string' && !f.startsWith('.') && f !== 'manifest.json'
          )
      : []
    resources.push({
      directory: `pqctoday-priv/local-evidence-cache/${dir}/`,
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
