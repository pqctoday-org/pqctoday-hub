// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Briefcase, Building2, School, AlertCircle, Trophy, Users } from 'lucide-react'

import { leadersData, leadersMetadata } from '../../data/leadersData'
import { logEvent } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import { EmptyState } from '../ui/empty-state'
import { CountryFlag } from '../common/CountryFlag'
import { LeaderCard } from './LeaderCard'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { ExportButton } from '../ui/ExportButton'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LEADERS_CSV_COLUMNS } from '@/utils/csvExportConfigs'

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'Europe',
  apac: 'Asia-Pacific',
}

/** Maps region IDs to the country name values used in the leaders CSV. */
const LEADERS_REGION_COUNTRIES: Record<string, string[]> = {
  americas: ['USA', 'Canada', 'USA/Canada', 'USA/Switzerland', 'USA/Germany', 'France/USA'],
  eu: [
    'UK',
    'France',
    'Germany',
    'Switzerland',
    'Belgium',
    'Portugal',
    'Estonia/EU',
    'Netherlands',
    'Sweden',
    'Russia',
    'Spain',
    'Italy',
    'France/Netherlands',
    'Germany/Netherlands',
    'Israel',
  ],
  apac: ['Singapore', 'Japan', 'South Korea', 'Australia', 'India', 'China'],
}

const FLAG_CODE_MAP: Record<string, string> = {
  USA: 'us',
  UK: 'gb',
  France: 'fr',
  Germany: 'de',
  Switzerland: 'ch',
  Canada: 'ca',
  Singapore: 'sg',
  Japan: 'jp',
  'South Korea': 'kr',
  Australia: 'au',
  Israel: 'il',
  Belgium: 'be',
  Portugal: 'pt',
  Netherlands: 'nl',
  Sweden: 'se',
  Spain: 'es',
  Italy: 'it',
  India: 'in',
  China: 'cn',
  Russia: 'ru',
  'Estonia/EU': 'eu',
  'USA/Switzerland': 'us',
  'USA/Germany': 'us',
  'USA/Canada': 'us',
  'France/Netherlands': 'fr',
  'Germany/Netherlands': 'de',
  'France/USA': 'fr',
}

export const LeadersGrid = () => {
  const [searchParams] = useSearchParams()
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    return searchParams.get('region') ?? 'All'
  })
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return searchParams.get('country') ?? 'All'
  })
  const [selectedSector, setSelectedSector] = useState<string>(() => {
    const sector = searchParams.get('sector')
    return sector && ['Public', 'Private', 'Academic'].includes(sector) ? sector : 'All'
  })
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [highlightedLeader, setHighlightedLeader] = useState<string | null>(() =>
    searchParams.get('leader')
  )
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Sync URL params on same-route navigations (e.g. chatbot deep links)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) setSearchQuery(q) // eslint-disable-line react-hooks/set-state-in-effect -- URL is external state

    const sector = searchParams.get('sector')
    if (sector && ['Public', 'Private', 'Academic'].includes(sector)) {
      setSelectedSector(sector)
    }

    const region = searchParams.get('region')
    if (region) setSelectedRegion(region)

    const country = searchParams.get('country')
    if (country) {
      setSelectedCountry(country)
    }

    const leader = searchParams.get('leader')
    if (leader) {
      setHighlightedLeader(leader)
    }
  }, [searchParams])

  // Scroll to highlighted leader after render
  useEffect(() => {
    if (!highlightedLeader || !gridRef.current) return
    const timer = setTimeout(() => {
      const id = `leader-${highlightedLeader.replace(/\s+/g, '-')}`
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => setHighlightedLeader(null), 3000)
      } else {
        // Check if leader exists in unfiltered data but is hidden by filters
        const existsUnfiltered = leadersData.some((l) => l.name === highlightedLeader)
        if (existsUnfiltered) {
          // Clear filters so the card becomes visible, then re-trigger scroll
          setSelectedRegion('All')
          setSelectedCountry('All')
          setSelectedSector('All')
          setSearchQuery('')
        } else {
          // Leader doesn't exist in database at all
          setNotFoundMessage(`"${highlightedLeader}" was not found in the leaders database.`)
          setHighlightedLeader(null)
          setTimeout(() => setNotFoundMessage(null), 4000)
        }
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [highlightedLeader, selectedCountry, selectedSector, searchQuery])

  // Region items
  const regionItems = useMemo(
    () => [
      { id: 'All', label: 'All Regions' },
      ...Object.entries(REGION_LABELS).map(([id, label]) => ({ id, label })),
    ],
    []
  )

  // Country items scoped by selected region
  const countryItems = useMemo(() => {
    const unique = new Set(leadersData.map((l) => l.country))
    let countries = Array.from(unique).sort()

    if (selectedRegion !== 'All') {
      // eslint-disable-next-line security/detect-object-injection
      const regionSet = new Set(LEADERS_REGION_COUNTRIES[selectedRegion] ?? [])
      countries = countries.filter((c) => regionSet.has(c))
    }

    return [
      { id: 'All', label: 'All Countries', icon: null },
      ...countries.map((c) => ({
        id: c,
        label: c,
        // eslint-disable-next-line security/detect-object-injection
        icon: <CountryFlag code={FLAG_CODE_MAP[c] ?? 'un'} width={20} height={12} />,
      })),
    ]
  }, [selectedRegion])

  // Sector items
  const sectorItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Sectors', icon: null },
      {
        id: 'Public',
        label: 'Public',
        icon: <Building2 size={14} className="text-secondary" />,
      },
      {
        id: 'Private',
        label: 'Private',
        icon: <Briefcase size={14} className="text-primary" />,
      },
      {
        id: 'Academic',
        label: 'Academic',
        icon: <School size={14} className="text-secondary" />,
      },
    ]
  }, [])

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    let result = leadersData

    if (selectedCountry !== 'All') {
      result = result.filter((l) => l.country === selectedCountry)
    } else if (selectedRegion !== 'All') {
      // eslint-disable-next-line security/detect-object-injection
      const regionSet = new Set(LEADERS_REGION_COUNTRIES[selectedRegion] ?? [])
      result = result.filter((l) => regionSet.has(l.country))
    }

    if (selectedSector !== 'All') {
      result = result.filter((l) => l.type === selectedSector)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.organizations.some((o) => o.toLowerCase().includes(q)) ||
          l.bio.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      )
    }

    return result
  }, [selectedRegion, selectedCountry, selectedSector, searchQuery])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(filteredLeaders, LEADERS_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-leaders'))
  }, [filteredLeaders])

  return (
    <div className="space-y-6">
      <div className="text-center mb-2 md:mb-8">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient flex items-center justify-center gap-3">
          <Trophy className="text-primary shrink-0" size={28} />
          Transformation Leaders
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Meet the visionaries and organizations driving the global transition to Post-Quantum
          Cryptography.
        </p>
        {leadersMetadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 mb-4 md:mb-8 font-mono">
            <p>
              Data Source: {leadersMetadata.filename} • Updated:{' '}
              {leadersMetadata.lastUpdate.toLocaleDateString()}
            </p>
            <SourcesButton viewType="Leaders" />
            <ShareButton
              title="PQC Industry Leaders — Organizations Driving Post-Quantum Adoption"
              text="Meet the visionaries and organizations driving the global transition to post-quantum cryptography."
            />
            <GlossaryButton />
            <ExportButton onExport={handleExportCsv} />
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col md:flex-row items-center gap-3">
          {/* Mobile: Filters on one row */}
          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            {/* Sector Filter */}
            <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
              <FilterDropdown
                items={sectorItems}
                selectedId={selectedSector}
                onSelect={(id) => {
                  setSelectedSector(id)
                  logEvent('Leaders', 'Filter Sector', id)
                }}
                defaultLabel="Sector"
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>

            {/* Region Filter */}
            <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
              <FilterDropdown
                items={regionItems}
                selectedId={selectedRegion}
                onSelect={(id) => {
                  setSelectedRegion(id)
                  setSelectedCountry('All')
                  logEvent('Leaders', 'Filter Region', id)
                }}
                defaultLabel="Region"
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>

            {/* Country Filter */}
            <div className="flex-1 min-w-[100px] sm:min-w-[140px]">
              <FilterDropdown
                items={countryItems}
                selectedId={selectedCountry}
                onSelect={(id) => {
                  setSelectedCountry(id)
                  logEvent('Leaders', 'Filter Country', id)
                }}
                defaultLabel="Country"
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>
          </div>

          <span className="hidden md:inline text-muted-foreground px-2" aria-hidden="true">
            Search:
          </span>
          <div className="relative flex-1 min-w-[200px] w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor="leader-search" className="sr-only">
              Search leaders by name or title
            </label>
            <input
              id="leader-search"
              type="text"
              placeholder="Search leaders..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.length > 2) {
                  logEvent('Leaders', 'Search', e.target.value)
                }
              }}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notFoundMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel border-l-4 border-l-status-warning p-3 flex items-center gap-3 mb-4"
          >
            <AlertCircle size={18} className="text-status-warning shrink-0" />
            <p className="text-sm text-muted-foreground">{notFoundMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredLeaders.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title="No leaders found"
          description="Try adjusting the region, country, sector, or search query."
        />
      )}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredLeaders.map((leader) => (
          <div
            key={leader.id}
            id={`leader-${leader.name.replace(/\s+/g, '-')}`}
            className={
              highlightedLeader === leader.name
                ? 'ring-2 ring-primary/60 rounded-xl transition-all duration-500'
                : ''
            }
          >
            <LeaderCard leader={leader} />
          </div>
        ))}
      </div>
    </div>
  )
}
