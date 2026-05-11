// SPDX-License-Identifier: GPL-3.0-only

export type SponsorTier = 'founding' | 'strategic' | 'category' | 'listed'

export interface Sponsor {
  /** Canonical company name as it should appear publicly */
  name: string
  tier: SponsorTier
  /** For category sponsors: the category they sponsor (e.g., "HSM", "PKI / CA") */
  category?: string
  /** Path under /public, or full URL */
  logoUrl: string
  /** One-line description for the About > Acknowledgments section */
  description?: string
  /** Sponsor's primary marketing URL */
  website: string
  /** ISO date the sponsorship started — used for "Sponsor since" attribution */
  since: string
}

/**
 * The list of active sponsors. Add an entry here when a sponsorship closes.
 * Ordering does not matter; consumers sort by tier or alphabetically.
 *
 * Editorial-independence note: sponsorship status here is purely a recognition
 * marker. It MUST NOT be referenced from /migrate, /compliance, or any other
 * editorial dataset to influence ordering, ranking, or inclusion. See:
 * https://pqctoday.com/editorial-independence
 */
export const SPONSORS: Sponsor[] = []

const TIER_RANK: Record<SponsorTier, number> = {
  founding: 0,
  strategic: 1,
  category: 2,
  listed: 3,
}

export function getSponsorsByTier(tier: SponsorTier): Sponsor[] {
  return SPONSORS.filter((s) => s.tier === tier).sort((a, b) => a.name.localeCompare(b.name))
}

export function getSponsorsForFooter(limit = 6): Sponsor[] {
  return [...SPONSORS]
    .sort((a, b) => {
      const t = TIER_RANK[a.tier] - TIER_RANK[b.tier]
      return t !== 0 ? t : a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

export function isSponsor(vendorName: string): Sponsor | undefined {
  const normalized = vendorName.trim().toLowerCase()
  return SPONSORS.find((s) => s.name.toLowerCase() === normalized)
}
