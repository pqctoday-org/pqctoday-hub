// SPDX-License-Identifier: AGPL-3.0-only
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
import { getAlgorithmDefaults } from '../../data/personaConfig'
import {
  CRYPTO_FAMILY_ITEMS,
  FUNCTION_ITEMS,
  REGION_ITEMS,
  STATUS_ITEMS,
  LEVEL_ITEMS,
  filterValueLabel,
  type FilterKey,
} from './algorithmFilterOptions'

export {
  CRYPTO_FAMILY_ITEMS,
  FUNCTION_ITEMS,
  REGION_ITEMS,
  STATUS_ITEMS,
  LEVEL_ITEMS,
} from './algorithmFilterOptions'

// Keep the legacy `fips-validated` id for existing URLs. The learner-facing
// label is deliberately "Final NIST standards": FIPS standardizes algorithms;
// CMVP validates concrete cryptographic modules.
export type QuickViewPreset = 'nist-picks' | 'final-nist-standards' | 'everything'

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
  /** Which QuickView preset (if any) is currently applied. Owned by useAlgorithmExplorer. */
  quickView?: 'none' | 'nist-picks' | 'final-nist-standards'
  /** Called when a QuickView preset is selected. Implementation lives in AlgorithmsView. */
  onQuickView?: (preset: QuickViewPreset) => void
  /** CNSA 2.0 lens state — rendered as a Row-1 toggle inside the deck. */
  cnsaLens?: boolean
  onToggleCnsaLens?: () => void
  /** Research-gap filter — narrows to algorithms with an incomplete data row. */
  researchGapOnly?: boolean
  onToggleResearchGapOnly?: () => void
  /** One-line persona hint shown as the deck's bottom row; dismissible. */
  personaHint?: string
  /** Optional action rendered at the end of the persona-hint line (e.g. executive "View Top 4"). */
  hintAction?: ReactNode
  onDismissHint?: () => void
  /** Clears every active filter + search in one click. */
  onClearAll?: () => void
  /**
   * Filters currently set by the reader's role preset rather than by the URL
   * or a click (useAlgorithmExplorer's `roleDefaultFilters`). When omitted,
   * any filter still equal to the role's preset value is treated as one.
   */
  roleDefaultFilters?: ReadonlyArray<{ key: FilterKey; label: string }>
}

/** Role-preset filters still in force, judged from the persona and the current values. */
function roleDefaultsInForce(
  persona: PersonaId | null,
  current: Record<FilterKey, string>
): Array<{ key: FilterKey; label: string }> {
  if (!persona) return []
  const preset = getAlgorithmDefaults(persona).filters
  return (Object.keys(current) as FilterKey[]).flatMap((key) => {
    // eslint-disable-next-line security/detect-object-injection -- key is a typed union
    const def = preset[key]
    // eslint-disable-next-line security/detect-object-injection -- key is a typed union
    if (!def || def === 'All' || current[key] !== def) return []
    return [{ key, label: filterValueLabel(key, def) }]
  })
}

/**
 * Three-preset segmented control that replaces the 5-dropdown entry tax for
 * binary personas (executive / ops / curious). Power personas (developer /
 * architect / researcher) still see the dropdowns inline.
 */
function QuickViewSegmented({
  quickView,
  onQuickView,
  narrowed,
}: {
  quickView: 'none' | 'nist-picks' | 'final-nist-standards'
  onQuickView: (preset: QuickViewPreset) => void
  /** A dropdown filter (e.g. a role default) still hides rows. */
  narrowed: boolean
}) {
  // quickView is tracked directly (see useAlgorithmExplorer.ts) rather than
  // reverse-derived from the Family/Function/Status dropdowns — that reverse
  // derivation was itself part of the bug: it made "FIPS-validated" mean
  // "status=Certified" (which also includes non-FIPS regional standards like
  // AIMer/HAETAE/Classic-McEliece) and "NIST picks" mean "family=Lattice"
  // (which excludes SLH-DSA, a Hash-based algorithm this preset's own
  // tooltip claims to include).
  // "Everything" only reads as pressed when nothing else hides rows; with a
  // dropdown filter still in force no preset is pressed.
  const active: QuickViewPreset | null =
    quickView === 'none' ? (narrowed ? null : 'everything') : quickView

  const options: Array<{ id: QuickViewPreset; label: string; icon: typeof Star; title: string }> = [
    {
      id: 'nist-picks',
      label: 'NIST picks',
      icon: Star,
      title: 'FIPS 203/204/205 — ML-KEM, ML-DSA, and hash-based SLH-DSA',
    },
    {
      id: 'final-nist-standards',
      label: 'Final NIST standards',
      icon: BadgeCheck,
      title:
        'Algorithms published in final NIST FIPS standards; this does not validate a product or module',
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
  quickView = 'none',
  onQuickView,
  cnsaLens = false,
  onToggleCnsaLens,
  researchGapOnly = false,
  onToggleResearchGapOnly,
  personaHint,
  hintAction,
  onDismissHint,
  onClearAll,
  roleDefaultFilters,
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
    searchQuery !== '' ||
    quickView !== 'none'
  const dropdownNarrowed =
    cryptoFamily !== 'All' ||
    functionGroup !== 'All' ||
    securityLevel !== 'All' ||
    region !== 'All' ||
    status !== 'All'
  const roleDefaults =
    roleDefaultFilters ??
    roleDefaultsInForce(persona, {
      family: cryptoFamily,
      fn: functionGroup,
      level: securityLevel,
      region,
      status,
    })
  const clearFilter: Record<FilterKey, (id: string) => void> = {
    family: onCryptoFamilyChange,
    fn: onFunctionGroupChange,
    level: onSecurityLevelChange,
    region: onRegionChange,
    status: onStatusChange,
  }

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
            placeholder='Search — try "lattice KEM" or "ML-DSA"'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm"
            aria-label="Search algorithms"
          />
        </div>

        {onQuickView && (
          <QuickViewSegmented
            quickView={quickView}
            onQuickView={onQuickView}
            narrowed={dropdownNarrowed}
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

        {/* Research-gap toggle — narrows to algorithms with an incomplete data row */}
        {onToggleResearchGapOnly && (
          <Button
            variant={researchGapOnly ? 'gradient' : 'outline'}
            size="sm"
            onClick={onToggleResearchGapOnly}
            aria-pressed={researchGapOnly}
            className="min-h-[44px] md:min-h-0 md:h-7 gap-1.5 px-2 text-xs"
            title="Filter to algorithms with at least one 'Research needed' field"
          >
            <Lightbulb size={13} aria-hidden="true" />
            Research needed
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

      {/* Role-preset filters stay visible even with the dropdown row collapsed,
          so rows a role hides are never hidden silently. */}
      {roleDefaults.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="role-default-filters">
          {roleDefaults.map(({ key, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-muted px-2.5 py-1 text-xs text-foreground"
            >
              Role default: {label}
              <Button
                variant="ghost"
                size="sm"
                // eslint-disable-next-line security/detect-object-injection -- key is a typed union
                onClick={() => clearFilter[key]('All')}
                aria-label={`Clear role default filter: ${label}`}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X size={12} aria-hidden="true" />
              </Button>
            </span>
          ))}
        </div>
      )}

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
