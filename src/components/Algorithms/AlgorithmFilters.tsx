// SPDX-License-Identifier: GPL-3.0-only
import { Filter, Shield, Search, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { FilterDropdown } from '../common/FilterDropdown'
import { Input } from '../ui/input'
import { useState } from 'react'
import clsx from 'clsx'

export const CRYPTO_FAMILY_ITEMS = [
  { id: 'All', label: 'All Families' },
  { id: 'Lattice', label: 'Lattice' },
  { id: 'Code-based', label: 'Code-based' },
  { id: 'Hash-based', label: 'Hash-based' },
  { id: 'Hybrid', label: 'Hybrid' },
  { id: 'Classical', label: 'Classical' },
]

export const FUNCTION_ITEMS = [
  { id: 'All', label: 'All Functions' },
  { id: 'KEM', label: 'KEM / Encryption' },
  { id: 'Signature', label: 'Signature' },
]

const LEVEL_ITEMS = [
  { id: 'All', label: 'All Levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
  { id: '4', label: 'Level 4' },
  { id: '5', label: 'Level 5' },
]

interface AlgorithmFiltersProps {
  cryptoFamily: string
  onCryptoFamilyChange: (id: string) => void
  functionGroup: string
  onFunctionGroupChange: (id: string) => void
  securityLevel: string
  onSecurityLevelChange: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  filteredCount: number
  totalCount: number
  availableLevels?: number[]
}

export function AlgorithmFilters({
  cryptoFamily,
  onCryptoFamilyChange,
  functionGroup,
  onFunctionGroupChange,
  securityLevel,
  onSecurityLevelChange,
  searchQuery,
  onSearchChange,
  filteredCount,
  totalCount,
  availableLevels,
}: AlgorithmFiltersProps) {
  const levelItems = availableLevels
    ? LEVEL_ITEMS.filter((item) => item.id === 'All' || availableLevels.includes(parseInt(item.id)))
    : LEVEL_ITEMS

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const hasActiveFilters =
    cryptoFamily !== 'All' || functionGroup !== 'All' || securityLevel !== 'All' || searchQuery !== ''

  return (
    <div className="glass-panel p-3 md:p-4">
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center gap-2 text-sm font-medium text-foreground p-2 rounded-md bg-muted/50 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
            <span>Filter Algorithms</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary inline-block ml-1" />
            )}
          </div>
          <ChevronDown
            size={16}
            className={clsx('text-muted-foreground transition-transform', isMobileOpen && 'rotate-180')}
          />
        </button>
      </div>

      {/* Filters Container (Hidden on mobile unless open) */}
      <div
        className={clsx(
          'flex-col md:flex-row md:items-center gap-3 mt-3 md:mt-0',
          isMobileOpen ? 'flex' : 'hidden md:flex'
        )}
      >
        <div className="hidden md:flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            items={CRYPTO_FAMILY_ITEMS}
            selectedId={cryptoFamily}
            onSelect={onCryptoFamilyChange}
            label="Family"
            defaultLabel="All Families"
            noContainer
          />

          <FilterDropdown
            items={FUNCTION_ITEMS}
            selectedId={functionGroup}
            onSelect={onFunctionGroupChange}
            label="Function"
            defaultLabel="All Functions"
            noContainer
          />

          <FilterDropdown
            items={levelItems}
            selectedId={securityLevel}
            onSelect={onSecurityLevelChange}
            label="Security"
            defaultLabel="All Levels"
            defaultIcon={<Shield size={16} className="text-primary" />}
            noContainer
          />
        </div>

        <div className="relative flex-1 min-w-[180px] md:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search algorithms..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <div className="text-sm text-muted-foreground md:ml-auto whitespace-nowrap">
          Showing {filteredCount} of {totalCount} algorithms
        </div>
      </div>
    </div>
  )
}
