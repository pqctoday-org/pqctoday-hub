// SPDX-License-Identifier: GPL-3.0-only

import type { Leader } from '@/data/leadersData'

/** Category matching for the sidebar filter/counts. Every leader has ONE
 * primary `category` (their main claim to fame — unchanged, still exact-match
 * for every category), but "Patent Inventor" / "Open Source Maintainer" are
 * additionally INCLUSIVE: a leader whose primary category is something else
 * (e.g. Standards, Algorithm Inventor) but who also has a real patentRefs /
 * migrateCatalogRefs entry still counts and still shows up when that filter
 * is selected — reflecting a real, sourced contribution even when it isn't
 * this person's primary identity. Confirmed 2026-07-31: 5 of 7 leaders with
 * PatentRefs, and 5 of 7 with MigrateCatalogRefs, fall into exactly this
 * case (e.g. Dr. Vadim Lyubashevsky is category=Algorithm Inventor but also
 * holds a PQC patent). */
export function leaderMatchesCategory(leader: Leader, category: string): boolean {
  if (leader.category === category) return true
  if (category === 'Patent Inventor') return (leader.patentRefs?.length ?? 0) > 0
  if (category === 'Open Source Maintainer') return (leader.migrateCatalogRefs?.length ?? 0) > 0
  return false
}

/** Maps country name values from the leaders CSV to ISO 3166-1 alpha-2 flag codes.
 *  Dual-country entries use the first-listed country's code. */
export const FLAG_CODE_MAP: Record<string, string> = {
  USA: 'us',
  UK: 'gb',
  France: 'fr',
  Germany: 'de',
  Switzerland: 'ch',
  Canada: 'ca',
  Singapore: 'sg',
  Japan: 'jp',
  'South Korea': 'kr',
  Australia: 'au',
  Israel: 'il',
  Belgium: 'be',
  Portugal: 'pt',
  Netherlands: 'nl',
  Sweden: 'se',
  Spain: 'es',
  Italy: 'it',
  India: 'in',
  China: 'cn',
  Russia: 'ru',
  Finland: 'fi',
  Ireland: 'ie',
  'New Zealand': 'nz',
  'Estonia/EU': 'eu',
  'USA/Switzerland': 'us',
  'USA/Germany': 'us',
  'USA/Canada': 'us',
  'USA/China': 'us',
  'USA/Israel': 'us',
  'USA/Netherlands': 'us',
  'Belgium/USA': 'be',
  'France/Netherlands': 'fr',
  'France/USA': 'fr',
  'Germany/Netherlands': 'de',
  'Japan/USA': 'jp',
  'Netherlands/USA': 'nl',
}

/** Maps region IDs to the country name values used in the leaders CSV. */
export const LEADERS_REGION_COUNTRIES: Record<string, string[]> = {
  americas: [
    'USA',
    'Canada',
    'Belgium/USA',
    'France/USA',
    'Japan/USA',
    'Netherlands/USA',
    'USA/Canada',
    'USA/China',
    'USA/Germany',
    'USA/Israel',
    'USA/Netherlands',
    'USA/Switzerland',
  ],
  eu: [
    'UK',
    'France',
    'Germany',
    'Switzerland',
    'Belgium',
    'Portugal',
    'Estonia/EU',
    'Netherlands',
    'Sweden',
    'Russia',
    'Spain',
    'Italy',
    'Finland',
    'Ireland',
    'France/Netherlands',
    'Germany/Netherlands',
    'Israel',
  ],
  apac: ['Singapore', 'Japan', 'South Korea', 'Australia', 'India', 'China', 'New Zealand'],
}

/** migrate-catalog product_ids are kebab-case slugs ("bouncy-castle-java") —
 * the CSV has no per-leader display name for them, so this derives a
 * readable label (simple title-case; won't recover exact brand casing like
 * "OpenSSL", but that's a display nicety, not a correctness concern — the
 * link's href always carries the real product_id). */
export function productLabelFromId(productId: string): string {
  return productId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
