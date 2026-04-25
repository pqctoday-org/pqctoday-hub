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
  {
    path: exact('/timeline'),
    queryKeys: ['country', 'region', 'q', 'evref'],
    description: 'Timeline',
  },
  {
    path: exact('/algorithms'),
    queryKeys: ['highlight', 'tab', 'subtab', 'compare', 'family', 'level', 'fn', 'q'],
    description: 'Algorithms',
  },
  {
    path: exact('/library'),
    queryKeys: ['ref', 'cat', 'org', 'ind', 'view', 'sort', 'q'],
    description: 'Library',
  },
  {
    path: exact('/threats'),
    queryKeys: ['id', 'industry', 'criticality', 'q', 'sort', 'dir'],
    description: 'Threats',
  },
  {
    path: exact('/leaders'),
    queryKeys: ['leader', 'sector', 'country', 'cat', 'region', 'q', 'view'],
    description: 'Leaders',
  },
  {
    path: exact('/compliance'),
    queryKeys: [
      'tab',
      'q',
      'cert',
      'mcat',
      'org',
      'ind',
      'vendor',
      'pqc',
      'cat',
      'src',
      'rtab',
      'evref',
    ],
    description: 'Compliance',
  },
  {
    path: exact('/migrate'),
    queryKeys: [
      'q',
      'layer',
      'cat',
      'subcat',
      'vendor',
      'verification',
      'industry',
      'step',
      'mode',
      'software',
    ],
    description: 'Migrate catalog',
  },
  {
    path: exact('/assess'),
    queryKeys: ['step'],
    description: 'Assessment wizard',
  },
  { path: exact('/report'), queryKeys: '*', description: 'Assessment report' },
  { path: exact('/changelog'), queryKeys: '*', description: 'Changelog' },
  { path: exact('/about'), queryKeys: '*', description: 'About' },
  { path: exact('/explore'), queryKeys: '*', description: 'Guided exploration' },
  { path: exact('/faq'), queryKeys: '*', description: 'FAQ' },
  { path: exact('/terms'), queryKeys: '*', description: 'Terms' },

  // Patents
  {
    path: exact('/patents'),
    queryKeys: [
      'tab',
      'patent',
      'search',
      'assignee',
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
    ],
    description: 'Patents',
  },

  // Learn
  {
    path: exact('/learn'),
    queryKeys: ['track', 'persona'],
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
    const allowed = new Set(pat.queryKeys)
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
