// SPDX-License-Identifier: AGPL-3.0-only
import { useLocation, useSearchParams } from 'react-router'
import { useCatalogResultFocus } from './useCatalogResultFocus'

const CATALOG_FILTERS = ['q', 'cat', 'group', 'verb', 'difficulty', 'runs', 'runtime'] as const
type CatalogFilter = (typeof CATALOG_FILTERS)[number]

function copyFilters(query: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams()
  for (const key of CATALOG_FILTERS) {
    const value = query.get(key)
    if (value) result.set(key, value)
  }
  return result
}

export function playgroundReturnState(query: URLSearchParams, tool: string) {
  return { playgroundFilters: copyFilters(query).toString(), playgroundTool: tool }
}

export function playgroundCatalogReturn(state: unknown) {
  if (!state || typeof state !== 'object' || !('playgroundFilters' in state)) return null
  if (typeof state.playgroundFilters !== 'string') return null
  const filters = copyFilters(new URLSearchParams(state.playgroundFilters)).toString()
  const tool =
    'playgroundTool' in state && typeof state.playgroundTool === 'string'
      ? state.playgroundTool
      : ''
  return { to: `/playground${filters ? `?${filters}` : ''}`, state: { focusPlaygroundTool: tool } }
}

export function usePlaygroundCatalogState() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const setFilter = (key: CatalogFilter, value: string | null) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true, state: location.state, preventScrollReset: true }
    )
  }

  useCatalogResultFocus(location.state?.focusPlaygroundTool, 'playground')
  return { params, setParams, setFilter }
}
