// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useHistoryStore } from '@/store/useHistoryStore'
import type { HistoryEventType } from '@/types/HistoryTypes'
import { DayGroup } from './DayGroup'

const MILESTONE_TYPES = new Set<HistoryEventType>([
  'module_started',
  'module_completed',
  'quiz_session',
  'assessment_completed',
  'artifact_executive',
  'belt_earned',
  'streak_milestone',
  'migrate_product_selection',
  'compliance_framework_selection',
])

export const HistoryFeed: React.FC = () => {
  const events = useHistoryStore((s) => s.events)

  const groupedByDay = useMemo(() => {
    const sorted = [...events]
      .filter((e) => MILESTONE_TYPES.has(e.type))
      .sort((a, b) => b.timestamp - a.timestamp)
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

  const hasMilestones = groupedByDay.length > 0

  if (!hasMilestones) {
    return (
      <div className="text-center py-12 space-y-3">
        <Clock size={32} className="text-muted-foreground mx-auto opacity-40" />
        <p className="text-sm text-muted-foreground">No milestones recorded yet.</p>
        <p className="text-xs text-muted-foreground">
          Complete a module, take the quiz, or run the assessment to see milestones here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {groupedByDay.map(({ day, events: dayEvents }) => (
        <DayGroup key={day} day={day} events={dayEvents} />
      ))}
    </div>
  )
}
