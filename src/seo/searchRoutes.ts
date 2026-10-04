// SPDX-License-Identifier: GPL-3.0-only
import { ROUTE_META, isNoindexRoute } from './routeMeta'
import { TOOL_ROUTE_META, type ToolRouteKind } from './toolRouteMeta.generated'

export type SearchRouteKind = 'page' | 'learn' | ToolRouteKind

export interface SearchRoute {
  path: string
  kind: SearchRouteKind
  index: boolean
  title: string
  description: string
  sourceGlobs?: string[]
  contentRegion: string
}

const existing: SearchRoute[] = Object.entries(ROUTE_META).map(([path, meta]) => ({
  path,
  kind: path.startsWith('/learn/') ? 'learn' : 'page',
  index: !isNoindexRoute(path),
  title: meta.title,
  description: meta.description,
  contentRegion: path === '/simulation' ? 'main' : '#main-content',
}))

export const SEARCH_ROUTES: readonly SearchRoute[] = [...existing, ...TOOL_ROUTE_META].sort(
  (a, b) => a.path.localeCompare(b.path)
)

const byPath = new Map(SEARCH_ROUTES.map((route) => [route.path, route]))

if (byPath.size !== SEARCH_ROUTES.length) {
  throw new Error('search route manifest contains duplicate paths')
}

export function normalizeSearchPath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export function getSearchRoute(pathname: string): SearchRoute | undefined {
  return byPath.get(normalizeSearchPath(pathname))
}

export function indexableRoutes(): readonly SearchRoute[] {
  return SEARCH_ROUTES.filter((route) => route.index)
}

export function minimumContentCharacters(route: SearchRoute): number {
  if (
    route.kind === 'business-tool' ||
    route.kind === 'browser-tool' ||
    route.kind === 'sandbox-tool' ||
    route.kind === 'lab'
  ) {
    return 400
  }
  if (route.path === '/navigate' || route.path === '/simulation') return 300
  return 600
}
