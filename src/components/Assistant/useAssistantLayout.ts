// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState, type CSSProperties } from 'react'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import {
  ASSISTANT_WIDTH_MAX,
  ASSISTANT_WIDTH_MIN,
  automaticWidth,
  clampWidth,
  maxWidthFor,
  useAssistantWidthStore,
} from '@/store/useAssistantWidthStore'
import type { RightPanelTab } from '@/types/HistoryTypes'

/** Width below which the Hub itself gets the full-screen sheet (the `lg` breakpoint). */
const SHEET_QUERY = '(max-width: 1023px)'
/** Embedded pages keep the docked drawer down to a phone's width. */
const SHEET_QUERY_EMBEDDED = '(max-width: 639px)'

function useNarrowViewport(query: string): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [query])
  return narrow
}

/**
 * `docked`: the drawer beside the page, which stays usable (no focus lock).
 * `sheet`: the full-screen sheet of the phone and the tablet, which holds focus until closed.
 */
export function useAssistantLayout(): 'docked' | 'sheet' {
  const mobileShell = useIsMobileShell()
  const embedded = useIsEmbedded()
  const narrow = useNarrowViewport(embedded ? SHEET_QUERY_EMBEDDED : SHEET_QUERY)
  return mobileShell || narrow ? 'sheet' : 'docked'
}

function useWindowWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  )
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/** What the width control needs: the width now, its limits in this window, and the ways to change it. */
export function useAssistantWidth() {
  const viewport = useWindowWidth()
  const stored = useAssistantWidthStore((s) => s.width)
  const setWidth = useAssistantWidthStore((s) => s.setWidth)
  const wider = useAssistantWidthStore((s) => s.wider)
  const narrower = useAssistantWidthStore((s) => s.narrower)
  const reset = useAssistantWidthStore((s) => s.reset)
  const width = stored === null ? automaticWidth(viewport) : clampWidth(stored, viewport)
  return {
    width,
    min: ASSISTANT_WIDTH_MIN,
    max: Math.min(ASSISTANT_WIDTH_MAX, maxWidthFor(viewport)),
    setWidth,
    wider,
    narrower,
    reset,
  }
}

/** The docked drawer's width in pixels: the learner's choice, else 520 on a wide window and 400 on a narrower one. */
export function useAssistantDrawerWidth(): number {
  return useAssistantWidth().width
}

/**
 * Right padding that keeps the page usable beside a docked drawer, as an inline style because the
 * width is a number the learner can change. The guided workshop keeps its own, wider width.
 */
export function drawerPaddingStyle(
  isOpen: boolean,
  layout: 'docked' | 'sheet',
  tab: RightPanelTab,
  width: number
): CSSProperties | undefined {
  if (!isOpen || layout === 'sheet' || tab === 'workshop') return undefined
  return { paddingRight: width }
}

/** The workshop's own padding: a class, so the style scanner sees it. */
export function drawerPaddingClass(
  isOpen: boolean,
  layout: 'docked' | 'sheet',
  tab: RightPanelTab
): string {
  return isOpen && layout === 'docked' && tab === 'workshop' ? 'sm:pr-[40vw]' : ''
}
