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
  sourceUrlQuality?: string
  /** The trusted-sources registry id backing this record. Present on 107 of 114
   *  active rows; parsed from the CSV since 2026-08-10 (B+ remediation 4.3) so
   *  `evidenceStrength` can weigh "who says this" rather than only how
   *  confident the extraction was. */
  trustedSourceId?: string
  trustedSourceIdStatus?: string
  dataQualityNotes?: string
  confidenceScore?: number
  applicableIndustriesNormalized?: string[]
  lastVerified?: string
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
  source_url_quality: string
  trusted_source_id_status: string
  data_quality_notes: string
  confidence_score?: string
  last_verified?: string
  applicable_industries_normalized?: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const modules = import.meta.glob('./quantum_threats_hsm_industries_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/**
 * Collapses near-duplicate raw `industry` labels that describe the same
 * sector under different CSV wording — verified against the corpus's own
 * `applicable_industries_normalized` tags, which tag both "Critical
 * Infrastructure" and "Energy / Critical Infrastructure" rows with the same
 * `critical-infrastructure` tag (Threats #5). Extend this map, driven by that
 * same tag evidence, if a future CSV snapshot introduces another wording
 * variant of an already-covered sector.
 */
const INDUSTRY_ALIASES: Record<string, string> = {
  'Critical Infrastructure': 'Critical Infrastructure / Energy',
  'Energy / Critical Infrastructure': 'Critical Infrastructure / Energy',
  'Critical Infrastructure / Energy': 'Critical Infrastructure / Energy',
}

function canonicalIndustry(raw: string): string {
  return INDUSTRY_ALIASES[raw] ?? raw
}

function transformThreat(row: RawThreatRow): ThreatData | null {
  if (row.status === 'deprecated' || row.status === 'obsolete') return null
  const pct = parseIntSafe(row.accuracy_pct)
  return {
    industry: canonicalIndustry(row.industry || ''),
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
    sourceUrlQuality: row.source_url_quality || undefined,
    trustedSourceId: row.trusted_source_id || undefined,
    trustedSourceIdStatus: row.trusted_source_id_status || undefined,
    dataQualityNotes: row.data_quality_notes || undefined,
    confidenceScore: row.confidence_score ? Number(row.confidence_score) : undefined,
    lastVerified: row.last_verified || undefined,
    applicableIndustriesNormalized: row.applicable_industries_normalized
      ? row.applicable_industries_normalized
          .split(';')
          .map((s) => s.trim())
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
  return (data as RawThreatRow[]).map(transformThreat).filter((r): r is ThreatData => r !== null)
}

/**
 * How well-evidenced a threat record is, 0–100 — B+ remediation 4.3
 * (2026-08-10). Composed only of fields the corpus actually carries, and
 * weighted the way the rest of the site weights evidence: who says it and
 * whether it was reviewed outrank how confident the extraction was.
 *
 * A record missing a field scores zero for that component rather than being
 * excluded or imputed — "we don't know" must sort below "we checked", never
 * above it.
 */
export function evidenceStrength(threat: ThreatItem): number {
  const peer = threat.peerReviewed === 'yes' ? 40 : threat.peerReviewed === 'partial' ? 20 : 0
  const sourced = threat.trustedSourceId?.trim() ? 25 : 0
  const confidence = Math.min(20, ((threat.confidenceScore ?? 0) / 100) * 20)
  const accuracy = Math.min(15, ((threat.accuracyPct ?? 0) / 100) * 15)
  return Math.round(peer + sourced + confidence + accuracy)
}
