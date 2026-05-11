// SPDX-License-Identifier: GPL-3.0-only
import { ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
}

/**
 * TrustTierFilter — multi-select dropdown for trust tier (C8).
 * URL state: `?tier=Authoritative&tier=High` (repeated keys).
 * Default: no selection (no filtering applied).
 */
export function TrustTierFilter({ className }: TrustTierFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
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

/** Read trust-tier filter state from URL — returns empty array when unset. */
export function useTrustTierFilter(): TrustTier[] {
  const [searchParams] = useSearchParams()
  return searchParams.getAll('tier').filter(isTrustTier)
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
