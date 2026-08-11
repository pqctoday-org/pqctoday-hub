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
 *      registers any single-country row's enforcement body as a domestic
 *      regulator for that country × each tagged industry.
 *
 * Five Eyes affinity is a separate signal — it doesn't make a body domestic,
 * but it elevates the framework from generic Recognized to "Five Eyes
 * affinity" with a specific reason string for executives.
 */
import { complianceFrameworks } from '../data/complianceData'
import { COUNTRY_CODE_TO_NAME } from '../data/jurisdictionsData'

type RegulatorKey = `${string}::${string}`

/**
 * Hand-authored core. Keys are `country::industry`, with `*` as the
 * "applies to all industries for this country" wildcard. Values are arrays
 * of regulator names — exact-match against the framework's `enforcementBody`.
 */
const MANUAL_REGULATORS: Record<RegulatorKey, string[]> = {
  // Australia — sector regulators not always in the compliance CSV
  'Australia::Government & Defense': ['ASD', 'Department of Defence'],
  'Australia::Finance & Banking': ['APRA', 'ASIC', 'RBA', 'AUSTRAC', 'OAIC', 'ASD'],
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
 * Body types whose single-country rows name a domestic *authority*.
 *
 * `regulatory_body` belongs here alongside `compliance_framework`: a national
 * financial regulator is modelled as a body, not as a framework, so excluding
 * it made ACPR and AMF — the French banking and securities regulators — read
 * as "Foreign authority … recognized in France" for a French profile.
 *
 * Deliberately excluded: `standardization_body`, `technical_standard`,
 * `certification_body` and `industry_alliance`. Those author or validate; they
 * do not enforce, and admitting them would make any standards body in your
 * country read as your regulator.
 */
const DOMESTIC_AUTHORITY_BODY_TYPES: ReadonlySet<string> = new Set([
  'compliance_framework',
  'regulatory_body',
])

/**
 * Country tokens are stored inconsistently across the data and the callers:
 * the compliance CSV migrated to ISO 3166-1 alpha-2 ('FR'), while the
 * assessment store and persona picker hold full names ('France'). Registering
 * and looking up under both forms is what makes the derived map reachable —
 * keyed on the raw token alone it matched nothing for any ISO-coded row.
 */
const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODE_TO_NAME).map(([code, name]) => [name, code])
)

function countryAliases(token: string): string[] {
  const t = token.trim()
  if (!t) return []
  // eslint-disable-next-line security/detect-object-injection -- t is a data token, and both maps are plain string→string records built at module load
  const asName = COUNTRY_CODE_TO_NAME[t]
  // eslint-disable-next-line security/detect-object-injection -- same
  const asCode = COUNTRY_NAME_TO_CODE[t]
  return Array.from(new Set([t, asName, asCode].filter(Boolean) as string[]))
}

/**
 * Map of `country::industry` → set of regulators contributed by single-country
 * authority rows in the compliance CSV. Built once at module load, registered
 * under every alias of the country token. The classifier merges this with the
 * manual core, with manual entries taking precedence on conflict (no override
 * semantics today, only union).
 */
const DERIVED_REGULATORS: Map<string, Set<string>> = (() => {
  const out = new Map<string, Set<string>>()
  for (const fw of complianceFrameworks) {
    if (!DOMESTIC_AUTHORITY_BODY_TYPES.has(fw.bodyType)) continue
    if (fw.countries.length !== 1) continue
    const country = fw.countries[0].trim()
    if (!country || country === 'Global') continue
    const eb = fw.enforcementBody?.trim()
    if (!eb) continue
    // Register for each industry the framework covers, under every country alias.
    const industries = fw.industries.length > 0 ? fw.industries : ['*']
    for (const alias of countryAliases(country)) {
      for (const ind of industries) {
        const key = `${alias}::${ind.trim()}`
        if (!out.has(key)) out.set(key, new Set())
        out.get(key)!.add(eb)
      }
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
  const i = (industry ?? '').trim() || '*'

  // Both stores and both data vocabularies: 'France' and 'FR' must resolve to
  // the same regulators regardless of which side supplied the token.
  for (const c of countryAliases(country)) {
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

/**
 * Bodies that act EU-wide — counted as domestic for any EU member.
 *
 * Matching is exact, so compound strings must be listed verbatim as the CSV
 * writes them. The two added below are EU institutions whose rows previously
 * fell through to Recognized purely on string shape:
 *   - 'European Commission/ENISA'                  (EU Cyber Resilience Act)
 *   - 'European Banking Authority (EBA); national competent authorities' (PSD2)
 *
 * NOT added: 'Europol/FS-ISAC' (Europol Quantum Safe Financial Forum). Europol
 * is an EU agency, but the QSFF is a voluntary call-to-action forum with no
 * enforcement power — rendering it as "Your regulator" would overstate it.
 */
const EU_LEVEL_BODIES = new Set([
  'ENISA',
  'EU/EC',
  'European Commission',
  'European Commission/ENISA',
  'ECCG/ENISA',
  'EBA/ESMA/EIOPA',
  'ESMA/EBA',
  'European Banking Authority (EBA); national competent authorities',
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
