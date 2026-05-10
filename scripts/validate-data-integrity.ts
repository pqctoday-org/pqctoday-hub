#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Unified data integrity validator for the PQC Timeline App.
 *
 * Runs all cross-reference checks (C1-C10, D1-D6, N1-N21, QA-C1-D2), freshness tracking,
 * URL coverage, local resource validation, and enrichment coverage.
 *
 * Usage:
 *   npx tsx scripts/validate-data-integrity.ts                # console output
 *   npx tsx scripts/validate-data-integrity.ts --json          # JSON to stdout
 *   npx tsx scripts/validate-data-integrity.ts --verbose       # show all findings
 *   npx tsx scripts/validate-data-integrity.ts --staleness 60  # custom staleness threshold (days)
 *   npx tsx scripts/validate-data-integrity.ts --report-only   # always exit 0 (CI dry run)
 *   npx tsx scripts/validate-data-integrity.ts --data-dir PATH # validate alternate data dir (e.g., cowork)
 *
 * Exit codes:
 *   0 — all checks pass (or --report-only mode)
 *   1 — ERROR-severity findings detected
 *   2 — script failure
 */

import { setDataDir } from './validators/data-loader.js'
import { runCrossRefChecks } from './validators/cross-ref-checks.js'
import { runQAConsistencyChecks } from './validators/qa-consistency-checks.js'
import { runContentAccuracyChecks } from './validators/content-accuracy-checks.js'
import { runUrlCoverageChecks } from './validators/url-coverage-checks.js'
import { runLocalResourceChecks } from './validators/local-resource-checks.js'
import { runEnrichmentChecks } from './validators/enrichment-checks.js'
import { runEnrichmentCrossChecks } from './validators/enrichment-crosscheck.js'
import { runFreshnessChecks } from './validators/freshness-checks.js'
import { runGraphConsistencyChecks } from './validators/graph-consistency-checks.js'
import { runSourceDocumentQualityChecks } from './validators/source-document-quality.js'
import { runEnrichmentAccuracyChecks } from './validators/enrichment-accuracy-checks.js'
import { runTrustEngineChecks } from './validators/trust-engine-checks.js'
import { runMissingReferenceChecks } from './validators/missing-reference-checks.js'
import { runQASemanticChecks } from './validators/qa-semantic-checks.js'
import { runDuplicateChecks } from './validators/duplicate-checks.js'
import {
  runSelfContainmentChecks,
  runStatusColumnChecks,
  runVocabTagChecks,
  runOrphanCheck,
} from './validators/self-containment-checks.js'
import { buildReport, printReport } from './validators/report-builder.js'
import type { CheckResult } from './validators/types.js'
import fs from 'fs'
import path from 'path'

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const verbose = args.includes('--verbose')
const reportOnly = args.includes('--report-only')
// Phase 2.1 — opt-in embedding-driven candidate suggestions for MR-1
// (and future validators that support the same flag).
const withCandidates = args.includes('--with-candidates')

const stalenessIdx = args.indexOf('--staleness')
const staleThreshold = stalenessIdx >= 0 ? parseInt(args[stalenessIdx + 1], 10) || 90 : 90

const dataDirIdx = args.indexOf('--data-dir')
if (dataDirIdx >= 0 && args[dataDirIdx + 1]) {
  setDataDir(args[dataDirIdx + 1])
}

// ── Run all checks ──────────────────────────────────────────────────────────

try {
  const allResults: CheckResult[] = []

  // 1. Cross-reference + duplicate checks (C1-C10, D1-D6, N1-N15)
  const crossRefResults = runCrossRefChecks()
  allResults.push(...crossRefResults)

  // 2. QA consistency checks (QA-C1..QA-C10, QA-D1..QA-D2)
  const qaResults = runQAConsistencyChecks()
  allResults.push(...qaResults)

  // 2b. Content accuracy checks (QA-F1..QA-F6)
  const contentAccuracyResults = runContentAccuracyChecks()
  allResults.push(...contentAccuracyResults)

  // 3. URL coverage (N17)
  const { results: urlResults, coverage: urlCoverage } = runUrlCoverageChecks()
  allResults.push(...urlResults)

  // 3. Local resource checks (N18)
  const { results: localResults, resources: localResources } = runLocalResourceChecks()
  allResults.push(...localResults)

  // 4. Enrichment coverage + script version (N19)
  const { results: enrichResults, coverage: enrichCoverage } = runEnrichmentChecks()
  allResults.push(...enrichResults)

  // 5. Enrichment cross-checks: Q&A + rag-summary vs. enrichments (N20, N21)
  const { results: xcheckResults } = runEnrichmentCrossChecks()
  allResults.push(...xcheckResults)

  // 6. Freshness tracking (N16)
  const { results: freshResults, dataSources } = runFreshnessChecks(staleThreshold)
  allResults.push(...freshResults)

  // 7. Source document quality checks (N22)
  const sourceQualityResults = runSourceDocumentQualityChecks()
  allResults.push(...sourceQualityResults)

  // 7b. Enrichment content accuracy checks (N23-A..E)
  const enrichAccuracyResults = runEnrichmentAccuracyChecks()
  allResults.push(...enrichAccuracyResults)

  // 7c. Trust engine checks (CM-W, CM-C, QA-S, QA-CSWP, CM-1..CM-4, CM-E, CM-CSWP, CM-G)
  const trustEngineResults = await runTrustEngineChecks()
  allResults.push(...trustEngineResults)

  // 7d. Missing-reference detector (MR-1) — T03 of trust-engine implementation plan.
  // Phase 2.1 — pass --with-candidates to populate embedding-proposed sources
  // on every finding (~3 candidates per orphan, ranked by cosine).
  if (withCandidates) {
    const { loadEmbeddingsFromDisk } = await import('./lib/load-embeddings-from-disk.js')
    try {
      await loadEmbeddingsFromDisk()
    } catch (err) {
      if (!jsonMode)
        console.warn(
          `--with-candidates requested but embedding runtime failed to load: ${err instanceof Error ? err.message : err}. Continuing without candidates.`
        )
    }
  }
  const missingRefResults = await runMissingReferenceChecks({ withCandidates })
  allResults.push(missingRefResults)

  // 7d.5. QA-F semantic validators (Phase 2.4 / T20) — F7..F12.
  // Reuses the embedding runtime preloaded above for MR-1 when --with-candidates
  // is set; semantic checks (F7, F10) self-skip if runtime isn't loaded.
  if (withCandidates) {
    const qaSemanticResults = await runQASemanticChecks()
    allResults.push(...qaSemanticResults)

    // 7d.6. Pair-wise semantic duplicate detection (Phase 2.3 / DUP-1).
    const duplicateResults = await runDuplicateChecks()
    allResults.push(...duplicateResults)
  }

  // 7e. Self-containment + vocab + status checks (DS03 + DS19) — data-self-containment plan
  allResults.push(...runSelfContainmentChecks())
  allResults.push(...runStatusColumnChecks())
  allResults.push(...runVocabTagChecks())
  // 7f. Trust-path orphan check on restored/deprecated rows (DS20)
  allResults.push(...runOrphanCheck())

  // 8. Graph consistency checks (GC-1..GC-12)
  const { results: graphResults, markdownReport: graphMarkdown } = runGraphConsistencyChecks()
  allResults.push(...graphResults)

  // Write graph consistency markdown report
  if (graphMarkdown) {
    const reportDir = path.join(process.cwd(), 'reports')
    fs.mkdirSync(reportDir, { recursive: true })
    const d = new Date()
    const dateTag = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${d.getFullYear()}`
    const reportPath = path.join(reportDir, `graph-consistency-${dateTag}.md`)
    fs.writeFileSync(reportPath, graphMarkdown)
    if (!jsonMode)
      console.log(`\n📝 Graph consistency report: ${path.relative(process.cwd(), reportPath)}`)
  }

  // ── Build report ────────────────────────────────────────────────────────

  const report = buildReport(allResults, dataSources, urlCoverage, localResources, enrichCoverage)

  // ── Output ──────────────────────────────────────────────────────────────

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printReport(report, verbose)
  }

  // ── Exit ────────────────────────────────────────────────────────────────

  if (reportOnly) {
    process.exit(0)
  }
  process.exit(report.summary.errors > 0 ? 1 : 0)
} catch (err) {
  console.error('Script failure:', err)
  process.exit(2)
}
