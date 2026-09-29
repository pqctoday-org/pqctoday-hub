// SPDX-License-Identifier: GPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  GLOBAL_QUERY_KEYS,
  ROUTE_PATTERNS,
  sanitizeDeepLink,
  validateDeepLink,
} from './deepLinkGrammar'

describe('sanitizeDeepLink', () => {
  it('leaves a fully valid internal link unchanged', () => {
    expect(sanitizeDeepLink('/algorithms?tab=support&matrixView=detailed')).toEqual({
      url: '/algorithms?tab=support&matrixView=detailed',
      strippedKeys: [],
    })
  })

  it('strips an unrecognized query key while keeping valid ones and the target route', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&bogus=1')
    expect(result.url).toBe('/algorithms?tab=support')
    expect(result.strippedKeys).toEqual(['bogus'])
  })

  it('strips the dead subtab param specifically', () => {
    const result = sanitizeDeepLink('/algorithms?tab=detailed&subtab=performance')
    expect(result.url).toBe('/algorithms?tab=detailed')
    expect(result.strippedKeys).toEqual(['subtab'])
  })

  it('strips multiple unrecognized keys', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&foo=1&bar=2')
    expect(result.url).toBe('/algorithms?tab=support')
    expect(result.strippedKeys).toEqual(['foo', 'bar'])
  })

  it('leaves a path with no query string unchanged', () => {
    expect(sanitizeDeepLink('/algorithms')).toEqual({ url: '/algorithms', strippedKeys: [] })
  })

  it('leaves routes with a free-form (*) query grammar unchanged', () => {
    expect(sanitizeDeepLink('/report?anything=goes&here=too')).toEqual({
      url: '/report?anything=goes&here=too',
      strippedKeys: [],
    })
  })

  it('leaves an unmatched path unchanged rather than stripping everything', () => {
    const url = '/some-future-page?whatever=1'
    expect(sanitizeDeepLink(url)).toEqual({ url, strippedKeys: [] })
  })

  it('leaves external URLs unchanged', () => {
    const url = 'https://example.com/?utm_source=chat'
    expect(sanitizeDeepLink(url)).toEqual({ url, strippedKeys: [] })
  })

  it('preserves a hash fragment after stripping', () => {
    const result = sanitizeDeepLink('/algorithms?tab=support&bogus=1#section')
    expect(result.url).toBe('/algorithms?tab=support#section')
    expect(result.strippedKeys).toEqual(['bogus'])
  })
})

// ── Per-route key sets ──────────────────────────────────────────────────────
// Pins EXACTLY the params each page reads (canonical forms only). Changing a
// page's URL contract must change this table, the grammar and promptBuilder's
// page guide together.
const EXPECTED_KEYS: Record<string, readonly string[]> = {
  '/timeline': [
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
  '/algorithms': [
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
  '/library': [
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
  '/threats': [
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
  '/leaders': [
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
  '/compliance': [
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
  '/migrate': ['tab', 'product', 'productIds', 'domain', 'vendor', 'open', 'share'],
  '/patents': [
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
}

function keysFor(path: string): readonly string[] {
  const pat = ROUTE_PATTERNS.find((p) => p.path.test(path))
  if (!pat || pat.queryKeys === '*') throw new Error(`no finite grammar for ${path}`)
  return pat.queryKeys
}

describe('deep-link grammar per-route key sets', () => {
  it.each(Object.keys(EXPECTED_KEYS))('%s allows exactly the pinned keys', (path) => {
    expect([...keysFor(path)].sort()).toEqual([...EXPECTED_KEYS[path]].sort())
  })

  it('has no duplicate keys on any route', () => {
    for (const pat of ROUTE_PATTERNS) {
      if (pat.queryKeys === '*') continue
      expect(new Set(pat.queryKeys).size, pat.description).toBe(pat.queryKeys.length)
    }
  })

  it('allows `spec` on every internal route', () => {
    expect(GLOBAL_QUERY_KEYS).toContain('spec')
    for (const url of [
      '/library?spec=FIPS-203',
      '/migrate?spec=X',
      '/learn/pqc-101?spec=RFC-9629',
    ]) {
      expect(validateDeepLink(url)).toBeNull()
      expect(sanitizeDeepLink(url).strippedKeys).toEqual([])
    }
  })

  it('rejects the dead / legacy params the Assistant must no longer emit', () => {
    const dead = [
      '/migrate?q=OpenSSL',
      '/migrate?layer=Libraries',
      '/migrate?industry=Finance',
      '/timeline?evref=FIPS-203',
      '/library?ind=Finance',
      '/leaders?view=table',
      '/compliance?page=2',
    ]
    for (const url of dead) expect(validateDeepLink(url), url).not.toBeNull()
  })

  it('accepts the canonical resource links', () => {
    const ok = [
      '/patents?patent=US12676741',
      '/migrate?product=openssl-3-5',
      '/migrate?tab=roadmaps&vendor=VND-001',
      '/compliance?framework=nist-ir-8547',
      '/timeline?event=US-NIST-2024-01',
      '/leaders?leader=Dustin%20Moody',
      '/algorithms?algo=ml-kem-768',
    ]
    for (const url of ok) expect(validateDeepLink(url), url).toBeNull()
  })
})

// ── Static guard: every grammar key is referenced by the page ──────────────
// Cheap, deterministic drift check. For each page route, every allowed key
// must appear as a quoted string literal ('key', "key" or `key`) somewhere in
// that page's own source (non-test .ts/.tsx). Keys that legitimately live
// elsewhere, or that land with the page-side PR, are listed explicitly.
const ROOT = path.resolve(__dirname, '../../..')

const PAGE_SOURCES: Record<string, readonly string[]> = {
  '/timeline': ['src/components/Timeline'],
  '/algorithms': ['src/components/Algorithms'],
  '/library': ['src/components/Library'],
  // ?prefs=off is read by the shared persona-defaults hook ThreatsDashboard uses.
  '/threats': ['src/components/Threats', 'src/hooks/usePersonaDefaults.ts'],
  '/leaders': ['src/components/Leaders'],
  '/compliance': ['src/components/Compliance'],
  '/migrate': ['src/components/Migrate'],
  '/patents': ['src/components/Patents'],
}

/**
 * Keys the page does not reference YET because the page-side deep-link PR
 * (PR 2) adds them. Delete an entry once the page references the key, so
 * the guard covers it again.
 */
const PENDING_PAGE_KEYS: Record<string, readonly string[]> = {
  '/timeline': ['docview', 'etype', 'deadlines', 'gsort', 'gdir'],
  '/algorithms': ['algo', 'usecase', 'attack', 'engine', 'case', 'matrixHighlight'],
  '/library': [],
  '/threats': ['protocol', 'threattab'],
  '/leaders': ['tsort', 'tdir'],
  '/compliance': ['reqfw', 'prod', 'cswpview', 'step', 'mtier', 'dossier', 'lsort', 'lq'],
  '/migrate': ['domain', 'vendor', 'open'],
  '/patents': ['sq'],
}

function collectSource(rel: string): string {
  const abs = path.join(ROOT, rel)
  const stat = fs.statSync(abs)
  if (stat.isFile()) return fs.readFileSync(abs, 'utf-8')
  let out = ''
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(rel, entry.name)
    if (entry.isDirectory()) out += collectSource(child)
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      out += fs.readFileSync(path.join(ROOT, child), 'utf-8')
  }
  return out
}

function referencesKey(src: string, key: string): boolean {
  return src.includes(`'${key}'`) || src.includes(`"${key}"`) || src.includes(`\`${key}\``)
}

describe('deep-link grammar ↔ page source guard', () => {
  it.each(Object.keys(PAGE_SOURCES))('every %s grammar key is read by the page', (route) => {
    const src = PAGE_SOURCES[route].map(collectSource).join('\n')
    const pending = new Set(PENDING_PAGE_KEYS[route])
    const missing = keysFor(route).filter((k) => !pending.has(k) && !referencesKey(src, k))
    expect(missing, `${route}: grammar keys the page never references`).toEqual([])
  })

  it('covers every pinned page route', () => {
    expect(Object.keys(PAGE_SOURCES).sort()).toEqual(Object.keys(EXPECTED_KEYS).sort())
  })
})
