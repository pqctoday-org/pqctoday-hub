// SPDX-License-Identifier: GPL-3.0-only
import {
  Filter,
  Shield,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Globe,
  CheckCircle,
  Star,
  BadgeCheck,
  ListFilter,
} from 'lucide-react'
import { FilterDropdown } from '../common/FilterDropdown'
import { Input } from '../ui/input'
import { useState } from 'react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '../../data/learningPersonas'
import { granularityForPersona } from '../../data/pqcProtocolMatrix'

export const CRYPTO_FAMILY_ITEMS = [
  { id: 'All', label: 'All Families' },
  { id: 'Lattice', label: 'Lattice' },
  { id: 'Code-based', label: 'Code-based' },
  { id: 'Hash-based', label: 'Hash-based' },
  { id: 'Hybrid', label: 'Hybrid' },
  { id: 'Multivariate', label: 'Multivariate' },
  { id: 'Isogeny', label: 'Isogeny' },
  { id: 'Classical', label: 'Classical' },
]

export const FUNCTION_ITEMS = [
  { id: 'All', label: 'All Functions' },
  { id: 'KEM', label: 'KEM / Encryption' },
  { id: 'Signature', label: 'Signature' },
]

export const REGION_ITEMS = [
  { id: 'All', label: 'All Regions' },
  { id: 'NIST', label: 'NIST (US)' },
  { id: 'IETF', label: 'IETF (Global)' },
  { id: 'BSI/ANSSI', label: 'BSI/ANSSI (Europe)' },
  { id: 'ETSI', label: 'ETSI (Europe)' },
  { id: 'KpqC', label: 'KpqC (Korea)' },
  { id: 'CACR', label: 'CACR (China)' },
]

export const STATUS_ITEMS = [
  { id: 'All', label: 'All Statuses' },
  { id: 'Certified', label: 'Certified' },
  { id: 'Candidate', label: 'Candidate' },
  { id: 'To Be Checked', label: 'To Be Checked' },
]

const LEVEL_ITEMS = [
  { id: 'All', label: 'All Levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
  { id: '4', label: 'Level 4' },
  { id: '5', label: 'Level 5' },
]

export type QuickViewPreset = 'nist-picks' | 'fips-validated' | 'everything'

interface AlgorithmFiltersProps {
  cryptoFamily: string
  onCryptoFamilyChange: (id: string) => void
  functionGroup: string
  onFunctionGroupChange: (id: string) => void
  securityLevel: string
  onSecurityLevelChange: (id: string) => void
  region: string
  onRegionChange: (id: string) => void
  status: string
  onStatusChange: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  filteredCount: number
  totalCount: number
  availableLevels?: number[]
  /** Active persona — drives QuickView surface (binary personas hide the 5-dropdown bar by default). */
  persona?: PersonaId | null
  /** Called when a QuickView preset is selected. Implementation lives in AlgorithmsView. */
  onQuickView?: (preset: QuickViewPreset) => void
}

/**
 * Three-preset segmented control that replaces the 5-dropdown entry tax for
 * binary personas (executive / ops / curious). Power personas (developer /
 * architect / researcher) still see the dropdowns inline.
 */
function QuickViewSegmented({
  status,
  cryptoFamily,
  functionGroup,
  onQuickView,
}: {
  status: string
  cryptoFamily: string
  functionGroup: string
  onQuickView: (preset: QuickViewPreset) => void
}) {
  // Reverse-derive the active preset from current filter state so the
  // segmented chip shows which preset matches the live filters.
  let active: QuickViewPreset | null = null
  if (status === 'All' && cryptoFamily === 'All' && functionGroup === 'All') {
    active = 'everything'
  } else if (status === 'Certified' && cryptoFamily === 'Lattice') {
    active = 'nist-picks'
  } else if (status === 'Certified' && cryptoFamily === 'All' && functionGroup === 'All') {
    active = 'fips-validated'
  }

  const options: Array<{ id: QuickViewPreset; label: string; icon: typeof Star; title: string }> = [
    {
      id: 'nist-picks',
      label: 'NIST picks',
      icon: Star,
      title: 'FIPS 203/204/205 — ML-KEM, ML-DSA, SLH-DSA (Lattice-based standardized)',
    },
    {
      id: 'fips-validated',
      label: 'FIPS-validated',
      icon: BadgeCheck,
      title: 'All algorithms that have completed FIPS validation',
    },
    {
      id: 'everything',
      label: 'Everything',
      icon: ListFilter,
      title: 'Clear all filters — show every algorithm',
    },
  ]

  return (
    <div
      className="inline-flex rounded-md border border-border bg-card p-0.5"
      role="group"
      aria-label="Quick filter presets"
    >
      {options.map(({ id, label, icon: Icon, title }) => (
        <Button
          key={id}
          type="button"
          variant={active === id ? 'gradient' : 'ghost'}
          size="sm"
          onClick={() => onQuickView(id)}
          className="h-7 gap-1 px-2 text-xs"
          aria-pressed={active === id}
          title={title}
        >
          <Icon size={12} />
          {label}
        </Button>
      ))}
    </div>
  )
}

export function AlgorithmFilters({
  cryptoFamily,
  onCryptoFamilyChange,
  functionGroup,
  onFunctionGroupChange,
  securityLevel,
  onSecurityLevelChange,
  region,
  onRegionChange,
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  filteredCount,
  totalCount,
  availableLevels,
  persona = null,
  onQuickView,
}: AlgorithmFiltersProps) {
  const levelItems = availableLevels
    ? LEVEL_ITEMS.filter((item) => item.id === 'All' || availableLevels.includes(parseInt(item.id)))
    : LEVEL_ITEMS

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  // Binary personas (executive / ops / curious) hide the five-dropdown bar by
  // default — they get the QuickView segmented control as the primary entry
  // point. Ternary / researcher / no-persona always see the full bar inline.
  const isBinaryPersona = granularityForPersona(persona) === 'binary'
  const [advancedOpen, setAdvancedOpen] = useState(!isBinaryPersona)
  const hasActiveFilters =
    cryptoFamily !== 'All' ||
    functionGroup !== 'All' ||
    securityLevel !== 'All' ||
    region !== 'All' ||
    status !== 'All' ||
    searchQuery !== ''

  return (
    <div className="glass-panel p-3 md:p-4">
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between">
        <Button
          variant="ghost"
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
            className={clsx(
              'text-muted-foreground transition-transform',
              isMobileOpen && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* QuickView segmented control + "More filters" disclosure for binary personas */}
      {onQuickView && (
        <div
          className={clsx(
            'flex flex-wrap items-center gap-2 mt-3 md:mt-0',
            isMobileOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          <QuickViewSegmented
            status={status}
            cryptoFamily={cryptoFamily}
            functionGroup={functionGroup}
            onQuickView={onQuickView}
          />
          {isBinaryPersona && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              aria-expanded={advancedOpen}
            >
              <SlidersHorizontal size={12} />
              {advancedOpen ? 'Hide filters' : 'More filters'}
              <ChevronDown
                size={12}
                className={clsx('transition-transform', advancedOpen && 'rotate-180')}
              />
            </Button>
          )}
          <span
            className="text-xs text-muted-foreground md:ml-auto whitespace-nowrap"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing {filteredCount} of {totalCount}
          </span>
        </div>
      )}

      {/* Filters Container (Hidden on mobile unless open) */}
      <div
        className={clsx(
          'flex-col md:flex-row md:items-center gap-3 mt-3 md:mt-0',
          isMobileOpen ? 'flex' : 'hidden md:flex',
          !advancedOpen && 'md:!hidden'
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
            onSelect={(id) => {
              onCryptoFamilyChange(id)
              setIsMobileOpen(false)
            }}
            label="Family"
            defaultLabel="All Families"
            noContainer
          />

          <FilterDropdown
            items={FUNCTION_ITEMS}
            selectedId={functionGroup}
            onSelect={(id) => {
              onFunctionGroupChange(id)
              setIsMobileOpen(false)
            }}
            label="Function"
            defaultLabel="All Functions"
            noContainer
          />

          <FilterDropdown
            items={levelItems}
            selectedId={securityLevel}
            onSelect={(id) => {
              onSecurityLevelChange(id)
              setIsMobileOpen(false)
            }}
            label="Security"
            defaultLabel="All Levels"
            defaultIcon={<Shield size={16} className="text-primary" />}
            noContainer
          />

          <FilterDropdown
            items={REGION_ITEMS}
            selectedId={region}
            onSelect={(id) => {
              onRegionChange(id)
              setIsMobileOpen(false)
            }}
            label="Region"
            defaultLabel="All Regions"
            defaultIcon={<Globe size={16} className="text-primary" />}
            noContainer
          />

          <FilterDropdown
            items={STATUS_ITEMS}
            selectedId={status}
            onSelect={(id) => {
              onStatusChange(id)
              setIsMobileOpen(false)
            }}
            label="Status"
            defaultLabel="All Statuses"
            defaultIcon={<CheckCircle size={16} className="text-primary" />}
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
          <p className="text-[10px] text-muted-foreground mt-1 ml-1 hidden md:block">
            Try "lattice KEM", "FIPS certified", or "replaces RSA"
          </p>
        </div>

        {!onQuickView && (
          <div
            className="text-sm text-muted-foreground md:ml-auto whitespace-nowrap"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing {filteredCount} of {totalCount} algorithms
          </div>
        )}
      </div>
    </div>
  )
}
