// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/lib/corpusLinkTargets.ts
 *
 * Value-level check for `chunk.deepLink`: does the item a link names actually
 * exist on the page it points at? `validateCorpusDeepLinks` (deepLinkGrammar)
 * only checks parameter NAMES, so until 2026-10-02 the corpus shipped 1,133
 * patent links to rows the Patents page drops, Library links to `FIPS-203`
 * (the id is `FIPS 203`) and Migrate links whose `?product=` was a document
 * title — every one of them opening a "not found" notice.
 *
 * Pure functions: the generator builds the resolver table from the same CSVs
 * the pages load and fails the build on any miss.
 */

/** True when `value` names an item the target page can open. */
export type ValueCheck = (value: string) => boolean

/**
 * path → param → check. The special path `'*'` applies on every route (the
 * global `?spec=` Library drawer).
 */
export type LinkResolverTable = Readonly<Record<string, Readonly<Record<string, ValueCheck>>>>

export interface UnresolvedLink {
  id: string
  source: string
  url: string
  param: string
  value: string
}

/** Params whose value is a comma-separated list; every entry must resolve. */
const LIST_PARAMS: ReadonlySet<string> = new Set(['productIds', 'patentIds', 'highlight'])

function splitInternalUrl(url: string): { path: string; params: URLSearchParams } | null {
  if (!url.startsWith('/')) return null
  const noHash = url.split('#')[0]
  const q = noHash.indexOf('?')
  const path = (q === -1 ? noHash : noHash.slice(0, q)).replace(/\/+$/, '') || '/'
  return { path, params: new URLSearchParams(q === -1 ? '' : noHash.slice(q + 1)) }
}

/** Every internal deepLink whose resource param names nothing the page has. */
export function findUnresolvedLinks(
  chunks: ReadonlyArray<{ id: string; source: string; deepLink?: string }>,
  table: LinkResolverTable
): UnresolvedLink[] {
  const misses: UnresolvedLink[] = []
  for (const chunk of chunks) {
    if (!chunk.deepLink) continue
    const parsed = splitInternalUrl(chunk.deepLink)
    if (!parsed) continue
    const checks = { ...(table['*'] ?? {}), ...(table[parsed.path] ?? {}) }
    for (const [param, check] of Object.entries(checks)) {
      const raw = parsed.params.get(param)
      if (raw === null) continue
      const values = LIST_PARAMS.has(param)
        ? raw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : [raw.trim()]
      if (values.length === 0 || values.some((v) => v === '')) {
        misses.push({ id: chunk.id, source: chunk.source, url: chunk.deepLink, param, value: raw })
        continue
      }
      for (const value of values) {
        if (!check(value)) {
          misses.push({ id: chunk.id, source: chunk.source, url: chunk.deepLink, param, value })
        }
      }
    }
  }
  return misses
}

/** `FIPS-203`, `fips_203` and `FIPS 203` all key to `fips203` (mirrors findLibraryItemByRef). */
export function separatorInsensitiveKey(ref: string): string {
  return ref.toLowerCase().replace(/[\s\-_.]+/g, '')
}

/**
 * Library `?ref=` check with the page's own tolerance: exact id, or a
 * separator/case variant that matches exactly one live document.
 */
export function libraryRefCheck(activeIds: Iterable<string>): ValueCheck {
  const exact = new Set<string>()
  const loose = new Map<string, number>()
  for (const id of activeIds) {
    exact.add(id)
    const k = separatorInsensitiveKey(id)
    loose.set(k, (loose.get(k) ?? 0) + 1)
  }
  return (v) => exact.has(v) || loose.get(separatorInsensitiveKey(v)) === 1
}

/** Case-insensitive membership over ids and/or names. */
export function caseInsensitiveCheck(...values: Iterable<string>[]): ValueCheck {
  const set = new Set<string>()
  for (const list of values) for (const v of list) if (v.trim()) set.add(v.trim().toLowerCase())
  return (v) => set.has(v.trim().toLowerCase())
}

/** Group misses for a readable build log: source → param → count. */
export function summarizeUnresolved(misses: readonly UnresolvedLink[]): string[] {
  const counts = new Map<string, number>()
  for (const m of misses) {
    const key = `${m.source} ?${m.param}=`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} × ${k}`)
}
