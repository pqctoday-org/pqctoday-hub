// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { timelineData, timelineMetadata, transformToGanttData } from '../../data/timelineData'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
import { SimpleGanttChart } from './SimpleGanttChart'

import { GanttLegend } from './GanttLegend'
import { MobileTimelineList } from './MobileTimelineList'
import { CountryFlag } from '../common/CountryFlag'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { ExportButton } from '../ui/ExportButton'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { TIMELINE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  apac: 'APAC',
  global: 'Global',
}

export const TimelineView = () => {
  useWorkflowPhaseTracker('timeline')
  const [searchParams] = useSearchParams()

  // Region filter — preset from persona preference
  const [regionFilter, setRegionFilter] = useState<string>(() => {
    // URL ?country= deep-link → don't preset region
    const countryParam = new URLSearchParams(window.location.search).get('country')
    if (countryParam && timelineData?.some((d) => d.countryName === countryParam)) return 'All'
    const region = usePersonaStore.getState().selectedRegion
    return region ?? 'All'
  })

  // Country filter — preset from URL ?country= param if present
  const [countryFilter, setCountryFilter] = useState<string>(() => {
    const countryParam = new URLSearchParams(window.location.search).get('country')
    if (countryParam && timelineData?.some((d) => d.countryName === countryParam)) {
      return countryParam
    }
    return 'All'
  })

  // Changing region resets country selection
  const handleRegionChange = (region: string) => {
    setRegionFilter(region)
    setCountryFilter('All')
  }

  // Sync ?country= param on same-route navigations (e.g. chatbot deep links)
  useEffect(() => {
    const countryParam = searchParams.get('country')
    if (countryParam && timelineData?.some((d) => d.countryName === countryParam)) {
      setCountryFilter(countryParam) // eslint-disable-line react-hooks/set-state-in-effect -- URL is external state
    }
  }, [searchParams])

  // Always call hooks first (React rules)
  const ganttData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    return transformToGanttData(timelineData)
  }, [])

  // Mobile: filter ganttData to the selected region's countries (mirrors desktop Gantt behaviour)
  const mobileGanttData = useMemo(() => {
    if (regionFilter === 'All' || regionFilter === 'global') return ganttData
    const allowed = new Set(REGION_COUNTRIES_MAP[regionFilter as keyof typeof REGION_COUNTRIES_MAP])
    return ganttData.filter((d) => allowed.has(d.country.countryName))
  }, [ganttData, regionFilter])

  const handleExportCsv = useCallback(() => {
    const flatEvents = ganttData.flatMap((gcd) => gcd.phases.flatMap((phase) => phase.events))
    const csv = generateCsv(flatEvents, TIMELINE_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-timeline'))
  }, [ganttData])

  // Region filter items
  const regionItems = useMemo(
    () => [
      { id: 'All', label: 'All Regions' },
      ...Object.entries(REGION_LABELS).map(([id, label]) => ({ id, label })),
    ],
    []
  )

  // Country filter items — scoped by selected region, each with flag icon
  const countryItems = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []

    const allCountries = Array.from(new Set(timelineData.map((d) => d.countryName))).sort()

    // If a region is selected, only show countries in that region
    let countries: string[]
    if (regionFilter !== 'All') {
      const regionCountries = new Set(
        REGION_COUNTRIES_MAP[regionFilter as keyof typeof REGION_COUNTRIES_MAP] ?? []
      )
      countries = allCountries.filter((c) => regionCountries.has(c))
    } else {
      countries = allCountries
    }

    return [
      { id: 'All', label: 'All Countries', icon: null },
      ...countries.map((c) => {
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
      }),
    ]
  }, [regionFilter])

  // Early return if data isn't loaded yet to prevent blank screen
  if (!timelineData || timelineData.length === 0 || ganttData.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Timeline Data...</h2>
          <p className="text-muted-foreground">Please wait while we load the migration timeline.</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="timeline-view-root">
      <div className="text-center mb-2 md:mb-12" data-testid="timeline-header">
        <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          Global Migration Timeline
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from
          discovery to full migration and key regulatory milestones.
        </p>
        {timelineMetadata && (
          <div className="hidden lg:flex justify-center items-center gap-3 text-[10px] md:text-xs text-muted-foreground font-mono">
            <p>
              Data Source: {timelineMetadata.filename} • Updated:{' '}
              {timelineMetadata.lastUpdate.toLocaleDateString()}
            </p>
            <SourcesButton viewType="Timeline" />
            <ShareButton
              title="PQC Migration Timeline — Global Post-Quantum Cryptography Roadmap"
              text="Compare PQC migration timelines across nations — track phases from discovery to full migration."
            />
            <GlossaryButton />
            <ExportButton onExport={handleExportCsv} />
          </div>
        )}
      </div>

      <div className="mt-2 md:mt-12">
        {/* Desktop View: Full Gantt Chart */}
        <div className="hidden md:block" data-testid="desktop-view-container">
          <SimpleGanttChart
            data={ganttData}
            regionFilter={regionFilter}
            onRegionSelect={handleRegionChange}
            regionItems={regionItems}
            selectedCountry={countryFilter}
            onCountrySelect={setCountryFilter}
            countryItems={countryItems}
            initialFilter={searchParams.get('q') ?? undefined}
          />
        </div>

        {/* Mobile View: Simplified List */}
        <div className="md:hidden" data-testid="mobile-view-container">
          {regionFilter !== 'All' && regionFilter !== 'global' && (
            <p className="text-xs text-primary/90 mb-3">
              Filtered:{' '}
              {
                // eslint-disable-next-line security/detect-object-injection
                REGION_LABELS[regionFilter] ?? regionFilter
              }{' '}
              ({mobileGanttData.length} countries)
            </p>
          )}
          <MobileTimelineList data={mobileGanttData} />
        </div>
      </div>

      <div className="mt-8" data-testid="timeline-legend-container">
        <GanttLegend />
      </div>
    </div>
  )
}
