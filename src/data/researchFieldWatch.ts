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
  /** Rows mapped to this field whose last-update date falls inside the window. */
  revisionCount: number
  /** Rows mapped to this field that deprecated (deprecated_at) inside the window. */
  deprecatedCount: number
}

export interface ResearchFieldWatchSummary {
  /** One entry per followed field id, in the order the caller supplied them.
   *  An id that isn't a real bucket (stale/renamed) is silently dropped rather
   *  than surfaced as a meaningless 0-count row. */
  fields: FieldWatchEntry[]
  /** Sum of `deprecatedCount` across the followed fields — NOT a corpus-wide total. */
  totalDeprecatedInWindow: number
  /**
   * True iff nothing in the researcher's followed fields was retracted inside
   * the window.
   *
   * The card's punchline used to read "Nothing you cited has been retracted",
   * which the app cannot know: there is no per-user citation concept anywhere.
   * (`useBookmarkStore`'s `libraryBookmarks` is a general save-for-later list,
   * not a citation register — wiring this to bookmarks would make it
   * misleadingly `true` whenever the researcher simply hasn't bookmarked
   * anything.) The card's own footnote conceded the gap in fine print while the
   * headline asserted it anyway. The claim is now scoped to what is actually
   * computed: the researcher's followed fields.
   */
  nothingRetracted: boolean
}

const BUCKET_LABEL = new Map(RESEARCH_FIELD_BUCKETS.map((b) => [b.id, b.label]))

/** True when `ms` is a real timestamp strictly after `threshold`. */
function isAfter(ms: number | null, threshold: number | null): boolean {
  return threshold !== null && ms !== null && ms > threshold
}

/**
 * Pure computation — given the researcher's followed field ids, the start of
 * the reporting window, and the loaded row data, returns per-field
 * revision/deprecation counts inside that window. No I/O; safe to unit test
 * directly against fabricated fixtures.
 *
 * WHY A CORPUS WINDOW, NOT "SINCE YOUR LAST VISIT" (changed 2026-08-02).
 * This used to take the visitor's `lastVisitedAt` timestamp and count rows
 * whose `last_update_date` fell after it. That could never return a non-zero
 * number for a real visitor, and the reason is a category error rather than a
 * tuning problem: `last_update_date` is the DOCUMENT's publication date, while
 * the boundary was BROWSING time. Measured against `library_07312026_r2.csv`,
 * the newest `last_update_date` in the entire 1,011-row catalog was
 * 2026-06-29 — 34 days before the release — so every visitor arriving after
 * late June saw "0 revisions" on every field they followed, permanently. A
 * deploy could add fifty documents and the count would stay 0 if they happened
 * to be older RFCs. (It was worse than that: the card called `markVisited()`
 * on every mount, so opening the home page twice reset the boundary to minutes
 * earlier.)
 *
 * The window is now anchored to the CORPUS RELEASE — "what changed in this
 * release of the library" — which is a question the data can actually answer,
 * and which is the same for every visitor. `windowStartMs === null` disables
 * counting entirely rather than silently reporting zeros as a finding.
 */
export function computeResearchFieldWatch(
  followedFieldIds: string[],
  windowStartMs: number | null,
  rows: FieldWatchRow[]
): ResearchFieldWatchSummary {
  const counts = new Map<string, { revisionCount: number; deprecatedCount: number }>()
  for (const id of followedFieldIds) counts.set(id, { revisionCount: 0, deprecatedCount: 0 })

  for (const row of rows) {
    const fieldIds = mapAlgorithmFamilyToFields(row.algorithmFamily)
    for (const fieldId of fieldIds) {
      const bucket = counts.get(fieldId)
      if (!bucket) continue // not a field this researcher follows
      if (isAfter(row.lastUpdateDateMs, windowStartMs)) bucket.revisionCount += 1
      if (row.isDeprecated && isAfter(row.deprecatedAtMs, windowStartMs)) {
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

  const totalDeprecatedInWindow = fields.reduce((sum, f) => sum + f.deprecatedCount, 0)

  return {
    fields,
    totalDeprecatedInWindow,
    nothingRetracted: totalDeprecatedInWindow === 0,
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

/**
 * How far back from the corpus release date the card reports.
 *
 * 90 days, chosen against the real catalog rather than picked as a round
 * number: measured on `library_07312026_r2.csv`, a 30-day window yields 0
 * updated documents (the newest `last_update_date` is 2026-06-29, a month
 * before the release), 60 days yields 20, and 90 yields 54 updated + 222
 * retracted. A window that reports zero across the whole corpus tells the
 * researcher nothing, which is the failure this card is being rescued from.
 */
export const FIELD_WATCH_WINDOW_DAYS = 90

const MS_PER_DAY = 86_400_000

export interface FieldWatchCorpus {
  rows: FieldWatchRow[]
  /** Release date of the library CSV this was loaded from, ms since epoch, or `null`. */
  releaseDateMs: number | null
  /** Start of the reporting window (`releaseDateMs` - 90 days), or `null`. */
  windowStartMs: number | null
}

let cachedCorpus: FieldWatchCorpus | null = null

/**
 * Loads every library row — active AND deprecated, deliberately NOT filtered
 * the way `libraryData.ts` filters — as `FieldWatchRow`s, plus the corpus
 * release date and the derived reporting window, via the same `loadLatestCSV`
 * + `import.meta.glob('./library_*.csv', ...)` pattern `libraryData.ts` itself
 * uses. Memoized at module scope (the CSV is static per deploy); pass
 * `forceReload: true` to bypass the cache (tests only).
 */
export function loadFieldWatchCorpus(forceReload = false): FieldWatchCorpus {
  if (cachedCorpus && !forceReload) return cachedCorpus

  const modules = import.meta.glob('./library_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const { data, metadata } = loadLatestCSV<RawFieldWatchRow, FieldWatchRow>(
    modules,
    /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    transformFieldWatchRow
  )

  // The release date comes from the CSV FILENAME (loadLatestCSV's parsed
  // metadata), not from any row inside it. That is the point: it is the date
  // this corpus snapshot shipped, which is what "changed in this release"
  // means — and unlike a row's `last_update_date` it cannot lag the catalog.
  const releaseDateMs = metadata ? metadata.lastUpdate.getTime() : null
  const windowStartMs =
    releaseDateMs === null ? null : releaseDateMs - FIELD_WATCH_WINDOW_DAYS * MS_PER_DAY

  cachedCorpus = { rows: data, releaseDateMs, windowStartMs }
  return cachedCorpus
}
