// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { StoryButton } from '@/components/storybook'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY } from './copy'
import { useAssistantLayout } from './useAssistantLayout'

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

  return (
    <div
      role="navigation"
      aria-label="Return"
      className="flex items-center gap-2 border-b border-border bg-highlight px-4 py-1 text-sm text-heading print:hidden"
    >
      <StoryButton variant="quiet" onClick={goBack} className="gap-1">
        <ArrowLeft size={14} aria-hidden="true" />
        {label}
      </StoryButton>
    </div>
  )
}
