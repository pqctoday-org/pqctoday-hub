// SPDX-License-Identifier: AGPL-3.0-only
import Papa from 'papaparse'
import type { EnrichmentLookup } from './enrichmentParse'

/**
 * The "{Country}:{OrgName} — {Title}" label every row of a timeline CSV carries
 * now, built from the raw CSV exactly as the enrichment pipeline keys rows (the
 * loader's display tweaks, e.g. NSA's country, do not apply to keys).
 */
export function timelineCurrentLabels(csvText: string): Set<string> {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  const labels = new Set<string>()
  for (const r of data) {
    const c = (r.Country ?? '').trim()
    const o = (r.OrgName ?? '').trim()
    const t = (r.Title ?? '').trim()
    if (c && o && t) labels.add(`${c}:${o} — ${t}`)
  }
  return labels
}

/**
 * The merged enrichment lookup without entries filed under a row's OLD label
 * when the same row (event_id) also has an entry under its CURRENT label.
 *
 * Why (16 Oct 2026): enrichment is keyed by label, and every generation is
 * merged, so a row renamed and later re-enriched kept its old-label entry. The
 * app never shows it (getTimelineEnrichment reads the current label first and
 * an alias only when that is missing), but it still shipped: a refreshed
 * Singapore row's old entry kept claiming a deadline the regulator never set.
 * An alias whose row has no current-label entry stays — it is the fallback.
 */
export function dropSupersededAliases(
  merged: EnrichmentLookup,
  aliases: Readonly<Record<string, readonly string[]>>,
  currentLabels: ReadonlySet<string>
): EnrichmentLookup {
  const drop = new Set<string>()
  for (const labels of Object.values(aliases)) {
    const hasCurrentEntry = labels.some((l) => currentLabels.has(l) && l in merged)
    if (!hasCurrentEntry) continue
    for (const l of labels) if (!currentLabels.has(l)) drop.add(l)
  }
  return Object.fromEntries(Object.entries(merged).filter(([k]) => !drop.has(k)))
}
