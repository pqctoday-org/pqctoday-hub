// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { StoryButton } from '@/components/storybook'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY } from './copy'
import { useAssistantLayout } from './useAssistantLayout'

/**
 * The modal dialog that currently covers the page, if any. A page the learner was sent to can open
 * its own detail dialog on arrival; its backdrop sits over the page chrome, and a screen reader
 * treats everything outside a modal dialog as unavailable. The Assistant's own sheet is not counted.
 */
function useCoveringModal(active: boolean): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!active) {
      setHost(null)
      return
    }
    let frame = 0
    const look = () => {
      frame = 0
      const modals = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-modal="true"]:not([data-assistant-layout])')
      )
      setHost(modals.at(-1) ?? null)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(look)
    }
    look()
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal'],
    })
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [active])
  return host
}

/**
 * The one return control of a page opened from an answer. Desktop: "Back to your answer", which
 * reopens the drawer where it was. Phone: "Back to <page>", naming where it goes.
 */
export function AssistantReturnBar() {
  const target = useAssistantReturnStore((s) => s.target)
  const landedPath = useAssistantReturnStore((s) => s.landedPath)
  const land = useAssistantReturnStore((s) => s.land)
  const clear = useAssistantReturnStore((s) => s.clear)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const layout = useAssistantLayout()
  const covering = useCoveringModal(Boolean(target) && landedPath !== null)

  // The first page reached after the short address resolves is the page the row opened. Moving on
  // from it ends the return.
  useEffect(() => {
    if (!target) return
    const here = `${pathname}${search}`
    if (pathname.startsWith('/go/')) return
    if (landedPath === null) {
      if (here !== target.path) land(here)
      return
    }
    if (here !== landedPath) clear()
  }, [target, landedPath, pathname, search, land, clear])

  if (!target || landedPath === null) return null

  const phone = layout === 'sheet'
  const label = phone ? `Back to ${target.label}` : COPY.backToAnswer

  const goBack = () => {
    const destination = target.path
    clear()
    navigate(destination)
    if (!phone) useRightPanelStore.getState().open('chat')
  }

  const button = (
    <StoryButton variant="quiet" onClick={goBack} className="gap-1">
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </StoryButton>
  )

  // Under a modal dialog the bar would sit behind its backdrop and outside what assistive
  // technology can reach. It then lives inside that dialog, fixed at the top corner above its
  // content, so a pointer, the keyboard and a screen reader all reach it. One control at a time.
  if (covering) {
    return createPortal(
      <div
        role="navigation"
        aria-label="Return"
        className="fixed left-4 z-return-bar flex items-center rounded-full border-2 border-ink bg-highlight px-1 text-sm text-heading shadow-lg print:hidden"
        style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {button}
      </div>,
      covering
    )
  }

  return (
    <div
      role="navigation"
      aria-label="Return"
      className="flex items-center gap-2 border-b border-border bg-highlight px-4 py-1 text-sm text-heading print:hidden"
    >
      {button}
    </div>
  )
}
