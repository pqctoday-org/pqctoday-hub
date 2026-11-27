// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  FACET_KEY_BY_PAGE,
  applyGrammarChange,
  parseGrammarSearch,
  rewriteRecordAliases,
  type FacetPage,
  type GrammarChange,
  type GrammarState,
} from './recordUrl'

export interface GrammarUrl extends GrammarState {
  /** Apply one change; the history entry is added or replaced by the contract's rules. */
  change: (change: GrammarChange) => void
  setOpen: (tag: string | null) => void
  setTab: (slug: string | null) => void
  setFacet: (value: string | null) => void
}

/**
 * The URL contract for one page. Reads the state from the address, writes changes back with the
 * right history mode, and rewrites an old record key (`?id=`, `?ref=` ...) to `?open=` on arrival.
 */
export function useGrammarUrl(facetKey?: string): GrammarUrl {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const facet = facetKey ?? (FACET_KEY_BY_PAGE as Record<string, string>)[pathname as FacetPage]

  useEffect(() => {
    const rewritten = rewriteRecordAliases(pathname, search)
    if (rewritten.changed) navigate({ pathname, search: rewritten.search, hash }, { replace: true })
  }, [pathname, search, hash, navigate])

  const state = useMemo(() => parseGrammarSearch(search, facet), [search, facet])

  const change = useCallback(
    (c: GrammarChange) => {
      const next = applyGrammarChange(search, c)
      navigate({ pathname, search: next.search, hash }, { replace: next.history === 'replace' })
    },
    [navigate, pathname, search, hash]
  )

  return {
    ...state,
    change,
    setOpen: (tag) => change({ kind: 'open', tag }),
    setTab: (slug) => change({ kind: 'tab', slug }),
    setFacet: (value) => facet && change({ kind: 'facet', key: facet, value }),
  }
}

/** Just the open record: `const [open, setOpen] = useRecordParam()`. */
export function useRecordParam(): [string | null, (tag: string | null) => void] {
  const { open, setOpen } = useGrammarUrl()
  return [open, setOpen]
}
