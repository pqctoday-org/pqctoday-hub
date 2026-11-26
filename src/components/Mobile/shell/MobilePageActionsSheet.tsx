// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  Bot,
  Map,
  Bookmark,
  HelpCircle,
  BookOpen,
  BookOpenText,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { getMobilePageActions, type MobilePageActionId } from './getMobilePageActions'
import { useMobileWhatsNewStatus } from './mobileWhatsNew'
import { useVersionStore } from '@/store/useVersionStore'
import { MobileSheet } from '../primitives/Sheet'

const ICONS: Record<MobilePageActionId, typeof Bot> = {
  assistant: Bot,
  journey: Map,
  bookmarks: Bookmark,
  faq: HelpCircle,
  sources: BookOpen,
  glossary: BookOpenText,
  whatsNew: Sparkles,
  about: Info,
}

export interface MobilePageActionsSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * The ⋯ sheet (handoff "⋯ page-actions sheet") — route-aware: only actions
 * the current route registers appear, using the same gates the desktop top
 * bar uses (getMobilePageActions). Omits a disabled row entirely rather
 * than rendering one that does nothing, per the handoff's own rule.
 *
 * Assistant, Bookmarks and FAQ open the drawer's full-screen sheet (RightPanel) through the same
 * store the desktop top bar writes to; so do Sources and Glossary. Your journey goes to Learn.
 * What's new and About navigate to their real pages.
 *
 * What's new's sub-label ("N since your last visit", handoff: "'What's new'
 * carries its unread count") overrides getMobilePageActions' static "Recent
 * changes to this site" when there really is unread news — that function is
 * pure (pathname → actions), so live unread state is layered on here rather
 * than threaded through it. Opening the row marks the version seen, exactly
 * as dismissing the desktop WhatsNewModal already does, so the dot clears
 * once the user has actually looked.
 */
export function MobilePageActionsSheet({ open, onClose }: MobilePageActionsSheetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const openRightPanel = useRightPanelStore((s) => s.open)
  const nextPanel = useRef<'chat' | 'bookmarks' | 'faq' | 'sources' | 'glossary' | null>(null)
  const { hasUnread, count } = useMobileWhatsNewStatus()
  const markAllSeen = useVersionStore((s) => s.markAllSeen)

  const { actions: rawActions } = getMobilePageActions(location.pathname)
  const actions = rawActions.map((action) =>
    action.id === 'whatsNew' && hasUnread
      ? { ...action, sub: `${count} since your last visit` }
      : action
  )

  useEffect(() => {
    if (open || !nextPanel.current) return
    // The sheet restores focus to More during cleanup. Open the drawer after
    // that restoration so its focus lock captures the persistent trigger.
    const tab = nextPanel.current
    nextPanel.current = null
    openRightPanel(tab)
  }, [open, openRightPanel])

  const handleSelect = (id: MobilePageActionId) => {
    switch (id) {
      case 'assistant':
        nextPanel.current = 'chat'
        onClose()
        return
      case 'bookmarks':
        nextPanel.current = 'bookmarks'
        onClose()
        return
      case 'faq':
        // On the phone the FAQ is a sheet over the page.
        nextPanel.current = 'faq'
        onClose()
        return
      case 'journey':
        // The old Journey tab moved to Learn › Your journey.
        onClose()
        navigate('/learn?view=journey')
        return
      case 'whatsNew':
        onClose()
        markAllSeen()
        navigate('/revisions')
        return
      case 'sources':
        nextPanel.current = 'sources'
        onClose()
        return
      case 'glossary':
        nextPanel.current = 'glossary'
        onClose()
        return
      case 'about':
        onClose()
        navigate('/about')
        return
    }
  }

  return (
    <>
      <MobileSheet open={open} onClose={onClose} testId="mobile-page-actions-sheet">
        <div className="divide-y divide-border">
          {actions.map(({ id, label, sub }) => {
            const Icon = ICONS[id]
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                onClick={() => handleSelect(id)}
                className="flex h-auto min-h-[44px] w-full items-center justify-start gap-3 rounded-none px-1 py-2.5 text-left"
              >
                <Icon size={16} aria-hidden="true" className="shrink-0 text-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-foreground">{label}</span>
                  <span className="block text-[10.5px] text-muted-foreground">{sub}</span>
                </span>
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
              </Button>
            )
          })}
        </div>
      </MobileSheet>
    </>
  )
}
