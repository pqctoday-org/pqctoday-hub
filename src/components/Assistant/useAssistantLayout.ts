// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import type { RightPanelTab } from '@/types/HistoryTypes'

/** Width below which even a desktop browser gets the full-screen sheet. */
const SHEET_QUERY = '(max-width: 639px)'

/** The drawer is 400 px wide beside the page. */
export const ASSISTANT_DRAWER_WIDTH_PX = 400

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(SHEET_QUERY).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(SHEET_QUERY)
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return narrow
}

/**
 * `docked`: the 400 px drawer beside the page, which stays usable (no focus lock).
 * `sheet`: the full-screen sheet of the phone, which holds focus until closed.
 */
export function useAssistantLayout(): 'docked' | 'sheet' {
  const mobileShell = useIsMobileShell()
  const narrow = useNarrowViewport()
  return mobileShell || narrow ? 'sheet' : 'docked'
}

/**
 * Right padding that keeps the page usable beside a docked drawer. Written out in full so the
 * style scanner sees each class. The guided workshop keeps its own, wider width.
 */
export function drawerPaddingClass(
  isOpen: boolean,
  layout: 'docked' | 'sheet',
  tab: RightPanelTab
): string {
  if (!isOpen || layout === 'sheet') return ''
  return tab === 'workshop' ? 'sm:pr-[40vw]' : 'pr-[400px]'
}
