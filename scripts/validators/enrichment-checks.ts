// SPDX-License-Identifier: GPL-3.0-only
/**
 * N19: Enrichment coverage and script version tracking.
 * Reports which records have enrichments, coverage %, and enrichment script metadata.
 */
import type { CheckResult, EnrichmentCoverageEntry, EnrichmentFileMeta, Finding } from './types.js'
import { loadCSV, loadEnrichments } from './data-loader.js'

interface EnrichmentSource {
  collection: string
  csvPrefix: string
  idField: string
}

const ENRICHMENT_SOURCES: EnrichmentSource[] = [
  { collection: 'library', csvPrefix: 'library_', idField: 'reference_id' },
  { collection: 'timeline', csvPrefix: 'timeline_', idField: '__timeline_composite' },
  { collection: 'threats', csvPrefix: 'quantum_threats_hsm_industries_', idField: 'threat_id' },
]

const APPROVED_MODELS = ['qwen3.6:27b', 'ollama-qwen3.6:27b', 'qwen3.5:27b', 'ollama-qwen3.5:27b', 'manual-extraction', 'manual']

export function runEnrichmentChecks(): {
  results: CheckResult[]
  coverage: EnrichmentCoverageEntry[]
} {
  const results: CheckResult[] = []
  const coverage: EnrichmentCoverageEntry[] = []

  for (const source of ENRICHMENT_SOURCES) {
    const csv = loadCSV(source.csvPrefix)
    const { files, allIds } = loadEnrichments(source.collection)

    // For timeline, build composite keys matching enrichment format: "Country:OrgName — Title"
    let sourceIds: Set<string>
    if (source.idField === '__timeline_composite') {
      sourceIds = new Set(
        csv.rows
          .map((r) => {
            const c = r.Country?.trim()
            const o = r.OrgName?.trim()
            const t = r.Title?.trim()
            return c && o && t ? `${c}:${o} \u2014 ${t}` : null
          })
          .filter((s): s is string => s !== null)
      )
      // Also add em-dash variant
      const altIds = new Set(
        csv.rows
          .map((r) => {
            const c = r.Country?.trim()
            const o = r.OrgName?.trim()
            const t = r.Title?.trim()
            return c && o && t ? `${c}:${o} — ${t}` : null
          })
          .filter((s): s is string => s !== null)
      )
      for (const id of altIds) sourceIds.add(id)
    } else {
      sourceIds = new Set(csv.rows.map((r) => r[source.idField]).filter(Boolean))
    }
    const enrichedIds = new Set([...allIds].filter((id) => sourceIds.has(id)))
    const unenrichedIds = [...sourceIds].filter((id) => !allIds.has(id))

    const fileMetas: EnrichmentFileMeta[] = files.map((f) => ({
      file: f.file,
      entries: f.entries.length,
      model: f.model,
      scriptVersion: f.scriptVersion,
      date: f.date,
    }))

    const sourceRecords = sourceIds.size
    const enrichedRecords = enrichedIds.size
    const pct = sourceRecords > 0 ? ((enrichedRecords / sourceRecords) * 100).toFixed(1) : '0.0'

    coverage.push({
      source: source.collection,
      sourceRecords,
      enrichedRecords,
      coverage: `${pct}%`,
      unenrichedIds: unenrichedIds.slice(0, 50), // cap for readability
      files: fileMetas,
    })

    // Check for non-approved models
    // Historical files (before 03042026) may use older models — noted in findings but
    // do not contribute to WARNING severity (they cannot be retroactively re-enriched).
    const MANDATE_DATE = '2026-03-04' // qwen3.5:27b mandate started
    const findings: Finding[] = []
    let hasRecentViolation = false
    for (const f of files) {
      const isHistorical = f.date && f.date < MANDATE_DATE
      if (!f.model) {
        findings.push({
          csv: f.file,
          row: null,
          field: 'enrichment_method',
          value: 'missing',
          message: `Enrichment file "${f.file}" has no model metadata — add frontmatter or comment header`,
        })
      } else if (!APPROVED_MODELS.some((m) => f.model!.includes(m))) {
        if (!isHistorical) {
          hasRecentViolation = true
          findings.push({
            csv: f.file,
            row: null,
            field: 'enrichment_method',
            value: f.model,
            message: `Enrichment file "${f.file}" used model "${f.model}" — must be qwen3.5:27b`,
          })
        }
        // Historical pre-mandate files are noted in the check description but not flagged
        // as findings — they cannot be retroactively re-enriched without a full re-run.
      }
    }

    results.push({
      id: `N19-enrichment-${source.collection}`,
      category: 'enrichment',
      description: `${source.collection} enrichment coverage & model validation`,
      sourceA: 'enrichments',
      sourceB: source.collection,
      severity: hasRecentViolation ? 'ERROR' : findings.length > 0 ? 'WARNING' : 'INFO',
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  return { results, coverage }
}
