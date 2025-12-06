import { useState, useMemo } from 'react'
import {
  timelineData,
  timelineMetadata,
  transformToGanttData,
  type TimelinePhase,
} from '../../data/timelineData'
import { SimpleGanttChart } from './SimpleGanttChart'
import { Globe } from 'lucide-react'
import { GanttLegend } from './GanttLegend'
import { MobileTimelineList } from './MobileTimelineList'

export const TimelineView = () => {
  const [selectedCountry, setSelectedCountry] = useState<TimelinePhase | null>(null)
  // Removed unused viewMode state as we now use CSS media queries for view switching

  const ganttData = useMemo(() => transformToGanttData(timelineData), [])

  const countryItems = useMemo(() => {
    // Get unique country names
    const countries = Array.from(new Set(timelineData.map((d) => d.countryName))).sort()
    return countries.map((c) => ({
      id: c,
      label: c,
      icon: <Globe size={16} className="text-muted-foreground" />, // Added icon to satisfy type requirement
    }))
  }, [])

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleCountrySelect = (phase: any) => {
    // Loosened type to allow CountryData from timelineData
    setSelectedCountry(phase)
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-2 md:mb-12">
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
        <div className="hidden md:block">
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
        <div className="md:hidden">
          <MobileTimelineList data={ganttData} />
        </div>
      </div>

      <div className="mt-8">
        <GanttLegend />
      </div>
    </div>
  )
}
