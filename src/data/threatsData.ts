// SPDX-License-Identifier: GPL-3.0-only
import Papa from 'papaparse'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitPipe, parseIntSafe } from './csvUtils'

export interface ThreatData {
  industry: string
  threatId: string
  description: string
  criticality: 'Critical' | 'High' | 'Medium' | 'Medium-High' | 'Low'
  cryptoAtRisk: string
  pqcReplacement: string
  mainSource: string
  sourceUrl: string
  accuracyPct?: number
  relatedModules: string[]
  peerReviewed?: 'yes' | 'no' | 'partial'
  vettingBody?: string[]
  status?: 'New' | 'Updated'
}

export type ThreatItem = ThreatData

interface RawThreatRow {
  industry: string
  threat_id: string
  threat_description: string
  criticality: string
  crypto_at_risk: string
  pqc_replacement: string
  main_source: string
  source_url: string
  accuracy_pct: string
  related_modules: string
  trusted_source_id: string
  local_file: string
  peer_reviewed: string
  vetting_body: string
}

const modules = import.meta.glob('./quantum_threats_hsm_industries_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function transformThreat(row: RawThreatRow): ThreatData {
  const pct = parseIntSafe(row.accuracy_pct)
  return {
    industry: row.industry || '',
    threatId: row.threat_id || '',
    description: row.threat_description || '',
    criticality: (row.criticality as ThreatData['criticality']) || 'Medium',
    cryptoAtRisk: row.crypto_at_risk || '',
    pqcReplacement: row.pqc_replacement || '',
    mainSource: row.main_source || '',
    sourceUrl: row.source_url || '',
    accuracyPct: pct || undefined,
    relatedModules: splitPipe(row.related_modules),
    peerReviewed: (row.peer_reviewed?.toLowerCase() as ThreatData['peerReviewed']) || undefined,
    vettingBody: row.vetting_body
      ? row.vetting_body
          .split(';')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined,
  }
}

const {
  data: currentItems,
  previousData: previousItems,
  metadata,
} = loadLatestCSV<RawThreatRow, ThreatData>(
  modules,
  /quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  transformThreat,
  true // withPrevious for status badges
)

// Compute status map
const statusMap = previousItems
  ? compareDatasets(currentItems, previousItems, 'threatId')
  : new Map<string, ItemStatus>()

// Inject status
export const threatsData: ThreatData[] = currentItems.map((item) => ({
  ...item,
  status: statusMap.get(item.threatId),
}))

export const threatsMetadata = metadata

export const THREATS_COUNT = threatsData.length

// Standalone CSV parser for use by tests and RAG corpus generator
export function parseThreatsCSV(csvContent: string): ThreatData[] {
  if (!csvContent.trim()) return []
  const { data } = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return (data as RawThreatRow[]).map(transformThreat)
}
