// SPDX-License-Identifier: GPL-3.0-only
import { createContext } from 'react'

export interface SectionExpandContextValue {
  /** Increment to expand all CollapsibleSections in the subtree. */
  expandToken: number
  /** Increment to collapse all CollapsibleSections in the subtree. */
  collapseToken: number
}

export const SectionExpandContext = createContext<SectionExpandContextValue>({
  expandToken: 0,
  collapseToken: 0,
})
