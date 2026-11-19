// SPDX-License-Identifier: AGPL-3.0-only

import type { CsvColumnConfig } from '@/utils/csvExport'
import type { PatentItem } from '@/types/PatentTypes'
import { publicationScope, USPTO_PUBLIC_SEARCH } from '@/data/patentFilters'

export type ColumnId =
  | 'num'
  | 'title'
  | 'assignee'
  | 'agility'
  | 'impact'
  | 'issueDate'
  | 'priorityDate'
  | 'pqcAlgorithms'
  | 'classicalAlgorithms'
  | 'quantumRelevance'
  | 'threatModel'
  | 'applicationDomain'
  | 'quantumTechnology'
  | 'impactScore'
  | 'inventors'

export type PresetKey = 'essential' | 'algorithms' | 'full'

export const COLUMN_LABELS: Record<ColumnId, string> = {
  num: '#',
  title: 'Title',
  assignee: 'Assignee',
  agility: 'Crypto Agility',
  impact: 'Impact',
  issueDate: 'Granted / Published',
  priorityDate: 'Priority Date',
  pqcAlgorithms: 'PQC Algorithms',
  classicalAlgorithms: 'Classical Algorithms',
  quantumRelevance: 'Q. Relevance',
  threatModel: 'Threat Model',
  applicationDomain: 'Domain',
  quantumTechnology: 'Quantum Tech',
  impactScore: 'Score',
  inventors: 'Inventors',
}

export const ALL_COLUMN_IDS: ColumnId[] = [
  'num',
  'title',
  'assignee',
  'pqcAlgorithms',
  'classicalAlgorithms',
  'quantumRelevance',
  'threatModel',
  'applicationDomain',
  'agility',
  'impact',
  'issueDate',
  'priorityDate',
  'quantumTechnology',
  'impactScore',
  'inventors',
]

export const COLUMN_PRESETS: Record<PresetKey, ColumnId[]> = {
  essential: ['num', 'title', 'assignee'],
  algorithms: [
    'num',
    'title',
    'assignee',
    'issueDate',
    'pqcAlgorithms',
    'classicalAlgorithms',
    'quantumRelevance',
    'threatModel',
    'applicationDomain',
  ],
  full: [...ALL_COLUMN_IDS],
}

export const COLUMNS_LS_KEY = 'pqc-patents-columns'

// CSV export column config for the patents dataset. Lives here (a pure,
// React-free module) so both the page and its embeds can import it without
// pulling in a view component.
export const PATENTS_CSV_COLUMNS: CsvColumnConfig<PatentItem>[] = [
  { header: 'Patent Number', accessor: (p) => p.patentNumber },
  { header: 'Title', accessor: (p) => p.title },
  { header: 'Assignee', accessor: (p) => p.assignee },
  { header: 'Filing Office', accessor: (p) => p.filingJurisdiction ?? '' },
  { header: 'Filing Application', accessor: (p) => p.filingJurisdictionApplication ?? '' },
  { header: 'Filing Bibliographic Source', accessor: (p) => p.filingJurisdictionSourceUrl ?? '' },
  { header: 'Inventors', accessor: (p) => p.inventors },
  { header: 'Priority Date', accessor: (p) => p.priorityDate },
  {
    header: 'Publication Type',
    accessor: (p) =>
      p.publicationKind === 'published_application' ? 'Published application' : 'Granted patent',
  },
  {
    header: 'USPTO Public Search',
    accessor: (p) => (p.patentNumber.startsWith('US') ? USPTO_PUBLIC_SEARCH : ''),
  },
  { header: 'Current Status Lookup Guidance', accessor: publicationScope },
  { header: 'Filing Date', accessor: (p) => p.filingDate },
  { header: 'Grant or Publication Date', accessor: (p) => p.issueDate },
  { header: 'Crypto Agility', accessor: (p) => p.cryptoAgilityMode },
  { header: 'Quantum Relevance', accessor: (p) => p.quantumRelevance },
  { header: 'Impact Level', accessor: (p) => p.impactLevel },
  { header: 'Impact Score', accessor: (p) => String(p.impactScore) },
  { header: 'PQC Algorithms', accessor: (p) => p.pqcAlgorithms.join('; ') },
  { header: 'Classical Algorithms', accessor: (p) => p.classicalAlgorithms.join('; ') },
  { header: 'Quantum Technology', accessor: (p) => p.quantumTechnology.join('; ') },
  { header: 'Application Domain', accessor: (p) => p.applicationDomain.join('; ') },
  { header: 'Threat Model', accessor: (p) => p.threatModel.join('; ') },
  { header: 'Summary', accessor: (p) => p.summary },
  {
    header: 'PQC Migration Score (1-10)',
    accessor: (p) => (p.pqcMigrationScore == null ? '' : String(p.pqcMigrationScore)),
  },
  { header: 'PQC Migration Reason', accessor: (p) => p.pqcMigrationReason },
  { header: 'Performance Claims', accessor: (p) => p.performanceClaims.join('; ') },
]

// "PQC only" keeps patents that actually involve post-quantum crypto:
// at least one PQC algorithm, or a pqc_only / hybrid crypto-agility mode.
export function isPqcPatent(p: PatentItem): boolean {
  return (
    p.pqcAlgorithms.length > 0 ||
    p.cryptoAgilityMode === 'pqc_only' ||
    p.cryptoAgilityMode === 'hybrid'
  )
}

/** Columns in the order PatentsTable renders them. */
export const COLUMN_ORDER: ColumnId[] = [
  'num',
  'title',
  'assignee',
  'pqcAlgorithms',
  'classicalAlgorithms',
  'quantumRelevance',
  'threatModel',
  'applicationDomain',
  'agility',
  'impact',
  'issueDate',
  'priorityDate',
  'quantumTechnology',
  'impactScore',
  'inventors',
]

/**
 * Fixed widths (px) for every column except Title, which takes the rest.
 * PatentsTable uses fixed layout: only the rows in view are rendered, and auto
 * layout would size columns from whichever rows happen to be on screen. With
 * the default columns at 1440 px the old auto widths left Title about 70 px.
 */
export const COLUMN_WIDTH_PX: Record<Exclude<ColumnId, 'title'>, number> = {
  num: 48,
  assignee: 150,
  pqcAlgorithms: 130,
  classicalAlgorithms: 130,
  quantumRelevance: 105,
  threatModel: 120,
  applicationDomain: 120,
  agility: 110,
  impact: 90,
  issueDate: 115,
  priorityDate: 105,
  quantumTechnology: 130,
  impactScore: 75,
  inventors: 160,
}

/** Title never gets narrower than this; below it the table scrolls sideways. */
export const TITLE_MIN_PX = 240
