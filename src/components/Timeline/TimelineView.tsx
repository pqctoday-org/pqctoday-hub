import { useState, useMemo } from 'react'
import {
  timelineData,
  timelineMetadata,
  transformToGanttData,
  type CountryData,
} from '../../data/timelineData'
import { CountryFlag } from '../common/CountryFlag'
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

  const countryItems = useMemo(() => {
    const allOption = { id: 'All', label: 'All Countries', icon: null }
    const countries = timelineData.map((c) => ({
      id: c.countryName,
      label: c.countryName,
      icon: <CountryFlag code={c.flagCode} width={20} height={12} />,
    }))
    return [allOption, ...countries]
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Global Migration Timeline</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
          Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from
          discovery to full migration and key regulatory milestones.
        </p>
        {timelineMetadata && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Data Source: {timelineMetadata.filename} • Updated:{' '}
            {timelineMetadata.lastUpdate.toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-12">
        <SimpleGanttChart
          data={ganttData}
          selectedCountry={selectedCountry ? selectedCountry.countryName : 'All'}
          onCountrySelect={(id) => {
            const country =
              id === 'All' ? null : timelineData.find((c) => c.countryName === id) || null
            handleCountrySelect(country)
          }}
          countryItems={countryItems}
        />
      </div>

      <div className="mt-8">
        <GanttLegend />
      </div>
    </div>
  )
}
