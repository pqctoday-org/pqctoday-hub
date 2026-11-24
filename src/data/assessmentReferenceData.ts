// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reference tables the assessment and the threat-industry filters read, held as rows of
 * `pqcassessment_*.csv` (one `category` per kind of row) instead of as tables in code:
 *
 *   category `industry` : one row per site sector. Its `threat_industries` cell lists the
 *                         Threats-page industry labels the sector covers.
 *
 * `INDUSTRY_TO_THREATS_MAP` keeps the CSV's row order, which the Threats page relies on when
 * it names the sector that matches a set of industries.
 */
import { loadLatestCSV, splitSemicolon } from './csvUtils'

interface RawReferenceRow {
  category: string
  id: string
  threat_industries?: string
}

const modules = import.meta.glob('./pqcassessment_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface SiteSectorRow {
  sector: string
  threatIndustries: string[]
}

const { data: siteSectorRows } = loadLatestCSV<RawReferenceRow, SiteSectorRow>(
  modules,
  /pqcassessment_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    if (row.category !== 'industry' || !row.id) return null
    return { sector: row.id, threatIndustries: splitSemicolon(row.threat_industries) }
  }
)

/**
 * Site sector → Threats-page industry labels. The ONE map: the assessment report's threat
 * appendix uses it too. Sectors may share a Threats industry (Legal / Notary sits under both
 * Finance and Government; Payment Card Industry under Finance and Retail).
 */
export const INDUSTRY_TO_THREATS_MAP: Record<string, string[]> = Object.fromEntries(
  siteSectorRows.map((r) => [r.sector, r.threatIndustries])
)
