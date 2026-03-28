// SPDX-License-Identifier: GPL-3.0-only
/**
 * Assembles the final IntegrityReport from all check results.
 */
import type {
  CheckResult, DataSourceMeta, IntegrityReport,
  UrlCoverageEntry, LocalResourceEntry, EnrichmentCoverageEntry,
} from './types.js'

export function buildReport(
  checkResults: CheckResult[],
  dataSources: Record<string, DataSourceMeta>,
  urlCoverage: UrlCoverageEntry[],
  localResources: LocalResourceEntry[],
  enrichments: EnrichmentCoverageEntry[],
): IntegrityReport {
  const errors = checkResults.filter(r => r.status === 'FAIL' && r.severity === 'ERROR').length
  const warnings = checkResults.filter(r => r.status === 'FAIL' && r.severity === 'WARNING').length
  const info = checkResults.filter(r => r.status === 'FAIL' && r.severity === 'INFO').length
  const passed = checkResults.filter(r => r.status === 'PASS').length

  // Build coverage matrix — for each source, list its cross-validation partners
  const coverageMatrix: Record<string, string[]> = {}
  for (const r of checkResults) {
    if (r.category !== 'cross-reference') continue
    if (!coverageMatrix[r.sourceA]) coverageMatrix[r.sourceA] = []
    if (r.sourceB && !coverageMatrix[r.sourceA].includes(r.sourceB)) {
      coverageMatrix[r.sourceA].push(r.sourceB)
    }
    if (r.sourceB) {
      if (!coverageMatrix[r.sourceB]) coverageMatrix[r.sourceB] = []
      if (!coverageMatrix[r.sourceB].includes(r.sourceA)) {
        coverageMatrix[r.sourceB].push(r.sourceA)
      }
    }
  }

  return {
    reportVersion: '1.0',
    timestamp: new Date().toISOString(),
    dataSources,
    summary: {
      totalChecks: checkResults.length,
      checksRun: checkResults.filter(r => r.status !== 'SKIP').length,
      errors,
      warnings,
      info,
      passed,
    },
    checkResults,
    coverageMatrix,
    urlCoverage,
    localResources,
    enrichments,
  }
}

// ── Console output ────────────────────────────────────────────────────────────

export function printReport(report: IntegrityReport, verbose: boolean): void {
  const { summary, checkResults, dataSources, urlCoverage, enrichments } = report

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  PQC Timeline App — Data Integrity Report')
  console.log('══════════════════════════════════════════════════════════════\n')

  // Data sources summary
  console.log('── Data Sources ────────────────────────────────────────────')
  const sourceEntries = Object.values(dataSources)
  const maxKeyLen = Math.max(...sourceEntries.map(s => s.key.length))
  for (const s of sourceEntries) {
    const icon = s.status === 'current' ? '✓' : s.status === 'stale' ? '⚠' : '✗'
    const pad = ' '.repeat(maxKeyLen - s.key.length)
    console.log(`  ${icon} ${s.key}${pad}  ${s.latestFile || 'N/A'}  (${s.recordCount} records, ${s.staleDays}d old)`)
  }
  console.log()

  // Check results
  console.log('── Check Results ───────────────────────────────────────────')
  for (const r of checkResults) {
    const icon = r.status === 'PASS' ? '✓' : r.severity === 'ERROR' ? '✗' : r.severity === 'WARNING' ? '⚠' : 'ℹ'
    const count = r.findings.length > 0 ? ` (${r.findings.length} findings)` : ''
    console.log(`  ${icon} [${r.id}] ${r.description}${count}`)

    if (verbose && r.findings.length > 0) {
      for (const f of r.findings.slice(0, 10)) {
        console.log(`      ${f.message}`)
      }
      if (r.findings.length > 10) {
        console.log(`      ... and ${r.findings.length - 10} more`)
      }
    }
  }
  console.log()

  // URL coverage
  console.log('── URL Coverage ────────────────────────────────────────────')
  for (const u of urlCoverage) {
    console.log(`  ${u.source}: ${u.withUrl}/${u.total} (${u.coverage})`)
  }
  console.log()

  // Enrichment coverage
  console.log('── Enrichment Coverage ─────────────────────────────────────')
  for (const e of enrichments) {
    console.log(`  ${e.source}: ${e.enrichedRecords}/${e.sourceRecords} (${e.coverage}) — ${e.files.length} enrichment files`)
    if (verbose) {
      for (const f of e.files) {
        console.log(`    ${f.file}: ${f.entries} entries, model=${f.model || 'unknown'}`)
      }
    }
  }
  console.log()

  // Summary
  console.log('── Summary ─────────────────────────────────────────────────')
  console.log(`  Total checks:  ${summary.totalChecks}`)
  console.log(`  Passed:        ${summary.passed}`)
  console.log(`  Errors:        ${summary.errors}`)
  console.log(`  Warnings:      ${summary.warnings}`)
  console.log(`  Info:          ${summary.info}`)
  console.log()

  if (summary.errors > 0) {
    console.log('✗ FAILED — fix ERROR-severity findings above.')
  } else if (summary.warnings > 0) {
    console.log('⚠ PASSED with warnings.')
  } else {
    console.log('✓ All checks passed.')
  }
  console.log()
}
