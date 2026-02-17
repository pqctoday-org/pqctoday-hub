import { useState, useMemo } from 'react'
import { Search, Briefcase, Building2, School } from 'lucide-react'

import { leadersData, leadersMetadata } from '../../data/leadersData'
import { logEvent } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import { CountryFlag } from '../common/CountryFlag'
import { LeaderCard } from './LeaderCard'
import { SourcesButton } from '../ui/SourcesButton'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'

export const LeadersGrid = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All')
  const [selectedSector, setSelectedSector] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Extract unique countries
  const countryItems = useMemo(() => {
    const unique = new Set(leadersData.map((l) => l.country))
    const sortedCountries = Array.from(unique).sort()

    // Helper to get flag code from country name (simple mapping)
    const getFlagCode = (country: string) => {
      const map: Record<string, string> = {
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
        'Estonia/EU': 'eu',
        'USA/Switzerland': 'us',
        'France/Netherlands': 'fr',
        'Germany/Netherlands': 'de',
        'USA/Germany': 'us',
      }
      // eslint-disable-next-line security/detect-object-injection
      return map[country] || 'un' // default to UN flag or similar if needed
    }

    return [
      { id: 'All', label: 'All Countries', icon: null },
      ...sortedCountries.map((c) => ({
        id: c,
        label: c,
        icon: <CountryFlag code={getFlagCode(c)} width={20} height={12} />,
      })),
    ]
  }, [])

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
        icon: <School size={14} className="text-blue-400" />,
      },
    ]
  }, [])

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    let result = leadersData

    if (selectedCountry !== 'All') {
      result = result.filter((l) => l.country === selectedCountry)
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
  }, [selectedCountry, selectedSector, searchQuery])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-2 md:mb-12">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
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
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col md:flex-row items-center gap-4">
          {/* Mobile: Filters on one row */}
          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            {/* Sector Filter */}
            <div className="flex-1 min-w-[120px]">
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
            <div className="flex-1 min-w-[120px]">
              <FilterDropdown
                items={countryItems}
                selectedId={selectedCountry}
                onSelect={(id) => {
                  setSelectedCountry(id)
                  logEvent('Leaders', 'Filter Country', id)
                }}
                defaultLabel="Region"
                opaque
                className="mb-0 w-full"
                noContainer
              />
            </div>
          </div>

          <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
          <div className="relative flex-1 min-w-[200px] w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeaders.map((leader) => (
          <LeaderCard key={leader.id} leader={leader} />
        ))}
      </div>
    </div>
  )
}
