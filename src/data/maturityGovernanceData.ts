// SPDX-License-Identifier: GPL-3.0-only
/**
 * Loads and merges ALL pqc_maturity_governance_requirements_*.csv files.
 * Unlike standard loaders that pick only the latest file, the maturity corpus
 * spans multiple run dates (each enrichment script appends to the date it ran).
 * Deduplication key: ref_id + pillar + maturity_level + requirement[:60].
 */
import Papa from 'papaparse'
import type { MaturityRequirement, MaturityCategory } from '@/types/MaturityTypes'
import { parseIntSafe } from './csvUtils'

interface RawMaturityRow {
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

for (const content of Object.values(modules)) {
  if (typeof content !== 'string') continue
  const { data } = Papa.parse<RawMaturityRow>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  for (const row of data) {
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
