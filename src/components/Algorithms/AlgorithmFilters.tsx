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
  ShieldCheck,
  Lightbulb,
  X,
} from 'lucide-react'
import { FilterDropdown } from '../common/FilterDropdown'
import { Input } from '../ui/input'
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { PersonaId } from '../../data/learningPersonas'
import { granularityForPersona } from '../../data/pqcProtocolMatrix'

export const CRYPTO_FAMILY_ITEMS = [
  { id: 'All', label: 'All Families' },
  { id: 'Lattice', label: 'Lattice' },
  { id: 'Code-based', label: 'Code-based' },
  { id: 'Hash-based', label: 'Hash-based' },
  // P2.1 (2026-05-22): renamed from 'Hybrid' to 'Composite (math)' to
  // disambiguate from protocol-level "hybrid signature". The loader maps
  // legacy CSV 'Hybrid' → 'Composite' so this id matches the data.
  { id: 'Composite', label: 'Composite (math)' },
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
  /** CNSA 2.0 lens state — rendered as a Row-1 toggle inside the deck. */
  cnsaLens?: boolean
  onToggleCnsaLens?: () => void
  /** One-line persona hint shown as the deck's bottom row; dismissible. */
  personaHint?: string
  /** Optional action rendered at the end of the persona-hint line (e.g. executive "View Top 4"). */
  hintAction?: ReactNode
  onDismissHint?: () => void
  /** Clears every active filter + search in one click. */
  onClearAll?: () => void
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
          className="min-h-[44px] md:min-h-0 md:h-7 gap-1 px-2 text-xs"
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
  cnsaLens = false,
  onToggleCnsaLens,
  personaHint,
  hintAction,
  onDismissHint,
  onClearAll,
}: AlgorithmFiltersProps) {
  const levelItems = availableLevels
    ? LEVEL_ITEMS.filter((item) => item.id === 'All' || availableLevels.includes(parseInt(item.id)))
    : LEVEL_ITEMS

  // Binary personas (executive / ops / curious) collapse the five-dropdown bar
  // by default — they lead with the QuickView segmented control + search.
  // Ternary / researcher / no-persona open the dropdown row inline.
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
    <div className="glass-panel p-3 md:p-4 space-y-3">
      {/* Row 1 — primary controls, always visible */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search (primary) */}
        <div className="relative flex-1 min-w-[200px] md:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder='Search — try "lattice KEM" or "replaces RSA"'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm"
            aria-label="Search algorithms"
          />
        </div>

        {onQuickView && (
          <QuickViewSegmented
            status={status}
            cryptoFamily={cryptoFamily}
            functionGroup={functionGroup}
            onQuickView={onQuickView}
          />
        )}

        {/* CNSA 2.0 lens toggle — primary-tinted when active */}
        {onToggleCnsaLens && (
          <Button
            variant={cnsaLens ? 'gradient' : 'outline'}
            size="sm"
            onClick={onToggleCnsaLens}
            aria-pressed={cnsaLens}
            className="min-h-[44px] md:min-h-0 md:h-7 gap-1.5 px-2 text-xs"
            title="Filter to the NSA CNSA 2.0 suite — ML-KEM-1024 / ML-DSA-87 required; SLH-DSA excluded"
          >
            <ShieldCheck size={13} aria-hidden="true" />
            CNSA 2.0
          </Button>
        )}

        {/* Filters disclosure — toggles the dropdown row */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="min-h-[44px] md:min-h-0 md:h-7 gap-1 px-2 text-xs text-muted-foreground"
          aria-expanded={advancedOpen}
        >
          <SlidersHorizontal size={12} />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          )}
          <ChevronDown
            size={12}
            className={clsx('transition-transform', advancedOpen && 'rotate-180')}
          />
        </Button>

        <span
          className="text-xs text-muted-foreground ml-auto whitespace-nowrap"
          aria-live="polite"
          aria-atomic="true"
        >
          Showing {filteredCount} of {totalCount}
        </span>
      </div>

      {/* Row 2 — dropdown filters, collapsible */}
      {advancedOpen && (
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Filter size={18} className="text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filters
            </span>
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

            <FilterDropdown
              items={REGION_ITEMS}
              selectedId={region}
              onSelect={onRegionChange}
              label="Region"
              defaultLabel="All Regions"
              defaultIcon={<Globe size={16} className="text-primary" />}
              noContainer
            />

            <FilterDropdown
              items={STATUS_ITEMS}
              selectedId={status}
              onSelect={onStatusChange}
              label="Status"
              defaultLabel="All Statuses"
              defaultIcon={<CheckCircle size={16} className="text-primary" />}
              noContainer
            />

            {onClearAll && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              >
                <X size={12} />
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Row 3 — single-line persona hint, dismissible */}
      {personaHint && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
          <Lightbulb size={13} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="flex-1">{personaHint}</span>
          {hintAction}
          {onDismissHint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissHint}
              aria-label="Dismiss hint"
              className="h-5 w-5 p-0 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
