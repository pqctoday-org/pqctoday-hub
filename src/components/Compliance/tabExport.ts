// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceFramework } from '@/data/complianceData'
import type { ObligationRow } from './obligations/obligationsModel'
import type { ProgressEntry } from './progress/progressModel'
import type { ComplianceMeta, ComplianceRecord } from './types'
import type { RecordScope } from './recordSemantics'
import { buildComplianceCsv } from './recordsExport'
import { csvFilename, generateCsv, type CsvColumnConfig } from '@/utils/csvExport'
import { forYouViewRows, type ForYouViewRow } from './views/forYouSelection'

/**
 * The tabs whose page-level Export CSV exports what the tab shows. Each file name carries
 * the tab's own label: pqc-compliance-<tab label>-<date>.csv.
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

/** The tab label as a file-name slug: For You, Landscape, Rules & Standards, Progress, Product Records. */
const TAB_FILE_SLUG: Record<ExportTab, string> = {
  foryou: 'for-you',
  landscape: 'landscape',
  obligations: 'rules-and-standards',
  progress: 'progress',
  records: 'product-records',
}

export function tabExportFileName(tab: ExportTab, now = new Date()): string {
  return csvFilename(`pqc-compliance-${TAB_FILE_SLUG[tab]}`, now)
}

export interface TabExportInput {
  /** The For You rows for the active persona, as that persona's view lists them (see forYouRowsFor). */
  forYou: ForYouViewRow[]
  /** The landscape rows currently shown (after the landscape's own filters and role set). */
  landscape: ComplianceFramework[]
  /** The Rules & Standards rows, in the order the tab shows them. */
  obligations: ObligationRow[]
  /** The Progress entries for this reader's profile. */
  progress: ProgressEntry[]
  /** The Product Records rows currently shown (after the table's filters and scope). */
  records: ComplianceRecord[]
  meta: ComplianceMeta | null
  scope: RecordScope
  newestRecordDate: Date | null
}

/** The For You rows for the active persona, as that persona's view lists them. */
export function forYouRowsFor(
  persona: string | null | undefined,
  results: Parameters<typeof forYouViewRows>[1],
  derived: Parameters<typeof forYouViewRows>[2]
): ForYouViewRow[] {
  return forYouViewRows(persona, results, derived)
}

const FOR_YOU_COLUMNS: CsvColumnConfig<ForYouViewRow>[] = [
  { header: 'Section', accessor: (r) => r.section },
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
