// SPDX-License-Identifier: GPL-3.0-only

import type { CsvColumnConfig } from '@/utils/csvExport'
import type { PatentItem } from '@/types/PatentTypes'

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
  issueDate: 'Issue Date',
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
  { header: 'Inventors', accessor: (p) => p.inventors },
  { header: 'Priority Date', accessor: (p) => p.priorityDate },
  { header: 'Issue Date', accessor: (p) => p.issueDate },
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
