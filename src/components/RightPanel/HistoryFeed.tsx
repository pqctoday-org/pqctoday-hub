import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useHistoryStore } from '@/store/useHistoryStore'
import { DayGroup } from './DayGroup'

export const HistoryFeed: React.FC = () => {
  const events = useHistoryStore((s) => s.events)

  const groupedByDay = useMemo(() => {
    const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp)
    const groups = new Map<string, typeof sorted>()

    for (const event of sorted) {
      const dayKey = new Date(event.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!groups.has(dayKey)) groups.set(dayKey, [])
      groups.get(dayKey)!.push(event)
    }

    return Array.from(groups.entries()).map(([day, dayEvents]) => ({ day, events: dayEvents }))
  }, [events])

  if (events.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Clock size={32} className="text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        <p className="text-xs text-muted-foreground">
          Visit learning modules, generate keys, or take the quiz to start tracking your journey.
        </p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      {groupedByDay.map(({ day, events: dayEvents }) => (
        <DayGroup key={day} day={day} events={dayEvents} defaultExpanded={day === today} />
      ))}
    </div>
  )
}
