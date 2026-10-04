// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { ROUTE_META } from './routeMeta'
import { TOOL_ROUTE_META } from './toolRouteMeta.generated'
import { SEARCH_ROUTES, getSearchRoute, indexableRoutes } from './searchRoutes'

const LAB_PATHS = [
  '/playground/interactive',
  '/playground/hsm',
  '/playground/cacp',
  '/playground/docker',
]

describe('search route manifest', () => {
  it('contains every registry route in both directions', () => {
    const expected = new Set([
      ...Object.keys(ROUTE_META),
      ...BUSINESS_TOOLS.map((tool) => `/business/tools/${tool.id}`),
      ...WORKSHOP_TOOLS.map((tool) => `/playground/${tool.id}`),
      ...LAB_PATHS,
    ])
    expect(new Set(SEARCH_ROUTES.map((route) => route.path))).toEqual(expected)
  })

  it('has no duplicate or reserved-path collision', () => {
    const paths = SEARCH_ROUTES.map((route) => route.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(WORKSHOP_TOOLS.filter((tool) => LAB_PATHS.includes(`/playground/${tool.id}`))).toEqual(
      []
    )
  })

  it('classifies the exact current inventory', () => {
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'business-tool')).toHaveLength(37)
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'browser-tool')).toHaveLength(34)
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'sandbox-tool')).toHaveLength(24)
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'lab')).toHaveLength(4)
    // Pages other than Learn modules are pinned; the Learn module pages and the total follow from the
    // module catalog and the two sources, so adding a module or a tool does not need a second edit here.
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'page')).toHaveLength(26)
    expect(SEARCH_ROUTES.filter((route) => route.kind === 'learn')).toHaveLength(MANIFESTS.length)
    expect(indexableRoutes()).toHaveLength(Object.keys(ROUTE_META).length + TOOL_ROUTE_META.length)
  })

  it('gives tool routes unique metadata and a content region', () => {
    for (const route of SEARCH_ROUTES.filter((candidate) => candidate.kind.includes('tool'))) {
      expect(route.title).toContain('PQC Today')
      expect(route.description.length).toBeGreaterThan(20)
      expect(route.description.length).toBeLessThanOrEqual(160)
      expect(route.contentRegion).toBe('#main-content')
      expect(getSearchRoute(`${route.path}/`)).toEqual(route)
    }
  })
})

describe('the tool count quoted in page copy is the real one', () => {
  it('is the number of Business Tools in the registry', () => {
    expect(ROUTE_META['/business/tools']!.description).toContain(
      `${BUSINESS_TOOLS.length} interactive business planning tools`
    )
  })
})
