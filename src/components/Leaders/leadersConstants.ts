// SPDX-License-Identifier: AGPL-3.0-only

import type { Leader } from '@/data/leadersData'

/** The leader categories, as the page's category filter offers them and as
 *  `?cat=` takes them (singular, exact spelling — "Skeptic/Critic" includes the
 *  slash). Every leader in the data has exactly one of these as their primary
 *  category. */
export const LEADER_CATEGORIES = [
  'Standards',
  'Industry Vendor',
  'Industry Adopter',
  'Algorithm Inventor',
  'Patent Inventor',
  'Open Source Maintainer',
  'Government',
  'Skeptic/Critic',
] as const

export type LeaderCategory = (typeof LEADER_CATEGORIES)[number]

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
  'United States': 'us',
  UK: 'gb',
  'United Kingdom': 'gb',
  Brazil: 'br',
  Estonia: 'ee',
  'Czech Republic': 'cz',
  Norway: 'no',
  'Hong Kong': 'hk',
  Taiwan: 'tw',
  'European Union': 'eu',
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
  'Israel/USA': 'il',
}

/** Display labels for the `?region=` ids (LeadersGrid's Region dropdown, and the
 *  phone Community screen's filter chip). */
export const LEADERS_REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'Europe',
  apac: 'Asia-Pacific',
}

/** Maps region IDs to the country name values used in the leaders CSV. The CSV
 *  spells some countries two ways ("USA" and "United States", "UK" and
 *  "United Kingdom"), so both spellings are listed; a leader whose country is in
 *  no list silently drops out of `?region=` (95 of 402 did until 2026-10-04).
 *  leadersConstants.test.ts fails when a country in the data is in no list. */
export const LEADERS_REGION_COUNTRIES: Record<string, string[]> = {
  americas: [
    'USA',
    'United States',
    'Canada',
    'Brazil',
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
    'Israel/USA',
  ],
  eu: [
    'UK',
    'United Kingdom',
    'France',
    'Germany',
    'Switzerland',
    'Belgium',
    'Portugal',
    'Estonia/EU',
    'Estonia',
    'Czech Republic',
    'Norway',
    'Austria',
    'European Union',
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
  apac: [
    'Singapore',
    'Japan',
    'South Korea',
    'Australia',
    'India',
    'China',
    'New Zealand',
    'Hong Kong',
    'Taiwan',
  ],
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

/**
 * "Who to follow, and why" — B+ remediation 4.1 (2026-08-10).
 *
 * The grid was byte-identical for every role that could see it: "it lists
 * people without saying why any of them should matter to the reader". This
 * turns the directory into a reading list by naming, per role, which two
 * categories are worth their time and what they get from each.
 *
 * Keyed by CATEGORY rather than by person, deliberately. A per-person editorial
 * line for 378 leaders would be unmaintainable, would go stale silently, and
 * would be the kind of unciteable authored claim this program is removing
 * elsewhere. Category is a real, sourced field on every row, and the guidance
 * below is about the category, which is a defensible thing to assert.
 *
 * Every `category` string here must exist in the live leaders CSV —
 * `leadersConstants.test.ts` fails otherwise, so a category rename cannot leave
 * a role pointed at an empty filter.
 */
export interface LeaderGuidance {
  category: string
  /** One line: what this reader gets from following this group. */
  why: string
}

export const PERSONA_LEADER_GUIDANCE: Record<string, LeaderGuidance[]> = {
  executive: [
    {
      category: 'Government',
      why: 'Use their cited publications to find policy signals; the profile alone does not establish an obligation or date for your organization.',
    },
    {
      category: 'Industry Adopter',
      why: 'Their published experience can suggest questions for your own programme, but it is not a comparable cost estimate.',
    },
  ],
  grc: [
    {
      category: 'Government',
      why: 'Follow the cited agency sources as inputs to an obligations review; inclusion here does not determine applicability.',
    },
    {
      category: 'Standards',
      why: 'Trace standards work to the issued document and version your programme actually references.',
    },
  ],
  developer: [
    {
      category: 'Open Source Maintainer',
      why: 'Find maintainers and then inspect the project release notes for implementation changes; your deployment schedule remains system-specific.',
    },
    {
      category: 'Algorithm Inventor',
      why: 'The people who designed what you are implementing; their papers answer the parameter questions the docs skip.',
    },
  ],
  architect: [
    {
      category: 'Standards',
      why: 'Use their cited work to follow interoperability discussions, while distinguishing drafts from issued standards.',
    },
    {
      category: 'Industry Vendor',
      why: 'Use vendor profiles to find roadmap sources and questions for suppliers, not as proof of product readiness.',
    },
  ],
  researcher: [
    {
      category: 'Algorithm Inventor',
      why: 'Primary sources for the constructions themselves — cite these, not the summaries of them.',
    },
    {
      category: 'Skeptic/Critic',
      why: 'The published dissent. A field with no recorded counter-claims is a field nobody has checked.',
    },
  ],
  'cert-engineer': [
    {
      category: 'Government',
      why: 'Find scheme and agency publications, then verify the programme, module boundary, and effective version that apply.',
    },
    {
      category: 'Industry Vendor',
      why: 'Find vendor claims worth checking against official certificate and validation records.',
    },
  ],
  ops: [
    {
      category: 'Industry Vendor',
      why: 'Use cited vendor material to investigate support windows; confirm product, version, and platform coverage directly.',
    },
    {
      category: 'Open Source Maintainer',
      why: 'Follow upstream project evidence for deprecations and releases, then check when your own distribution adopts them.',
    },
  ],
  curious: [
    {
      category: 'Government',
      why: 'Start with public-body sources to see which dates and policies have actually been published.',
    },
    {
      category: 'Algorithm Inventor',
      why: 'Connect the standardized algorithm names to the researchers and cited work behind them.',
    },
  ],
}
