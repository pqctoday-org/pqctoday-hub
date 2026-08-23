// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Bot, Map, HelpCircle, BookOpen, BookOpenText, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourcesModal } from '@/components/ui/SourcesModal'
import { Glossary } from '@/components/common/Glossary'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { getMobilePageActions, type MobilePageActionId } from './getMobilePageActions'
import { useMobileWhatsNewStatus } from './mobileWhatsNew'
import { useVersionStore } from '@/store/useVersionStore'
import { MobileSheet } from '../primitives/Sheet'

const ICONS: Record<MobilePageActionId, typeof Bot> = {
  assistant: Bot,
  journey: Map,
  faq: HelpCircle,
  sources: BookOpen,
  glossary: BookOpenText,
  whatsNew: Sparkles,
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
 * Assistant/Journey reuse the existing, already-mobile-responsive RightPanel
 * (w-full below the sm breakpoint) via the same store the desktop top bar's
 * Ask/Journey buttons already write to — no new panel built. Sources and
 * Glossary reuse their real desktop content components directly. FAQ and
 * What's new navigate to their real pages.
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
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const { hasUnread, count } = useMobileWhatsNewStatus()
  const markAllSeen = useVersionStore((s) => s.markAllSeen)

  const { actions: rawActions, sourcesViewType } = getMobilePageActions(location.pathname)
  const actions = rawActions.map((action) =>
    action.id === 'whatsNew' && hasUnread
      ? { ...action, sub: `${count} since your last visit` }
      : action
  )

  const handleSelect = (id: MobilePageActionId) => {
    switch (id) {
      case 'assistant':
        onClose()
        openRightPanel('chat')
        return
      case 'journey':
        onClose()
        openRightPanel('history')
        return
      case 'faq':
        onClose()
        navigate('/faq')
        return
      case 'whatsNew':
        onClose()
        markAllSeen()
        navigate('/revisions')
        return
      case 'sources':
        onClose()
        setSourcesOpen(true)
        return
      case 'glossary':
        onClose()
        setGlossaryOpen(true)
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

      {sourcesViewType && (
        <SourcesModal
          isOpen={sourcesOpen}
          onClose={() => setSourcesOpen(false)}
          viewType={sourcesViewType}
        />
      )}
      <Glossary isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </>
  )
}
