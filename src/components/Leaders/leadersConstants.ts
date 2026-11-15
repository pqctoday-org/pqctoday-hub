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
  if (category === 'Open Source Maintainer')
    return (leader.migrateCatalogRefs ?? []).some((id) => isOpenSourceCatalogProduct(id))
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
  Austria: 'at',
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
  'United States/Canada': 'us',
  'Belgium/United States': 'be',
  'Japan/United States': 'jp',
  'Netherlands/United States': 'nl',
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
    'United States/Canada',
    'Belgium/United States',
    'Japan/United States',
    'Netherlands/United States',
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

/**
 * Display name and licence of every migrate-catalog product a leader row cites
 * (`MigrateCatalogRefs`), copied from the catalogue's `software_name` and
 * `license_type`. The 2.6 MB catalogue is not loaded on /leaders, so the names
 * live here; leadersConstants.test.ts fails when a cited product is missing or
 * its name or licence no longer matches the catalogue.
 */
export const LEADER_CATALOG_PRODUCTS: Record<string, { name: string; openSource: boolean }> = {
  'bouncy-castle-c-net': { name: 'Bouncy Castle C# .NET', openSource: true },
  'bouncy-castle-java': { name: 'Bouncy Castle Java', openSource: true },
  botan: { name: 'Botan', openSource: true },
  'cosmian-covercrypt': { name: 'Cosmian covercrypt', openSource: false },
  'go-stdlib-crypto-mlkem': { name: 'Go stdlib crypto/mlkem', openSource: true },
  'google-tink': { name: 'Google Tink', openSource: true },
  leancrypto: { name: 'leancrypto', openSource: true },
  'liboqs-rust-oqs-crate': { name: 'liboqs-rust (oqs crate)', openSource: true },
  'mlkem-native': { name: 'mlkem-native', openSource: true },
  openssl: { name: 'OpenSSL', openSource: true },
  pqcrypto: { name: 'pqcrypto', openSource: true },
  'Qinsight-Atlas-Cryptographic-Discovery-P': {
    name: 'Qinsight Atlas — Cryptographic Discovery & Posture Management Platform',
    openSource: false,
  },
  'rustcrypto-ml-dsa': { name: 'RustCrypto ml-dsa', openSource: true },
  'rustcrypto-ml-kem': { name: 'RustCrypto ml-kem', openSource: true },
}

function catalogProduct(productId: string) {
  return Object.prototype.hasOwnProperty.call(LEADER_CATALOG_PRODUCTS, productId)
    ? // eslint-disable-next-line security/detect-object-injection -- own key checked above
      LEADER_CATALOG_PRODUCTS[productId]
    : undefined
}

/** The catalogue's name for a product; a title-cased slug when it is not listed. */
export function productLabelFromId(productId: string): string {
  return (
    catalogProduct(productId)?.name ??
    productId
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}

/** True only when the catalogue records the product's licence as open source. */
export function isOpenSourceCatalogProduct(productId: string): boolean {
  return catalogProduct(productId)?.openSource === true
}

/** Section heading for a leader's catalogue products: "Open Source Project(s)"
 *  only when every product is open source, otherwise "Catalog Product(s)". */
export function catalogProductsHeading(productIds: readonly string[]): string {
  const allOpen = productIds.every((id) => isOpenSourceCatalogProduct(id))
  const noun = allOpen ? 'Open Source Project' : 'Catalog Product'
  return productIds.length === 1 ? noun : `${noun}s (${productIds.length})`
}

/**
 * Countries that have rows on /timeline (timeline CSV `Country`), limited to
 * the ones leader rows use. leadersConstants.test.ts checks this list against
 * timelineData both ways for every leader country, so it cannot drift.
 */
const TIMELINE_COUNTRIES = new Set([
  'Australia',
  'Brazil',
  'Canada',
  'China',
  'Czech Republic',
  'European Union',
  'Finland',
  'France',
  'Germany',
  'Hong Kong',
  'India',
  'Israel',
  'Italy',
  'Japan',
  'Netherlands',
  'Norway',
  'Singapore',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Taiwan',
  'United Kingdom',
  'United States',
])

/**
 * The /timeline country for a leader's "Events from …" link, or null when the
 * Timeline has no events for it (blank, or a country such as Ireland with no
 * Timeline rows). A dual-country value uses its first part that has events.
 */
export function leaderTimelineCountry(country: string): string | null {
  for (const part of country.split('/')) {
    const p = part.trim()
    if (TIMELINE_COUNTRIES.has(p)) return p
  }
  return null
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
      why: 'Agency profiles, such as NIST, ENISA and national authorities, link to cited publications. The directory lists few certification-programme, laboratory or scheme profiles, so verify the programme, module boundary, and effective version in the official register.',
    },
    {
      category: 'Industry Vendor',
      why: 'Vendor profiles link to cited material whose claims are worth checking against official certificate and validation records; a profile is not a record of any certificate.',
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

/** The card's "Ask about" question, without "They are  at ." when a row has
 *  no role or organization (7 rows have no role, 1 neither). */
export function leaderAssistantQuestion(leader: Leader): string {
  const orgs = leader.organizations.filter((o) => o.trim())
  const role = leader.title.trim()
  const who =
    role && orgs.length > 0
      ? ` They are ${role} at ${orgs.join(' and ')}.`
      : role
        ? ` They are ${role}.`
        : orgs.length > 0
          ? ` They work with ${orgs.join(' and ')}.`
          : ''
  const background = leader.bio ? ` Background: ${leader.bio}` : ''
  return `What is ${leader.name}'s role in post-quantum cryptography?${who}${background}`
}

const REMOVAL_TEMPLATE = `**Name:** [Your full name or the name listed on the page]
**Organization:** [If applicable]
**Reason:** [Optional — no questions asked]`

/** Pre-filled GitHub Discussions post asking for a profile's correction or
 *  removal — the request route the Community page and the phone screen link to. */
export const LEADER_REMOVAL_REQUEST_URL = (() => {
  const base = 'https://github.com/pqctoday-org/pqctoday-hub/discussions/new'
  const params = new URLSearchParams({
    category: 'i-consent-to-be-added-as-a-pqc-leader',
    title: 'Request removal from the PQC Community',
    body: REMOVAL_TEMPLATE,
  })
  return `${base}?${params.toString()}`
})()

/** How profiles get into the directory (owner decision 2026-11-14, Leaders A-1). */
export const LEADER_PROVENANCE_SENTENCE =
  'Profiles are compiled from cited public sources (standards, research, patents, open-source projects) and from people who ask to be listed.'

/** The same fact for pages outside /leaders (disclaimer, About), which have to
 *  say which directory they mean (owner decision 2026-11-14). */
export const LEADER_COMMUNITY_PROVENANCE =
  'Profiles in the Community directory are compiled from cited public sources (standards, research, patents, open-source projects) and from people who ask to be listed.'
