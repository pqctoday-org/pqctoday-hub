// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { parseDateMs } from './libraryData'
import { mapAlgorithmFamilyToFields, RESEARCH_FIELD_BUCKETS } from './researchFieldTaxonomy'

/**
 * researchFieldWatch — the "changed in your fields since last visit" counter
 * behind the Researcher persona's field-watch card
 * (IMPLEMENTATION-PLAN-2026-08-01.md §6).
 *
 * Two exports:
 *  - `computeResearchFieldWatch` — a PURE function (no I/O) taking already-
 *    loaded row data + the researcher's followed fields + their last-visit
 *    timestamp, returning per-field revision/deprecation counts. This is
 *    what's unit tested against fabricated fixtures.
 *  - `loadFieldWatchRows` — the real-data adapter wiring it to the actual
 *    library CSV, for `ResearcherFieldWatchCard` to call.
 *
 * DATA-AVAILABILITY NOTE (read before touching `loadFieldWatchRows`):
 * `libraryData.ts`'s exported `libraryData` array ONLY contains rows whose
 * CSV `status` column is `active` — `transformLibraryRow` returns `null` for
 * every other row. (Its `LibraryItem.status` field is a DIFFERENT, unrelated
 * concept — the "New"/"Updated" recency badge — not the CSV's active/
 * deprecated lifecycle state.) Deprecated rows only resurface via
 * `priorRevisions` attached to whatever record superseded them, and only
 * when the CSV's `superseded_by` column is set. Measured against
 * `library_07312026_r2.csv`: 222 rows are `status=deprecated`, but 100 of
 * those (45%) have NO `superseded_by` at all — they are invisible via
 * `libraryData`'s public exports, and even the 122 that DO resurface as a
 * `PriorRevision` don't carry their own `AlgorithmFamily` (only the survivor
 * does).
 *
 * An honest "corpus deprecated" count therefore needs its own read of the
 * raw `status` / `deprecated_at` / `AlgorithmFamily` columns, covering BOTH
 * active and deprecated rows. `loadFieldWatchRows` does this by reusing the
 * exact same `loadLatestCSV` utility + `import.meta.glob` pattern
 * `libraryData.ts` itself uses (same PapaParse-backed loader, just a
 * narrower transform function) — not a second CSV parser, and not an attempt
 * to reconstruct this from `libraryData`'s already-filtered output.
 */

export interface FieldWatchRow {
  referenceId: string
  /** Raw `AlgorithmFamily` CSV value — bucketed via `mapAlgorithmFamilyToFields`. */
  algorithmFamily: string
  /** Parsed `last_update_date`, ms since epoch, or `null` if unparseable/absent. */
  lastUpdateDateMs: number | null
  isDeprecated: boolean
  /** Parsed `deprecated_at`, ms since epoch, or `null` if unparseable/absent/not deprecated. */
  deprecatedAtMs: number | null
}

export interface FieldWatchEntry {
  fieldId: string
  label: string
  /** Rows mapped to this field whose last-update date falls after `lastVisitedAt`. */
  revisionCount: number
  /** Rows mapped to this field that deprecated (deprecated_at) after `lastVisitedAt`. */
  deprecatedCount: number
}

export interface ResearchFieldWatchSummary {
  /** One entry per followed field id, in the order the caller supplied them.
   *  An id that isn't a real bucket (stale/renamed) is silently dropped rather
   *  than surfaced as a meaningless 0-count row. */
  fields: FieldWatchEntry[]
  /** Sum of `deprecatedCount` across all followed fields. */
  totalDeprecatedSinceVisit: number
  /**
   * "Nothing you cited has been retracted" per the design mockup's punchline.
   *
   * SIMPLIFICATION (flagged per the task spec, not silently papered over):
   * the app has no real per-user "citations" concept anywhere.
   * `useBookmarkStore`'s `libraryBookmarks` is the closest analog but is a
   * general save-for-later list, not a citation register — wiring this flag
   * to bookmarks would make it misleadingly `true` whenever the researcher
   * simply hasn't bookmarked anything yet. Per the task's own fallback
   * instruction, this treats EVERY deprecated row in a followed field as the
   * relevant signal instead: `true` iff `totalDeprecatedSinceVisit === 0`.
   */
  nothingRetracted: boolean
}

const BUCKET_LABEL = new Map(RESEARCH_FIELD_BUCKETS.map((b) => [b.id, b.label]))

/** True when `ms` is a real timestamp strictly after `threshold`. `threshold === null`
 *  (first visit, no baseline yet) always yields `false` — nothing counts as
 *  "since last visit" until there has been one. */
function isAfter(ms: number | null, threshold: number | null): boolean {
  return threshold !== null && ms !== null && ms > threshold
}

/**
 * Pure computation — given the researcher's followed field ids, their last
 * visit timestamp (`null` on a first visit), and the loaded row data, returns
 * per-field revision/deprecation counts since that visit. No I/O; safe to
 * unit test directly against fabricated fixtures.
 */
export function computeResearchFieldWatch(
  followedFieldIds: string[],
  lastVisitedAt: number | null,
  rows: FieldWatchRow[]
): ResearchFieldWatchSummary {
  const counts = new Map<string, { revisionCount: number; deprecatedCount: number }>()
  for (const id of followedFieldIds) counts.set(id, { revisionCount: 0, deprecatedCount: 0 })

  for (const row of rows) {
    const fieldIds = mapAlgorithmFamilyToFields(row.algorithmFamily)
    for (const fieldId of fieldIds) {
      const bucket = counts.get(fieldId)
      if (!bucket) continue // not a field this researcher follows
      if (isAfter(row.lastUpdateDateMs, lastVisitedAt)) bucket.revisionCount += 1
      if (row.isDeprecated && isAfter(row.deprecatedAtMs, lastVisitedAt)) {
        bucket.deprecatedCount += 1
      }
    }
  }

  const fields: FieldWatchEntry[] = followedFieldIds.flatMap((fieldId) => {
    const label = BUCKET_LABEL.get(fieldId)
    const bucket = counts.get(fieldId)
    if (!label || !bucket) return []
    return [
      {
        fieldId,
        label,
        revisionCount: bucket.revisionCount,
        deprecatedCount: bucket.deprecatedCount,
      },
    ]
  })

  const totalDeprecatedSinceVisit = fields.reduce((sum, f) => sum + f.deprecatedCount, 0)

  return {
    fields,
    totalDeprecatedSinceVisit,
    nothingRetracted: totalDeprecatedSinceVisit === 0,
  }
}

// ── Real-data adapter ────────────────────────────────────────────────────

interface RawFieldWatchRow {
  reference_id: string
  AlgorithmFamily: string
  last_update_date: string
  status?: string
  deprecated_at?: string
}

function transformFieldWatchRow(row: RawFieldWatchRow): FieldWatchRow | null {
  if (!row.reference_id) return null
  return {
    referenceId: row.reference_id,
    algorithmFamily: row.AlgorithmFamily ?? '',
    lastUpdateDateMs: parseDateMs(row.last_update_date),
    isDeprecated: row.status === 'deprecated',
    deprecatedAtMs: parseDateMs(row.deprecated_at),
  }
}

let cachedRows: FieldWatchRow[] | null = null

/**
 * Loads every library row — active AND deprecated, deliberately NOT filtered
 * the way `libraryData.ts` filters — as `FieldWatchRow`s, via the same
 * `loadLatestCSV` + `import.meta.glob('./library_*.csv', ...)` pattern
 * `libraryData.ts` itself uses. Memoized at module scope (the CSV is static
 * per deploy); pass `forceReload: true` to bypass the cache (tests only).
 */
export function loadFieldWatchRows(forceReload = false): FieldWatchRow[] {
  if (cachedRows && !forceReload) return cachedRows

  const modules = import.meta.glob('./library_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const { data } = loadLatestCSV<RawFieldWatchRow, FieldWatchRow>(
    modules,
    /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    transformFieldWatchRow
  )

  cachedRows = data
  return data
}
