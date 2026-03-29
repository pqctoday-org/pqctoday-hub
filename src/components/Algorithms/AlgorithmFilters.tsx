// SPDX-License-Identifier: GPL-3.0-only
import { Filter, Shield, Search } from 'lucide-react'
import { FilterDropdown } from '../common/FilterDropdown'
import { Input } from '../ui/input'

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

  return (
    <div className="glass-panel p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
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
