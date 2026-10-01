// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure grouping / capping / hint helpers for the ⌘K palette, kept out of
 * CommandPalette.tsx so they can be unit-tested (and so that file only exports
 * the component, which react-refresh requires).
 */
import type { SearchResult } from '@/services/search/SearchIndex'
import { SOURCE_LABELS } from '@/data/searchRoutes'

/** Rows shown per source group before the rest sit behind "Show N more". */
export const PALETTE_GROUP_CAP = 5

export type GroupedResults = { source: string; label: string; items: SearchResult[] }[]

/**
 * Group results by source label, in order of each group's first hit (so the
 * best-ranked hit still decides which group comes first). Within a group the
 * ranking order is preserved.
 */
export function groupResults(results: SearchResult[]): GroupedResults {
  const map = new Map<string, SearchResult[]>()
  for (const r of results) {
    const label = SOURCE_LABELS[r.source] ?? r.source
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(r)
  }
  return Array.from(map.entries()).map(([label, items]) => ({
    source: items[0].source,
    label,
    items,
  }))
}

export interface CappedGroup {
  source: string
  label: string
  /** Every hit in the group (the header count). */
  total: number
  /** The rows currently rendered. */
  visible: SearchResult[]
  /** Rows behind the "Show N more" control (0 = no control). */
  moreCount: number
}

/** Keep the top `cap` rows of every group unless its label is in `expanded`. */
export function capGroups(
  groups: GroupedResults,
  expanded: ReadonlySet<string>,
  cap: number = PALETTE_GROUP_CAP
): CappedGroup[] {
  return groups.map(({ source, label, items }) => {
    const open = expanded.has(label) || items.length <= cap
    return {
      source,
      label,
      total: items.length,
      visible: open ? items : items.slice(0, cap),
      moreCount: open ? 0 : items.length - cap,
    }
  })
}

/** One keyboard-navigable row: a result, or a group's "Show N more" control. */
export type NavEntry =
  { kind: 'result'; item: SearchResult } | { kind: 'more'; label: string; moreCount: number }

/**
 * The flat, in-render-order list ArrowUp/ArrowDown walks. It contains exactly
 * what is on screen — visible rows plus each group's "Show N more" control — so
 * activeIdx can never point at a collapsed row. When a control is activated its
 * group expands and the first newly revealed row takes the control's index.
 */
export function buildNav(groups: CappedGroup[]): NavEntry[] {
  const nav: NavEntry[] = []
  for (const g of groups) {
    for (const item of g.visible) nav.push({ kind: 'result', item })
    if (g.moreCount > 0) nav.push({ kind: 'more', label: g.label, moreCount: g.moreCount })
  }
  return nav
}

export interface HiddenSummary {
  count: number
  /** Source labels of the hidden hits, most hidden first, at most `maxLabels`. */
  labels: string[]
}

/** Summarise hits the Authoritative-only filter removed for the hint row. */
export function summarizeHidden(
  hidden: ReadonlyArray<{ source: string }>,
  maxLabels = 3
): HiddenSummary {
  const perLabel = new Map<string, number>()
  for (const h of hidden) {
    const label = SOURCE_LABELS[h.source] ?? h.source
    if (label) perLabel.set(label, (perLabel.get(label) ?? 0) + 1)
  }
  const labels = [...perLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxLabels)
    .map(([label]) => label)
  return { count: hidden.length, labels }
}

/** Visible wording of the hint; the "turn it off" action is a separate button. */
export function hiddenHintText({ count, labels }: HiddenSummary): string {
  const eg = labels.length > 0 ? ` (e.g. ${labels.join(', ')})` : ''
  return `${count} more result${count === 1 ? '' : 's'} hidden by Authoritative only${eg}`
}
