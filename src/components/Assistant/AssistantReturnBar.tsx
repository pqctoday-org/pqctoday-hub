// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { StoryButton } from '@/components/storybook'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY } from './copy'
import { useAssistantLayout } from './useAssistantLayout'
import { usePageModal } from './usePageModal'

function useCoveringModal(active: boolean): HTMLElement | null {
  const modal = usePageModal()
  return active ? modal : null
}

/**
 * Focus goes back to the row action that opened the page, once the drawer shows the answer again.
 * The drawer may need a moment to mount, so the look is repeated for a short while.
 */
function focusOrigin(origin: string | undefined): void {
  if (!origin) return
  let tries = 0
  const look = () => {
    const el = document.querySelector<HTMLElement>(
      `[data-assistant-layout] button[aria-label="${CSS.escape(origin)}"]`
    )
    if (el) {
      el.focus()
      el.scrollIntoView?.({ block: 'nearest' })
    } else if (++tries < 30) {
      requestAnimationFrame(look)
    }
  }
  requestAnimationFrame(look)
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
  const { pathname, search, key } = useLocation()
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
      // Still on the entry the row was used on: its navigation has not arrived yet.
      if (key === target.fromKey) return
      // The row's own navigation stayed on the page the learner was on (a link to this page, or a
      // hash-only link): nothing was opened, so there is nothing to return from.
      if (here === target.path || pathname === target.path.split(/[?#]/)[0]) clear()
      else land(here)
      return
    }
    // The page rewriting its own address (adding a preference, tidying the record's name) or the
    // learner changing a filter or closing the record is still that page. Another page ends it.
    if (pathname !== landedPath.split(/[?#]/)[0]) clear()
  }, [target, landedPath, pathname, search, key, land, clear])

  if (!target || landedPath === null) return null

  const phone = layout === 'sheet'
  const label = phone ? `Back to ${target.label}` : COPY.backToAnswer

  const goBack = () => {
    const destination = target.path
    clear()
    navigate(destination)
    if (!phone) {
      useRightPanelStore.getState().open('chat')
      focusOrigin(target.origin)
    }
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
