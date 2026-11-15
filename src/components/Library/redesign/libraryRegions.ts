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

/** ISO-ish codes → labels for the Geography facet and filter chips. */
export const REGION_LABELS = new Map<string, string>([
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['AU', 'Australia'],
  ['CA', 'Canada'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['CN', 'China'],
  ['RU', 'Russia'],
  ['SG', 'Singapore'],
  ['IN', 'India'],
  ['HK', 'Hong Kong'],
  ['NL', 'Netherlands'],
  ['AE', 'United Arab Emirates'],
  ['SA', 'Saudi Arabia'],
  ['IL', 'Israel'],
  ['SE', 'Sweden'],
  ['NO', 'Norway'],
  ['CZ', 'Czechia'],
  ['MY', 'Malaysia'],
  ['ZA', 'South Africa'],
  ['KE', 'Kenya'],
  ['NZ', 'New Zealand'],
  ['G7', 'G7'],
  ['NATO', 'NATO'],
])

/** Region groups GeoFilter offers as built-in overlay options. */
export const GEO_OVERLAY_LABELS = new Map<string, string>([
  ['PQC-REGION-GLOBAL', 'Global'],
  ['PQC-REGION-FIVEEYES', 'Five Eyes'],
  ['PQC-REGION-EU', 'European Union'],
])

/** Spellings that name a place another token already codes, → that code. */
const REGION_ALIASES = new Map<string, string>([
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
