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
import { EU_MEMBER_COUNTRIES } from './euCountries'
import { REGION_COUNTRIES_MAP, INDUSTRY_TO_THREATS_MAP } from '../data/personaConfig'
import { canonicalizeLibraryIndustry } from './industryNormalization'
import { isDomesticRegulator, isFiveEyesAffinity, isEuLevelBody } from './regulatorMap'

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
  | 'informational'

export interface ApplicabilityResult<T> {
  item: T
  tier: ApplicabilityTier
  /** Human-readable reason — shown in panel chips/tooltips. */
  reason: string
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

  // Country signals
  const eu = isEuMember(profile)
  const directCountryMatch =
    hasCountry && (countries.includes(country!) || (eu && countries.includes('European Union')))
  const regionCountries = regionCountriesFor(profile)
  const regionCountryMatch =
    !directCountryMatch && regionCountries !== null
      ? countries.some((c) => regionCountries.has(c)) ||
        (region === 'eu' && countries.includes('European Union'))
      : false

  // Industry signals — direct match only counts when the item has at least one
  // explicit industry tag; empty industry lists are NOT treated as a match for
  // industry-specific tiers (only as universal qualifiers when country matches).
  const directIndustryMatch = hasIndustry && industries.includes(industry!)
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
      industries: fw.industries,
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
  // (e.g. 'Government & Defense' → ['Government / Defense', 'Legal / Notary / eSignature']).
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
    informational: [],
  }
  for (const r of results) out[r.tier].push(r)
  return out
}
