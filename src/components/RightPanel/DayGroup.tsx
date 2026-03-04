// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { HistoryEventRow } from './HistoryEventRow'
import type { HistoryEvent } from '@/types/HistoryTypes'

interface DayGroupProps {
  day: string
  events: HistoryEvent[]
}

export const DayGroup: React.FC<DayGroupProps> = ({ day, events }) => {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 w-full px-2 py-1 text-xs font-medium text-muted-foreground">
        <span>{day}</span>
        <span className="text-muted-foreground/50">
          ({events.length} {events.length === 1 ? 'milestone' : 'milestones'})
        </span>
      </div>

      <div className="ml-1 mt-0.5 border-l border-border/50 pl-2">
        {events.map((event) => (
          <HistoryEventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
