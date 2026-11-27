// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The URL contract (UX grammar v2.1, section 3.2). Anything a reader chooses that changes what
 * they see goes in the address. Pure functions: no React, no router. `useGrammarUrl` wraps them.
 *
 *   tab      ?tab=<slug of the visible label>   (the first tab has no parameter)
 *   facet    ?<key>=<slug>                      (one fixed key per page, FACET_KEY_BY_PAGE)
 *   record   ?open=<tag>                        (old keys stay as aliases: RECORD_KEY_ALIASES)
 *   compare  ?compare=<slug>,<slug>
 *   step     ?step=<n>      (1-based)           zone ?zone=<slug>      question ?q=<slug>
 *
 * History: a filter change REPLACES the history entry; opening a record or a tab ADDS one.
 */

export const GRAMMAR_PARAMS = {
  tab: 'tab',
  open: 'open',
  compare: 'compare',
  step: 'step',
  zone: 'zone',
  question: 'q',
  view: 'view',
  mode: 'mode',
  lens: 'lens',
  group: 'group',
  cell: 'cell',
  alg: 'alg',
  panel: 'panel',
} as const

/** The one facet key of each page (handoff 3.2). */
export const FACET_KEY_BY_PAGE = {
  '/threats': 'severity',
  '/algorithms': 'region',
  '/timeline': 'kind',
  '/patents': 'year',
  '/compliance': 'scheme',
  '/library': 'type',
  '/migrate': 'support',
} as const

export type FacetPage = keyof typeof FACET_KEY_BY_PAGE

/** "Rules & standards" to "rules-standards": the slug of a visible label. */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// --- Old record keys -> ?open= ---------------------------------------------------------------

export interface RecordKeyAlias {
  /** The page (path prefix) the old key opened a record on. */
  page: string
  /** The old query key. */
  key: string
  /** Which record type the key names. */
  type: string
}

/**
 * Old record keys that stay as aliases and rewrite to `?open=`. A key counts as a record key only
 * on its own page (`?id=` is a threat on /threats and means nothing elsewhere), so each row names
 * the page. Collected from the Hub's own routes; the handoff counts 35 and names 11 of them.
 */
export const RECORD_KEY_ALIASES: readonly RecordKeyAlias[] = [
  { page: '/threats', key: 'id', type: 'threat' },
  { page: '/threats', key: 'threat', type: 'threat' },
  { page: '/library', key: 'ref', type: 'document' },
  { page: '/library', key: 'qv', type: 'document' },
  { page: '/algorithms', key: 'algo', type: 'algorithm' },
  { page: '/algorithms', key: 'highlight', type: 'algorithm' },
  { page: '/algorithms', key: 'quickview', type: 'algorithm' },
  { page: '/algorithms', key: 'transition', type: 'transition' },
  { page: '/algorithms', key: 'usecase', type: 'usecase' },
  { page: '/algorithms', key: 'kat', type: 'kat' },
  { page: '/algorithms', key: 'protocol', type: 'protocol' },
  { page: '/algorithms', key: 'standard', type: 'industrystandard' },
  { page: '/migrate', key: 'product', type: 'product' },
  { page: '/migrate', key: 'vendor', type: 'vendor' },
  { page: '/compliance', key: 'prod', type: 'product' },
  { page: '/compliance', key: 'vendor', type: 'vendor' },
  { page: '/compliance', key: 'cert', type: 'certification' },
  { page: '/compliance', key: 'framework', type: 'framework' },
  { page: '/compliance', key: 'req', type: 'requirement' },
  { page: '/compliance', key: 'reqfw', type: 'framework' },
  { page: '/compliance', key: 'evref', type: 'document' },
  { page: '/compliance', key: 'src', type: 'source' },
  { page: '/compliance', key: 'country', type: 'country' },
  { page: '/leaders', key: 'leader', type: 'person' },
  { page: '/patents', key: 'patent', type: 'patent' },
  { page: '/timeline', key: 'event', type: 'event' },
  { page: '/timeline', key: 'country', type: 'country' },
  { page: '/learn', key: 'glossary', type: 'term' },
  { page: '/learn', key: 'track', type: 'track' },
  { page: '/library', key: 'sector', type: 'sector' },
  { page: '/simulation', key: 'topic', type: 'mission' },
  { page: '/playground', key: 'lesson', type: 'lesson' },
  { page: '/playground', key: 'algo', type: 'tool' },
  { page: '/faq', key: 'item', type: 'document' },
]

const pageMatches = (pathname: string, page: string) =>
  pathname === page || pathname.startsWith(`${page}/`)

export interface AliasRewrite {
  search: string
  /** True when an old key was rewritten (the caller then replaces the history entry). */
  changed: boolean
}

/**
 * Rewrites an old record key to `?open=<value>`. When `?open=` is already present it wins and the
 * old key is dropped. Unrelated parameters keep their order.
 */
export function rewriteRecordAliases(pathname: string, search: string): AliasRewrite {
  const params = new URLSearchParams(search)
  const hit = RECORD_KEY_ALIASES.find((a) => pageMatches(pathname, a.page) && params.has(a.key))
  if (!hit) return { search: params.toString() ? `?${params.toString()}` : '', changed: false }
  const value = params.get(hit.key) ?? ''
  const next = new URLSearchParams()
  let placed = false
  const hasOpen = params.has(GRAMMAR_PARAMS.open)
  for (const [k, v] of params) {
    if (k === hit.key) {
      if (!hasOpen && !placed) {
        next.set(GRAMMAR_PARAMS.open, value)
        placed = true
      }
    } else next.append(k, v)
  }
  return { search: `?${next.toString()}`, changed: true }
}

/** Tab keys that were renamed to the slug of their visible label (handoff 3.2); the old keys stay as aliases. */
export const TAB_KEY_ALIASES: Record<string, Record<string, string>> = {
  '/compliance': {
    obligations: 'rules-standards',
    requirements: 'sources-practices',
    standards: 'landscape',
  },
  '/learn/tls-basics': { 'downgrade-attack': 'workshop' },
}

// --- State ----------------------------------------------------------------------------------

export interface GrammarState {
  /** The record tag, from `?open=`. */
  open: string | null
  /** The tab slug; null is the first tab. */
  tab: string | null
  /** The page's facet value, from its one fixed key. */
  facet: string | null
  compare: string[]
  step: number | null
  zone: string | null
  question: string | null
}

export function parseGrammarSearch(search: string, facetKey?: string): GrammarState {
  const p = new URLSearchParams(search)
  const step = Number(p.get(GRAMMAR_PARAMS.step))
  return {
    open: p.get(GRAMMAR_PARAMS.open) || null,
    tab: p.get(GRAMMAR_PARAMS.tab) || null,
    facet: facetKey ? p.get(facetKey) || null : null,
    compare: (p.get(GRAMMAR_PARAMS.compare) ?? '').split(',').filter(Boolean),
    step: Number.isInteger(step) && step >= 1 ? step : null,
    zone: p.get(GRAMMAR_PARAMS.zone) || null,
    question: p.get(GRAMMAR_PARAMS.question) || null,
  }
}

/** One change a reader makes. */
export type GrammarChange =
  | { kind: 'open'; tag: string | null }
  | { kind: 'tab'; slug: string | null }
  | { kind: 'facet'; key: string; value: string | null }
  | { kind: 'compare'; slugs: readonly string[] }
  | { kind: 'step'; step: number | null }
  | { kind: 'zone'; slug: string | null }
  | { kind: 'question'; slug: string | null }

export type HistoryMode = 'push' | 'replace'

export interface GrammarUpdate {
  /** The new search string, with a leading "?" or empty. */
  search: string
  history: HistoryMode
}

const setOrDelete = (p: URLSearchParams, key: string, value: string | null | undefined) => {
  if (value === null || value === undefined || value === '') p.delete(key)
  else p.set(key, value)
}

/**
 * The address after a change, and how to record it. Opening a record or a tab adds a history entry;
 * closing a record and every filter, compare, step, zone or question change replaces it. Changing
 * the tab drops `?open=` (the record belongs to the tab it was opened on).
 */
export function applyGrammarChange(search: string, change: GrammarChange): GrammarUpdate {
  const p = new URLSearchParams(search)
  let history: HistoryMode = 'replace'
  switch (change.kind) {
    case 'open':
      setOrDelete(p, GRAMMAR_PARAMS.open, change.tag)
      history = change.tag ? 'push' : 'replace'
      break
    case 'tab':
      setOrDelete(p, GRAMMAR_PARAMS.tab, change.slug)
      p.delete(GRAMMAR_PARAMS.open)
      history = 'push'
      break
    case 'facet':
      setOrDelete(p, change.key, change.value)
      break
    case 'compare':
      setOrDelete(p, GRAMMAR_PARAMS.compare, change.slugs.join(','))
      break
    case 'step':
      setOrDelete(p, GRAMMAR_PARAMS.step, change.step === null ? null : String(change.step))
      break
    case 'zone':
      setOrDelete(p, GRAMMAR_PARAMS.zone, change.slug)
      break
    case 'question':
      setOrDelete(p, GRAMMAR_PARAMS.question, change.slug)
      break
  }
  const s = p.toString()
  return { search: s ? `?${s}` : '', history }
}

/** `/go/<tag>`: the universal address of a record (I7). */
export function goPath(tag: string): string {
  return `/go/${encodeURIComponent(tag)}`
}
