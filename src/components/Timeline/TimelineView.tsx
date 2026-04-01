// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Globe, Link2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { timelineData, timelineMetadata, transformToGanttData } from '../../data/timelineData'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
import { SimpleGanttChart } from './SimpleGanttChart'
import { GanttLegend } from './GanttLegend'
import { MobileTimelineList } from './MobileTimelineList'
import { CountryFlag } from '../common/CountryFlag'
import { PageHeader } from '../common/PageHeader'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { FilterDropdown } from '../common/FilterDropdown'
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
  const [searchParams, setSearchParams] = useSearchParams()

  // Region filter — preset from URL ?region= or persona preference
  const [regionFilter, setRegionFilter] = useState<string>(() => {
    if (searchParams.get('country')) return 'All' // country deep-link → don't preset region
    return searchParams.get('region') ?? usePersonaStore.getState().selectedRegion ?? 'All'
  })

  // Country filter — preset from URL ?country= param if present
  const [countryFilter, setCountryFilter] = useState<string>(() => {
    const countryParam = searchParams.get('country')
    if (countryParam && timelineData?.some((d) => d.countryName === countryParam)) {
      return countryParam
    }
    return 'All'
  })

  /** Write region + country filters back to URL. */
  const syncFiltersToUrl = useCallback(
    (overrides: { region?: string; country?: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const region = overrides.region ?? regionFilter
          const country = overrides.country ?? countryFilter

          if (region !== 'All') next.set('region', region)
          else next.delete('region')
          if (country !== 'All') next.set('country', country)
          else next.delete('country')
          return next
        },
        { replace: true }
      )
    },
    [regionFilter, countryFilter, setSearchParams]
  )

  // Changing region resets country selection
  const handleRegionChange = (region: string) => {
    setRegionFilter(region)
    setCountryFilter('All')
    syncFiltersToUrl({ region, country: 'All' })
  }

  const handleCountrySelect = (country: string) => {
    setCountryFilter(country)
    syncFiltersToUrl({ country })
  }

  // Sync ?region= and ?country= params on same-route navigations (e.g. chatbot deep links).
  // Functional setters prevent cascade loops.
  useEffect(() => {
    const nextCountry = searchParams.get('country') ?? 'All'
    const nextRegion = searchParams.get('region') ?? 'All'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL→state sync is the purpose of this effect
    setCountryFilter((prev) => (prev !== nextCountry ? nextCountry : prev))
    setRegionFilter((prev) => (prev !== nextRegion ? nextRegion : prev))
  }, [searchParams])

  // Always call hooks first (React rules)
  const ganttData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    return transformToGanttData(timelineData)
  }, [])

  // Mobile: filter ganttData to the selected region/country (mirrors desktop Gantt behaviour)
  const mobileGanttData = useMemo(() => {
    let result = ganttData
    if (regionFilter !== 'All' && regionFilter !== 'global') {
      const allowed = new Set(
        REGION_COUNTRIES_MAP[regionFilter as keyof typeof REGION_COUNTRIES_MAP]
      )
      result = result.filter((d) => allowed.has(d.country.countryName))
    }
    if (countryFilter !== 'All') {
      result = result.filter((d) => d.country.countryName === countryFilter)
    }
    return result
  }, [ganttData, regionFilter, countryFilter])

  const [countryCopied, setCountryCopied] = useState(false)

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
    if (regionFilter !== 'All' && regionFilter !== 'global') {
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
      <PageHeader
        icon={Globe}
        pageId="timeline"
        title="Global Migration Timeline"
        description="Compare Post-Quantum Cryptography migration roadmaps across nations. Track phases from discovery to full migration and key regulatory milestones."
        dataSource={
          timelineMetadata
            ? `${timelineMetadata.filename} • Updated: ${timelineMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Timeline"
        shareTitle="PQC Migration Timeline — Global Post-Quantum Cryptography Roadmap"
        shareText="Compare PQC migration timelines across nations — track phases from discovery to full migration."
        onExport={handleExportCsv}
        endorseUrl={buildEndorsementUrl({
          category: 'timeline-endorsement',
          title: 'Endorse: Global PQC Migration Timeline',
          resourceType: 'Timeline Page',
          resourceId: 'Global Migration Timeline',
          resourceDetails:
            '**Page:** Global Migration Timeline — Compare PQC migration roadmaps across nations.',
          pageUrl: '/timeline',
        })}
        endorseLabel="Timeline Page"
        endorseResourceType="Timeline"
        flagUrl={buildFlagUrl({
          category: 'timeline-endorsement',
          title: 'Flag: Global PQC Migration Timeline',
          resourceType: 'Timeline Page',
          resourceId: 'Global Migration Timeline',
          resourceDetails:
            '**Page:** Global Migration Timeline — Compare PQC migration roadmaps across nations.',
          pageUrl: '/timeline',
        })}
        flagLabel="Timeline Page"
        flagResourceType="Timeline"
        testId="timeline-header"
      />

      <div className="mt-2 md:mt-12">
        {/* Desktop View: Full Gantt Chart */}
        <div className="hidden md:block" data-testid="desktop-view-container">
          <SimpleGanttChart
            data={ganttData}
            regionFilter={regionFilter}
            onRegionSelect={handleRegionChange}
            regionItems={regionItems}
            selectedCountry={countryFilter}
            onCountrySelect={handleCountrySelect}
            countryItems={countryItems}
            initialFilter={searchParams.get('q') ?? undefined}
          />
        </div>

        {/* Mobile View: Simplified List */}
        <div className="md:hidden" data-testid="mobile-view-container">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <FilterDropdown
                items={regionItems}
                selectedId={regionFilter}
                onSelect={handleRegionChange}
                defaultLabel="Region"
                noContainer
                opaque
                className="mb-0 w-full"
              />
            </div>
            <div className="flex-1">
              <FilterDropdown
                items={countryItems}
                selectedId={countryFilter}
                onSelect={handleCountrySelect}
                defaultLabel="Country"
                noContainer
                opaque
                className="mb-0 w-full"
              />
            </div>
            {countryFilter !== 'All' && (
              <button
                type="button"
                aria-label="Copy country timeline link"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/timeline?country=${encodeURIComponent(countryFilter)}`
                  )
                  toast.success('Link copied!')
                  setCountryCopied(true)
                  setTimeout(() => setCountryCopied(false), 2000)
                }}
                className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors flex-shrink-0"
              >
                {countryCopied ? <Check size={16} className="text-accent" /> : <Link2 size={16} />}
              </button>
            )}
          </div>
          {(regionFilter !== 'All' || countryFilter !== 'All') && (
            <p className="text-xs text-primary/90 mb-3">
              {mobileGanttData.length} countr{mobileGanttData.length === 1 ? 'y' : 'ies'}
              {regionFilter !== 'All' && regionFilter !== 'global' && (
                <>
                  {/* eslint-disable-next-line security/detect-object-injection */} in{' '}
                  {REGION_LABELS[regionFilter] ?? regionFilter}
                </>
              )}
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
