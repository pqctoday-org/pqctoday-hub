// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Scope for a URL-driven page rendered inside another page: every
 * `useEmbedSearchParams()` call underneath shares this local params state
 * instead of the real page URL. See src/hooks/useEmbedSearchParams.ts.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { EmbedSearchParamsContext, type SearchParamsTuple } from '@/hooks/useEmbedSearchParams'

export function EmbedSearchParamsProvider({
  initial,
  children,
}: {
  /** Starting params, e.g. `industry=Telecommunications`. */
  initial?: string
  children: ReactNode
}) {
  const [params, setParamsState] = useState(() => new URLSearchParams(initial ?? ''))
  const setParams = useCallback<SearchParamsTuple[1]>(
    (nextInit) =>
      setParamsState((prev) => {
        const next = new URLSearchParams(
          typeof nextInit === 'function'
            ? (nextInit(prev) as URLSearchParams)
            : (nextInit as URLSearchParams)
        )
        // Keep the same object when unchanged, as the real setter does, so
        // params-keyed effects don't re-fire forever.
        return next.toString() === prev.toString() ? prev : next
      }),
    []
  )
  const value = useMemo<SearchParamsTuple>(() => [params, setParams], [params, setParams])
  return (
    <EmbedSearchParamsContext.Provider value={value}>{children}</EmbedSearchParamsContext.Provider>
  )
}
