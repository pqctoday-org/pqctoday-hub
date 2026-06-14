// SPDX-License-Identifier: GPL-3.0-only
/**
 * simFeed — the Simulation's scripted live-feed, loaded from a dated CSV
 * (`sim_feed_<MMDDYYYY>.csv`) with records for every quarter Q1 2026 → Q4 2040.
 * Latest-dated file wins (same convention as the other hub CSVs). Emitted by
 * scripts/gen-sim-feed.mjs; edit/regenerate to retune the timeline.
 */
import { loadLatestCSV } from './csvUtils'
import type { EventSeverity } from './simEvents'

const modules = import.meta.glob('./sim_feed_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawRow {
  year: string
  q: string
  sev: string
  txt: string
}
interface FeedRecord {
  year: number
  q: number
  sev: EventSeverity
  txt: string
}
export interface FeedRow {
  sev: EventSeverity
  txt: string
}

const { data: records } = loadLatestCSV<RawRow, FeedRecord>(
  modules,
  /sim_feed_(\d{2})(\d{2})(\d{4})\.csv$/,
  (row) => ({
    year: Number(row.year),
    q: Number(row.q),
    sev: row.sev as EventSeverity,
    txt: row.txt,
  })
)

const key = (year: number, q: number) => `${year}-Q${q}`

/** Scripted feed records keyed `${year}-Q${q}`. */
export const SIM_FEED: Record<string, FeedRow[]> = records.reduce<Record<string, FeedRow[]>>(
  (acc, r) => {
    ;(acc[key(r.year, r.q)] ??= []).push({ sev: r.sev, txt: r.txt })
    return acc
  },
  {}
)

/** Scripted feed for a given quarter (empty array if out of the 2026–2040 range). */
export function feedFor(year: number, q: number): FeedRow[] {
  return SIM_FEED[key(year, q)] ?? []
}
