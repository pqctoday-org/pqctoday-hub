// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import { GlossaryContext } from './GlossaryContext'

/** Mounted once at the Kmip3View level so all 4 sub-tabs (Learn, Reference,
 * Corpus Replay, Batch & Macros) share one rail instance and one "now
 * viewing" pin, regardless of which sub-tab the hover/focus happened in. */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const value = useMemo(
    () => ({ activeKey, setActive: setActiveKey, collapsed, setCollapsed }),
    [activeKey, collapsed]
  )

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
}
