// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/lib/latestDatedCsv.ts
 *
 * Picks the newest `*_MMDDYYYY.csv` under a directory, for the Node-side
 * scripts that read the role-board CSVs.
 *
 * WHY THIS EXISTS. Both `generate-role-board-content.ts` and
 * `audit-role-board-ctas.ts` originally did this with a plain
 * `readdirSync(...).filter(...).sort()` and took the last entry. That is
 * lexicographic order over an `MMDDYYYY` name, which is NOT chronological
 * order: `01012027` sorts BELOW `08022026`, so the first role-board CSV of
 * 2027 would have lost to the August 2026 file and been silently ignored —
 * copy edits would simply stop taking effect, with no error anywhere.
 *
 * The app already solves this correctly in `src/data/csvUtils.ts`'s
 * `sortCSVFiles`, which parses the MM/DD/YYYY capture groups into a real Date
 * (and an optional `_rN` revision) and sorts descending. This module reuses
 * that function rather than adding a third implementation of the same idea —
 * same reasoning `researchFieldTaxonomy.ts` gives for reusing the Library
 * page's family classifier instead of writing a second normalizer.
 *
 * `sortCSVFiles` only reads the KEYS of the record it is given to work out
 * ordering, so this passes filenames with empty content and reads just the
 * winning file off disk afterwards.
 */

import { readdirSync } from 'fs'
import { join } from 'path'
import { sortCSVFiles } from '../../src/data/csvUtils'

/**
 * Absolute path of the newest dated CSV in `dataDir` matching `regex`, or
 * `null` if none match.
 *
 * `regex` must capture MM, DD, YYYY as its first three groups (and may capture
 * an `_rN` revision as its fourth), anchored against a bare filename — the
 * same shape `sortCSVFiles` expects. Must NOT carry the `g` flag: a global
 * regex keeps `lastIndex` state across calls and would match intermittently.
 */
export function latestDatedCsv(dataDir: string, regex: RegExp): string | null {
  if (regex.global) {
    throw new Error(`latestDatedCsv: regex must not be global (got ${regex})`)
  }
  const modules: Record<string, unknown> = {}
  for (const file of readdirSync(dataDir)) {
    // eslint-disable-next-line security/detect-object-injection -- file comes from readdirSync and is regex-matched above
    if (regex.test(file)) modules[file] = ''
  }
  const sorted = sortCSVFiles(modules, regex)
  return sorted.length > 0 ? join(dataDir, sorted[0].path) : null
}

/** Matches `role_board_content_MMDDYYYY.csv`. */
export const ROLE_BOARD_CONTENT_RE = /^role_board_content_(\d{2})(\d{2})(\d{4})\.csv$/

/** Matches `role_board_ctas_MMDDYYYY.csv`. */
export const ROLE_BOARD_CTAS_RE = /^role_board_ctas_(\d{2})(\d{2})(\d{4})\.csv$/

/** Matches `role_board_variants_MMDDYYYY.csv`. */
export const ROLE_BOARD_VARIANTS_RE = /^role_board_variants_(\d{2})(\d{2})(\d{4})\.csv$/
