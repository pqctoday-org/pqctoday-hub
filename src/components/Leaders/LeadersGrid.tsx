import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { leadersData, leadersMetadata } from '../../data/leadersData'
import { logEvent } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import { CountryFlag } from '../common/CountryFlag'
import { LeaderCard } from './LeaderCard'

export const LeadersGrid = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All')

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

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    if (selectedCountry === 'All') return leadersData
    return leadersData.filter((l) => l.country === selectedCountry)
  }, [selectedCountry])

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
          <p className="hidden lg:block text-[10px] md:text-xs text-muted-foreground/60 mb-4 md:mb-8 font-mono">
            Data Source: {leadersMetadata.filename} • Updated:{' '}
            {leadersMetadata.lastUpdate.toLocaleDateString()}
          </p>
        )}

        {/* Country Filter */}
        <FilterDropdown
          items={countryItems}
          selectedId={selectedCountry}
          onSelect={(id) => {
            setSelectedCountry(id)
            logEvent('Leaders', 'Filter Country', id)
          }}
          label="Select Region"
          defaultLabel="All Countries"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredLeaders.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
