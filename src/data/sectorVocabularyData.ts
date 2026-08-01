// SPDX-License-Identifier: GPL-3.0-only
/**
 * sectorVocabularyData — single source of truth for the industry/sector
 * vocabulary used by the /compliance industry facet.
 *
 * WHY THIS FILE EXISTS (WP-0.2/WP-1.1, 2026-07-31)
 * ------------------------------------------------
 * The vocabulary used to live as two hardcoded object literals inside
 * SectorFilter.tsx — NAICS_LABELS and INDUSTRY_TO_NAICS. Adding a sector was
 * therefore a code change, which is why four CSWP-39 anchors (Chemical,
 * Critical Manufacturing, Food & Agriculture, Transportation Systems) had no
 * /compliance filter at all: nobody edits a .tsx to add data.
 *
 * It also carried a silent ambiguity. 'Technology' appeared in the alias list
 * of BOTH '51' and '54', and resolveToNaics returned whichever Object.entries
 * happened to yield first — so a deep link's meaning depended on key order.
 *
 * The backing CSV (sector_vocabulary_MMDDYYYY.csv) follows the same
 * date-stamped versioning and DS01 status schema as every other reference CSV.
 *
 * KEY vs DISPLAY
 * --------------
 * compliance_*.csv now separates the two, on purpose:
 *   - `naics_codes`  = the machine key. Drives filtering. One vocabulary.
 *   - `industries`   = human-readable display text. Never filtered on.
 * Before this split both columns held identical values on code-tagged rows
 * while 27 other rows used free text, and the facet exact-matched over the
 * mixture — hiding 74 row-tags from the canonical option.
 *
 * CROSS-SECTOR ROWS
 * -----------------
 * 'Critical Infrastructure' and 'Defense Industrial Base' are not NAICS
 * sectors; they span several. They keep their label for display and carry
 * `expandsTo` so filtering still reaches them. They are deliberately NOT
 * offered as filter options — selecting one would mean something different
 * from every other option in the list.
 */
import { loadLatestCSV } from './csvUtils'
import { filterActive } from './loaderUtils'

// ── Types ─────────────────────────────────────────────────────────────────

export interface SectorVocabularyEntry {
  /** NAICS 2-digit code, or a CROSS-* key for cross-sector groupings. */
  sectorKey: string
  displayName: string
  /** The CSWP-39 industry anchor this maps to, where one exists. */
  cswp39Anchor: string
  /** Every historical spelling that should resolve to this entry. */
  aliases: string[]
  crossSector: boolean
  /** For cross-sector entries: the NAICS codes it expands to for filtering. */
  expandsTo: string[]
  status: string
}

interface RawSectorVocabularyRow {
  sector_key: string
  display_name: string
  cswp39_anchor: string
  aliases: string
  cross_sector: string
  expands_to: string
  notes: string
  status: string
}

const split = (v: string | undefined): string[] =>
  (v ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

const modules = import.meta.glob('./sector_vocabulary_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: loadedEntries } = loadLatestCSV<RawSectorVocabularyRow, SectorVocabularyEntry>(
  modules,
  // No leading anchor: import.meta.glob returns './name.csv', so a '^name'
  // regex silently matches nothing and the loader falls back to an empty
  // vocabulary. Matches the convention every other loader in this directory
  // uses.
  /sector_vocabulary_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    const sectorKey = (row.sector_key ?? '').trim()
    if (!sectorKey) return null
    return {
      sectorKey,
      displayName: (row.display_name ?? '').trim(),
      cswp39Anchor: (row.cswp39_anchor ?? '').trim(),
      aliases: split(row.aliases),
      crossSector: (row.cross_sector ?? '').trim().toLowerCase() === 'yes',
      expandsTo: split(row.expands_to),
      status: (row.status ?? 'active').trim(),
    }
  }
)

export const SECTOR_VOCABULARY: SectorVocabularyEntry[] = filterActive(loadedEntries)

/** Entries that are real, selectable filter options (excludes cross-sector). */
export const FILTERABLE_SECTORS: SectorVocabularyEntry[] = SECTOR_VOCABULARY.filter(
  (e) => !e.crossSector
)

/**
 * NAICS 2-digit code → display label. Derived, not hardcoded.
 * Same shape as the literal this replaced, so existing consumers are unchanged.
 */
export const NAICS_LABELS: Record<string, string> = Object.fromEntries(
  FILTERABLE_SECTORS.map((e) => [e.sectorKey, e.displayName])
)

/**
 * Lowercased alias → every sector key it resolves to.
 *
 * A list, not a single value: six aliases legitimately resolve to more than
 * one key. Four are NAICS's own splits (retail 44/45, transportation 48/49);
 * 'technology' → 51 and 54 is a deliberate 2026-07-31 decision, because the
 * frameworks tagged that way are cryptography standards and certification
 * schemes that apply to software/IT and technical-services firms alike.
 */
const ALIAS_TO_KEYS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {}
  for (const entry of SECTOR_VOCABULARY) {
    const register = (alias: string) => {
      const k = alias.trim().toLowerCase()
      if (!k) return
      if (!map[k]) map[k] = []
      if (!map[k].includes(entry.sectorKey)) map[k].push(entry.sectorKey)
    }
    register(entry.sectorKey)
    entry.aliases.forEach(register)
  }
  return map
})()

/**
 * Sector key → its alias list. The forward direction of ALIAS_TO_KEYS, for
 * consumers that still substring-match freeform prose (the Library page's
 * industry fields are not a migrated key column the way compliance's are).
 */
export const SECTOR_ALIASES_BY_KEY: Record<string, string[]> = Object.fromEntries(
  SECTOR_VOCABULARY.map((e) => [e.sectorKey, e.aliases])
)

/**
 * Resolve a freeform industry string to the set of NAICS codes it means.
 *
 * REPLACES the old single-value resolveToNaics, whose one-code return was the
 * direct cause of a real bug: `?ind=Finance%20%26%20Banking` resolved to '52'
 * and then exact-matched, returning NONE of the rows literally tagged
 * "Finance & Banking". Returning a set and matching ANY fixes that class.
 *
 * Cross-sector inputs expand to their constituent codes.
 * Returns [] for 'All' / empty, and [value] for an unknown token so an
 * unrecognised URL param still surfaces rather than silently selecting nothing.
 */
export function resolveToNaicsSet(value: string): string[] {
  if (!value || value === 'All') return []
  const keys = ALIAS_TO_KEYS[value.trim().toLowerCase()]
  if (!keys || keys.length === 0) return [value]
  const out = new Set<string>()
  for (const key of keys) {
    const entry = SECTOR_VOCABULARY.find((e) => e.sectorKey === key)
    if (entry?.crossSector) {
      entry.expandsTo.forEach((c) => out.add(c))
    } else {
      out.add(key)
    }
  }
  return [...out]
}

/**
 * Resolve an `industries`-column token to a human-readable sector label.
 *
 * After the WP-1.1 migration the column already holds display names, so this
 * is mostly a passthrough. It still expands bare NAICS codes, because
 * deprecated rows deliberately keep their pre-migration tagging (rewriting a
 * retired row's tags would rewrite the record of what was true when it was
 * retired) and other sources still pass codes in.
 */
export function industryLabel(token: string): string {
  if (!token) return token
  return NAICS_LABELS[token] ?? token
}
