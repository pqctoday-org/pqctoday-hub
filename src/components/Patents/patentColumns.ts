// SPDX-License-Identifier: GPL-3.0-only

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
    'pqcAlgorithms',
    'classicalAlgorithms',
    'quantumRelevance',
    'threatModel',
    'applicationDomain',
  ],
  full: [...ALL_COLUMN_IDS],
}

export const COLUMNS_LS_KEY = 'pqc-patents-columns'
