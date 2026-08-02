// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { SourcesModal } from './SourcesModal'
import type { ViewType } from '../../data/authoritativeSourcesData'
import { Button } from '@/components/ui/button'

interface SourcesButtonProps {
  viewType: ViewType
  /** Small icon + text-xs, no border/background — used by the global top bar
   * (MainLayout.tsx). Default keeps the bordered-pill look everywhere else. */
  compact?: boolean
  /** Passed through to SourcesModal — the page's own underlying CSV filename
   * + last-updated date, when known (2026-08-01 follow-up: "what is missing
   * is the latest sources csv file name or latest csv update date"). */
  dataSource?: string
}

export const SourcesButton = ({ viewType, compact = false, dataSource }: SourcesButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsModalOpen(true)}
        className={
          compact
            ? 'flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors'
            : 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20'
        }
        aria-label={`View authoritative sources for ${viewType}`}
      >
        <BookOpen size={compact ? 13 : 14} />
        <span>Sources</span>
      </Button>

      <SourcesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewType={viewType}
        dataSource={dataSource}
      />
    </>
  )
}
