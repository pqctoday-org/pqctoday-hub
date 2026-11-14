// SPDX-License-Identifier: AGPL-3.0-only
import { ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'
import type { TrustTier } from '@/data/trustScore'
import { isTrustTier, matchesTrustTierFilter, trustTiersFromParams } from '@/data/trustTierFilter'

// Re-exported: existing desktop callers import it from here.
export { matchesTrustTierFilter }

const TIER_OPTIONS: FilterDropdownItem[] = [
  { id: 'Authoritative', label: 'Authoritative' },
  { id: 'High', label: 'High' },
  { id: 'Moderate', label: 'Moderate' },
  { id: 'Low', label: 'Low' },
]

interface TrustTierFilterProps {
  className?: string
  /** Optional URL-param source override (for the sim embed). Defaults to useSearchParams. */
  params?: URLSearchParams
  setParams?: ReturnType<typeof useSearchParams>[1]
}

/**
 * TrustTierFilter — multi-select dropdown for trust tier (C8).
 * URL state: `?tier=Authoritative&tier=High` (repeated keys).
 * Default: no selection (no filtering applied).
 */
export function TrustTierFilter({
  className,
  params: paramsProp,
  setParams: setParamsProp,
}: TrustTierFilterProps) {
  const [urlParams, setUrlParams] = useSearchParams()
  const searchParams = paramsProp ?? urlParams
  const setSearchParams = setParamsProp ?? setUrlParams
  const selected = searchParams.getAll('tier').filter(isTrustTier)

  function handleChange(tiers: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tier')
        for (const t of tiers) {
          if (isTrustTier(t)) next.append('tier', t)
        }
        return next
      },
      { replace: true }
    )
  }

  return (
    <FilterDropdown
      items={TIER_OPTIONS}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="Trust tier"
      defaultIcon={<ShieldCheck size={14} className="text-primary" />}
      className={className}
    />
  )
}

/** Read trust-tier filter state — empty array when unset. Accepts an optional
 *  URLSearchParams override (for the sim embed). */
export function useTrustTierFilter(paramsOverride?: URLSearchParams): TrustTier[] {
  const [urlParams] = useSearchParams()
  return trustTiersFromParams(paramsOverride ?? urlParams)
}
