// SPDX-License-Identifier: GPL-3.0-only
/**
 * N17: URL source validation — every record should have at least one valid URL.
 */
import type { CheckResult, Finding, UrlCoverageEntry } from './types.js'
import { loadCSV, isValidUrl } from './data-loader.js'

interface UrlCheckConfig {
  source: string
  prefix: string
  idField: string
  urlFields: string[]
  /** If true, at least one URL field must be non-empty (OR logic). If false, all must be valid. */
  anyOneSuffices: boolean
}

const URL_CONFIGS: UrlCheckConfig[] = [
  {
    source: 'library',
    prefix: 'library_',
    idField: 'reference_id',
    urlFields: ['download_url'],
    anyOneSuffices: false,
  },
  {
    source: 'timeline',
    prefix: 'timeline_',
    idField: 'Title',
    urlFields: ['SourceUrl'],
    anyOneSuffices: false,
  },
  {
    source: 'compliance',
    prefix: 'compliance_',
    idField: 'id',
    urlFields: ['website'],
    anyOneSuffices: false,
  },
  {
    source: 'threats',
    prefix: 'quantum_threats_hsm_industries_',
    idField: 'threat_id',
    urlFields: ['source_url'],
    anyOneSuffices: false,
  },
  {
    source: 'leaders',
    prefix: 'leaders_',
    idField: 'Name',
    urlFields: ['WebsiteUrl', 'LinkedinUrl'],
    anyOneSuffices: true,
  },
  {
    source: 'migrate',
    prefix: 'pqc_product_catalog_',
    idField: 'software_name',
    urlFields: ['authoritative_source', 'repository_url'],
    anyOneSuffices: true,
  },
  {
    source: 'authoritative_sources',
    prefix: 'pqc_authoritative_sources_reference_',
    idField: 'Source_Name',
    urlFields: ['Primary_URL'],
    anyOneSuffices: false,
  },
]

export function runUrlCoverageChecks(): { results: CheckResult[]; coverage: UrlCoverageEntry[] } {
  const results: CheckResult[] = []
  const coverage: UrlCoverageEntry[] = []

  for (const config of URL_CONFIGS) {
    const data = loadCSV(config.prefix)
    if (data.rows.length === 0) continue

    const findings: Finding[] = []
    const missing: Array<{ id: string; field: string }> = []
    let withUrl = 0
    let withoutUrl = 0

    data.rows.forEach((row, i) => {
      const id = row[config.idField] || `row-${i + 2}`
      const urls = config.urlFields.map((f) => row[f]?.trim()).filter(Boolean)

      if (config.anyOneSuffices) {
        if (urls.length === 0) {
          withoutUrl++
          missing.push({ id, field: config.urlFields.join(' | ') })
          findings.push({
            csv: data.file,
            row: i + 2,
            field: config.urlFields.join('|'),
            value: '',
            message: `${config.source} "${id}" has no URL in any of: ${config.urlFields.join(', ')}`,
          })
        } else {
          // Check syntax of present URLs
          const valid = urls.some((u) => isValidUrl(u))
          if (valid) withUrl++
          else {
            withoutUrl++
            findings.push({
              csv: data.file,
              row: i + 2,
              field: config.urlFields.join('|'),
              value: urls[0],
              message: `${config.source} "${id}" has URLs but none are syntactically valid`,
            })
          }
        }
      } else {
        const url = urls[0]
        if (!url) {
          withoutUrl++
          missing.push({ id, field: config.urlFields[0] })
        } else if (!isValidUrl(url)) {
          withoutUrl++
          findings.push({
            csv: data.file,
            row: i + 2,
            field: config.urlFields[0],
            value: url,
            message: `${config.source} "${id}" has invalid URL: "${url}"`,
          })
        } else {
          withUrl++
        }
      }
    })

    const total = data.rows.length
    const pct = total > 0 ? ((withUrl / total) * 100).toFixed(1) : '0.0'

    coverage.push({
      source: config.source,
      total,
      withUrl,
      withoutUrl,
      coverage: `${pct}%`,
      missingUrls: missing,
    })

    results.push({
      id: `N17-url-${config.source}`,
      category: 'url-coverage',
      description: `${config.source} URL coverage check`,
      sourceA: config.source,
      sourceB: null,
      severity: 'WARNING',
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
    })
  }

  return { results, coverage }
}
