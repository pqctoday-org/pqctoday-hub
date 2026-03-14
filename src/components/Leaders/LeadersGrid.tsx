// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Briefcase,
  Building2,
  School,
  AlertCircle,
  Users,
  Award,
  ShieldX,
} from 'lucide-react'

import { usePersonaStore } from '@/store/usePersonaStore'
import { leadersData, leadersMetadata } from '../../data/leadersData'
import type { Leader } from '../../data/leadersData'
import { logEvent } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import { EmptyState } from '../ui/empty-state'
import { CountryFlag } from '../common/CountryFlag'
import { LeaderCard } from './LeaderCard'
import { LeadersTable } from './LeadersTable'
import { LeaderDetailPopover } from './LeaderDetailPopover'
import { LeaderCategorySidebar, LEADER_CATEGORIES } from './LeaderCategorySidebar'
import { FLAG_CODE_MAP, LEADERS_REGION_COUNTRIES } from './leadersConstants'
import { ViewToggle } from '../Library/ViewToggle'
import type { ViewMode } from '../Library/ViewToggle'
import { SortControl } from '../Library/SortControl'
import { PageHeader } from '../common/PageHeader'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { LEADERS_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { LeaderConsentModal } from './LeaderConsentModal'
import { LeaderRemovalModal } from './LeaderRemovalModal'
import { Button } from '../ui/button'

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'Europe',
  apac: 'Asia-Pacific',
}

type LeaderSortOption = 'name' | 'country' | 'category'

const LEADER_SORT_OPTIONS: { id: LeaderSortOption; label: string }[] = [
  { id: 'name', label: 'Name A-Z' },
  { id: 'country', label: 'Country' },
  { id: 'category', label: 'Category' },
]

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
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [highlightedLeader, setHighlightedLeader] = useState<string | null>(() =>
    searchParams.get('leader')
  )
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortBy, setSortBy] = useState<LeaderSortOption>('name')
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const { selectedIndustries } = usePersonaStore()

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
          setActiveCategory('All')
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
  }, [highlightedLeader, selectedCountry, selectedSector, searchQuery, activeCategory])

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

  // Category tabs for mobile dropdown
  const categoryTabs = useMemo(() => ['All', ...LEADER_CATEGORIES], [])

  // Category info for the sidebar pills
  const categoryInfo = useMemo(() => {
    return LEADER_CATEGORIES.map((name) => {
      const items = leadersData.filter((l) => l.category === name)
      return {
        name,
        count: items.length,
        hasUpdates: items.some((l) => l.status === 'New' || l.status === 'Updated'),
      }
    })
  }, [])

  const totalHasUpdates = leadersData.some((l) => l.status === 'New' || l.status === 'Updated')

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    let result = leadersData

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter((l) => l.category === activeCategory)
    }

    // Country / Region filter
    if (selectedCountry !== 'All') {
      result = result.filter((l) => l.country === selectedCountry)
    } else if (selectedRegion !== 'All') {
      // eslint-disable-next-line security/detect-object-injection
      const regionSet = new Set(LEADERS_REGION_COUNTRIES[selectedRegion] ?? [])
      result = result.filter((l) => regionSet.has(l.country))
    }

    // Sector filter
    if (selectedSector !== 'All') {
      result = result.filter((l) => l.type === selectedSector)
    }

    // Search filter
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
  }, [selectedRegion, selectedCountry, selectedSector, activeCategory, searchQuery])

  // Industry relevance — leaders whose bio/organizations match selected industries
  const industryRelevant = useMemo(() => {
    const relevant = new Set<string>()
    if (selectedIndustries.length === 0) return relevant
    const keywords = selectedIndustries.map((ind) => ind.toLowerCase().split(/\s*[&/]\s*/)).flat()
    for (const leader of leadersData) {
      const text =
        `${leader.bio} ${leader.organizations.join(' ')} ${leader.category}`.toLowerCase()
      if (keywords.some((kw) => text.includes(kw))) {
        relevant.add(leader.id)
      }
    }
    return relevant
  }, [selectedIndustries])

  // Sort for card view
  const sortedLeaders = useMemo(() => {
    const items = [...filteredLeaders]
    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'country':
        items.sort((a, b) => a.country.localeCompare(b.country))
        break
      case 'category':
        items.sort((a, b) => a.category.localeCompare(b.category))
        break
    }
    // Stable secondary sort: industry-relevant leaders float to top
    if (industryRelevant.size > 0) {
      items.sort((a, b) => {
        const aR = industryRelevant.has(a.id) ? 0 : 1
        const bR = industryRelevant.has(b.id) ? 0 : 1
        return aR - bR
      })
    }
    return items
  }, [filteredLeaders, sortBy, industryRelevant])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(sortedLeaders, LEADERS_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-leaders'))
  }, [sortedLeaders])

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category)
    logEvent('Leaders', 'Filter Category', category)
  }

  const openDetail = (leader: Leader) => setSelectedLeader(leader)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Transformation Leaders"
        description="Visionaries and organizations driving the global transition to Post-Quantum Cryptography."
        dataSource={
          leadersMetadata
            ? `${leadersMetadata.filename} • Updated: ${leadersMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Leaders"
        shareTitle="PQC Industry Leaders — Organizations Driving Post-Quantum Adoption"
        shareText="Meet the visionaries and organizations driving the global transition to post-quantum cryptography."
        onExport={handleExportCsv}
        endorseUrl={buildEndorsementUrl({
          category: 'leader-endorsement',
          title: 'Endorse: PQC Transformation Leaders',
          resourceType: 'Leaders Page',
          resourceId: 'Transformation Leaders',
          resourceDetails:
            '**Page:** Transformation Leaders — Visionaries and organizations driving the global transition to Post-Quantum Cryptography.',
          pageUrl: '/leaders',
        })}
        endorseLabel="Leaders Page"
        endorseResourceType="Leaders"
        flagUrl={buildFlagUrl({
          category: 'leader-endorsement',
          title: 'Flag: PQC Transformation Leaders',
          resourceType: 'Leaders Page',
          resourceId: 'Transformation Leaders',
          resourceDetails:
            '**Page:** Transformation Leaders — Visionaries and organizations driving the global transition to Post-Quantum Cryptography.',
          pageUrl: '/leaders',
        })}
        flagLabel="Leaders Page"
        flagResourceType="Leaders"
      />

      {/* Leader consent / removal CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setIsConsentModalOpen(true)
            logEvent('Leaders', 'Open Consent Modal')
          }}
          className="gap-2 text-sm"
        >
          <Award size={16} className="text-primary" />I consent to be added as a PQC Leader
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setIsRemovalModalOpen(true)
            logEvent('Leaders', 'Open Removal Modal')
          }}
          className="gap-2 text-sm text-muted-foreground"
        >
          <ShieldX size={16} />
          Request removal
        </Button>
      </div>

      {/* Category pill tabs (desktop) */}
      <LeaderCategorySidebar
        categories={categoryInfo}
        active={activeCategory}
        onSelect={handleCategorySelect}
        totalCount={leadersData.length}
        totalHasUpdates={totalHasUpdates}
      />

      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col md:flex-row items-center gap-3">
        {/* Mobile: Category dropdown (hidden on lg where pills show) */}
        <div className="flex items-center gap-2 w-full lg:hidden text-xs">
          <div className="flex-1 min-w-[150px]">
            <FilterDropdown
              items={categoryTabs}
              selectedId={activeCategory}
              onSelect={handleCategorySelect}
              defaultLabel="Category"
              noContainer
              opaque
              className="mb-0 w-full"
            />
          </div>
        </div>

        {/* Sector + Region + Country + Search + Sort + ViewToggle */}
        <div className="flex flex-wrap items-center gap-2 w-full text-xs">
          <div className="min-w-[100px]">
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

          <div className="min-w-[100px]">
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

          <div className="min-w-[100px]">
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

          <div className="relative flex-1 min-w-[140px]">
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
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 min-h-[44px] text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {viewMode === 'cards' && (
            <SortControl value={sortBy} onChange={setSortBy} options={LEADER_SORT_OPTIONS} />
          )}

          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredLeaders.length} leader{filteredLeaders.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' && ` in ${activeCategory}`}
      </p>

      {/* Not found toast */}
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

      {/* Empty state */}
      {filteredLeaders.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title="No leaders found"
          description="Try adjusting the category, sector, region, country, or search query."
        />
      )}

      {/* Content area */}
      {filteredLeaders.length > 0 && viewMode === 'cards' ? (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {sortedLeaders.map((leader) => (
            <div
              key={leader.id}
              id={`leader-${leader.name.replace(/\s+/g, '-')}`}
              className={
                highlightedLeader === leader.name
                  ? 'ring-2 ring-primary/60 rounded-xl transition-all duration-500'
                  : ''
              }
            >
              <LeaderCard
                leader={leader}
                onClick={() => openDetail(leader)}
                isIndustryMatch={industryRelevant.has(leader.id)}
              />
            </div>
          ))}
        </div>
      ) : filteredLeaders.length > 0 ? (
        <>
          <div className="hidden md:block">
            <LeadersTable data={filteredLeaders} onViewDetails={openDetail} />
          </div>
          {/* Mobile fallback to cards */}
          <div ref={gridRef} className="md:hidden grid grid-cols-1 gap-4">
            {sortedLeaders.map((leader) => (
              <div
                key={leader.id}
                id={`leader-${leader.name.replace(/\s+/g, '-')}`}
                className={
                  highlightedLeader === leader.name
                    ? 'ring-2 ring-primary/60 rounded-xl transition-all duration-500'
                    : ''
                }
              >
                <LeaderCard
                  leader={leader}
                  onClick={() => openDetail(leader)}
                  isIndustryMatch={industryRelevant.has(leader.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Detail Popover */}
      <LeaderDetailPopover
        isOpen={!!selectedLeader}
        onClose={() => setSelectedLeader(null)}
        leader={selectedLeader}
      />

      {/* Leader Consent Modal */}
      <LeaderConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
      />

      {/* Leader Removal Modal */}
      <LeaderRemovalModal
        isOpen={isRemovalModalOpen}
        onClose={() => setIsRemovalModalOpen(false)}
      />
    </div>
  )
}
