// SPDX-License-Identifier: AGPL-3.0-only
import type { ApplicabilityResult } from '@/utils/applicabilityEngine'
import type { DerivedResult } from '@/utils/trustPathTraversal'
import type { ComplianceFramework } from '@/data/complianceData'
import type { ObligationRow } from './obligations/obligationsModel'
import type { ProgressEntry } from './progress/progressModel'
import type { ComplianceMeta, ComplianceRecord } from './types'
import type { RecordScope } from './recordSemantics'
import { buildComplianceCsv } from './recordsExport'
import { csvFilename, generateCsv, type CsvColumnConfig } from '@/utils/csvExport'

/**
 * The tabs whose page-level Export CSV exports what the tab shows. Each file name
 * carries the tab name and the reader's date: pqc-compliance-<tab>-<date>.csv.
 */
export type ExportTab = 'foryou' | 'landscape' | 'obligations' | 'progress' | 'records'

export function exportTabFor(stableTab: string): ExportTab | undefined {
  switch (stableTab) {
    case 'foryou':
    case 'landscape':
    case 'obligations':
    case 'progress':
    case 'records':
      return stableTab
    default:
      return undefined
  }
}

export function tabExportFileName(tab: ExportTab, now = new Date()): string {
  return csvFilename(`pqc-compliance-${tab}`, now)
}

export interface TabExportInput {
  /** The For You tab's rows: applicable frameworks, then the trust-path-derived ones (see forYouRows). */
  forYou: ForYouExportRow[]
  /** The landscape rows currently shown (after the landscape's own filters). */
  landscape: ComplianceFramework[]
  /** The Rules & Standards rows for this reader's profile. */
  obligations: ObligationRow[]
  /** The Progress entries for this reader's profile. */
  progress: ProgressEntry[]
  /** The Product Records rows currently shown (after the table's filters and scope). */
  records: ComplianceRecord[]
  meta: ComplianceMeta | null
  scope: RecordScope
  newestRecordDate: Date | null
}

/** One For You row, as the tab lists it. */
export interface ForYouExportRow {
  id: string
  label: string
  tier: string
  reason: string
  bindingStatus?: string
  deadline?: string
  confidenceScore?: number
  trustedSource?: string
}

/**
 * The For You rows: the applicable frameworks, then the frameworks the trust paths reach
 * from them (the tab's "derived" section), each with its tier and reason.
 */
export function forYouRows(
  applicable: ApplicabilityResult<ComplianceFramework>[],
  derived: DerivedResult[]
): ForYouExportRow[] {
  const direct: ForYouExportRow[] = applicable.map((r) => ({
    id: r.item.id,
    label: r.item.label,
    tier: r.tier,
    reason: r.reason,
    bindingStatus: r.item.bindingStatus,
    deadline: r.item.deadline,
    confidenceScore: r.item.confidenceScore,
    trustedSource: r.item.trustedSourceId,
  }))
  const reached: ForYouExportRow[] = derived.map((d) => ({
    id: d.standardId,
    label: d.standardLabel,
    tier: d.derivedTier,
    reason: 'Reached through a trust path from your applicable frameworks',
  }))
  return [...direct, ...reached]
}

const FOR_YOU_COLUMNS: CsvColumnConfig<ForYouExportRow>[] = [
  { header: 'Framework ID', accessor: (r) => r.id },
  { header: 'Framework', accessor: (r) => r.label },
  { header: 'Applicability tier', accessor: (r) => r.tier },
  { header: 'Reason', accessor: (r) => r.reason },
  { header: 'Binding status', accessor: (r) => r.bindingStatus },
  { header: 'Deadline', accessor: (r) => r.deadline },
  { header: 'Data confidence', accessor: (r) => r.confidenceScore },
  { header: 'Trusted source', accessor: (r) => r.trustedSource },
]

const LANDSCAPE_COLUMNS: CsvColumnConfig<ComplianceFramework>[] = [
  { header: 'Framework ID', accessor: (f) => f.id },
  { header: 'Framework', accessor: (f) => f.label },
  { header: 'Body type', accessor: (f) => f.bodyType },
  { header: 'Countries', accessor: (f) => f.countries.join('; ') },
  { header: 'Deadline', accessor: (f) => f.deadline },
  { header: 'PQC requirement', accessor: (f) => f.pqcRequirement },
  { header: 'Binding status', accessor: (f) => f.bindingStatus },
  { header: 'Enforcement body', accessor: (f) => f.enforcementBody },
]

const OBLIGATION_COLUMNS: CsvColumnConfig<ObligationRow>[] = [
  { header: 'Framework ID', accessor: (r) => r.framework.id },
  { header: 'Framework', accessor: (r) => r.framework.label },
  { header: 'Applicability tier', accessor: (r) => r.tier },
  { header: 'Reason', accessor: (r) => r.reason },
  { header: 'Binding status', accessor: (r) => r.framework.bindingStatus },
  { header: 'Countries', accessor: (r) => r.framework.countries.join('; ') },
  { header: 'Requirements', accessor: (r) => r.requirementCount },
  {
    header: 'Milestones',
    accessor: (r) => r.milestones.map((m) => `${m.year}: ${m.label}`).join('; '),
  },
]

const PROGRESS_COLUMNS: CsvColumnConfig<ProgressEntry>[] = [
  { header: 'Framework ID', accessor: (e) => e.framework.id },
  { header: 'Framework', accessor: (e) => e.framework.label },
  { header: 'Progress group', accessor: (e) => e.bucket },
  { header: 'Milestone year', accessor: (e) => e.year },
  { header: 'Milestone', accessor: (e) => e.label },
  { header: 'Deadline text', accessor: (e) => e.framework.deadline },
]

/** The CSV for one tab: its own rows, with the same content the tab lists. */
export function buildTabCsv(tab: ExportTab, input: TabExportInput): string {
  switch (tab) {
    case 'foryou':
      return generateCsv(input.forYou, FOR_YOU_COLUMNS)
    case 'landscape':
      return generateCsv(input.landscape, LANDSCAPE_COLUMNS)
    case 'obligations':
      return generateCsv(input.obligations, OBLIGATION_COLUMNS)
    case 'progress':
      return generateCsv(input.progress, PROGRESS_COLUMNS)
    case 'records':
      return buildComplianceCsv(input.records, {
        meta: input.meta,
        scope: input.scope,
        newestRecordDate: input.newestRecordDate,
      })
  }
}
