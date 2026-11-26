// SPDX-License-Identifier: AGPL-3.0-only
import { MessageCircle } from 'lucide-react'
import { StoryButton } from '@/components/storybook'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { COPY } from './copy'

/**
 * The phone's dock on Learn screens: one thin bar with one button. It opens the Assistant sheet,
 * where the question box is focused and empty and the suggested questions are shown. The dock itself
 * holds no text box and no question.
 */
export function AssistantDock() {
  const open = useRightPanelStore((s) => s.open)
  return (
    <div
      className="fixed inset-x-0 z-mobile-dock border-t-2 border-ink bg-card px-3 py-1"
      style={{ bottom: 'var(--mobile-nav-height)' }}
    >
      <StoryButton
        variant="secondary"
        className="w-full justify-between"
        aria-label={COPY.dockAskLabel}
        onClick={() => open('chat')}
      >
        <span>{COPY.dockAsk}</span>
        <MessageCircle size={16} aria-hidden="true" />
      </StoryButton>
    </div>
  )
}
