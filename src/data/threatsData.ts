// SPDX-License-Identifier: GPL-3.0-only
import Papa from 'papaparse'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'
import { loadLatestCSV, splitPipe, parseIntSafe } from './csvUtils'
import {
  canonicalThreatIndustry,
  isPublishedThreatStatus,
  isRetiredThreatStatus,
  UNRATED_CRITICALITY,
} from './threatRowRules'

export interface ThreatData {
  industry: string
  threatId: string
  description: string
  /** 'Unrated' when the CSV cell is blank — shown as such, never guessed. */
  criticality: 'Critical' | 'High' | 'Medium' | 'Medium-High' | 'Low' | 'Unrated'
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
  /** Approved second sources (library referenceIds) and the claim columns
   *  each one states — from `secondary_source_ref` + `secondary_claims`,
   *  written only by an approved second-source review item (2026-09-24). */
  secondarySources?: SecondarySource[]
}

export interface SecondarySource {
  /** Library referenceId, e.g. "RFC 7935". */
  ref: string
  /** Claim columns it states: threat_description | crypto_at_risk | pqc_replacement. */
  claims: string[]
}

/**
 * `secondary_claims` is either plain columns ("threat_description") when the
 * row has one second source, or `column@ref` pairs when claims rest on
 * different documents ("crypto_at_risk@RFC 6605;pqc_replacement@draft-x-00").
 * Both are ';'-separated. A pair naming a ref the row does not list is kept
 * out rather than guessed onto another source.
 */
export function parseSecondarySources(refCell?: string, claimsCell?: string): SecondarySource[] {
  const refs = (refCell ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  if (refs.length === 0) return []
  const parts = (claimsCell ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  const byRef = new Map<string, string[]>(refs.map((r) => [r, []]))
  for (const part of parts) {
    const at = part.indexOf('@')
    if (at < 0) {
      if (refs.length === 1) byRef.get(refs[0])?.push(part)
      continue
    }
    byRef.get(part.slice(at + 1).trim())?.push(part.slice(0, at).trim())
  }
  return refs.map((ref) => ({ ref, claims: byRef.get(ref) ?? [] }))
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
  secondary_source_ref?: string
  secondary_claims?: string
}

const THREATS_FILE_RE = /quantum_threats_hsm_industries_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

const modules = import.meta.glob('./quantum_threats_hsm_industries_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function transformThreat(row: RawThreatRow): ThreatData | null {
  // Retired (deprecated/obsolete) and not-yet-filled (draft) rows never reach
  // the page — one predicate shared with the RAG corpus generator.
  if (!isPublishedThreatStatus(row.status)) return null
  const pct = parseIntSafe(row.accuracy_pct)
  return {
    industry: canonicalThreatIndustry(row.industry || ''),
    threatId: row.threat_id || '',
    description: row.threat_description || '',
    criticality: (row.criticality?.trim() as ThreatData['criticality']) || UNRATED_CRITICALITY,
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
    secondarySources: (() => {
      const found = parseSecondarySources(row.secondary_source_ref, row.secondary_claims)
      return found.length ? found : undefined
    })(),
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
  THREATS_FILE_RE,
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

/** A retired (deprecated/obsolete) threat: just enough to tell a reader who
 *  follows an old link what happened to it. */
export interface RetiredThreat {
  threatId: string
  deprecatedAt?: string
  deprecatedReason?: string
}

function transformRetired(row: RawThreatRow): RetiredThreat | null {
  if (!isRetiredThreatStatus(row.status) || !row.threat_id) return null
  return {
    threatId: row.threat_id,
    deprecatedAt: row.deprecated_at?.trim() || undefined,
    deprecatedReason: row.deprecated_reason?.trim() || undefined,
  }
}

/** Retired rows of the latest snapshot, by id — so `/threats?id=<retired>`
 *  can say the entry was retired instead of silently showing nothing. */
export const retiredThreats: ReadonlyMap<string, RetiredThreat> = new Map(
  loadLatestCSV<RawThreatRow, RetiredThreat>(modules, THREATS_FILE_RE, transformRetired).data.map(
    (r) => [r.threatId, r]
  )
)

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
