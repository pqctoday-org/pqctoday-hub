// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import { GlossaryContext } from './GlossaryContext'
import type { GlossaryData } from './glossaryTypes'

/** Mounted once per playground's learn hub so every sub-tab shares one rail
 * instance and one "now viewing" pin, regardless of which sub-tab the
 * hover/focus happened in. `data` is that playground's own glossary content
 * (e.g. KMIP wire tags vs. PKCS#11 attributes/mechanisms). */
export function GlossaryProvider({
  data,
  children,
}: {
  data: GlossaryData
  children: ReactNode
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const value = useMemo(
    () => ({ activeKey, setActive: setActiveKey, collapsed, setCollapsed, data }),
    [activeKey, collapsed, data]
  )

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
}
