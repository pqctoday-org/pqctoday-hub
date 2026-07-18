// SPDX-License-Identifier: GPL-3.0-only
import { createContext, useContext } from 'react'
import type { GlossaryData } from './glossaryTypes'

const EMPTY_DATA: GlossaryData = { tagGlossary: {}, terms: [], lookupDef: () => undefined }

interface GlossaryContextValue {
  /** The glossary key (a `tagGlossary` name or `terms[].id`) currently
   * hovered/focused anywhere on the page — drives the rail's pinned card. */
  activeKey: string | null
  setActive: (key: string) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  /** This playground's glossary content, supplied by `GlossaryProvider`. */
  data: GlossaryData
}

export const GlossaryContext = createContext<GlossaryContextValue>({
  activeKey: null,
  setActive: () => {},
  collapsed: false,
  setCollapsed: () => {},
  data: EMPTY_DATA,
})

export const useGlossary = () => useContext(GlossaryContext)
