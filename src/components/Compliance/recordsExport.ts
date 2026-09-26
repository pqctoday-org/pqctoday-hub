// SPDX-License-Identifier: GPL-3.0-only
/**
 * CSV export for certification records. Every export carries the dataset
 * scope and the record scope the reader chose (current only vs. including
 * historical / archived), so a downloaded file cannot be mistaken for a
 * complete list of every validated product.
 */
import { generateCsv } from '@/utils/csvExport'
import { COMPLIANCE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import type { ComplianceMeta, ComplianceRecord } from './types'
import {
  applyRecordScope,
  formatIsoDate,
  scopeNotice,
  snapshotRetrievalEntries,
  type RecordScope,
} from './recordSemantics'

/** A preamble line as ONE CSV field (quoted when it contains a delimiter). */
function preambleLine(text: string): string {
  const line = `# ${text}`
  return /[",\n\r]/.test(line) ? `"${line.replace(/"/g, '""')}"` : line
}

export function complianceExportPreamble(
  meta: ComplianceMeta | null | undefined,
  scope: RecordScope,
  newestRecordDate?: Date | null
): string[] {
  const lines = [
    'PQC Today certification records export',
    `Dataset scope: ${scopeNotice(meta)}`,
    scope === 'all'
      ? 'Records: current and historical / archived / revoked'
      : 'Records: current only (status Active or Validated)',
    'PQC names on Common Criteria / EUCC / CSPN rows are named in the Security Target, not validated PQC support.',
  ]
  const retrieval = snapshotRetrievalEntries(meta)
  if (retrieval.length > 0) {
    lines.push(`Snapshot retrieved: ${retrieval.map((e) => `${e.label} ${e.date}`).join('; ')}`)
  }
  if (newestRecordDate) {
    lines.push(`Newest record date: ${formatIsoDate(newestRecordDate.toISOString())}`)
  }
  if (meta?.publicationId) lines.push(`Publication: ${meta.publicationId}`)
  return lines.map(preambleLine)
}

/**
 * Builds the export: scope preamble, then the records filtered to `scope`
 * (callers that already applied the scope may pass 'all' records through —
 * filtering twice is harmless).
 */
export function buildComplianceCsv(
  records: readonly ComplianceRecord[],
  options: { meta?: ComplianceMeta | null; scope: RecordScope; newestRecordDate?: Date | null }
): string {
  const scoped = applyRecordScope(records, options.scope)
  const preamble = complianceExportPreamble(options.meta, options.scope, options.newestRecordDate)
  return [...preamble, generateCsv(scoped, COMPLIANCE_CSV_COLUMNS)].join('\n')
}
