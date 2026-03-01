// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { HistoryEventRow } from './HistoryEventRow'
import type { HistoryEvent } from '@/types/HistoryTypes'

const COLLAPSED_LIMIT = 3

interface DayGroupProps {
  day: string
  events: HistoryEvent[]
  defaultExpanded?: boolean
}

export const DayGroup: React.FC<DayGroupProps> = ({ day, events, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasMore = events.length > COLLAPSED_LIMIT
  const visibleEvents = expanded ? events : events.slice(0, COLLAPSED_LIMIT)

  // Filter out daily_visit events from the display summary
  const meaningfulCount = events.filter((e) => e.type !== 'daily_visit').length

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{day}</span>
        <span className="text-muted-foreground/50">
          ({meaningfulCount} {meaningfulCount === 1 ? 'activity' : 'activities'})
        </span>
      </button>

      <div className="ml-1 mt-0.5 border-l border-border/50 pl-2">
        {visibleEvents.map((event) => (
          <HistoryEventRow key={event.id} event={event} />
        ))}

        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:text-primary/80 px-2 py-1 transition-colors"
          >
            +{events.length - COLLAPSED_LIMIT} more
          </button>
        )}
      </div>
    </div>
  )
}
