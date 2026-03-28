// SPDX-License-Identifier: GPL-3.0-only
/**
 * N16: Per-source freshness tracking and staleness detection.
 * Tracks the latest file date for each data source and flags stale ones.
 */
import type { CheckResult, DataSourceMeta, Finding, FreshnessStatus } from './types.js'
import { findLatestCSV, loadCSV, loadStaticCSV, loadJSON, fileMtime, loadEnrichments } from './data-loader.js'

interface SourceConfig {
  key: string
  type: 'csv' | 'static-csv' | 'json' | 'enrichment' | 'ts-file'
  prefix?: string
  filename?: string
  relativePath?: string
  collection?: string
}

const SOURCES: SourceConfig[] = [
  { key: 'library', type: 'csv', prefix: 'library_' },
  { key: 'migrate', type: 'csv', prefix: 'quantum_safe_cryptographic_software_reference_' },
  { key: 'certification_xref', type: 'csv', prefix: 'migrate_certification_xref_' },
  { key: 'timeline', type: 'csv', prefix: 'timeline_' },
  { key: 'compliance', type: 'csv', prefix: 'compliance_' },
  { key: 'leaders', type: 'csv', prefix: 'leaders_' },
  { key: 'threats', type: 'csv', prefix: 'quantum_threats_hsm_industries_' },
  { key: 'quiz', type: 'csv', prefix: 'pqcquiz_' },
  { key: 'algorithms', type: 'csv', prefix: 'pqc_complete_algorithm_reference_' },
  { key: 'algorithm_transitions', type: 'csv', prefix: 'algorithms_transitions_' },
  { key: 'assessment', type: 'csv', prefix: 'pqcassessment_' },
  { key: 'authoritative_sources', type: 'csv', prefix: 'pqc_authoritative_sources_reference_' },
  { key: 'priority_matrix', type: 'static-csv', filename: 'pqc_software_category_priority_matrix.csv' },
  { key: 'compliance_data_json', type: 'json', relativePath: 'public/data/compliance-data.json' },
  { key: 'rag_corpus', type: 'json', relativePath: 'public/data/rag-corpus.json' },
  { key: 'glossary', type: 'ts-file', relativePath: 'src/data/glossaryData.ts' },
  { key: 'enrichments_library', type: 'enrichment', collection: 'library' },
  { key: 'enrichments_timeline', type: 'enrichment', collection: 'timeline' },
  { key: 'enrichments_threats', type: 'enrichment', collection: 'threats' },
]

function daysBetween(dateStr: string, now: Date): number {
  const parts = dateStr.split('-').map(Number)
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function freshnessStatus(staleDays: number, threshold: number): FreshnessStatus {
  if (staleDays <= threshold) return 'current'
  if (staleDays <= threshold * 2) return 'stale'
  return 'critical'
}

export function runFreshnessChecks(staleThreshold = 90): { results: CheckResult[]; dataSources: Record<string, DataSourceMeta> } {
  const now = new Date()
  const timestamp = now.toISOString()
  const dataSources: Record<string, DataSourceMeta> = {}
  const findings: Finding[] = []

  for (const src of SOURCES) {
    let latestFile: string | null = null
    let fileDate: string | null = null
    let recordCount = 0

    switch (src.type) {
      case 'csv': {
        const found = findLatestCSV(src.prefix!)
        if (found) {
          latestFile = found.path.split('/').pop() || null
          fileDate = found.date
          const data = loadCSV(src.prefix!)
          recordCount = data.rows.length
        }
        break
      }
      case 'static-csv': {
        const data = loadStaticCSV(src.filename!)
        latestFile = data.file || null
        fileDate = data.fileDate
        recordCount = data.rows.length
        break
      }
      case 'json': {
        latestFile = src.relativePath!.split('/').pop() || null
        fileDate = fileMtime(src.relativePath!)

        // For rag-corpus.json, try to get generatedAt from content
        if (src.key === 'rag_corpus') {
          try {
            const corpus = loadJSON<{ chunkCount?: number; generatedAt?: string }>(src.relativePath!)
            if (corpus) {
              recordCount = corpus.chunkCount || 0
              if (corpus.generatedAt) {
                const d = new Date(corpus.generatedAt)
                fileDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              }
            }
          } catch { /* use mtime fallback */ }
        } else if (src.key === 'compliance_data_json') {
          try {
            const data = loadJSON<unknown[]>(src.relativePath!)
            if (data) recordCount = data.length
          } catch { /* ok */ }
        }
        break
      }
      case 'enrichment': {
        const { files, allIds } = loadEnrichments(src.collection!)
        recordCount = allIds.size
        if (files.length > 0) {
          const latest = files[files.length - 1]
          latestFile = latest.file
          fileDate = latest.date
        }
        break
      }
      case 'ts-file': {
        latestFile = src.relativePath!.split('/').pop() || null
        fileDate = fileMtime(src.relativePath!)
        break
      }
    }

    const staleDays = fileDate ? daysBetween(fileDate, now) : 999
    const status = freshnessStatus(staleDays, staleThreshold)

    dataSources[src.key] = {
      key: src.key,
      latestFile,
      fileDate,
      recordCount,
      staleDays,
      staleThreshold,
      status,
      lastAuditTimestamp: timestamp,
    }

    if (status === 'critical') {
      findings.push({
        csv: latestFile || src.key, row: null, field: 'fileDate', value: fileDate || 'unknown',
        message: `Data source "${src.key}" is critically stale (${staleDays} days old, threshold: ${staleThreshold * 2})`,
      })
    } else if (status === 'stale') {
      findings.push({
        csv: latestFile || src.key, row: null, field: 'fileDate', value: fileDate || 'unknown',
        message: `Data source "${src.key}" is stale (${staleDays} days old, threshold: ${staleThreshold})`,
      })
    }
  }

  const results: CheckResult[] = [{
    id: 'N16-data-freshness',
    category: 'freshness',
    description: 'Per-source freshness tracking',
    sourceA: 'all',
    sourceB: null,
    severity: findings.some(f => f.message.includes('critically')) ? 'ERROR' : findings.length > 0 ? 'WARNING' : 'INFO',
    status: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  }]

  return { results, dataSources }
}
