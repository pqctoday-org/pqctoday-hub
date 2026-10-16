// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { parseDateMs } from './libraryData'
import {
  mapAlgorithmFamilyToFields,
  OTHER_FIELD_BUCKET_ID,
  RESEARCH_FIELD_BUCKETS,
} from './researchFieldTaxonomy'
import { parseResearchTopicsDetailed, researchTopicLabel } from './researchTopics'

/**
 * researchFieldWatch — the "recent corpus changes by algorithm family" counter
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
  /** Known research-topic ids from the CSV `research_topics` column; absent or
   *  empty when the row is not tagged (or the CSV has no such column yet). */
  researchTopics?: string[]
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
  /** One entry per followed research-topic id, counted the same way from the
   *  rows' `researchTopics`. `fieldId` holds the topic id. Unknown ids are
   *  dropped, as for `fields`. */
  topics: FieldWatchEntry[]
  /** Sum of `deprecatedCount` across the followed fields and topics — NOT a corpus-wide total. */
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
  rows: FieldWatchRow[],
  followedTopicIds: string[] = []
): ResearchFieldWatchSummary {
  const counts = new Map<string, { revisionCount: number; deprecatedCount: number }>()
  for (const id of followedFieldIds) counts.set(id, { revisionCount: 0, deprecatedCount: 0 })
  const topicCounts = new Map<string, { revisionCount: number; deprecatedCount: number }>()
  for (const id of followedTopicIds) topicCounts.set(id, { revisionCount: 0, deprecatedCount: 0 })

  const tally = (
    bucket: { revisionCount: number; deprecatedCount: number } | undefined,
    row: FieldWatchRow
  ) => {
    if (!bucket) return // not a field / topic this researcher follows
    if (isAfter(row.lastUpdateDateMs, windowStartMs)) bucket.revisionCount += 1
    if (row.isDeprecated && isAfter(row.deprecatedAtMs, windowStartMs)) {
      bucket.deprecatedCount += 1
    }
  }

  for (const row of rows) {
    for (const fieldId of mapAlgorithmFamilyToFields(row.algorithmFamily)) {
      tally(counts.get(fieldId), row)
    }
    for (const topicId of row.researchTopics ?? []) tally(topicCounts.get(topicId), row)
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

  const topics: FieldWatchEntry[] = followedTopicIds.flatMap((topicId) => {
    const label = researchTopicLabel(topicId)
    const bucket = topicCounts.get(topicId)
    if (!label || !bucket) return []
    return [{ fieldId: topicId, label, ...bucket }]
  })

  const totalDeprecatedInWindow = [...fields, ...topics].reduce(
    (sum, f) => sum + f.deprecatedCount,
    0
  )

  return {
    fields,
    topics,
    totalDeprecatedInWindow,
    nothingRetracted: totalDeprecatedInWindow === 0,
  }
}

export interface OtherFieldShare {
  /** Active rows that land only in the Other / Uncategorized bucket. */
  other: number
  /** All active rows. */
  total: number
  /** `other / total` as a whole percentage (0 when there are no rows). */
  percent: number
}

/**
 * How much of the ACTIVE catalogue has no recognised algorithm family and so
 * lands in Other / Uncategorized. Computed from the shipped library CSV
 * rather than written down, because it moves with every library release (it
 * was ~43% on the July catalogue and 56% on the October one).
 */
export function computeOtherFieldShare(rows: FieldWatchRow[]): OtherFieldShare {
  const active = rows.filter((r) => !r.isDeprecated)
  const other = active.filter((r) => {
    const fields = mapAlgorithmFamilyToFields(r.algorithmFamily)
    return fields.length === 1 && fields[0] === OTHER_FIELD_BUCKET_ID
  }).length
  const total = active.length
  return { other, total, percent: total === 0 ? 0 : Math.round((other / total) * 100) }
}

/**
 * How many rows (active or retracted) carry at least one research topic. Zero
 * means the Library has not been tagged yet, so topic counts would be zeros
 * that say nothing — the card shows a note instead.
 */
export function countTopicTaggedRows(rows: FieldWatchRow[]): number {
  return rows.filter((r) => (r.researchTopics?.length ?? 0) > 0).length
}

// ── Real-data adapter ────────────────────────────────────────────────────

interface RawFieldWatchRow {
  reference_id: string
  AlgorithmFamily: string
  last_update_date: string
  status?: string
  deprecated_at?: string
  /** Absent from CSVs written before research topics existed. */
  research_topics?: string
}

function transformFieldWatchRow(row: RawFieldWatchRow): FieldWatchRow | null {
  if (!row.reference_id) return null
  return {
    referenceId: row.reference_id,
    algorithmFamily: row.AlgorithmFamily ?? '',
    lastUpdateDateMs: parseDateMs(row.last_update_date),
    isDeprecated: row.status === 'deprecated',
    deprecatedAtMs: parseDateMs(row.deprecated_at),
    // Detailed form so this second read of the CSV does not double-count the
    // unknown ids the main library loader already counts.
    researchTopics: parseResearchTopicsDetailed(row.research_topics).topics,
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
  /** Share of active documents in the Other / Uncategorized bucket. */
  otherShare: OtherFieldShare
  /** Rows carrying at least one research topic (see `countTopicTaggedRows`). */
  topicTaggedCount: number
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

  cachedCorpus = {
    rows: data,
    releaseDateMs,
    windowStartMs,
    otherShare: computeOtherFieldShare(data),
    topicTaggedCount: countTopicTaggedRows(data),
  }
  return cachedCorpus
}
