// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryRecentlyChanged — one horizontal strip of New & Updated documents,
 * replacing the live page's two stacked feeds (ActivityFeed + ContentUpdatesFeed)
 * so real documents sit above the fold. Click a card → opens the detail drawer.
 */
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/data/libraryData'
import { formatLibDate } from './libraryPills'

interface LibraryRecentlyChangedProps {
  items: LibraryItem[]
  onOpen: (referenceId: string) => void
  /** Cap the strip; the rail's "New & updated" quick view shows the full set. */
  limit?: number
}

export function LibraryRecentlyChanged({ items, onOpen, limit = 16 }: LibraryRecentlyChangedProps) {
  if (items.length === 0) return null
  const shown = items.slice(0, limit)

  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Recently changed
        </span>
        <span className="text-[11px] text-muted-foreground">{items.length} docs</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        {shown.map((item) => {
          const isNew = item.status === 'New'
          return (
            <Button
              key={item.referenceId}
              type="button"
              variant="ghost"
              onClick={() => onOpen(item.referenceId)}
              className="flex h-auto w-[215px] shrink-0 snap-start flex-col items-start justify-start gap-1 rounded-xl border border-border bg-card/40 p-2.5 text-left font-normal hover:border-primary/40 hover:bg-card"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isNew ? 'bg-success' : 'bg-primary'}`}
                  aria-hidden="true"
                />
                <span
                  className={`font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] ${
                    isNew ? 'text-success' : 'text-primary'
                  }`}
                >
                  {item.status}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatLibDate(item.lastUpdateDate)}
                </span>
              </span>
              <span className="w-full truncate font-mono text-[11px] font-semibold text-primary">
                {item.referenceId}
              </span>
              <span className="line-clamp-1 w-full text-[12px] text-foreground">
                {item.documentTitle}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
