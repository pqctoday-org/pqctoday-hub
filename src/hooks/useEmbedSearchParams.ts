// SPDX-License-Identifier: AGPL-3.0-only
/**
 * useEmbedSearchParams — `useSearchParams` for a page that can also render
 * embedded inside another page (the simulation).
 *
 * A URL-driven page embedded in /simulation must not read or write the page
 * URL: it would corrupt the simulation's own route, and React Router forbids
 * nesting a second <Router> to isolate it. So the embed wraps the page in
 * <EmbedSearchParamsProvider>, and every component inside that calls this hook
 * — the page, its filter bar, its table — shares ONE local params object with
 * the same API. Outside a provider this is exactly `useSearchParams()`.
 *
 * LibraryViewRedesign, MigrateView, ThreatsDashboard and useAlgorithmExplorer
 * each carry an older inline copy of the local-state half; new embeddable pages
 * use this instead.
 */
import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router'

export type SearchParamsTuple = ReturnType<typeof useSearchParams>

export const EmbedSearchParamsContext = createContext<SearchParamsTuple | null>(null)

export function useEmbedSearchParams(): SearchParamsTuple {
  // Always called (hook rules); ignored inside an embed.
  const real = useSearchParams()
  const embedded = useContext(EmbedSearchParamsContext)
  return embedded ?? real
}

/** True inside an <EmbedSearchParamsProvider>. */
export const useInSearchParamsEmbed = (): boolean => useContext(EmbedSearchParamsContext) !== null
