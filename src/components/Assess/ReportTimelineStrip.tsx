import React, { useMemo } from 'react'
import { timelineData, transformToGanttData, phaseColors } from '../../data/timelineData'
import type { Phase } from '../../data/timelineData'

const START_YEAR = 2024
const END_YEAR = 2035
const SPAN = END_YEAR - START_YEAR

const TICK_YEARS = [2024, 2026, 2028, 2030, 2032, 2034, 2035]

function yearToPercent(year: number): number {
  return ((year - START_YEAR) / SPAN) * 100
}

interface ReportTimelineStripProps {
  countryName: string
}

export const ReportTimelineStrip: React.FC<ReportTimelineStripProps> = ({ countryName }) => {
  const ganttData = useMemo(() => transformToGanttData(timelineData), [])

  const countryData = useMemo(
    () => ganttData.find((g) => g.country.countryName === countryName) ?? null,
    [ganttData, countryName]
  )

  if (!countryName || !countryData) {
    return (
      <p className="text-muted-foreground text-sm py-2">
        No country selected or no timeline data available.
      </p>
    )
  }

  const { phases } = countryData

  return (
    <div className="space-y-3 overflow-x-auto">
      {/* Year scale header */}
      <div className="relative h-5 min-w-[480px]">
        {TICK_YEARS.map((yr) => {
          const left = yearToPercent(yr)
          return (
            <div
              key={yr}
              className="absolute flex flex-col items-center"
              style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2 bg-border" />
              <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{yr}</span>
            </div>
          )
        })}
        {/* Baseline rule */}
        <div className="absolute top-0 left-0 right-0 h-px bg-border" />
      </div>

      {/* Phase rows */}
      <div className="space-y-1.5 min-w-[480px]">
        {phases.map((phase, idx) => {
          const clampedStart = Math.max(START_YEAR, phase.startYear)
          const clampedEnd = Math.min(END_YEAR, phase.endYear)
          if (clampedStart >= END_YEAR || clampedEnd <= START_YEAR) return null

          const leftPct = yearToPercent(clampedStart)
          const widthPct = Math.max(1, yearToPercent(clampedEnd) - leftPct)
          const phaseColor =
            phaseColors[phase.phase as Phase]?.start ?? 'hsl(var(--phase-guidance))'

          return (
            <div key={`${phase.phase}-${idx}`} className="flex items-center gap-2">
              {/* Label */}
              <div className="w-36 shrink-0 text-right">
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                  {phase.phase}
                </span>
              </div>

              {/* Bar track */}
              <div className="flex-1 relative h-5">
                <div className="absolute inset-y-0 left-0 right-0 rounded bg-border/20" />
                <div
                  className="absolute inset-y-1 rounded"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: phaseColor,
                    opacity: 0.85,
                  }}
                  title={`${phase.phase}: ${phase.startYear}–${phase.endYear}`}
                />
              </div>

              {/* Year range label */}
              <div className="w-20 shrink-0">
                <span className="text-[9px] text-muted-foreground font-mono">
                  {phase.startYear}–{phase.endYear}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Phase colour legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border">
        {(
          [
            'Discovery',
            'Testing',
            'POC',
            'Migration',
            'Standardization',
            'Guidance',
            'Policy',
            'Regulation',
            'Research',
            'Deadline',
          ] as Phase[]
        )
          .filter((p) => phases.some((ph) => ph.phase === p))
          .map((p) => (
            <span key={p} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span
                className="inline-block w-3 h-2 rounded-sm"
                style={{ backgroundColor: phaseColors[p]?.start }}
              />
              {p}
            </span>
          ))}
      </div>
    </div>
  )
}
