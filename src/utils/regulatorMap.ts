// SPDX-License-Identifier: GPL-3.0-only
/**
 * Domestic-regulator lookup for `(country, industry)` pairs.
 *
 * Used by the applicability engine's Mandatory tier test:
 * a framework is Mandatory only when its `enforcementBody` matches a domestic
 * regulator for the user's country + industry. A framework whose country list
 * includes the user's country but whose enforcement body is foreign falls
 * through to the Recognized tier instead.
 *
 * Authoring strategy is hybrid:
 *   1. A small hand-curated map captures regulators that don't appear in the
 *      compliance CSV but are real (ASIC, RBA, GCHQ, etc.).
 *   2. CSV augmentation walks `complianceFrameworks` at module load and
 *      registers any single-country compliance_framework row's enforcement
 *      body as a domestic regulator for that country × each tagged industry.
 *
 * Five Eyes affinity is a separate signal — it doesn't make a body domestic,
 * but it elevates the framework from generic Recognized to "Five Eyes
 * affinity" with a specific reason string for executives.
 */
import { complianceFrameworks } from '../data/complianceData'

type RegulatorKey = `${string}::${string}`

/**
 * Hand-authored core. Keys are `country::industry`, with `*` as the
 * "applies to all industries for this country" wildcard. Values are arrays
 * of regulator names — exact-match against the framework's `enforcementBody`.
 */
const MANUAL_REGULATORS: Record<RegulatorKey, string[]> = {
  // Australia — sector regulators not always in the compliance CSV
  'Australia::Government & Defense': ['ASD', 'Department of Defence'],
  'Australia::Finance & Banking': ['APRA', 'ASIC', 'RBA'],
  'Australia::Insurance': ['APRA'],
  'Australia::Telecommunications': ['ACMA', 'ASD'],

  // United States
  'United States::Government & Defense': [
    'NIST',
    'NSA',
    'CISA',
    'CISA/NSA',
    'DISA',
    'DoD/OUSD(A&S)',
    'OMB/CISA',
    'GSA/FedRAMP PMO',
    'GSA',
  ],
  'United States::Finance & Banking': ['OCC', 'FRB', 'FDIC', 'SEC', 'CFPB', 'NIST'],
  'United States::Healthcare': ['HHS OCR', 'FDA', 'NIST'],
  'United States::Energy & Utilities': ['NERC', 'TSA', 'NIST'],
  'United States::Education': ['US Dept of Education', 'FTC'],
  'United States::Technology': ['NIST', 'CISA'],

  // United Kingdom
  'United Kingdom::Government & Defense': ['NCSC', 'GCHQ'],
  'United Kingdom::Finance & Banking': ['FCA', 'PRA', 'BoE'],
  'United Kingdom::Telecommunications': ['NCSC', 'Ofcom'],

  // France / Germany / other European single-regulator countries
  'France::*': ['ANSSI'],
  'Germany::*': ['BSI'],
  'Netherlands::*': ['NCSC-NL'],
  'Switzerland::*': ['Swiss NCSC'],

  // APAC
  'Japan::*': ['CRYPTREC'],
  'South Korea::*': ['KISA', 'NIS', 'KISA/NIS', 'KISA/NIS/MSIT'],
  'Singapore::Finance & Banking': ['MAS'],
  'Singapore::Government & Defense': ['CSA Singapore', 'CSA'],
  'Singapore::Technology': ['CSA Singapore', 'IMDA'],
  'Singapore::*': ['CSA Singapore', 'CSA'],
  'New Zealand::*': ['GCSB/NCSC'],
  'India::*': ['CERT-In'],

  // EU level — applies to every EU member transparently via classifier
  // special-case (`isEuMember(profile)` in engine).
  'European Union::*': ['ENISA', 'ECCG/ENISA', 'European Commission', 'EU/EC', 'EBA/ESMA/EIOPA'],

  // Canada
  'Canada::*': ['CCCS'],

  // Israel
  'Israel::Government & Defense': ['INCD'],
  'Israel::Finance & Banking': ['Bank of Israel'],

  // Five Eyes / Commonwealth — kept here so single-regulator countries get
  // catchalls before CSV derivation runs.
  'Bahrain::*': ['Bahrain NCSC'],
  'Jordan::*': ['CBJ'],
  'Egypt::*': ['DPC (Egypt)'],
  'United Arab Emirates::*': ['DST/NQM'],
}

// ── CSV-derived augmentation ────────────────────────────────────────────

/**
 * Map of `country::industry` → set of regulators contributed by single-country
 * compliance_framework rows in the compliance CSV. Built once at module load.
 * The classifier merges this with the manual core, with manual entries taking
 * precedence on conflict (no override semantics today, only union).
 */
const DERIVED_REGULATORS: Map<string, Set<string>> = (() => {
  const out = new Map<string, Set<string>>()
  for (const fw of complianceFrameworks) {
    if (fw.bodyType !== 'compliance_framework') continue
    if (fw.countries.length !== 1) continue
    const country = fw.countries[0].trim()
    if (!country || country === 'Global') continue
    const eb = fw.enforcementBody?.trim()
    if (!eb) continue
    // Register for each industry the framework covers.
    const industries = fw.industries.length > 0 ? fw.industries : ['*']
    for (const ind of industries) {
      const key = `${country}::${ind.trim()}`
      if (!out.has(key)) out.set(key, new Set())
      out.get(key)!.add(eb)
    }
  }
  return out
})()

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Returns the set of domestic regulator names for the given (country, industry).
 * Combines manual entries (exact + wildcard `*`) with CSV-derived entries.
 *
 * Returns an empty set when no regulator is known — caller treats this as
 * "no domestic-authority signal," which means a framework with that country
 * in its country list will fall through to the Recognized tier.
 */
export function regulatorsFor(country: string, industry: string | null): Set<string> {
  const out = new Set<string>()
  const c = country.trim()
  const i = (industry ?? '').trim() || '*'

  // Manual: exact industry match, then wildcard
  for (const key of [`${c}::${i}` as RegulatorKey, `${c}::*` as RegulatorKey]) {
    // eslint-disable-next-line security/detect-object-injection
    const list = MANUAL_REGULATORS[key]
    if (list) for (const v of list) out.add(v)
  }

  // CSV-derived
  for (const key of [`${c}::${i}`, `${c}::*`]) {
    const list = DERIVED_REGULATORS.get(key)
    if (list) for (const v of list) out.add(v)
  }

  return out
}

/** True when `body` is a domestic regulator for (country, industry). */
export function isDomesticRegulator(
  country: string | null,
  industry: string | null,
  body: string | null
): boolean {
  if (!country || !body) return false
  return regulatorsFor(country, industry).has(body.trim())
}

// ── Five Eyes affinity ──────────────────────────────────────────────────

const FIVE_EYES_MEMBERS = new Set([
  'Australia',
  'Canada',
  'New Zealand',
  'United Kingdom',
  'United States',
])

const FIVE_EYES_BODIES = new Set([
  'NIST',
  'NSA',
  'CISA',
  'CISA/NSA',
  'CSIS',
  'GCSB',
  'GCSB/NCSC',
  'NCSC',
  'CCCS',
  'ASD',
])

/**
 * True when (country, body) crosses Five Eyes — i.e. the user is in a member
 * country and the enforcing body belongs to a different Five Eyes nation.
 * Used to elevate generic Recognized tier with a "Five Eyes affinity" reason.
 */
export function isFiveEyesAffinity(country: string | null, body: string | null): boolean {
  if (!country || !body) return false
  return FIVE_EYES_MEMBERS.has(country.trim()) && FIVE_EYES_BODIES.has(body.trim())
}

// ── EU-level affinity (separate concept from regulatorsFor) ─────────────

/** Bodies that act EU-wide — counted as domestic for any EU member. */
const EU_LEVEL_BODIES = new Set([
  'ENISA',
  'EU/EC',
  'European Commission',
  'ECCG/ENISA',
  'EBA/ESMA/EIOPA',
  'ESMA/EBA',
  'EU DPAs',
  'ENISA/EU Member States',
  'ETSI/EU Commission',
])

/** True when `body` is an EU-level enforcement body. */
export function isEuLevelBody(body: string | null): boolean {
  if (!body) return false
  return EU_LEVEL_BODIES.has(body.trim())
}

// ── Test surface — exposed for unit tests only ───────────────────────────
export const __testing = {
  MANUAL_REGULATORS,
  DERIVED_REGULATORS,
  FIVE_EYES_MEMBERS,
  FIVE_EYES_BODIES,
  EU_LEVEL_BODIES,
}
