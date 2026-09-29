// SPDX-License-Identifier: GPL-3.0-only
/**
 * Which Patents tab a URL lands on (desktop only). The `?patent=` ID helpers
 * shared with the mobile screen live in '@/data/patentsScope'.
 */
export const PATENT_TABS = ['insights', 'explore', 'search'] as const
export type PatentTab = (typeof PATENT_TABS)[number]

/**
 * The tab to show for the current URL.
 * - A valid `?tab` wins.
 * - An unknown/legacy `?tab` (e.g. `tab=patents`, emitted by RAG and the
 *   Assistant) used to render an empty tab body — it maps to Explore.
 * - No `?tab` but a Search-tab query (`?sq`) → Search, so the drawer's
 *   prev/next steps through those hits.
 * - No `?tab` but a `?patent` or any filter param → Explore, so a linked
 *   patent's row (or the filtered list) is what sits under the drawer.
 * - Otherwise the Insights landing tab.
 */
export function resolvePatentTab(params: URLSearchParams, filterParams: string[]): PatentTab {
  const raw = params.get('tab')
  if (raw && (PATENT_TABS as readonly string[]).includes(raw)) return raw as PatentTab
  if (raw) return 'explore'
  if (params.get('sq')) return 'search'
  if (params.get('patent')) return 'explore'
  if (filterParams.some((k) => params.get(k))) return 'explore'
  return 'insights'
}
