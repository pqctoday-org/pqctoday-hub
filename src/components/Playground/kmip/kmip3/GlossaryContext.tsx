// SPDX-License-Identifier: GPL-3.0-only
import { createContext, useContext } from 'react'

interface GlossaryContextValue {
  /** The glossary key (a TAG_GLOSSARY tag name or TERMS id) currently
   * hovered/focused anywhere on the page — drives the rail's pinned card. */
  activeKey: string | null
  setActive: (key: string) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export const GlossaryContext = createContext<GlossaryContextValue>({
  activeKey: null,
  setActive: () => {},
  collapsed: false,
  setCollapsed: () => {},
})

export const useGlossary = () => useContext(GlossaryContext)
