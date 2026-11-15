// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The `?tier=` trust-tier filter as pure logic, no JSX — shared by the desktop
 * TrustTierFilter control and the phone screens, so a shared `?tier=` link
 * filters the same records on both.
 */
import { getTrustScore, type TrustTier, type ScoredResourceType } from '@/data/trustScore'

export const TRUST_TIER_ORDER: TrustTier[] = ['Authoritative', 'High', 'Moderate', 'Low']

export function isTrustTier(value: string): value is TrustTier {
  return TRUST_TIER_ORDER.includes(value as TrustTier)
}

/** `?tier=Authoritative&tier=High` → the known tiers; empty when unset. */
export function trustTiersFromParams(params: URLSearchParams): TrustTier[] {
  return params.getAll('tier').filter(isTrustTier)
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
