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
      why: 'They set the deadlines you will be held to — their statements become your dates.',
    },
    {
      category: 'Industry Adopter',
      why: 'Organisations already mid-migration. Their published experience is the closest thing to a cost estimate you can cite.',
    },
  ],
  developer: [
    {
      category: 'Open Source Maintainer',
      why: 'They ship the libraries you will actually import — their release notes are your migration schedule.',
    },
    {
      category: 'Algorithm Inventor',
      why: 'The people who designed what you are implementing; their papers answer the parameter questions the docs skip.',
    },
  ],
  architect: [
    {
      category: 'Standards',
      why: 'The editors whose drafts decide what interoperates. Following the draft beats reacting to the RFC.',
    },
    {
      category: 'Industry Vendor',
      why: 'Whoever supplies your estate — their roadmap is a constraint on yours whether you track it or not.',
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
  ops: [
    {
      category: 'Industry Vendor',
      why: 'The people whose support timelines decide when you can actually upgrade what you run.',
    },
    {
      category: 'Open Source Maintainer',
      why: 'Upstream for most of your estate — deprecations land here first, months before your distro.',
    },
  ],
  curious: [
    {
      category: 'Government',
      why: 'The clearest signal that this is real: these are the bodies that have already set dates.',
    },
    {
      category: 'Algorithm Inventor',
      why: 'The people who built the replacements. Their work is why there is a fix at all.',
    },
  ],
}
