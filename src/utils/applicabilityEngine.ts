// SPDX-License-Identifier: GPL-3.0-only
/**
 * Applicability Engine — single source of truth for "what applies to this user".
 *
 * Given a UserProfile {industry, country, region}, classifies each item across
 * the 4 content domains (compliance frameworks, library docs, threats, timeline
 * events) into one of 4 tiers:
 *
 *   - 'mandatory'     — country + industry both match (or item is industry-universal)
 *   - 'cross-border'  — country matches; item targets other industries
 *   - 'advisory'      — industry matches; item is global/region-relevant
 *   - 'informational' — only region or weak signal matches
 *
 * Reused by /assess Step 5, /compliance For-You tab, the assessment report,
 * and the command center, replacing inline filter logic that previously lived
 * in each consumer.
 */
import type { ComplianceFramework } from '../data/complianceData'
import { complianceFrameworks } from '../data/complianceData'
import type { ThreatData } from '../data/threatsData'
import { threatsData } from '../data/threatsData'
import type { TimelineEvent, CountryData } from '../types/timeline'
import { timelineData } from '../data/timelineData'

/** Flattens the hierarchical timeline structure into a flat list of events. */
function flattenTimeline(countries: CountryData[]): TimelineEvent[] {
  const out: TimelineEvent[] = []
  for (const c of countries) {
    for (const body of c.bodies) {
      for (const ev of body.events) out.push(ev)
    }
  }
  return out
}

const FLAT_TIMELINE_EVENTS: TimelineEvent[] = flattenTimeline(timelineData)
import type { LibraryItem } from '../data/libraryData'
import { libraryData } from '../data/libraryData'
import type { Region } from '../store/usePersonaStore'
import type { XwalkRelationshipType } from '../data/conceptXwalkData'
import { EU_MEMBER_COUNTRIES } from './euCountries'
import { REGION_COUNTRIES_MAP, INDUSTRY_TO_THREATS_MAP } from '../data/personaConfig'
import { canonicalizeLibraryIndustry } from './industryNormalization'
import { resolveToNaicsSet } from '../data/sectorVocabularyData'
import { isDomesticRegulator, isFiveEyesAffinity, isEuLevelBody } from './regulatorMap'
import pqcVocabOverlay from '../data/pqc-vocab-overlay.json'

// ── Types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  industry: string | null
  country: string | null
  region?: Region | null
}

export type ApplicabilityTier =
  | 'mandatory'
  | 'recognized'
  | 'cross-border'
  | 'advisory'
  | 'derived'
  | 'informational'

/** A single trust-path hop from a directly-matched standard to a derived one. */
export interface TrustPath {
  sourceStandardId: string
  sourceStandardLabel: string
  sourceTier: ApplicabilityTier
  relationshipType: XwalkRelationshipType
  /** 0–100 score from the xwalk edge's confidence label */
  edgeConfidence: number
  edgeEvidence: string
  reviewerDisplay: string
  reviewedDate: string
  /** Propagated confidence: source_conf × rel_multiplier × (edge_conf / 100) */
  derivedConfidence: number
  hop: 1 | 2
}

export interface ApplicabilityResult<T> {
  item: T
  tier: ApplicabilityTier
  /** Human-readable reason — shown in panel chips/tooltips. */
  reason: string
  /** Present only when tier === 'derived' — the IR 8477 trust path that produced this result. */
  trustPath?: TrustPath
}

/** Normalized view of an item's applicability fields, abstracted across types. */
interface ItemFields {
  countries: string[]
  industries: string[]
  /** True when item applies regardless of industry (universal scope). */
  industryUniversal: boolean
  /** True when item is global/country-universal. */
  countryUniversal: boolean
  /**
   * The body that enforces / authors / promulgates the item. Drives the new
   * Mandatory-vs-Recognized distinction: a country-matched item with a domestic
   * enforcement body is Mandatory; with a foreign enforcement body it's
   * Recognized. Optional — items without a clear authoring body fall through
   * to weaker tiers regardless.
   */
  enforcementBody?: string | null
}

// ── Profile helpers ──────────────────────────────────────────────────────

export function isProfileEmpty(profile: UserProfile): boolean {
  const { industry, country, region } = profile
  const hasIndustry = !!industry && industry !== 'Other'
  const hasCountry = !!country && country !== 'Global'
  const hasRegion = !!region && region !== 'global'
  return !hasIndustry && !hasCountry && !hasRegion
}

function regionCountriesFor(profile: UserProfile): Set<string> | null {
  const { country, region } = profile
  // Only fall back to region when country is not a specific value
  if (country && country !== 'Global') return null
  if (!region || region === 'global') return null
  return new Set(REGION_COUNTRIES_MAP[region])
}

function isEuMember(profile: UserProfile): boolean {
  return profile.country ? EU_MEMBER_COUNTRIES.has(profile.country) : false
}

// ── Controlled-vocabulary normalization (FR-PF-01/FR-PF-02) ─────────────
// Accepts ISO 3166-1 alpha-2 codes, PQC overlay codes, and legacy freeform
// strings. Returns an array of normalized country values (PQC overlay codes
// may expand to multiple ISO codes).

// Bidirectional ISO 3166-1 alpha-2 ↔ full-name map for the countries that
// appear in our data CSVs. Needed because normalize-vocab-tags converts full
// names to ISO codes in _r2 CSVs while the assessment store keeps full names.
const ISO_TO_FULL: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  JP: 'Japan',
  SG: 'Singapore',
  IL: 'Israel',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  NZ: 'New Zealand',
}
const FULL_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_TO_FULL).map(([k, v]) => [v, k])
)

/**
 * Expand a CSV country token to all equivalent forms so the profile's full-
 * name ('United States') can match a CSV row that stores the ISO code ('US'),
 * or vice versa.
 */
function expandCountry(value: string): string[] {
  const v = value.trim()
  const full = ISO_TO_FULL[v]
  if (full) return [v, full]
  const iso = FULL_TO_ISO[v]
  if (iso) return [v, iso]
  return [v]
}

export function normalizeCountry(value: string): string[] {
  const v = value.trim()
  if (/^[A-Z]{2}$/.test(v)) return [v]
  if (v.startsWith('PQC-REGION-')) {
    const overlay = (
      pqcVocabOverlay.geography as Array<{ code: string; maps_to: string | string[] | null }>
    ).find((g) => g.code === v)
    if (overlay?.maps_to) {
      return Array.isArray(overlay.maps_to) ? overlay.maps_to : [overlay.maps_to]
    }
  }
  return [v]
}

const NAICS_2DIGIT_TO_FREEFORM: Record<string, string[]> = {
  '52': ['Finance & Banking', 'Finance & Insurance', 'Banking', 'financial'],
  '92': ['Government & Defense', 'Government', 'Defense', 'Public Administration'],
  '54': ['Technology', 'Professional Services'],
  '51': ['Technology', 'Information Technology', 'Software', 'Telecommunications', 'Telecom'],
  '62': ['Healthcare', 'Life Sciences', 'Medical'],
  '22': ['Energy & Utilities', 'Energy', 'Utilities'],
  '48': ['Transportation', 'Logistics'],
}

export function normalizeIndustry(value: string): string[] {
  const v = value.trim()
  if (/^\d{2,6}$/.test(v)) return [v]
  if (v.startsWith('PQC-SECTOR-')) return [v]
  // Check if the freeform string can be mapped to a NAICS code
  for (const [naics, aliases] of Object.entries(NAICS_2DIGIT_TO_FREEFORM)) {
    if (aliases.some((a) => v.toLowerCase().includes(a.toLowerCase()))) return [naics, v]
  }
  return [v]
}

/**
 * Expand a CSV `industries` list (typically NAICS 2-digit codes from compliance
 * frameworks) to also include the freeform aliases users see in the UI. Keeps
 * the original codes so NAICS-driven filters (top SectorFilter, ?sector=) keep
 * working while letting freeform-driven inputs (ProfileSummary, persona/assess
 * store) match the same rows.
 */
export function expandIndustriesForMatching(industries: string[]): string[] {
  const out = new Set<string>(industries)
  for (const i of industries) {
    if (/^\d{2,6}$/.test(i)) {
      const aliases = NAICS_2DIGIT_TO_FREEFORM[i.slice(0, 2)] ?? []
      for (const a of aliases) out.add(a)
      continue
    }
    // FIXED 2026-08-11: freeform labels were never expanded, only numeric codes.
    //
    // The compliance CSV almost never stores the code — it stores the long
    // NAICS label: 'Finance & Insurance' on 106 rows, 'Public Administration'
    // on 133, 'Information Technology' on 61. The persona vocabulary the reader
    // actually picks from says 'Finance & Banking', 'Government & Defense',
    // 'Technology'. Those are the SAME sector and sat in the same alias group
    // here, but the group was only ever consulted for a numeric entry, so a
    // Finance & Banking reader matched the 5 rows literally tagged that and
    // missed the 106 tagged 'Finance & Insurance'.
    //
    // With a country set this stayed hidden: the industry-universal rule
    // (3+ industries) carried those rows in on the country match instead, so
    // the register looked right. With no country there is nothing to carry
    // them, which is why "Country: Any" returned an empty page rather than
    // "every instrument for this sector".
    //
    // First matching group wins — deterministic, and enough to join the label
    // to its own siblings without letting one row drift across sectors.
    for (const [code, aliases] of Object.entries(NAICS_2DIGIT_TO_FREEFORM)) {
      if (aliases.some((a) => i.toLowerCase().includes(a.toLowerCase()))) {
        out.add(code)
        for (const a of aliases) out.add(a)
        break
      }
    }
  }
  return Array.from(out)
}

/**
 * Do a CSV row's industry tags and the profile's industry land on the same
 * NAICS sector, per the shared `sector_vocabulary_*.csv`?
 *
 * ADDED 2026-08-13. `expandIndustriesForMatching` above walks
 * `NAICS_2DIGIT_TO_FREEFORM` and **breaks on the first matching group**, which
 * is wrong whenever a label belongs to two groups. The live case:
 * `'Information Technology'` contains the substring `'Technology'`, which is in
 * group `'54'`, iterated before `'51'` — the group that holds
 * `'Telecommunications'`. So a Telecommunications reader matched **zero**
 * telecom frameworks, and GSMA PQ.01/02/03 and every 3GPP row (all tagged
 * `Information Technology`) were unreachable. Four canonical industries —
 * Automotive, Aerospace, Retail & E-Commerce, Cross-cutting & Other — had no
 * group at all, so `Retail Trade` rows were unreachable from
 * `Retail & E-Commerce`.
 *
 * Rather than reorder that map (a fix that would need redoing at the next
 * two-group label), this consults the vocabulary the Library facet and the
 * compliance industry filter already resolve through, where a label may hold
 * several codes at once and no ordering is implied.
 *
 * Deliberately ADDITIVE — it only widens `directIndustryMatch`, never narrows
 * it, so nothing that matched before this change stops matching. That is what
 * keeps the blast radius (/compliance, /assess, the report) to "more rows
 * correctly included".
 *
 * `resolveToNaicsSet` echoes its input when nothing matches, so an unresolved
 * label yields `['<label>']` and can only self-match — which the identity
 * check on the line above already covers.
 */
function sectorCodesOverlap(csvIndustries: string[], profileIndustry: string): boolean {
  const mine = resolveToNaicsSet(profileIndustry)
  if (mine.length === 0 || (mine.length === 1 && mine[0] === profileIndustry)) return false
  const mineSet = new Set(mine)
  return csvIndustries.some((i) => resolveToNaicsSet(i).some((c) => mineSet.has(c)))
}

// ── Tier classifier ──────────────────────────────────────────────────────

interface ClassifyResult {
  tier: ApplicabilityTier
  reason: string
}

function classifyMatch(profile: UserProfile, fields: ItemFields): ClassifyResult | null {
  const { industry, country, region } = profile
  const { countries, industries, industryUniversal, countryUniversal, enforcementBody } = fields

  const hasIndustry = !!industry && industry !== 'Other'
  const hasCountry = !!country && country !== 'Global'

  // Country signals — expand both sides to handle ISO↔full-name mismatches
  // (e.g. profile stores 'United States' but _r2 CSVs use 'US').
  const eu = isEuMember(profile)
  const expandedProfileCountry = country ? expandCountry(country) : []
  const expandedCsvCountries = countries.flatMap(expandCountry)
  const isEuCsvEntry = countries.some((c) => c === 'European Union' || c === 'PQC-REGION-EU')
  const directCountryMatch =
    hasCountry &&
    (expandedProfileCountry.some((c) => expandedCsvCountries.includes(c)) || (eu && isEuCsvEntry))
  const regionCountries = regionCountriesFor(profile)
  const regionCountryMatch =
    !directCountryMatch && regionCountries !== null
      ? countries.some((c) => regionCountries.has(c)) || (region === 'eu' && isEuCsvEntry)
      : false

  // Industry signals — direct match only counts when the item has at least one
  // explicit industry tag; empty industry lists are NOT treated as a match for
  // industry-specific tiers (only as universal qualifiers when country matches).
  const directIndustryMatch =
    hasIndustry && (industries.includes(industry!) || sectorCodesOverlap(industries, industry!))
  const industryApplies = directIndustryMatch || industryUniversal

  // Authority signals — drive Mandatory-vs-Recognized when country matches.
  const eb = enforcementBody?.trim() || null
  const domesticBody = isDomesticRegulator(country, industry, eb) || (eu && isEuLevelBody(eb))
  const fiveEyesBody = !domesticBody && isFiveEyesAffinity(country, eb)

  // Tier rules — first match wins (ordered strongest → weakest).
  // We only emit results when there's a meaningful signal — items that share
  // neither country nor industry (and only have a weak region tie or a
  // generic "applies to everyone" tag) are intentionally dropped to keep the
  // panel signal-dense.
  if (directCountryMatch && industryApplies) {
    if (domesticBody) {
      return {
        tier: 'mandatory',
        reason: eb
          ? `Your regulator: ${eb}`
          : directIndustryMatch
            ? `${country} + ${industry} match`
            : `${country} match (applies to all industries)`,
      }
    }
    if (fiveEyesBody) {
      return {
        tier: 'recognized',
        reason: `Five Eyes affinity — ${eb} recognized in ${country}`,
      }
    }
    return {
      tier: 'recognized',
      reason: eb
        ? `Foreign authority ${eb} — recognized in ${country}`
        : `Recognized in ${country}`,
    }
  }
  if (directCountryMatch) {
    // Suppress industry-specific domestic standards that explicitly target a
    // different sector (e.g. HIPAA for a Finance profile). Only surface as
    // cross-border when the item is industry-universal so the user gets
    // contextual country-level coverage without irrelevant sector noise.
    if (!industryUniversal) return null
    return {
      tier: 'cross-border',
      reason: hasIndustry ? `${country} match (different industry focus)` : `${country} match`,
    }
  }
  if (directIndustryMatch && countryUniversal) {
    return { tier: 'advisory', reason: `Global standard for ${industry}` }
  }
  if (regionCountryMatch && directIndustryMatch) {
    return {
      tier: 'advisory',
      reason: `${region?.toUpperCase()} region + ${industry} match`,
    }
  }
  return null
}

// ── Public matchers (one per content type) ───────────────────────────────

/**
 * Step5's industry-universal heuristic: items targeting 0 or 3+ industries are
 * treated as universal. Preserved for backwards-compat with the wizard.
 */
function isIndustryUniversal(industries: string[]): boolean {
  return industries.length === 0 || industries.length >= 3
}

function isCountryUniversal(countries: string[]): boolean {
  return countries.length === 0 || countries.includes('Global')
}

export function applicableFrameworks(
  profile: UserProfile,
  frameworks: ComplianceFramework[] = complianceFrameworks
): ApplicabilityResult<ComplianceFramework>[] {
  if (isProfileEmpty(profile)) return []
  const out: ApplicabilityResult<ComplianceFramework>[] = []
  for (const fw of frameworks) {
    const match = classifyMatch(profile, {
      countries: fw.countries,
      industries: expandIndustriesForMatching(fw.industries),
      industryUniversal: isIndustryUniversal(fw.industries),
      countryUniversal: isCountryUniversal(fw.countries),
      enforcementBody: fw.enforcementBody,
    })
    if (match) out.push({ item: fw, tier: match.tier, reason: match.reason })
  }
  return out
}

export function applicableLibraryDocs(
  profile: UserProfile,
  docs: LibraryItem[] = libraryData
): ApplicabilityResult<LibraryItem>[] {
  if (isProfileEmpty(profile)) return []
  const out: ApplicabilityResult<LibraryItem>[] = []
  for (const doc of docs) {
    // Library uses semicolon-delimited regionScope and applicableIndustries arrays.
    const countries = doc.regionScope
      ? doc.regionScope
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    // Canonicalize the library's freeform industry tags ("IT" → "Technology",
    // "Government" → "Government & Defense") so they line up with the user's
    // canonical industry from the assessment store.
    const rawIndustries = doc.applicableIndustries ?? []
    const industries = Array.from(
      new Set(
        rawIndustries.map((t) => canonicalizeLibraryIndustry(t)).filter((v): v is string => !!v)
      )
    )
    // Library uses `authorsOrOrganization` as a freeform credit string; take the
    // first canonical org as the closest analogue to "enforcementBody". Best-effort.
    const firstAuthor = doc.authorsOrOrganization
      ? doc.authorsOrOrganization.split(/[;,]/)[0]?.trim()
      : null
    const match = classifyMatch(profile, {
      countries,
      industries,
      industryUniversal: isIndustryUniversal(industries),
      countryUniversal: isCountryUniversal(countries),
      enforcementBody: firstAuthor,
    })
    if (match) out.push({ item: doc, tier: match.tier, reason: match.reason })
  }
  return out
}

/**
 * Threat data has a single `industry` field; we wrap it in an array for the
 * classifier. Threats are never country-tagged at the row level — country
 * relevance is encoded by ID prefix (e.g. AUS-GOV-001) which we extract
 * heuristically.
 */
const COUNTRY_PREFIX_MAP: Record<string, string> = {
  AUS: 'Australia',
  USA: 'United States',
  EU: 'European Union',
  UK: 'United Kingdom',
  CAN: 'Canada',
  JPN: 'Japan',
  SGP: 'Singapore',
  KOR: 'South Korea',
}

function countriesForThreat(threatId: string): string[] {
  const prefix = threatId.split('-')[0]?.toUpperCase()
  if (!prefix) return []
  const country = COUNTRY_PREFIX_MAP[prefix]
  return country ? [country] : []
}

export function applicableThreats(
  profile: UserProfile,
  threats: ThreatData[] = threatsData
): ApplicabilityResult<ThreatData>[] {
  if (isProfileEmpty(profile)) return []
  // Expand the user's canonical industry into the threat-table industry vocabulary
  // (e.g. 'Government & Defense' → ['Government & Defense', 'Legal / Notary / eSignature']).
  // Profiles only emit a directIndustryMatch when the threat's row industry
  // appears in this expanded set.
  const profileForThreats: UserProfile =
    profile.industry && profile.industry in INDUSTRY_TO_THREATS_MAP
      ? { ...profile, industry: profile.industry } // canonical name preserved for reason text
      : profile

  const expandedIndustries = profile.industry
    ? new Set(INDUSTRY_TO_THREATS_MAP[profile.industry] ?? [])
    : new Set<string>()

  const out: ApplicabilityResult<ThreatData>[] = []
  for (const t of threats) {
    const rowIndustries = t.industry ? [t.industry] : []
    const countries = countriesForThreat(t.threatId)
    // For threats, "industry match" means the threat's row industry is in
    // the user's expanded threat-industry set. We synthesize an `industries`
    // array for the classifier that includes the user's canonical name iff
    // the expansion matches — making `directIndustryMatch=true` flow through.
    const synthIndustries = rowIndustries.some((ri) => expandedIndustries.has(ri))
      ? [profile.industry as string]
      : rowIndustries
    // Threats don't carry a regulatory enforcementBody — `mainSource` is a
    // citation, not an authority. Pass null so the classifier never reaches
    // the Mandatory tier via authority-match for threats; threats stay at
    // country+industry signal only.
    const match = classifyMatch(profileForThreats, {
      countries,
      industries: synthIndustries,
      industryUniversal: false,
      countryUniversal: countries.length === 0,
      enforcementBody: null,
    })
    if (match) out.push({ item: t, tier: match.tier, reason: match.reason })
  }
  return out
}

export function applicableTimelineEvents(
  profile: UserProfile,
  events: TimelineEvent[] = FLAT_TIMELINE_EVENTS
): ApplicabilityResult<TimelineEvent>[] {
  if (isProfileEmpty(profile)) return []
  const out: ApplicabilityResult<TimelineEvent>[] = []
  for (const ev of events) {
    const countries = ev.countryName ? [ev.countryName] : []
    // Timeline events do not carry industry tags — treat as industry-universal.
    // `orgName` is the regulator/sponsor of the event (e.g. "ASD" for an ISM
    // update); pass it as enforcementBody so AU+ASD events get classified as
    // Mandatory for an AU user instead of Recognized.
    const match = classifyMatch(profile, {
      countries,
      industries: [],
      industryUniversal: true,
      countryUniversal: countries.length === 0 || ev.countryName === 'Global',
      enforcementBody: ev.orgName,
    })
    if (match) out.push({ item: ev, tier: match.tier, reason: match.reason })
  }
  return out
}

// ── Aggregator ───────────────────────────────────────────────────────────

export interface AllApplicable {
  frameworks: ApplicabilityResult<ComplianceFramework>[]
  library: ApplicabilityResult<LibraryItem>[]
  threats: ApplicabilityResult<ThreatData>[]
  timeline: ApplicabilityResult<TimelineEvent>[]
}

export function allApplicable(profile: UserProfile): AllApplicable {
  return {
    frameworks: applicableFrameworks(profile),
    library: applicableLibraryDocs(profile),
    threats: applicableThreats(profile),
    timeline: applicableTimelineEvents(profile),
  }
}

// ── Tier helpers (for UI consumers) ──────────────────────────────────────

export const TIER_ORDER: ApplicabilityTier[] = [
  'mandatory',
  'recognized',
  'cross-border',
  'advisory',
  'derived',
  'informational',
]

export const TIER_META: Record<ApplicabilityTier, { label: string; description: string }> = {
  mandatory: {
    label: 'Mandatory',
    description: 'Your domestic regulator enforces this — direct compliance obligation',
  },
  recognized: {
    label: 'Recognized',
    description: 'Foreign authority — your country recognizes or adopts this standard',
  },
  'cross-border': {
    label: 'Cross-border',
    description: 'Country matches; targets other industries — review for relevance',
  },
  advisory: {
    label: 'Advisory',
    description: 'Global or regional standard for your industry — recommended adoption',
  },
  derived: {
    label: 'Related via IR 8477',
    description: 'Semantically related standard — derived via a reviewed concept relationship',
  },
  informational: {
    label: 'Informational',
    description: 'Regional context or peer-industry relevance',
  },
}

// ── Timeline ↔ Framework join ────────────────────────────────────────────

/**
 * Splits a list of timeline-event applicability results into:
 *   - `byFrameworkId`: events that match ≥1 framework's (country, enforcementBody)
 *     pair — surfaced as inline milestones on each matching framework card.
 *   - `industryEvents`: events with no framework match — surfaced as a small
 *     standalone "Industry events" sidebar in ExecutiveTimelineView.
 *
 * An event can match multiple frameworks (e.g. an ASD ISM update matches both
 * ASD-ISM and DSPF-PQC if both list ASD as enforcement body); in that case it
 * appears under each.
 */
export function linkTimelineToFrameworks(
  events: ApplicabilityResult<TimelineEvent>[],
  frameworks: ApplicabilityResult<ComplianceFramework>[]
): {
  byFrameworkId: Map<string, ApplicabilityResult<TimelineEvent>[]>
  industryEvents: ApplicabilityResult<TimelineEvent>[]
} {
  const byFrameworkId = new Map<string, ApplicabilityResult<TimelineEvent>[]>()
  const industryEvents: ApplicabilityResult<TimelineEvent>[] = []

  for (const evRes of events) {
    const ev = evRes.item
    let matched = false
    for (const fwRes of frameworks) {
      const fw = fwRes.item
      const countryHit = ev.countryName && fw.countries.includes(ev.countryName)
      const bodyHit =
        ev.orgName && fw.enforcementBody && ev.orgName.trim() === fw.enforcementBody.trim()
      if (countryHit && bodyHit) {
        if (!byFrameworkId.has(fw.id)) byFrameworkId.set(fw.id, [])
        byFrameworkId.get(fw.id)!.push(evRes)
        matched = true
      }
    }
    if (!matched) industryEvents.push(evRes)
  }

  return { byFrameworkId, industryEvents }
}

export function groupByTier<T>(
  results: ApplicabilityResult<T>[]
): Record<ApplicabilityTier, ApplicabilityResult<T>[]> {
  const out: Record<ApplicabilityTier, ApplicabilityResult<T>[]> = {
    mandatory: [],
    recognized: [],
    'cross-border': [],
    advisory: [],
    derived: [],
    informational: [],
  }
  for (const r of results) out[r.tier].push(r)
  return out
}
