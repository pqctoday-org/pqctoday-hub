// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reference tables the assessment and the threat-industry filters read, held as rows of
 * `pqcassessment_*.csv` (one `category` per kind of row) instead of as tables in code:
 *
 *   category `industry`  : one row per site sector. Its `threat_industries` cell lists the
 *                          Threats-page industry labels the sector covers; `industry_threat` is
 *                          the sector's base threat score (blank = not offered in the Assess
 *                          step, as for "Cross-cutting & Other").
 *   category `use_case`  : `hndl_relevance`, `migration_priority` and `tnfl_relevance` weights,
 *                          keyed by the row's label.
 *   category `retention` : `scoring_retention_years`, the years the risk score counts for the
 *                          retention id. It is written out for every id, 0 where the score has
 *                          never counted the id, so a blank is never read as a default.
 *   category `algorithm` : `quantum_vulnerable`, `pqc_replacement` and the notes (the
 *                          `description` cell) for an algorithm the Assess step lists.
 *
 * `INDUSTRY_TO_THREATS_MAP` keeps the CSV's row order, which the Threats page relies on when
 * it names the sector that matches a set of industries.
 */
import { loadLatestCSV, splitSemicolon } from './csvUtils'

interface RawReferenceRow {
  category: string
  id: string
  label?: string
  description?: string
  hndl_relevance?: string
  migration_priority?: string
  tnfl_relevance?: string
  scoring_retention_years?: string
  industry_threat?: string
  threat_industries?: string
  quantum_vulnerable?: string
  pqc_replacement?: string
}

const modules = import.meta.glob('./pqcassessment_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

type ReferenceRow =
  | { kind: 'industry'; sector: string; threatIndustries: string[]; threatScore?: number }
  | { kind: 'use_case'; label: string; hndl: number; migration: number; tnfl: number }
  | { kind: 'retention'; id: string; years?: number }
  | { kind: 'algorithm'; name: string; vulnerable: boolean; replacement: string; notes: string }

const num = (v: string | undefined): number | undefined => {
  const s = (v ?? '').trim()
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const { data: rows } = loadLatestCSV<RawReferenceRow, ReferenceRow>(
  modules,
  /pqcassessment_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    if (!row.id) return null
    switch (row.category) {
      case 'industry':
        return {
          kind: 'industry',
          sector: row.id,
          threatIndustries: splitSemicolon(row.threat_industries),
          threatScore: num(row.industry_threat),
        }
      case 'use_case':
        return {
          kind: 'use_case',
          label: row.label || row.id,
          hndl: num(row.hndl_relevance) ?? 5,
          migration: num(row.migration_priority) ?? 5,
          tnfl: num(row.tnfl_relevance) ?? 0,
        }
      case 'retention':
        return { kind: 'retention', id: row.id, years: num(row.scoring_retention_years) }
      case 'algorithm':
        return {
          kind: 'algorithm',
          name: row.id,
          vulnerable: row.quantum_vulnerable?.trim().toLowerCase() === 'yes',
          replacement: row.pqc_replacement ?? '',
          notes: row.description ?? '',
        }
      default:
        return null
    }
  }
)

const ofKind = <K extends ReferenceRow['kind']>(kind: K) =>
  rows.filter((r): r is Extract<ReferenceRow, { kind: K }> => r.kind === kind)

/**
 * Site sector → Threats-page industry labels. The ONE map: the assessment report's threat
 * appendix uses it too. Sectors may share a Threats industry (Legal / Notary sits under both
 * Finance and Government; Payment Card Industry under Finance and Retail).
 */
export const INDUSTRY_TO_THREATS_MAP: Record<string, string[]> = Object.fromEntries(
  ofKind('industry').map((r) => [r.sector, r.threatIndustries])
)

/** Base threat score of each sector the Assess step offers (rows with a score only). */
export const INDUSTRY_THREAT: Record<string, number> = Object.fromEntries(
  ofKind('industry')
    .filter((r) => r.threatScore !== undefined)
    .map((r) => [r.sector, r.threatScore as number])
)

/** Use-case label → relevance weights. */
export const USE_CASE_WEIGHTS: Record<
  string,
  { hndlRelevance: number; migrationPriority: number; tnflRelevance: number }
> = Object.fromEntries(
  ofKind('use_case').map((r) => [
    r.label,
    { hndlRelevance: r.hndl, migrationPriority: r.migration, tnflRelevance: r.tnfl },
  ])
)

/** Retention id → years the risk score counts. */
export const DATA_RETENTION_YEARS: Record<string, number> = Object.fromEntries(
  ofKind('retention')
    .filter((r) => r.years !== undefined)
    .map((r) => [r.id, r.years as number])
)

/** Algorithm name → quantum vulnerability, replacement and notes. */
export const ALGORITHM_DB: Record<
  string,
  { quantumVulnerable: boolean; replacement: string; notes: string }
> = Object.fromEntries(
  ofKind('algorithm').map((r) => [
    r.name,
    { quantumVulnerable: r.vulnerable, replacement: r.replacement, notes: r.notes },
  ])
)
