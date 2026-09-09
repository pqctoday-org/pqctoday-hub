// SPDX-License-Identifier: GPL-3.0-only
/**
 * jurisdictionsData — single source of truth for supported jurisdictions.
 *
 * Every consumer that needs a jurisdiction list, region map, sim archetype
 * lookup, or jurisdiction rule MUST import from here. Direct imports of
 * JURISDICTION_RULES from jurisdiction.ts, JURISDICTIONS from the Learn
 * module, or REGION_COUNTRIES_MAP from personaConfig.ts are being migrated
 * to this file. See remediation plan (2026-06-29).
 *
 * The backing CSV (jurisdictions_MMDDYYYY.csv) follows the same date-stamped
 * versioning and DS01 status schema as all other reference CSVs in src/data/.
 * Archive older versions to src/data/archive/ before bumping to a new date.
 *
 * Scope: jurisdictions where a user can identify their organisation as
 * operating under a specific regulatory regime. Non-sovereign groupings
 * (Global, G7, NATO, BIS, GSMA) are timeline-filter concerns only.
 *
 * Relationship to complianceData.ts:
 *   - COUNTRY_CODE_TO_NAME here replaces the hardcoded map in complianceData.ts
 *     (Phase 6 of the remediation plan). PQC-REGION-* synthetic overlay tokens
 *     stay inline in complianceData.ts — they are not real country codes.
 *   - COUNTRY_TO_REGION (compliance display taxonomy) stays in complianceData.ts;
 *     it uses a different taxonomy ('European Union', 'Asia-Pacific', etc.) and
 *     serves a different purpose from the picker region grouping here.
 *   - EU cascade (Phase 2): use EU_MEMBER_CODES to seed all EU-member compliance
 *     rows when a user selects "European Union" in Assess. UK is explicitly NOT
 *     in this set despite being in region='eu' for picker grouping.
 */
import { loadLatestCSV } from './csvUtils'
import { filterActive } from './loaderUtils'
import type { JurisdictionRule, HybridStance, EndState } from './jurisdiction'

// ── Types ─────────────────────────────────────────────────────────────────

/**
 * Simulation archetypes: codes for which the sim has 1:1 modelled rules,
 * scenario data, and deadline entries in TIMELINE_COUNTRY_DEADLINE_YEAR.
 *
 * Original five: US/DE/FR/UK/AU.
 * Phase 3 additions: CA, JP, KR, SG (wired in assessBridge).
 * Phase 3 additions: IN (deadline + compliance coverage; hybrid/endState
 *   uncurated until DST/NQM stance formally verified).
 * EU: promoted from DE fallback to its own archetype so ENISA guidance
 *   (hybrid required, pure end-state) is not silently replaced by BSI
 *   guidance (hybrid required, hybrid end-state).
 *
 * Before adding a new archetype, verify getScenario() handles the code —
 * it degrades gracefully via TIMELINE_COUNTRY_DEADLINE_YEAR fallback, but
 * sector-specific milestones (TIMELINE_COUNTRY_MILESTONES) may be absent.
 */
export type SimArchetype =
  | 'US'
  | 'DE'
  | 'FR'
  | 'UK'
  | 'AU'
  | 'CA'
  | 'JP'
  | 'KR'
  | 'SG'
  | 'IN'
  | 'EU'

/**
 * Region keys for all entries in the jurisdiction registry.
 *
 * Picker-visible (show_in_picker=yes): americas, eu, apac, mena.
 * Reference-only (show_in_picker=no): europe-noneu, africa.
 *
 * europe-noneu: CH, NO, TR, RU — European countries outside the EU/EEA bloc.
 *   Kept separate from eu so region never implies EU membership.
 * africa: ZA, NG, KE — appear in compliance framework rows only.
 *
 * NOTE: region='eu' is a PICKER GROUPING label ("Europe"), not a statement
 * of EU membership. UK is region='eu' (correct for a Europe group) but
 * eu_member=no (correct for compliance cascade exclusion). Always use
 * EU_MEMBER_CODES, not the eu region, to determine EU regulatory scope.
 */
export type JurisdictionRegion = 'americas' | 'eu' | 'mena' | 'apac' | 'europe-noneu' | 'africa'

/** Regions that surface in the picker and drive REGION_COUNTRIES_MAP. */
export type PickerRegion = 'americas' | 'eu' | 'mena' | 'apac'
const PICKER_REGIONS = new Set<PickerRegion>(['americas', 'eu', 'mena', 'apac'])

export interface JurisdictionEntry {
  /** ISO 3166-1 alpha-2 uppercase (US, DE, UK…). Key for JURISDICTION_RULES and assessBridge. */
  code: string
  /** Canonical full display name. Must match the Country column in the timeline CSV. */
  name: string
  /**
   * Lowercase 2-letter code for flagcdn.com (e.g. `gb` for UK).
   * Usually equals code.toLowerCase() except UK → gb.
   */
  flagCode: string
  /** Region grouping for all entries (picker + reference-only). */
  region: JurisdictionRegion
  /**
   * The /compliance display bloc for this jurisdiction.
   *
   * ADDED 2026-07-31 (WP-0.3). Deliberately a SEPARATE field from `region`
   * rather than derived from it, because the two taxonomies genuinely disagree
   * in three places and a derivation would have to guess: `americas` splits
   * into North America and Latin America, `mena` splits (Egypt is Africa), and
   * the UK is region='eu' for picker grouping but its own compliance bloc.
   *
   * Before this, complianceData.ts kept its own hand-maintained map of 66
   * country names. The two drifted exactly as you would expect: 12 of those
   * names had no jurisdictions row at all and could never be reached.
   */
  complianceBloc: string
  /**
   * W4.2 — RULE METADATA. A country-level entry is not a statement that every
   * organisation in that country is bound: EO 14412 addresses specified federal
   * systems and excludes national security systems, and the NCSC dates are
   * staged guidance rather than a cut-off. These fields exist so the app can
   * say what an instrument actually binds instead of implying universality.
   *
   * NOTE: no DATE lives here. Deadlines derive from the timeline CSV, which is
   * their single source; a second copy would drift.
   */
  /** The governing instrument's URL, where one is on file. */
  instrumentUrl: string
  /** Which systems/sectors the instrument binds. Empty = NOT RECORDED, which
   *  callers must render as unknown, never as "applies to you". */
  appliesTo: string
  /** Whether the instrument is a requirement or guidance. Empty = unknown. */
  force: 'requirement' | 'guidance' | ''
  /** Where appliesTo/force came from: verified national instrument, inherited
   *  from the EU roadmap for a member state with no national instrument on
   *  file, or unknown. Makes an unfilled row auditable rather than ambiguous. */
  scopeBasis: 'national' | 'inherited-eu' | 'unknown' | ''
  /** Next review date of the instrument, where published. */
  reviewDate: string
  /**
   * Whether this entry appears in jurisdiction pickers (Assess, Learn, Sim).
   * false = reference-only: used for COUNTRY_CODE_TO_NAME compliance expansion
   * and assessBridge archetype fallbacks, but not shown in selectors.
   */
  showInPicker: boolean
  /**
   * True for actual EU member states. Used to drive the Phase 2 compliance
   * cascade: selecting "European Union" seeds frameworks for all eu_member=true
   * countries. Distinct from region='eu' — UK is region='eu' but eu_member=false.
   */
  euMember: boolean
  /** Regulatory authority name. Empty for uncurated entries. */
  authority: string
  /**
   * Hybrid stance per published guidance. Undefined for uncurated entries.
   * Full rules (hybrid + endState + note) appear in JURISDICTION_RULES.
   * Partial entries (note only, no hybrid/endState) appear in JURISDICTION_AUTHORITY_NOTE.
   */
  hybrid?: HybridStance
  /** Target migration posture. Undefined for uncurated entries. */
  endState?: EndState
  /**
   * The sim archetype this jurisdiction maps to. Exact match when code ===
   * simArchetype; region fallback otherwise. Always defined.
   */
  simArchetype: SimArchetype
  /**
   * Plain-language summary. Present for both fully-curated entries (hybrid +
   * endState + note → JURISDICTION_RULES) and partially-curated entries
   * (note only → JURISDICTION_AUTHORITY_NOTE). Empty for uncurated entries.
   */
  note: string
  /** DS01 status. Only 'active' rows are surfaced by default. */
  status?: 'active' | 'deprecated' | 'obsolete'
  deprecatedAt?: string
  deprecatedReason?: string
}

// ── CSV loader ─────────────────────────────────────────────────────────────

interface RawJurisdictionRow {
  code: string
  name: string
  flag_code: string
  region: string
  compliance_bloc: string
  instrument_url: string
  applies_to: string
  force: string
  scope_basis: string
  review_date: string
  show_in_picker: string
  eu_member: string
  authority: string
  hybrid: string
  end_state: string
  sim_archetype: string
  note: string
  status?: string
  deprecated_at?: string
  deprecated_reason?: string
}

const VALID_REGIONS = new Set<JurisdictionRegion>([
  'americas',
  'eu',
  'mena',
  'apac',
  'europe-noneu',
  'africa',
])

const VALID_ARCHETYPES = new Set<SimArchetype>([
  'US',
  'DE',
  'FR',
  'UK',
  'AU',
  'CA',
  'JP',
  'KR',
  'SG',
  'IN',
  'EU',
])

const VALID_HYBRID = new Set<HybridStance>(['required', 'interim', 'discouraged'])
const VALID_END_STATE = new Set<EndState>(['hybrid', 'pure'])

const modules = import.meta.glob('./jurisdictions_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const EXPECTED_HEADERS: (keyof RawJurisdictionRow)[] = [
  'code',
  'name',
  'flag_code',
  'region',
  // Parsed since 2026-07-31 but never declared here, so every load logged
  // "unexpected columns: [ 'compliance_bloc' ]". Declared now.
  'compliance_bloc',
  'show_in_picker',
  'eu_member',
  'authority',
  'hybrid',
  'end_state',
  'sim_archetype',
  'note',
  'status',
  'deprecated_at',
  'deprecated_reason',
  // W4.2 — rule metadata. See JurisdictionEntry for what each one may and may
  // not be used to claim.
  'instrument_url',
  'applies_to',
  'force',
  'scope_basis',
  'review_date',
]

const { data: allRows } = loadLatestCSV<RawJurisdictionRow, JurisdictionEntry>(
  modules,
  /jurisdictions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    const code = row.code?.trim()
    const name = row.name?.trim()
    if (!code || !name) return null

    const region = row.region?.trim() as JurisdictionRegion
    if (!VALID_REGIONS.has(region)) return null

    const simArchetype = row.sim_archetype?.trim() as SimArchetype
    if (!VALID_ARCHETYPES.has(simArchetype)) return null

    const rawHybrid = row.hybrid?.trim()
    const rawEndState = row.end_state?.trim()

    return {
      code,
      name,
      flagCode: row.flag_code?.trim() || code.toLowerCase(),
      region,
      complianceBloc: row.compliance_bloc?.trim() || '',
      instrumentUrl: row.instrument_url?.trim() || '',
      appliesTo: row.applies_to?.trim() || '',
      force: (row.force?.trim() as JurisdictionEntry['force']) || '',
      scopeBasis: (row.scope_basis?.trim() as JurisdictionEntry['scopeBasis']) || '',
      reviewDate: row.review_date?.trim() || '',
      showInPicker: row.show_in_picker?.trim().toLowerCase() === 'yes',
      euMember: row.eu_member?.trim().toLowerCase() === 'yes',
      authority: row.authority?.trim() || '',
      hybrid: VALID_HYBRID.has(rawHybrid as HybridStance) ? (rawHybrid as HybridStance) : undefined,
      endState: VALID_END_STATE.has(rawEndState as EndState)
        ? (rawEndState as EndState)
        : undefined,
      simArchetype,
      note: row.note?.trim() || '',
      status: (row.status?.trim() as JurisdictionEntry['status']) || 'active',
      deprecatedAt: row.deprecated_at?.trim() || undefined,
      deprecatedReason: row.deprecated_reason?.trim() || undefined,
    }
  },
  false,
  EXPECTED_HEADERS
)

// ── Derived exports ────────────────────────────────────────────────────────

/** All active entries (picker + reference-only), sorted by name. */
const ACTIVE_ALL: JurisdictionEntry[] = filterActive(allRows).sort((a, b) =>
  a.name.localeCompare(b.name)
)

/** Active picker jurisdictions only — shown in Assess / Learn / Sim selectors. */
export const ALL_JURISDICTIONS: JurisdictionEntry[] = ACTIVE_ALL.filter((j) => j.showInPicker)

/** Lookup by uppercase ISO code — includes reference-only entries. */
export const JURISDICTION_BY_CODE: Record<string, JurisdictionEntry> = Object.fromEntries(
  ACTIVE_ALL.map((j) => [j.code, j])
)

/** Lookup by canonical full name — includes reference-only entries. */
export const JURISDICTION_BY_NAME: Record<string, JurisdictionEntry> = Object.fromEntries(
  ACTIVE_ALL.map((j) => [j.name, j])
)

/**
 * ISO code → canonical full name for ALL entries (picker + reference-only).
 * Replaces COUNTRY_CODE_TO_NAME in complianceData.ts (Phase 6).
 * PQC-REGION-* synthetic overlay tokens stay inline in complianceData.ts.
 * GB is emitted as an alias for UK (compliance CSV uses GB for United Kingdom).
 */
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ...Object.fromEntries(ACTIVE_ALL.map((j) => [j.code, j.name])),
  GB: 'United Kingdom', // compliance CSV uses GB; jurisdiction CSV key is UK
}

/**
 * EU member state ISO codes. Use this — not the eu region — to determine
 * EU regulatory scope. UK is excluded (left EU 2020). Used by Phase 2
 * compliance cascade: selecting European Union seeds frameworks for all
 * of these codes in addition to the EU code itself.
 */
/**
 * Country NAME -> /compliance display bloc. The single source of truth for the
 * compliance region facet, replacing the hand-maintained COUNTRY_TO_REGION
 * literal that used to live in complianceData.ts (WP-0.3).
 *
 * Keyed by name rather than code because the compliance CSV's `countries`
 * column is expanded to names before the facet sees it.
 */
export const COUNTRY_NAME_TO_COMPLIANCE_BLOC: Record<string, string> = Object.fromEntries(
  ACTIVE_ALL.filter((j) => j.complianceBloc).map((j) => [j.name, j.complianceBloc])
)

/**
 * W6.3 — the /compliance region bloc for a jurisdiction CODE.
 *
 * COUNTRY_NAME_TO_COMPLIANCE_BLOC is keyed by display NAME because that is what
 * the compliance CSV carries. An embedded simulation run knows its country as a
 * CODE, so this is the code-keyed counterpart rather than a second hand-written
 * map — both derive from the same rows.
 */
export const complianceRegionForCountry = (code: string): string | null =>
  JURISDICTION_BY_CODE[code]?.complianceBloc || null

export const EU_MEMBER_CODES: ReadonlySet<string> = new Set(
  ACTIVE_ALL.filter((j) => j.euMember).map((j) => j.code)
)

/**
 * Region → full country names for picker jurisdictions only.
 * Drop-in replacement for REGION_COUNTRIES_MAP in personaConfig.ts.
 * europe-noneu and africa are absent — no picker entries in those regions.
 */
export const REGION_COUNTRIES_MAP: Record<PickerRegion, string[]> = (() => {
  const map: Record<PickerRegion, string[]> = { americas: [], eu: [], mena: [], apac: [] }
  for (const j of ALL_JURISDICTIONS) {
    if (PICKER_REGIONS.has(j.region as PickerRegion)) {
      map[j.region as PickerRegion].push(j.name)
    }
  }
  return map
})()

/**
 * Full jurisdiction rules for entries with curated hybrid + endState + note.
 * Drop-in replacement for JURISDICTION_RULES in jurisdiction.ts.
 * EU now has its own entry (hybrid=required, endState=pure) distinct from DE.
 */
export const JURISDICTION_RULES: Record<string, JurisdictionRule> = Object.fromEntries(
  ACTIVE_ALL.filter((j) => j.hybrid && j.endState && j.note).map((j) => [
    j.code,
    {
      authority: j.authority,
      hybrid: j.hybrid as HybridStance,
      endState: j.endState as EndState,
      note: j.note,
    } satisfies JurisdictionRule,
  ])
)

/**
 * Authority and context note for entries with authority + note but no
 * hybrid/endState ruling (e.g. India: deadline + compliance coverage,
 * stance uncurated). Used by JurisdictionPanel to show a factual summary
 * without implying a compliance verdict. Keyed by sim archetype code.
 */
export const JURISDICTION_AUTHORITY_NOTE: Record<string, { authority: string; note: string }> =
  Object.fromEntries(
    ACTIVE_ALL.filter((j) => j.authority && j.note && !j.hybrid && !j.endState).map((j) => [
      j.code,
      { authority: j.authority, note: j.note },
    ])
  )

/**
 * Exact-match country name → sim archetype, for jurisdictions where
 * code === simArchetype (the country IS its own archetype).
 * Derived from ALL active entries so non-picker countries with saved
 * assessments still resolve correctly — not just from picker entries.
 * Drop-in replacement for COUNTRY_NAME_TO_CODE in assessBridge.ts.
 */
export const COUNTRY_NAME_TO_ARCHETYPE: Map<string, SimArchetype> = new Map(
  ACTIVE_ALL.filter((j) => j.code === j.simArchetype).map((j) => [j.name, j.simArchetype])
)

/**
 * Fallback country name → sim archetype for jurisdictions where
 * code !== simArchetype (the country uses a nearby archetype).
 * Derived from ALL active entries — covers non-picker EU members
 * (NL, BE, PL, SE…) so saved assessments for those countries keep
 * their correct DE archetype rather than falling to the US default.
 * Drop-in replacement for COUNTRY_REGION_FALLBACK in assessBridge.ts.
 */
export const COUNTRY_NAME_FALLBACK_ARCHETYPE: Map<string, SimArchetype> = new Map(
  ACTIVE_ALL.filter((j) => j.code !== j.simArchetype).map((j) => [j.name, j.simArchetype])
)

// ── Learn module adapter ───────────────────────────────────────────────────

/** Shape expected by ComplianceStrategy JurisdictionMapper and BusinessCenter adapter. */
export interface LegacyJurisdictionConfig {
  id: string
  label: string
  region: string
  countryNames: string[]
}

const REGION_DISPLAY_LABEL: Record<PickerRegion, string> = {
  americas: 'North America',
  eu: 'Europe',
  mena: 'Middle East',
  apac: 'Asia Pacific',
}

/**
 * Drop-in replacement for JURISDICTIONS in
 * src/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions.ts.
 */
export const JURISDICTIONS_LEGACY: LegacyJurisdictionConfig[] = ALL_JURISDICTIONS.map((j) => ({
  id: j.code.toLowerCase(),
  label: j.name,
  region: REGION_DISPLAY_LABEL[j.region as PickerRegion] ?? j.region,
  countryNames: [j.name],
}))
