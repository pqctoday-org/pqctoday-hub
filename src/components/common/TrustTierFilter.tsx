// SPDX-License-Identifier: AGPL-3.0-only
import { ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'
import { getTrustScore, type TrustTier, type ScoredResourceType } from '@/data/trustScore'

const TIER_ORDER: TrustTier[] = ['Authoritative', 'High', 'Moderate', 'Low']

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

function isTrustTier(value: string): value is TrustTier {
  return TIER_ORDER.includes(value as TrustTier)
}

/** Read trust-tier filter state — empty array when unset. Accepts an optional
 *  URLSearchParams override (for the sim embed). */
export function useTrustTierFilter(paramsOverride?: URLSearchParams): TrustTier[] {
  const [urlParams] = useSearchParams()
  const selected = (paramsOverride ?? urlParams).getAll('tier').filter(isTrustTier)
  // Keep the same array while the selected tiers do not change. A new array on every
  // render would be a new dependency for every memo and effect that reads it: the
  // records table reports its rows back up, which re-renders the page with a new array,
  // and that repeats without end. Only known tiers are keyed, and tier names have no comma.
  const key = selected.join(',')
  return useMemo(() => (key ? (key.split(',') as TrustTier[]) : []), [key])
}

/**
 * Returns true if the (resourceType, resourceId) pair has a tier matching one
 * of the selected tiers, OR if no tier filter is active. Records with no
 * trust score are excluded from results when any tier is selected — preserving
 * the user's intent ("show me only Authoritative content").
 */
export function matchesTrustTierFilter(
  selectedTiers: TrustTier[],
  resourceType: ScoredResourceType,
  resourceId: string
): boolean {
  if (selectedTiers.length === 0) return true
  const score = getTrustScore(resourceType, resourceId)
  if (!score) return false
  return selectedTiers.includes(score.tier)
}
