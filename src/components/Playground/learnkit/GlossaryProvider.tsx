// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import { GlossaryContext } from './GlossaryContext'
import type { GlossaryData } from './glossaryTypes'

/** Mounted once per playground's learn hub so every sub-tab shares one rail
 * instance and one "now viewing" pin, regardless of which sub-tab the
 * hover/focus happened in. `data` is that playground's own glossary content
 * (e.g. KMIP wire tags vs. PKCS#11 attributes/mechanisms). */
export function GlossaryProvider({ data, children }: { data: GlossaryData; children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  // Default collapsed on phones/small tablets (<1024px, this app's established
  // mobile/desktop split) — the 300px-wide expanded rail otherwise crushes the
  // lesson/command content it sits beside on first load. Desktop is unaffected:
  // above 1024px this still initializes to expanded, exactly as before.
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 1023px)').matches
      : false
  )

  const value = useMemo(
    () => ({ activeKey, setActive: setActiveKey, collapsed, setCollapsed, data }),
    [activeKey, collapsed, data]
  )

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>
}
