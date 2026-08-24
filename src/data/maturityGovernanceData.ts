// SPDX-License-Identifier: GPL-3.0-only
/**
 * Loads and merges ALL pqc_maturity_governance_requirements_*.csv files.
 * Unlike standard loaders that pick only the latest file, the maturity corpus
 * spans multiple run dates (each enrichment script appends to the date it ran).
 * Deduplication key: ref_id + pillar + maturity_level + requirement[:60].
 *
 * Iteration order: BASENAME descending so the most recent revision wins on
 * dedup-key collisions. Enrichment runs that *replace* an earlier paraphrase
 * (e.g. the 2026-05-15 audit fixes in *_r1.csv) must shadow the older row, not
 * be shadowed by it. Pure additions (new tier behaviours, new sources) still
 * load regardless of order since they don't share dedup keys with prior rows.
 *
 * ⚠️  THIS SOURCE IS EXEMPT FROM THE `src/data/archive/` CONVENTION.
 * Everywhere else in src/data, "latest dated file wins, move the older ones to
 * archive/" is correct, because those loaders read only the newest file. Here
 * older files are ADDITIVE, not superseded — each enrichment run appends a new
 * dated file covering *different documents*. Archiving one deletes its
 * documents from the app.
 *
 * That is not hypothetical: the 2026-07-26 archival sweep (v4.27.0, 1a18b2830)
 * moved pqc_maturity_governance_requirements_05152026.csv into archive/, and
 * because the glob below does not descend into subdirectories, the corpus
 * silently collapsed from 189 documents / 1,382 requirements to 1 / 50. No
 * build error, no failing test. Every CSWP.39 surface (compliance drawer +
 * tiles, library popover, agility explorer) degraded for 12 days.
 *
 * So we deliberately glob BOTH directories. Two guards catch a repeat, and
 * neither is in maturityModel.test.ts — that file tests deriveMaturity() and
 * imports nothing from this loader (an earlier version of this comment pointed
 * there, which sent readers looking for a floor test that does not exist):
 *   - complianceData.test.ts asserts the corpus floors (maturityByRefId.size
 *     and maturityRequirements.length) against this loader's real output.
 *   - scripts/audit-merge-all-coverage.ts re-derives the globs below and fails
 *     if any on-disk file is unreachable by them. It runs in CI.
 * Do not "tidy" the archive glob away.
 */
import Papa from 'papaparse'
import type { MaturityRequirement, MaturityCategory } from '@/types/MaturityTypes'
import { parseIntSafe } from './csvUtils'
import { type RowWithStatus } from './loaderUtils'

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

// Two explicit globs rather than one clever pattern: `*` does not cross `/`, and
// spelling both directories out states the intent that archive/ is IN scope here.
const modules = {
  ...import.meta.glob('./pqc_maturity_governance_requirements_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('./archive/pqc_maturity_governance_requirements_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
}

const seen = new Set<string>()
const merged: MaturityRequirement[] = []

// Iterate in BASENAME descending order so newer revisions win on dedup-key
// collisions (e.g. *_r1 > base file > previous month's file). Compare basenames,
// not full paths — otherwise './archive/..._05152026.csv' would sort above
// './..._07192026.csv' purely because of the directory prefix, and a stale
// paraphrase would shadow the row that was meant to replace it.
//
// CODE-UNIT comparison, NOT localeCompare. This line used localeCompare until
// 2026-08-23, which silently inverted the one ordering the comment above
// promises: localeCompare treats '_' as ignorable punctuation, so it collates
// '..._08232026_r1.csv' BELOW '..._08232026.csv' and the _r1 revision lost every
// dedup-key collision to the file it was written to correct. Caught when four
// eIDAS rows deprecated in an _r1 generation kept loading as active. Measured
// across both merge-all families at the time of the fix, the change moved
// exactly those four rows and nothing else (2026 active rows -> 2022).
const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1)
const orderedEntries = Object.entries(modules).sort(([a], [b]) => {
  const x = basename(a)
  const y = basename(b)
  return x < y ? 1 : x > y ? -1 : 0
})
for (const [, content] of orderedEntries) {
  if (typeof content !== 'string') continue
  const { data } = Papa.parse<RawMaturityRow>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  // NOT filterActive(data) here. That call, on the whole array before the
  // loop, silently defeats the supersession this loop exists to do: a
  // deprecated row would be dropped before it ever reaches `seen`, so it
  // could never suppress an active row with the same key sitting in an
  // OLDER file — precisely the "stale paraphrase shadows the row that was
  // meant to replace it" failure the comment above already names. A row is
  // now filtered for activeness per-row, AFTER it claims its key, so a
  // deprecated row in a newer file still consumes the key and correctly
  // blocks the older active duplicate underneath it from loading.
  for (const row of data) {
    const level = parseIntSafe(row.maturity_level)
    const pillar = row.pillar?.trim() ?? ''
    const category = row.category?.trim() ?? ''
    if (!VALID_PILLARS.has(pillar) || !VALID_LEVELS.has(level)) continue
    const key = `${row.ref_id}|${pillar}|${level}|${(row.requirement ?? '').slice(0, 60)}`
    if (seen.has(key)) continue
    seen.add(key)
    if (row.status && row.status !== 'active') continue
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
