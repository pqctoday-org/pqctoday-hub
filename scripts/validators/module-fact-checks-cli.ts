#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Standalone CLI for module fact checks (MF-1..MF-4).
 *
 * Usage:
 *   npx tsx scripts/validators/module-fact-checks-cli.ts           # console report
 *   npx tsx scripts/validators/module-fact-checks-cli.ts --json    # JSON output
 *   npx tsx scripts/validators/module-fact-checks-cli.ts --report-only  # always exit 0
 */
import { runModuleFactChecks } from './module-fact-checks.js'

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const reportOnly = args.includes('--report-only')

const results = runModuleFactChecks()

const errors = results.filter((r) => r.status === 'FAIL' && r.severity === 'ERROR')
const warnings = results.filter((r) => r.status === 'FAIL' && r.severity === 'WARNING')
const passed = results.filter((r) => r.status === 'PASS')

if (jsonMode) {
  console.log(
    JSON.stringify(
      {
        results,
        summary: { passed: passed.length, warnings: warnings.length, errors: errors.length },
      },
      null,
      2
    )
  )
} else {
  console.log('\n── Module Fact Checks ─────────────────────────────────────')
  for (const r of results) {
    const icon = r.status === 'PASS' ? 'PASS' : r.severity === 'ERROR' ? 'FAIL' : 'WARN'
    console.log(`  [${icon}] ${r.id}: ${r.description} (${r.findings.length} findings)`)
    if (r.findings.length > 0) {
      for (const f of r.findings.slice(0, 10)) {
        console.log(`         ${f.csv}:${f.row} — ${f.message}`)
      }
      if (r.findings.length > 10) {
        console.log(`         ... and ${r.findings.length - 10} more`)
      }
    }
  }
  console.log(
    `\n  Summary: ${passed.length} passed, ${warnings.length} warnings, ${errors.length} errors`
  )
  console.log('──────────────────────────────────────────────────────────\n')
}

if (!reportOnly && errors.length > 0) {
  process.exit(1)
}
