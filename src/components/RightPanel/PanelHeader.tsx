// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { ObjectiveHeaderSlot } from '../Assistant/ObjectiveHeaderSlot'
import type { RightPanelTab } from '@/types/HistoryTypes'

interface PanelHeaderProps {
  /** Name of what the drawer shows: the Assistant, Bookmarks or the running workshop. */
  title: string
  activeTab: RightPanelTab
  /** On the phone sheet a Close control comes first in the tab order. On the desktop the top bar's toggle closes the drawer. */
  onClose?: () => void
}

/**
 * The drawer header. There are no tabs, and no expand or minimise buttons: what the drawer shows
 * is chosen by the top bar's Assistant and Bookmarks buttons (or a running guided workshop).
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, activeTab, onClose }) => (
  <div className="shrink-0 border-b border-border px-3 py-3 md:px-4">
    <div className="flex items-center gap-2">
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="order-last ml-auto min-h-[44px] min-w-[44px] p-2"
          aria-label="Close"
        >
          <X size={20} aria-hidden="true" />
        </Button>
      )}
      <h2 className="min-w-0 flex-1 truncate font-display text-base font-bold text-heading">
        {title}
      </h2>
    </div>
    {activeTab === 'chat' && (
      <div className="mt-2">
        <ObjectiveHeaderSlot />
      </div>
    )}
  </div>
)
