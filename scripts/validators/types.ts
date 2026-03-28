// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared types for the unified data integrity validator.
 */

export type Severity = 'ERROR' | 'WARNING' | 'INFO'
export type CheckStatus = 'PASS' | 'FAIL' | 'SKIP'
export type FreshnessStatus = 'current' | 'stale' | 'critical'

export interface Finding {
  csv: string
  row: number | null
  field: string
  value: string
  message: string
}

export interface CheckResult {
  id: string
  category: 'cross-reference' | 'duplicate' | 'url-coverage' | 'local-resource' | 'enrichment' | 'freshness' | 'structure' | 'graph'
  description: string
  sourceA: string
  sourceB: string | null
  severity: Severity
  status: CheckStatus
  findings: Finding[]
}

export interface DataSourceMeta {
  key: string
  latestFile: string | null
  fileDate: string | null
  recordCount: number
  staleDays: number
  staleThreshold: number
  status: FreshnessStatus
  lastAuditTimestamp: string
}

export interface UrlCoverageEntry {
  source: string
  total: number
  withUrl: number
  withoutUrl: number
  coverage: string
  missingUrls: Array<{ id: string; field: string }>
}

export interface LocalResourceEntry {
  directory: string
  expectedFiles: number
  presentFiles: number
  missingFiles: string[]
  orphanedFiles: string[]
  coverage: string
}

export interface EnrichmentFileMeta {
  file: string
  entries: number
  model: string | null
  scriptVersion: string | null
  date: string | null
}

export interface EnrichmentCoverageEntry {
  source: string
  sourceRecords: number
  enrichedRecords: number
  coverage: string
  unenrichedIds: string[]
  files: EnrichmentFileMeta[]
}

export interface IntegrityReport {
  reportVersion: string
  timestamp: string
  dataSources: Record<string, DataSourceMeta>
  summary: {
    totalChecks: number
    checksRun: number
    errors: number
    warnings: number
    info: number
    passed: number
  }
  checkResults: CheckResult[]
  coverageMatrix: Record<string, string[]>
  urlCoverage: UrlCoverageEntry[]
  localResources: LocalResourceEntry[]
  enrichments: EnrichmentCoverageEntry[]
}

/** CSV row as a string-keyed record (from PapaParse header mode). */
export type CsvRow = Record<string, string>

/** Parsed CSV dataset with its source filename. */
export interface CsvDataset {
  rows: CsvRow[]
  file: string
  fileDate: string | null
}
