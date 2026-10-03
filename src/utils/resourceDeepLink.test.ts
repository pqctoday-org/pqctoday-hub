import { describe, expect, it } from 'vitest'
import { ROUTE_PATTERNS } from '@/services/search/deepLinkGrammar'
import {
  RESOURCE_PARAMS,
  isResourceDeepLink,
  isSameRoute,
  resourceDeepLinkRoute,
} from './resourceDeepLink'

describe('isResourceDeepLink', () => {
  it.each([
    ['/threats', '?id=FIN-001'],
    ['/library', '?ref=FIPS%20203'],
    ['/library/', '?ref=FIPS%20203'],
    ['/patents', '?patent=US12676741'],
    ['/algorithms', '?tab=support&protocol=ssh'],
    ['/algorithms', '?highlight=ML-KEM-768'],
    ['/timeline', '?event=PQC%20Best%20Practices%20Published'],
    ['/timeline', '?country=France'],
    ['/migrate', '?productIds=softhsm2'],
    ['/leaders', '?leader=Stavros%20Kousidis'],
    ['/compliance', '?framework=CNSA-2'],
    ['/compliance', '?cert=5528'],
    ['/compliance', '?tab=cswp39&evref=CMMC-2.0-MODEL'],
    ['/timeline', '?spec=KpqC-Competition-Results'],
    ['/algorithms', '?try=ml-kem-demo'],
  ])('%s%s is a resource link', (path, search) => {
    expect(isResourceDeepLink(path, search)).toBe(true)
  })

  it.each([
    ['/library', ''],
    ['/library', '?view=table'],
    ['/compliance', '?tab=records'],
    ['/algorithms', '?tab=detailed'],
    ['/leaders', '?leader='],
    ['/', '?ref=FIPS%20203'],
  ])('%s%s is not a resource link', (path, search) => {
    expect(isResourceDeepLink(path, search)).toBe(false)
  })
})

describe('every grammar key is classified (resource vs view/filter)', () => {
  // Params that change what a page SHOWS (tab, filter, sort, layout) rather
  // than naming one item. Only resource params skip the phone role picker.
  // A key added to the Assistant grammar for one of these routes fails this
  // test until it is put in RESOURCE_PARAMS or here — the allow-list missed
  // every item param PR 2 added (deep-link refresh audit, 2026-10-02).
  const VIEW_PARAMS: Record<string, readonly string[]> = {
    '/library': [
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
    '/patents': [
      'tab',
      'scope',
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
    '/algorithms': [
      'tab',
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
      'matrixView',
      'matrixQ',
      'matrixStatus',
      'matrixAvailability',
      'matrixSort',
      'matrixHighlight',
      'cmp',
      'mechanism',
    ],
    '/timeline': [
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
    '/migrate': ['tab', 'rq', 'facet'],
    '/leaders': [
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
      'lsort',
      'lq',
    ],
  }

  it.each(Object.keys(RESOURCE_PARAMS))('%s', (route) => {
    const pattern = ROUTE_PATTERNS.find((p) => p.path.test(route))
    expect(pattern, `no grammar route for ${route}`).toBeDefined()
    const grammarKeys = pattern!.queryKeys
    expect(grammarKeys).not.toBe('*')
    const resource = RESOURCE_PARAMS[route]
    const view = VIEW_PARAMS[route] ?? []
    const unclassified = (grammarKeys as readonly string[]).filter(
      (k) => !resource.includes(k) && !view.includes(k)
    )
    expect(unclassified, `classify these ${route} keys`).toEqual([])
    expect(resource.filter((k) => view.includes(k))).toEqual([])
    // A resource param the Assistant cannot emit would be dead weight here.
    expect(resource.filter((k) => !(grammarKeys as readonly string[]).includes(k))).toEqual([])
  })

  it.each([
    ['/migrate', '?tab=roadmaps&vendor=VND-001'],
    ['/migrate', '?domain=hsm'],
    ['/compliance', '?reqfw=CNSA-2'],
    ['/algorithms', '?tab=landscape&usecase=uc-1'],
    ['/patents', '?inventor=Jane%20Doe'],
  ])('%s%s skips the role picker', (path, search) => {
    expect(isResourceDeepLink(path, search)).toBe(true)
  })
})

describe('resourceDeepLinkRoute', () => {
  it('returns the normalised route for a resource link and null otherwise', () => {
    expect(resourceDeepLinkRoute('/library/', '?ref=X')).toBe('/library')
    expect(resourceDeepLinkRoute('/library', '')).toBeNull()
  })

  it('compares routes ignoring a trailing slash', () => {
    expect(isSameRoute('/library/', '/library')).toBe(true)
    expect(isSameRoute('/library', '/patents')).toBe(false)
  })
})
