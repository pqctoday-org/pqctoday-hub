// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link grammar — single source of truth for valid `chunk.deepLink` URLs
 * emitted by the RAG corpus generator and consumed by the PQC Assistant.
 *
 * Used by:
 * - scripts/generate-rag-corpus.ts (build-time validator)
 * - scripts/corpus-invariants.test.ts (vitest gate)
 * - src/services/chat/promptBuilder.ts (prose grammar block in system prompt
 *   should mirror these patterns; see RoutePattern.docExample)
 *
 * A deep-link is valid iff it matches at least one RoutePattern. The matcher
 * checks the path against `path`, then verifies every query key appears in
 * `queryKeys` (or `queryKeys === '*'` for free-form query allow-all).
 */

export type RoutePattern = {
  /** Matches the URL pathname (no query string). Use ^...$ anchors. */
  path: RegExp
  /**
   * Allowed query keys. `'*'` = any keys allowed.
   * Empty array = no query string permitted.
   */
  queryKeys: readonly string[] | '*'
  /** For diagnostics in the validator output. */
  description: string
}

/**
 * Anchored exact path matcher for routes with no parameter segment.
 */
const exact = (p: string): RegExp => new RegExp(`^${p.replace(/[/.]/g, '\\$&')}$`)

/**
 * Slug pattern used by /learn/<id>, /playground/<id>, /business/tools/<id>.
 * Slugs are lowercase, hyphenated, alphanumeric.
 */
const SLUG = '[a-z0-9][a-z0-9-]*'

export const ROUTE_PATTERNS: readonly RoutePattern[] = [
  // Landing
  { path: exact('/'), queryKeys: ['scroll', 'persona', 'ind'], description: 'Landing' },

  // Top-level pages
  //
  // Each list below is EXACTLY the set of params the page reads (canonical
  // forms only — legacy aliases a page still tolerates, e.g. Migrate's `q` or
  // Compliance's `industry`/`geo`, are deliberately left out so the Assistant
  // never emits them). `spec` is allowed on every route via GLOBAL_QUERY_KEYS.
  // deepLinkGrammar.test.ts pins these sets and checks each key is referenced
  // in the page's own source folder.
  {
    path: exact('/timeline'),
    // `event` = timeline_*.csv event_id (titles still accepted by the page).
    queryKeys: [
      'event',
      'country',
      'region',
      'q',
      'cat',
      'tier',
      'prefs',
      'docview',
      'phase',
      'etype',
      'deadlines',
      'gsort',
      'gdir',
    ],
    description: 'Timeline',
  },
  {
    path: exact('/algorithms'),
    // `algo` opens an algorithm's detail drawer (algorithm_id; exact names
    // accepted). `protocol` opens a Protocol Support matrix row (implies
    // tab=support). `mode=compare` is the Detailed tab's Browse↔Compare
    // toggle. `section` is the Validation tab's accordion preset
    // (attacks|kat|coverage). `industry`/`mechanism`/`usecase` drive the
    // Landscape tab. The `matrix*` keys are Protocol Support's own state.
    queryKeys: [
      'tab',
      'algo',
      'highlight',
      'quickview',
      'compare',
      'family',
      'level',
      'fn',
      'q',
      'status',
      'region',
      'mode',
      'cnsa',
      'gap',
      'section',
      'attack',
      'engine',
      'case',
      'protocol',
      'matrixView',
      'matrixQ',
      'matrixStatus',
      'matrixAvailability',
      'matrixSort',
      'matrixHighlight',
      'industry',
      'mechanism',
      'usecase',
    ],
    description: 'Algorithms',
  },
  {
    path: exact('/library'),
    queryKeys: [
      'ref',
      'purpose',
      'cat',
      'org',
      'q',
      'lifecycle',
      'cswp39',
      'qv',
      'prefs',
      'view',
      'sort',
      'geo',
      'sector',
      'tier',
      'algo',
    ],
    description: 'Library',
  },
  {
    path: exact('/threats'),
    // Every parameter ThreatsDashboard reads (threatsUrlParams + the trust-tier
    // filter + the shared ?prefs=off opt-out), so the Assistant's links to
    // them are not stripped.
    queryKeys: [
      'id',
      'industry',
      'criticality',
      'class',
      'q',
      'sort',
      'dir',
      'mode',
      'tier',
      'prefs',
      'view',
      'protocol',
      'threattab',
    ],
    description: 'Threats',
  },
  {
    path: exact('/leaders'),
    // `mode=cards|table|stack` (NOT `view`); `cat` takes singular category
    // values ("Algorithm Inventor").
    queryKeys: [
      'leader',
      'cat',
      'region',
      'country',
      'sector',
      'q',
      'sort',
      'mode',
      'all',
      'layer',
      'tsort',
      'tdir',
    ],
    description: 'Leaders',
  },
  {
    path: exact('/compliance'),
    // `framework` opens a framework drawer, `cert` a certification record,
    // `evref` a CSWP.39 evidence reference. `pqc` is an algorithm-name
    // multi-select, not a boolean.
    queryKeys: [
      'tab',
      'framework',
      'cert',
      'evref',
      'req',
      'rtab',
      'rstatus',
      'q',
      'pqc',
      'cat',
      'src',
      'vendor',
      'mcat',
      'sort',
      'dir',
      'org',
      'ind',
      'region',
      'country',
      'phase',
      'view',
      'reqfw',
      'prod',
      'cswpview',
      'step',
      'mtier',
      'dossier',
      'lsort',
      'lq',
    ],
    description: 'Compliance',
  },
  {
    path: exact('/migrate'),
    // New links use product ids — never the legacy q/layer/cat/industry
    // forms the page merely tolerates.
    queryKeys: ['tab', 'product', 'productIds', 'domain', 'vendor', 'open', 'share'],
    description: 'Migrate catalog',
  },
  {
    path: exact('/assess'),
    queryKeys: ['step'],
    description: 'Assessment wizard',
  },
  { path: exact('/report'), queryKeys: '*', description: 'Assessment report' },
  { path: exact('/simulation'), queryKeys: '*', description: 'Migration Simulation' },
  { path: exact('/changelog'), queryKeys: '*', description: 'Changelog' },
  { path: exact('/about'), queryKeys: '*', description: 'About' },
  { path: exact('/explore'), queryKeys: '*', description: 'Guided exploration' },
  { path: exact('/faq'), queryKeys: '*', description: 'FAQ' },
  { path: exact('/terms'), queryKeys: '*', description: 'Terms' },

  // Patents
  {
    path: exact('/patents'),
    // `patent=US<number>`; `tab=insights|explore|search`; `sq` = Search-tab query.
    queryKeys: [
      'patent',
      'tab',
      'scope',
      'search',
      'assignee',
      'inventor',
      'patentIds',
      'agility',
      'domain',
      'impact',
      'quantumTech',
      'quantumRelevance',
      'region',
      'protocol',
      'classicalAlgorithm',
      'hardwareComponent',
      'nistStatus',
      'pqc',
      'fips',
      'filingYear',
      'sort',
      'dir',
      'preset',
      'columns',
      'from',
      'sq',
    ],
    description: 'Patents',
  },

  // Learn
  {
    path: exact('/learn'),
    queryKeys: ['track', 'persona', 'mode'],
    description: 'Learn catalog',
  },
  {
    path: exact('/learn/quiz'),
    queryKeys: ['category'],
    description: 'Quiz',
  },
  {
    path: new RegExp(`^/learn/${SLUG}$`),
    queryKeys: ['tab', 'step', 'category', 'diveDeeper'],
    description: 'Learning module',
  },

  // Playground
  { path: exact('/playground'), queryKeys: ['algo', 'tab'], description: 'Playground' },
  {
    path: new RegExp(`^/playground/${SLUG}$`),
    queryKeys: ['algo', 'tab'],
    description: 'Playground tool',
  },

  // OpenSSL Studio
  { path: exact('/openssl'), queryKeys: ['cmd'], description: 'OpenSSL Studio' },

  // Business / Command Center
  // /business accepts any #step-<id> hash (numeric or slug) used by guide chunks.
  { path: exact('/business'), queryKeys: '*', description: 'Command Center' },
  { path: exact('/business/tools'), queryKeys: '*', description: 'Planning tools grid' },
  {
    path: new RegExp(`^/business/tools/${SLUG}$`),
    queryKeys: '*',
    description: 'Planning tool',
  },

  // External authoritative-source URLs (trusted-sources, leaders.website etc.)
  {
    path: /^https?:\/\/[^\s]+$/,
    queryKeys: '*',
    description: 'External authoritative URL',
  },
]

/**
 * Query keys valid on EVERY internal route. `spec=<reference_id>` opens the
 * global library document drawer (SpecDrawerHost) in place on any page.
 */
export const GLOBAL_QUERY_KEYS: readonly string[] = ['spec']

export type ValidationFailure = {
  url: string
  reason: string
}

/**
 * Validate a single deep-link URL against the grammar.
 * Returns null on success, or a failure descriptor with a human-readable reason.
 */
export function validateDeepLink(url: string): ValidationFailure | null {
  if (!url || typeof url !== 'string') {
    return { url: String(url), reason: 'empty or non-string' }
  }

  // External URLs: only check absolute http(s)
  if (/^https?:\/\//.test(url)) {
    return null
  }

  // Split path/query/hash. Hash is treated as opaque client-side anchor —
  // any deepLink whose pathname matches a route is valid regardless of #fragment.
  let pathname: string
  let search: string
  const hashIdx = url.indexOf('#')
  const queryIdx = url.indexOf('?')

  if (queryIdx >= 0) {
    pathname = url.slice(0, queryIdx)
    if (hashIdx > queryIdx) {
      search = url.slice(queryIdx + 1, hashIdx)
    } else {
      search = url.slice(queryIdx + 1)
    }
  } else if (hashIdx >= 0) {
    pathname = url.slice(0, hashIdx)
    search = ''
  } else {
    pathname = url
    search = ''
  }

  for (const pat of ROUTE_PATTERNS) {
    if (!pat.path.test(pathname)) continue
    if (pat.queryKeys === '*') return null
    if (search === '') return null
    const params = new URLSearchParams(search)
    const allowed = new Set([...pat.queryKeys, ...GLOBAL_QUERY_KEYS])
    for (const key of params.keys()) {
      if (!allowed.has(key)) {
        return {
          url,
          reason: `route "${pat.description}" does not allow query key "${key}" (allowed: ${[...allowed].join(', ') || '(none)'})`,
        }
      }
    }
    return null
  }

  return { url, reason: 'no route pattern matched' }
}

/**
 * Validate a corpus of chunks. Returns aggregated failures.
 */
export function validateCorpusDeepLinks(
  chunks: ReadonlyArray<{ id: string; source: string; deepLink?: string }>
): Array<{ id: string; source: string } & ValidationFailure> {
  const failures: Array<{ id: string; source: string } & ValidationFailure> = []
  for (const chunk of chunks) {
    if (!chunk.deepLink) continue
    const failure = validateDeepLink(chunk.deepLink)
    if (failure) {
      failures.push({ id: chunk.id, source: chunk.source, ...failure })
    }
  }
  return failures
}

/**
 * Runtime (not build-time) counterpart to `validateDeepLink` — used right
 * before navigating an Assistant-authored chat link. Unlike the build-time
 * validator, this never blocks navigation: an internal URL whose path matches
 * a known route gets any query key NOT in that route's grammar stripped (the
 * user still lands on the right page); a URL whose path matches no known
 * route, or an external URL, passes through unchanged — the grammar isn't a
 * complete map of every route, so an unmatched path is "unknown", not
 * "invalid". Returns the (possibly unchanged) url plus any keys removed, so
 * the caller can log what happened.
 */
export function sanitizeDeepLink(url: string): { url: string; strippedKeys: string[] } {
  if (!url || typeof url !== 'string' || /^https?:\/\//.test(url) || !url.startsWith('/')) {
    return { url, strippedKeys: [] }
  }

  const hashIdx = url.indexOf('#')
  const queryIdx = url.indexOf('?')
  if (queryIdx < 0) return { url, strippedKeys: [] }

  const pathname = url.slice(0, queryIdx)
  const hash = hashIdx > queryIdx ? url.slice(hashIdx) : ''
  const search = hashIdx > queryIdx ? url.slice(queryIdx + 1, hashIdx) : url.slice(queryIdx + 1)

  const pattern = ROUTE_PATTERNS.find((pat) => pat.path.test(pathname))
  if (!pattern || pattern.queryKeys === '*') return { url, strippedKeys: [] }

  const allowed = new Set([...pattern.queryKeys, ...GLOBAL_QUERY_KEYS])
  const params = new URLSearchParams(search)
  const strippedKeys: string[] = []
  for (const key of [...params.keys()]) {
    if (!allowed.has(key)) {
      params.delete(key)
      strippedKeys.push(key)
    }
  }
  if (strippedKeys.length === 0) return { url, strippedKeys: [] }

  const nextSearch = params.toString()
  return {
    url: `${pathname}${nextSearch ? `?${nextSearch}` : ''}${hash}`,
    strippedKeys,
  }
}
