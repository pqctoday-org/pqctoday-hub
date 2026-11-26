// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PatentsRecentlyAdded — "Latest grants and publications": records granted or
 * published in the 90 days before the catalogue's newest such date, newest
 * first (latestGrantsAndPublications in patentsData.ts). Sorted by grant or
 * publication date, not by when the Hub added them (owner decision
 * 2026-11-14). Click a card → opens the detail drawer.
 */
import { Button } from '@/components/ui/button'
import type { PatentItem } from '@/types/PatentTypes'

interface PatentsRecentlyAddedProps {
  items: PatentItem[]
  onOpen: (patentNumber: string) => void
  /** Cap the strip. */
  limit?: number
}

function formatPatentDate(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function PatentsRecentlyAdded({ items, onOpen, limit = 16 }: PatentsRecentlyAddedProps) {
  if (items.length === 0) return null
  const shown = items.slice(0, limit)

  return (
    <div className="glass-panel bg-card backdrop-blur-none border-2 border-ink rounded-2xl shadow-[0_6px_0_hsl(var(--edge))] p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
          Latest grants and publications
        </span>
        <span className="text-[11px] text-muted-foreground">
          {items.length} in the last 90 days of the catalogue · by date, not when added
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        {shown.map((item) => (
          <Button
            key={item.patentNumber}
            type="button"
            variant="ghost"
            onClick={() => onOpen(item.patentNumber)}
            className="flex h-auto w-[215px] shrink-0 snap-start flex-col items-start justify-start gap-1 rounded-xl border border-border bg-card/40 p-2.5 text-left font-normal hover:border-primary/40 hover:bg-card"
          >
            <span className="flex items-center gap-1.5">
              <span className="font-mono uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
                {item.publicationKind === 'published_application' ? 'Application' : 'Granted'}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatPatentDate(item.issueDate)}
              </span>
            </span>
            <span className="w-full truncate font-mono text-[11px] font-semibold text-primary">
              {item.patentNumber}
            </span>
            <span className="line-clamp-1 w-full text-[12px] text-foreground">{item.title}</span>
            <span className="line-clamp-1 w-full text-[11px] text-muted-foreground">
              {item.assignee}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
