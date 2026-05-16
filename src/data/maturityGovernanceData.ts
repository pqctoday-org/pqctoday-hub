// SPDX-License-Identifier: GPL-3.0-only
/**
 * Loads and merges ALL pqc_maturity_governance_requirements_*.csv files.
 * Unlike standard loaders that pick only the latest file, the maturity corpus
 * spans multiple run dates (each enrichment script appends to the date it ran).
 * Deduplication key: ref_id + pillar + maturity_level + requirement[:60].
 *
 * Iteration order: filename DESCENDING so the most recent revision wins on
 * dedup-key collisions. Enrichment runs that *replace* an earlier paraphrase
 * (e.g. the 2026-05-15 audit fixes in *_r1.csv) must shadow the older row, not
 * be shadowed by it. Pure additions (new tier behaviours, new sources) still
 * load regardless of order since they don't share dedup keys with prior rows.
 */
import Papa from 'papaparse'
import type { MaturityRequirement, MaturityCategory } from '@/types/MaturityTypes'
import { parseIntSafe } from './csvUtils'
import { filterActive, type RowWithStatus } from './loaderUtils'

interface RawMaturityRow extends RowWithStatus {
  ref_id: string
  source_name: string
  category: string
  source_type: string
  pillar: string
  maturity_level: string
  asset_class: string
  requirement: string
  evidence_quote: string
  evidence_location: string
  source_url: string
  confidence: string
  extraction_model: string
  extraction_date: string
}

const VALID_PILLARS = new Set([
  'inventory',
  'governance',
  'lifecycle',
  'observability',
  'assurance',
])
const VALID_LEVELS = new Set([1, 2, 3, 4])
const VALID_CATEGORIES = new Set<MaturityCategory>([
  'Technical Standards',
  'Certification Schemes',
  'Compliance Frameworks',
  'Standardization Bodies',
])

const modules = import.meta.glob('./pqc_maturity_governance_requirements_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const seen = new Set<string>()
const merged: MaturityRequirement[] = []

// Iterate in filename DESCENDING order so newer revisions win on dedup-key
// collisions (e.g. *_r1 > base file > previous month's file).
const orderedEntries = Object.entries(modules).sort(([a], [b]) => b.localeCompare(a))
for (const [, content] of orderedEntries) {
  if (typeof content !== 'string') continue
  const { data } = Papa.parse<RawMaturityRow>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  for (const row of filterActive(data)) {
    const level = parseIntSafe(row.maturity_level)
    const pillar = row.pillar?.trim() ?? ''
    const category = row.category?.trim() ?? ''
    if (!VALID_PILLARS.has(pillar) || !VALID_LEVELS.has(level)) continue
    const key = `${row.ref_id}|${pillar}|${level}|${(row.requirement ?? '').slice(0, 60)}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push({
      refId: row.ref_id?.trim() ?? '',
      sourceName: row.source_name?.trim() ?? '',
      category: (VALID_CATEGORIES.has(category as MaturityCategory)
        ? category
        : 'Standardization Bodies') as MaturityCategory,
      sourceType: row.source_type?.trim() ?? '',
      pillar: pillar as MaturityRequirement['pillar'],
      maturityLevel: level as MaturityRequirement['maturityLevel'],
      assetClass: (row.asset_class?.trim() || 'all') as MaturityRequirement['assetClass'],
      requirement: row.requirement?.trim() ?? '',
      evidenceQuote: row.evidence_quote?.trim() ?? '',
      evidenceLocation: row.evidence_location?.trim() ?? '',
      sourceUrl: row.source_url?.trim() ?? '',
      confidence: (row.confidence?.trim() as MaturityRequirement['confidence']) || 'medium',
      extractionModel: row.extraction_model?.trim() ?? '',
      extractionDate: row.extraction_date?.trim() ?? '',
    })
  }
}

export const maturityRequirements: MaturityRequirement[] = merged

/** O(1) lookup: library ref_id → all requirements from that source */
export const maturityByRefId = new Map<string, MaturityRequirement[]>()
for (const req of merged) {
  const arr = maturityByRefId.get(req.refId) ?? []
  arr.push(req)
  maturityByRefId.set(req.refId, arr)
}
