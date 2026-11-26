// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { Button } from '../ui/button'
import { ObjectiveHeaderSlot } from '../Assistant/ObjectiveHeaderSlot'
import { COPY } from '../Assistant/copy'
import { useAssistantWidth } from '../Assistant/useAssistantLayout'
import type { RightPanelTab } from '@/types/HistoryTypes'

interface PanelHeaderProps {
  /** Name of what the drawer shows: the Assistant, Bookmarks or the running workshop. */
  title: string
  activeTab: RightPanelTab
  /**
   * A visible Close control. On the phone sheet it comes first in the tab order; beside the page it is the last control of the
   * header, after the width buttons. The top bar's toggle and Escape close the drawer too.
   */
  onClose?: () => void
  /** Beside the page (not the sheet): the Assistant offers Wider and Narrower buttons. */
  docked?: boolean
}

/** Wider and Narrower: the keyboard way to set the drawer's width. Not `disabled` at a limit, so focus stays. */
function WidthButtons() {
  const { width, min, max, wider, narrower } = useAssistantWidth()
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => width > min && narrower()}
        aria-disabled={width <= min || undefined}
        aria-label={COPY.narrower}
        title={COPY.narrower}
        className="min-h-[36px] min-w-[36px] p-1.5 aria-disabled:opacity-40"
      >
        <ChevronsRight size={18} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => width < max && wider()}
        aria-disabled={width >= max || undefined}
        aria-label={COPY.wider}
        title={COPY.wider}
        className="min-h-[36px] min-w-[36px] p-1.5 aria-disabled:opacity-40"
      >
        <ChevronsLeft size={18} aria-hidden="true" />
      </Button>
    </div>
  )
}

/**
 * The drawer header. There are no tabs, and no expand or minimise buttons: what the drawer shows
 * is chosen by the top bar's Assistant and Bookmarks buttons (or a running guided workshop).
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, activeTab, onClose, docked }) => {
  const close = onClose && (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClose}
      className={
        docked
          ? 'min-h-[36px] min-w-[36px] shrink-0 p-1.5'
          : 'order-last ml-auto min-h-[44px] min-w-[44px] p-2'
      }
      aria-label={COPY.close}
      title={COPY.close}
    >
      <X size={docked ? 18 : 20} aria-hidden="true" />
    </Button>
  )
  return (
    <div className="shrink-0 border-b border-border px-3 py-3 md:px-4">
      <div className="flex items-center gap-2">
        {!docked && close}
        <h2 className="min-w-0 flex-1 truncate font-display text-base font-bold text-heading">
          {title}
        </h2>
        {docked && activeTab === 'chat' && <WidthButtons />}
        {docked && close}
      </div>
      {activeTab === 'chat' && (
        <div className="mt-2">
          <ObjectiveHeaderSlot />
        </div>
      )}
    </div>
  )
}
