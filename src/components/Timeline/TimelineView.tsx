// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Globe, Link2, Check, Search, Download, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { timelineData, timelineMetadata, transformToGanttData } from '../../data/timelineData'
import type { GanttCountryData } from '../../types/timeline'
import { FilterChip } from '../common/FilterChip'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
import { COUNTRY_ALIASES } from '../../data/countryAliases'
import { SimpleGanttChart } from './SimpleGanttChart'
import { LeftNavTOC } from '@/components/common/LeftNavTOC'
import { GanttLegend } from './GanttLegend'
import { MobileTimelineList } from './MobileTimelineList'
import { CoverageByRegion } from './CoverageByRegion'
import { CountryFlag } from '../common/CountryFlag'
import { PageHeader } from '../common/PageHeader'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { FilterDropdown } from '../common/FilterDropdown'
import {
  TrustTierFilter,
  useTrustTierFilter,
  matchesTrustTierFilter,
} from '../common/TrustTierFilter'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { TIMELINE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  mena: 'MENA',
  apac: 'APAC',
  global: 'Global',
}

interface ResolvedCountry {
  resolved: string
  wasUnknown: boolean
}

function resolveCountryParam(param: string | null, knownCountries: string[]): ResolvedCountry {
  if (!param) return { resolved: 'All', wasUnknown: false }
  if (knownCountries.includes(param)) return { resolved: param, wasUnknown: false }
  // COUNTRY_ALIASES is `as const`; index access with arbitrary string needs a widened view.
  const aliasMap = COUNTRY_ALIASES as Readonly<Record<string, string>>
  // eslint-disable-next-line security/detect-object-injection
  const aliased = aliasMap[param]
  if (aliased && knownCountries.includes(aliased)) {
    return { resolved: aliased, wasUnknown: false }
  }
  // Case-insensitive fallback
  const ci = knownCountries.find((c) => c.toLowerCase() === param.toLowerCase())
  if (ci) return { resolved: ci, wasUnknown: false }
  // Literal "All" param is a valid request, not an unknown country
  return { resolved: 'All', wasUnknown: param.toLowerCase() !== 'all' }
}

export const TIMELINE_PERSONA_HINTS: Record<string, string> = {
  executive:
    'Focus on regulatory deadlines — countries approaching 2025–2026 milestones need immediate procurement action.',
  developer:
    'Track early-mover countries (US, UK, Germany) to align your library adoption with first production deployments.',
  architect:
    'Map which countries have entered the Deploy or Validate phase — these migration patterns are production-ready.',
  researcher:
    'Toggle the region filter to compare migration velocity across blocs and identify adoption outliers.',
  ops: 'Watch the Deploy phase column — countries entering it set the certificate-rotation clock for your fleet.',
  curious:
    'Each row is one country/region; bars show how far they have moved through five PQC migration phases.',
}

export const TimelineView = () => {
  useWorkflowPhaseTracker('timeline')
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  const toggleMyTimelineCountry = useBookmarkStore((s) => s.toggleMyTimelineCountry)
  const showOnlyTimelineCountries = useBookmarkStore((s) => s.showOnlyTimelineCountries)
  const setShowOnlyTimelineCountries = useBookmarkStore((s) => s.setShowOnlyTimelineCountries)

  const [searchParams, setSearchParams] = useSearchParams()

  // Region filter — preset from URL ?region= or persona preference
  const [regionFilter, setRegionFilter] = useState<string>(() => {
    if (searchParams.get('country')) return 'All' // country deep-link → don't preset region
    return searchParams.get('region') ?? usePersonaStore.getState().selectedRegion ?? 'All'
  })

  // Country filter — preset from URL ?country= param if present (with alias resolution)
  const initialCountryParam = searchParams.get('country')
  const [countryFilter, setCountryFilter] = useState<string>(() => {
    const known = timelineData?.map((d) => d.countryName) ?? []
    return resolveCountryParam(initialCountryParam, known).resolved
  })

  // Toast on mount if the deep-link country was unknown (silently degraded to All).
  useEffect(() => {
    const known = timelineData?.map((d) => d.countryName) ?? []
    const { wasUnknown } = resolveCountryParam(initialCountryParam, known)
    if (wasUnknown && initialCountryParam) {
      toast(`Country "${initialCountryParam}" not found — showing All.`, {
        icon: '⚠️',
        duration: 4000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [searchText, setSearchText] = useState<string>(searchParams.get('q') ?? '')

  /** Write region + country filters back to URL. */
  const syncFiltersToUrl = useCallback(
    (overrides: { region?: string; country?: string; q?: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const region = overrides.region ?? regionFilter
          const country = overrides.country ?? countryFilter
          const q = overrides.q ?? searchText

          if (region !== 'All') next.set('region', region)
          else next.delete('region')
          if (country !== 'All') next.set('country', country)
          else next.delete('country')
          if (q) next.set('q', q)
          else next.delete('q')
          return next
        },
        { replace: true }
      )
    },
    [regionFilter, countryFilter, searchText, setSearchParams]
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

  const handleSearchChange = (q: string) => {
    setSearchText(q)
    syncFiltersToUrl({ q })
  }

  /** Reset all filters in one click — used by zero-results EmptyState. */
  const clearAllFilters = useCallback(() => {
    setRegionFilter('All')
    setCountryFilter('All')
    setSearchText('')
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('region')
        next.delete('country')
        next.delete('q')
        next.delete('tier')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  // Sync ?region= and ?country= params on same-route navigations (e.g. chatbot deep links).
  // Functional setters prevent cascade loops.
  useEffect(() => {
    const known = timelineData?.map((d) => d.countryName) ?? []
    const paramCountry = searchParams.get('country')
    const { resolved: nextCountry, wasUnknown } = resolveCountryParam(paramCountry, known)
    const nextRegion = searchParams.get('region') ?? 'All'
    const nextQ = searchParams.get('q') ?? ''

    setCountryFilter((prev) => (prev !== nextCountry ? nextCountry : prev))
    setRegionFilter((prev) => (prev !== nextRegion ? nextRegion : prev))
    if (searchText !== nextQ) setSearchText(nextQ)
    if (wasUnknown && paramCountry) {
      toast(`Country "${paramCountry}" not found — showing All.`, {
        icon: '⚠️',
        duration: 4000,
      })
    }
  }, [searchParams])

  const tierFilter = useTrustTierFilter()

  // Always call hooks first (React rules)
  const ganttData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []
    if (tierFilter.length === 0) return transformToGanttData(timelineData)
    // Filter events at the leaf level: each TimelineEvent is scored by its title.
    const filteredCountries = timelineData
      .map((country) => ({
        ...country,
        bodies: country.bodies
          .map((body) => ({
            ...body,
            events: body.events.filter((event) =>
              matchesTrustTierFilter(tierFilter, 'timeline', event.title)
            ),
          }))
          .filter((body) => body.events.length > 0),
      }))
      .filter((country) => country.bodies.length > 0)
    return transformToGanttData(filteredCountries)
  }, [tierFilter])

  // Phase 3 — semantic supplement. Timeline chunks are titled like
  // "South Korea — KpqC Competition Results"; semantic hits return
  // those titles. We include a country in the filtered set if any
  // semantic hit title contains the country's name (substring), so
  // queries like "Asia-Pacific PQC mandates" surface JP/KR/IN rows
  // even when the country name isn't typed.
  const semantic = useSemanticSearch('timeline', searchText, { limit: 50 })
  const semanticTitlesLc = useMemo(
    () => (semantic.mode === 'semantic' ? semantic.hits.map((h) => h.id.toLowerCase()) : null),
    [semantic.mode, semantic.hits]
  )

  // Mobile: filter ganttData to the selected region/country (mirrors desktop Gantt behaviour)
  const mobileGanttData = useMemo(() => {
    let result = ganttData
    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter((d) => {
        const nameLc = d.country.countryName.toLowerCase()
        const lexicalMatch =
          nameLc.includes(q) || d.country.bodies.some((b) => b.name.toLowerCase().includes(q))
        if (lexicalMatch) return true
        if (semanticTitlesLc && semanticTitlesLc.some((t) => t.includes(nameLc))) return true
        return false
      })
    }
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
  }, [ganttData, regionFilter, countryFilter, searchText, semanticTitlesLc])

  const [countryCopied, setCountryCopied] = useState(false)

  const handleExportCsv = useCallback(
    (dataToExport: GanttCountryData[] = ganttData) => {
      if (dataToExport.length === 0) return
      const flatEvents = dataToExport.flatMap((gcd) => gcd.phases.flatMap((phase) => phase.events))
      const csv = generateCsv(flatEvents, TIMELINE_CSV_COLUMNS)
      downloadCsv(csv, csvFilename('pqc-timeline'))
    },
    [ganttData]
  )

  // Region filter items
  const regionItems = useMemo(
    () => [
      { id: 'All', label: 'All Regions' },
      ...Object.entries(REGION_LABELS).map(([id, label]) => ({ id, label })),
    ],
    []
  )

  // Per-country event counts AFTER the trust-tier filter has been applied.
  // Used to (a) append "(0)" to countries whose events are all filtered out,
  // and (b) hide countries from the dropdown that have no CSV rows at all.
  const countryEventCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of ganttData) {
      let n = 0
      for (const body of row.country.bodies) n += body.events.length
      counts.set(row.country.countryName, n)
    }
    return counts
  }, [ganttData])

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
        const eventCount = countryEventCounts.get(c) ?? 0
        const suffix = eventCount === 0 ? ' (0)' : ''
        return {
          id: c,
          label: `${c}${suffix}`,
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
  }, [regionFilter, countryEventCounts])

  // Genuinely-not-loaded → loading copy. Trust-tier-zeroed → fall through and
  // render the page chrome + an explanatory EmptyState below.
  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Timeline Data...</h2>
          <p className="text-muted-foreground">Please wait while we load the migration timeline.</p>
        </div>
      </div>
    )
  }
  const ganttDataEmpty = ganttData.length === 0

  const activeFilterLabels: string[] = []
  if (tierFilter.length > 0) activeFilterLabels.push(`Trust tier: ${tierFilter.join(', ')}`)
  if (regionFilter !== 'All')
    activeFilterLabels.push(`Region: ${REGION_LABELS[regionFilter] ?? regionFilter}`)
  if (countryFilter !== 'All') activeFilterLabels.push(`Country: ${countryFilter}`)
  if (searchText) activeFilterLabels.push(`Query: "${searchText}"`)
  const noResultsDescription = activeFilterLabels.length
    ? `Active filters → ${activeFilterLabels.join(' · ')}`
    : 'No timeline events matched the current view.'

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

      {/* eslint-disable-next-line security/detect-object-injection */}
      {selectedPersona && TIMELINE_PERSONA_HINTS[selectedPersona] && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
          <Lightbulb size={13} className="shrink-0 text-primary mt-0.5" aria-hidden="true" />
          {/* eslint-disable-next-line security/detect-object-injection */}
          <span>{TIMELINE_PERSONA_HINTS[selectedPersona]}</span>
        </div>
      )}

      <CoverageByRegion
        data={ganttData}
        selectedRegion={regionFilter}
        onSelectRegion={handleRegionChange}
      />

      <div className="mt-2 md:mt-12">
        {/* Desktop View: Left-rail country TOC + Full Gantt Chart */}
        <div className="hidden md:flex md:gap-6" data-testid="desktop-view-container">
          <aside className="md:w-56 lg:w-64 md:shrink-0 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
            <LeftNavTOC
              title="Countries"
              ariaLabel="Filtered countries"
              targetPrefix="timeline-toc"
              activeItemId={countryFilter !== 'All' ? countryFilter : null}
              onSelect={(id) => {
                handleCountrySelect(id)
                const target = document.getElementById(
                  `timeline-row-${id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
                )
                target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              groups={(() => {
                const filtered = countryItems.filter((c) => c.id !== 'All')
                if (filtered.length === 0) return []
                return [
                  {
                    id: 'all',
                    label: 'Countries',
                    items: filtered.map((c) => ({ id: c.id, label: c.label })),
                  },
                ]
              })()}
              emptyMessage="No countries match the current region filter."
            />
          </aside>
          <div className="flex-1 min-w-0">
            {ganttDataEmpty ? (
              <EmptyState
                icon={<Globe size={28} aria-hidden="true" />}
                title="No timeline events match the current filters."
                description={noResultsDescription}
                action={{ label: 'Clear all filters', onClick: clearAllFilters }}
              />
            ) : (
              <SimpleGanttChart
                data={ganttData}
                regionFilter={regionFilter}
                onRegionSelect={handleRegionChange}
                regionItems={regionItems}
                selectedCountry={countryFilter}
                onCountrySelect={handleCountrySelect}
                countryItems={countryItems}
                searchText={searchText}
                onSearchChange={handleSearchChange}
                myCountries={myTimelineCountries}
                onToggleMyCountry={toggleMyTimelineCountry}
                showOnlyMyCountries={showOnlyTimelineCountries}
                onSetShowOnlyMyCountries={setShowOnlyTimelineCountries}
              />
            )}
          </div>
        </div>

        {/* Mobile View: Simplified List */}
        <div className="md:hidden" data-testid="mobile-view-container">
          {/* Mobile Search */}
          <div className="relative w-full mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              aria-label="Search countries or organizations"
              placeholder="Search countries or organizations"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filters & Actions row */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 min-w-0">
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
            <div className="flex-1 min-w-0">
              <FilterDropdown
                items={countryItems}
                selectedId={countryFilter}
                onSelect={handleCountrySelect}
                defaultLabel="Country"
                noContainer
                opaque
                searchable={countryItems.length > 8}
                className="mb-0 w-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <TrustTierFilter className="mb-0 w-full" />
            </div>
            {countryFilter !== 'All' && (
              <Button
                variant="ghost"
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
                className="p-2 text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded-lg transition-colors flex-shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                {countryCopied ? <Check size={16} className="text-accent" /> : <Link2 size={16} />}
              </Button>
            )}
            <Button
              variant="ghost"
              type="button"
              aria-label="Export to CSV"
              title="Export filtered timeline data to CSV"
              onClick={() => handleExportCsv(mobileGanttData)}
              className="p-2 text-muted-foreground hover:text-foreground bg-muted/30 border border-border rounded-lg transition-colors flex-shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
            >
              <Download size={16} />
            </Button>
          </div>

          {/* Active Filter Chips */}
          {(regionFilter !== 'All' || countryFilter !== 'All' || searchText) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {regionFilter !== 'All' && regionFilter !== 'global' && (
                <FilterChip
                  label={REGION_LABELS[regionFilter] ?? regionFilter}
                  onClear={() => handleRegionChange('All')}
                />
              )}
              {regionFilter === 'global' && (
                <FilterChip label="Global" onClear={() => handleRegionChange('All')} />
              )}
              {countryFilter !== 'All' && (
                <FilterChip label={countryFilter} onClear={() => handleCountrySelect('All')} />
              )}
              {searchText && (
                <FilterChip label={`"${searchText}"`} onClear={() => handleSearchChange('')} />
              )}
            </div>
          )}

          {/* Results count text — when there ARE results and a filter is active */}
          {(regionFilter !== 'All' || countryFilter !== 'All' || searchText) &&
            mobileGanttData.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                {mobileGanttData.length} result{mobileGanttData.length === 1 ? '' : 's'} found
              </p>
            )}

          {mobileGanttData.length === 0 ? (
            <EmptyState
              icon={<Globe size={28} aria-hidden="true" />}
              title="No timeline events match the current filters."
              description={noResultsDescription}
              action={{ label: 'Clear all filters', onClick: clearAllFilters }}
            />
          ) : (
            <MobileTimelineList data={mobileGanttData} />
          )}
        </div>
      </div>

      <div className="mt-8" data-testid="timeline-legend-container">
        <GanttLegend />
      </div>
    </div>
  )
}
