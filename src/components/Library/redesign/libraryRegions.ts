// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library `region_scope` tokens → one canonical code and a reader-facing label.
 *
 * The catalogue mixes ISO codes (`US`, `CN`), registry ids (`PQC-REGION-EU`) and
 * full names (`United States`, `China`, `European Union`) for the same place.
 * Taken one token at a time, the Geography menu listed "United States" twice
 * (from `US` and from `United States`), "China" twice, "European Union" next to
 * the EU overlay, and raw codes with no label (`ES`). Every Library surface that
 * lists or matches regions canonicalises through here first.
 */
import { COUNTRY_CODE_TO_NAME } from '@/data/jurisdictionsData'

/**
 * ISO codes → labels for the Geography facet and filter chips: every jurisdiction in the
 * jurisdictions registry (jurisdictions_*.csv), named as it is there.
 */
export const REGION_LABELS = new Map<string, string>(Object.entries(COUNTRY_CODE_TO_NAME))

/** Region groups (the codes of pqc-vocab-overlay.json) and their reader-facing labels. */
export const GEO_OVERLAY_LABELS = new Map<string, string>([
  ['PQC-REGION-GLOBAL', 'Global'],
  ['PQC-REGION-FIVEEYES', 'Five Eyes'],
  ['PQC-REGION-EU', 'European Union'],
  ['PQC-REGION-EUROPE', 'Europe'],
  ['PQC-REGION-AMERICAS', 'Americas'],
  ['PQC-REGION-APAC', 'Asia-Pacific'],
  ['PQC-REGION-MEA', 'Middle East & Africa'],
])

/** Spellings that name a place another token already codes, → that code (old deep links keep working). */
const REGION_ALIASES = new Map<string, string>([
  ['czechia', 'CZ'],
  ['united states', 'US'],
  ['usa', 'US'],
  ['united kingdom', 'GB'],
  ['uk', 'GB'],
  ['china', 'CN'],
  ['european union', 'PQC-REGION-EU'],
  ['eu', 'PQC-REGION-EU'],
  ['global', 'PQC-REGION-GLOBAL'],
  ['international', 'PQC-REGION-GLOBAL'],
  ['worldwide', 'PQC-REGION-GLOBAL'],
  ['five eyes', 'PQC-REGION-FIVEEYES'],
])

/** Labels → their code, built from REGION_LABELS ("Germany" → DE). */
const CODE_BY_LABEL = new Map(
  [...REGION_LABELS].map(([code, label]) => [label.toLowerCase(), code])
)

/** The canonical code for one `region_scope` token (trimmed; unknown tokens pass through). */
export function canonicalRegionCode(token: string): string {
  const t = token.trim()
  const lower = t.toLowerCase()
  return REGION_ALIASES.get(lower) ?? CODE_BY_LABEL.get(lower) ?? t
}

/** A `region_scope` cell → its canonical codes, de-duplicated, blanks dropped. */
export function canonicalRegionCodes(cell: string | undefined): string[] {
  const out: string[] = []
  for (const raw of (cell ?? '').split(';')) {
    if (!raw.trim()) continue
    const code = canonicalRegionCode(raw)
    if (!out.includes(code)) out.push(code)
  }
  return out
}

/** Reader-facing label for a canonical code (the code itself when none is known). */
export function regionLabel(code: string): string {
  return GEO_OVERLAY_LABELS.get(code) ?? REGION_LABELS.get(code) ?? code
}
