import { useState, useMemo } from 'react'
import {
  timelineData,
  timelineMetadata,
  transformToGanttData,
  type CountryData,
} from '../../data/timelineData'
import { CountrySelector } from './CountrySelector'
import { SimpleGanttChart } from './SimpleGanttChart'
import { GanttLegend } from './GanttLegend'
import { logEvent } from '../../utils/analytics'

export const TimelineView = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const showAllCountries = selectedCountry === null

  const handleCountrySelect = (country: CountryData | null) => {
    setSelectedCountry(country)
    logEvent('Timeline', 'Filter Country', country ? country.countryName : 'All')
  }

  // Transform data for Gantt chart
  const ganttData = useMemo(() => {
    const allGanttData = transformToGanttData(timelineData)

    // Filter to selected country if not showing all
    if (!showAllCountries && selectedCountry) {
      return allGanttData.filter((d) => d.country.countryName === selectedCountry.countryName)
    }

    return allGanttData
  }, [selectedCountry, showAllCountries])

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Global Migration Timeline</h2>
        <p className="text-muted max-w-2xl mx-auto mb-4">
          Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from
          discovery to full migration and key regulatory milestones.
        </p>
        {timelineMetadata && (
          <p className="text-xs text-muted/60 font-mono">
            Data Source: {timelineMetadata.filename} • Updated:{' '}
            {timelineMetadata.lastUpdate.toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <CountrySelector
          countries={timelineData}
          selectedCountry={selectedCountry}
          onSelect={handleCountrySelect}
          showAllCountries={showAllCountries}
        />
      </div>

      <div className="mt-12">
        <SimpleGanttChart data={ganttData} />
      </div>

      <div className="mt-8">
        <GanttLegend />
      </div>
    </div>
  )
}
