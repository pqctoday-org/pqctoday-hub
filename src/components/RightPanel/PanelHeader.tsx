// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Bot, Clock, Network, Bookmark, X, Minus } from 'lucide-react'
import { Button } from '../ui/button'
import type { RightPanelTab } from '@/types/HistoryTypes'
import { useEmbedState } from '@/embed/EmbedProvider'

interface PanelHeaderProps {
  activeTab: RightPanelTab
  onTabChange: (tab: RightPanelTab) => void
  onClose: () => void
  onMinimize?: () => void
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  activeTab,
  onTabChange,
  onClose,
  onMinimize,
}) => {
  const { isEmbedded } = useEmbedState()
  let tabs: { id: RightPanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat', label: 'Assistant', icon: Bot },
    { id: 'history', label: 'Journey', icon: Clock },
    { id: 'graph', label: 'Graph', icon: Network },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ]

  if (isEmbedded) {
    tabs = tabs.filter((t) => t.id !== 'graph')
  }

  return (
    <div className="px-4 md:px-12 pt-4 pb-0 border-b border-border shrink-0">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-1" role="tablist">
          {tabs.map((tab) => (
            <Button
              variant="ghost"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="min-h-[44px] min-w-[44px] p-2"
              aria-label="Minimize assistant"
            >
              <Minus size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2"
            aria-label="Close assistant"
          >
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  )
}
