import React, { useMemo } from 'react'
import { Map } from 'lucide-react'
import clsx from 'clsx'
import type { RecommendedAction } from '../../hooks/useAssessmentEngine'
import { timelineData, transformToGanttData } from '../../data/timelineData'

interface MigrationRoadmapProps {
  actions: RecommendedAction[]
  countryName?: string
}

interface SwimLane {
  label: string
  range: string
  category: RecommendedAction['category']
  items: RecommendedAction[]
}

const EFFORT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> =
  {
    low: {
      label: 'Low',
      color: 'text-success',
      bg: 'bg-success/15',
      border: 'border-l-success',
    },
    medium: {
      label: 'Med',
      color: 'text-warning',
      bg: 'bg-warning/15',
      border: 'border-l-warning',
    },
    high: {
      label: 'High',
      color: 'text-destructive',
      bg: 'bg-destructive/15',
      border: 'border-l-destructive',
    },
  }

const LANE_CONFIG: Record<string, { accent: string; headerBg: string; badge: string }> = {
  immediate: {
    accent: 'border-destructive/40',
    headerBg: 'bg-destructive/10',
    badge: 'bg-destructive/20 text-destructive',
  },
  'short-term': {
    accent: 'border-warning/40',
    headerBg: 'bg-warning/10',
    badge: 'bg-warning/20 text-warning',
  },
  'long-term': {
    accent: 'border-border',
    headerBg: 'bg-muted/30',
    badge: 'bg-muted text-muted-foreground',
  },
}

const CATEGORY_MAP: Record<string, number> = {
  immediate: 0,
  'short-term': 1,
  'long-term': 2,
}

/** Find the earliest hard deadline year from the country's timeline phases. */
function findCountryDeadlineYear(countryName: string): number | null {
  const ganttData = transformToGanttData(timelineData)
  const countryData = ganttData.find(
    (g) => g.country.countryName.toLowerCase() === countryName.toLowerCase()
  )
  if (!countryData) return null

  const deadlinePhases = countryData.phases.filter((p) =>
    p.phase.toLowerCase().includes('deadline')
  )
  if (deadlinePhases.length === 0) return null

  return Math.min(...deadlinePhases.map((p) => p.startYear))
}

export const MigrationRoadmap: React.FC<MigrationRoadmapProps> = ({ actions, countryName }) => {
  const lanes: SwimLane[] = useMemo(() => {
    const grouped: SwimLane[] = [
      { label: 'Phase 1: Immediate', range: '0–6 months', category: 'immediate', items: [] },
      { label: 'Phase 2: Short-term', range: '6–18 months', category: 'short-term', items: [] },
      { label: 'Phase 3: Long-term', range: '18–36 months', category: 'long-term', items: [] },
    ]
    for (const action of actions) {
      const idx = CATEGORY_MAP[action.category] ?? 2
      // eslint-disable-next-line security/detect-object-injection
      grouped[idx].items.push(action)
    }
    return grouped
  }, [actions])

  const deadlineYear = useMemo(
    () => (countryName ? findCountryDeadlineYear(countryName) : null),
    [countryName]
  )

  const currentYear = new Date().getFullYear()

  return (
    <div className="glass-panel p-6 print:border print:border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Map className="text-primary" size={20} />
          Migration Roadmap
        </h3>
        {deadlineYear && (
          <span className="text-xs font-mono px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive">
            {countryName} deadline: {deadlineYear}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {lanes.map((lane) => {
          const laneStyle = LANE_CONFIG[lane.category] ?? LANE_CONFIG['long-term']
          return (
            <div
              key={lane.label}
              className={clsx('rounded-lg border overflow-hidden', laneStyle.accent)}
            >
              {/* Lane header */}
              <div
                className={clsx('flex items-center justify-between px-4 py-2', laneStyle.headerBg)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{lane.label}</span>
                  <span
                    className={clsx(
                      'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                      laneStyle.badge
                    )}
                  >
                    {lane.range}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lane.items.length} action{lane.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Action items */}
              <div className="divide-y divide-border/30">
                {lane.items.length === 0 ? (
                  <div className="px-4 py-3">
                    <span className="text-xs text-muted-foreground/50 italic">
                      No actions in this phase
                    </span>
                  </div>
                ) : (
                  lane.items.map((action) => {
                    const effort = action.effort ?? 'medium'
                    // eslint-disable-next-line security/detect-object-injection
                    const effortStyle = EFFORT_CONFIG[effort] ?? EFFORT_CONFIG.medium
                    return (
                      <div
                        key={action.priority}
                        className={clsx(
                          'flex items-start gap-3 px-4 py-2.5 border-l-2',
                          effortStyle.border
                        )}
                      >
                        <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5 w-5 text-right">
                          #{action.priority}
                        </span>
                        <p className="text-xs text-foreground flex-1 leading-relaxed">
                          {action.action}
                        </p>
                        <span
                          className={clsx(
                            'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                            effortStyle.bg,
                            effortStyle.color
                          )}
                        >
                          {effortStyle.label}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
            Effort:
          </span>
          {(['low', 'medium', 'high'] as const).map((effort) => {
            // eslint-disable-next-line security/detect-object-injection
            const style = EFFORT_CONFIG[effort]
            return (
              <span
                key={effort}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={clsx(
                    'inline-block w-3 h-3 rounded-sm border-l-2',
                    style.border,
                    style.bg
                  )}
                />
                {style.label}
              </span>
            )
          })}
          {deadlineYear && (
            <>
              <span className="text-muted-foreground/30">|</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-sm border border-destructive/30 bg-destructive/10" />
                Regulatory deadline ({currentYear + ' → ' + deadlineYear})
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
