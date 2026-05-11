// SPDX-License-Identifier: GPL-3.0-only
/**
 * listDiff — token-level add/remove rendering for semicolon-delimited cells.
 *
 * Used by RevisionDrilldownPanel to render diffs for list-typed columns
 * (library_refs, timeline_refs, applicable_industries, dependencies, etc.)
 * as token sets rather than raw string before/after.
 *
 * The output preserves token order from `after` (with `before`-only tokens
 * appended in their original order at the end) so a reader sees the new
 * shape of the cell with explicit removed-then-added markers.
 */

export interface ListDiff {
  /** Tokens that exist in both `before` and `after` */
  unchanged: string[]
  /** Tokens added in `after` (in their `after`-order) */
  added: string[]
  /** Tokens removed from `before` (in their `before`-order) */
  removed: string[]
  /** Tokens in their final rendered order — added/unchanged from after, removed appended */
  ordered: { token: string; status: 'unchanged' | 'added' | 'removed' }[]
}

/** Set of column names whose value is a semicolon-delimited token list. */
export const LIST_COLUMNS: ReadonlySet<string> = new Set([
  'library_refs',
  'libraryRefs',
  'timeline_refs',
  'timelineRefs',
  'dependencies',
  'applicable_industries',
  'applicable_industries_normalized',
  'industries',
  'countries',
  'frameworks',
  'cswp39_tags',
  'tags',
  'related_modules',
  'algorithm_refs',
  'algorithmRefs',
])

export function isListColumn(field: string): boolean {
  return LIST_COLUMNS.has(field)
}

/** Split a semicolon-delimited cell into trimmed, non-empty tokens. */
export function splitTokens(cell: string | null | undefined): string[] {
  if (!cell) return []
  return cell
    .split(';')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

/**
 * Compute a token-level diff between `before` and `after` semicolon-delimited
 * cell values. Token comparison is case-sensitive. Duplicate tokens collapse
 * to a single entry.
 */
export function diffList(
  before: string | null | undefined,
  after: string | null | undefined
): ListDiff {
  const beforeTokens = splitTokens(before)
  const afterTokens = splitTokens(after)
  const beforeSet = new Set(beforeTokens)
  const afterSet = new Set(afterTokens)

  const unchanged: string[] = []
  const added: string[] = []
  const seen = new Set<string>()

  // Walk after-tokens in their displayed order; preserves user-authored ordering.
  for (const tok of afterTokens) {
    if (seen.has(tok)) continue
    seen.add(tok)
    if (beforeSet.has(tok)) unchanged.push(tok)
    else added.push(tok)
  }

  const removed: string[] = []
  const removedSeen = new Set<string>()
  for (const tok of beforeTokens) {
    if (removedSeen.has(tok)) continue
    removedSeen.add(tok)
    if (!afterSet.has(tok)) removed.push(tok)
  }

  const ordered: ListDiff['ordered'] = []
  const orderedSeen = new Set<string>()
  for (const tok of afterTokens) {
    if (orderedSeen.has(tok)) continue
    orderedSeen.add(tok)
    ordered.push({ token: tok, status: beforeSet.has(tok) ? 'unchanged' : 'added' })
  }
  for (const tok of removed) {
    ordered.push({ token: tok, status: 'removed' })
  }

  return { unchanged, added, removed, ordered }
}
