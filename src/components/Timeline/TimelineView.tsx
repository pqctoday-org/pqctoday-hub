import { useState, useMemo } from 'react'
import {
  timelineData,
  timelineMetadata,
  transformToGanttData,
  type TimelinePhase,
} from '../../data/timelineData'
import { SimpleGanttChart } from './SimpleGanttChart'

import { GanttLegend } from './GanttLegend'
import { MobileTimelineList } from './MobileTimelineList'
import { CountryFlag } from '../common/CountryFlag'

export const TimelineView = () => {
  const [selectedCountry, setSelectedCountry] = useState<TimelinePhase | null>(null)
  // Removed unused viewMode state as we now use CSS media queries for view switching

  // Always call hooks first (React rules)
  const ganttData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    return transformToGanttData(timelineData)
  }, [])

  const countryItems = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    // Get unique country names
    const countries = Array.from(new Set(timelineData.map((d) => d.countryName))).sort()
    return countries.map((c) => {
      const countryData = timelineData.find((d) => d.countryName === c)
      return {
        id: c,
        label: c,
        icon: (
          <CountryFlag
            code={countryData?.flagCode || ''}
            width={16}
            height={12}
            className="rounded-[1px]"
          />
        ),
      }
    })
  }, [])

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleCountrySelect = (phase: any) => {
    // Loosened type to allow CountryData from timelineData
    setSelectedCountry(phase)
  }

  // Early return if data isn't loaded yet to prevent blank screen
  if (!timelineData || timelineData.length === 0 || ganttData.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Timeline Data...</h2>
          <p className="text-muted-foreground">Please wait while we load the migration timeline.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4" data-testid="timeline-view-root">
      <div className="text-center mb-2 md:mb-12" data-testid="timeline-header">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          Global Migration Timeline
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from
          discovery to full migration and key regulatory milestones.
        </p>
        {timelineMetadata && (
          <p className="hidden lg:flex justify-center text-[10px] md:text-xs text-muted-foreground font-mono">
            Data Source: {timelineMetadata.filename} • Updated:{' '}
            {timelineMetadata.lastUpdate.toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-2 md:mt-12">
        {/* Desktop View: Full Gantt Chart */}
        <div className="hidden md:block" data-testid="desktop-view-container">
          <SimpleGanttChart
            data={ganttData}
            // @ts-expect-error - known type mismatch between legacy CountryData and TimelinePhase
            selectedCountry={selectedCountry ? selectedCountry.countryName : 'All'}
            onCountrySelect={(id) => {
              const country =
                id === 'All' ? null : timelineData.find((c) => c.countryName === id) || null
              handleCountrySelect(country)
            }}
            countryItems={countryItems}
          />
        </div>

        {/* Mobile View: Simplified List */}
        <div className="md:hidden" data-testid="mobile-view-container">
          <MobileTimelineList data={ganttData} />
        </div>
      </div>

      <div className="mt-8" data-testid="timeline-legend-container">
        <GanttLegend />
      </div>
    </div>
  )
}
