// SPDX-License-Identifier: GPL-3.0-only
/**
 * scenarioConfig — the simulation's milestones are SCENARIO-CONFIGURABLE per country.
 *
 * A scenario's anchor dates come from the country's timeline data (the rows tagged
 * `sim_milestone` in the timeline CSV → `TIMELINE_COUNTRY_MILESTONES`). The US scenario is
 * anchored to EO 14409: key establishment (HNDL) 2030, digital signatures (TNFL) 2031. Other
 * countries become scenarios simply by tagging their timeline rows — no code change.
 *
 * Framework 2.1 two-track model (Activity 3.3): Track A = HNDL (key exchange / confidentiality),
 * Track B = TNFL (signatures / PKI). HNDL is the most time-critical (line 795). Crossed with
 * asset tiering (critical/HVA first, general trailing), the migration is FOUR tracks. The EO
 * dates apply to the CRITICAL tier; the two general-asset tracks are DERIVED (trail critical to
 * the 2035 program horizon — framework: Track B has the longest lead times). Governance is also
 * derived (in place ahead of critical migration) unless a `governance` row is tagged.
 *
 * Pure data only — the objective COMPLETION predicates (which read live maturity) live in the
 * consumer (transformationStatus). Here we only resolve dates / labels / standards.
 */
import {
  TIMELINE_COUNTRY_MILESTONES,
  TIMELINE_COUNTRY_DEADLINE_YEAR,
} from '@/data/timelineFacts.generated'

export type SimTrackId = 'hndl-critical' | 'tnfl-critical' | 'hndl-general' | 'tnfl-general'
export type SimObjectiveId = 'governance' | 'critical' | 'migration'

export interface SimTrack {
  id: SimTrackId
  label: string
  track: 'HNDL' | 'TNFL'
  tier: 'critical' | 'general'
  /** The year this track must complete by in this scenario. */
  year: number
  /** The named algorithm/standard for this track in this scenario. */
  standard: string
}

export interface SimObjective {
  id: SimObjectiveId
  label: string
  byYear: number
}

export interface SimScenario {
  countryCode: string
  programStartYear: number
  programEndYear: number
  governanceYear: number
  /** Four tracks, ordered by urgency: HNDL→TNFL, critical→general. */
  tracks: SimTrack[]
  /** Three headline objectives (roll-ups of the four tracks + governance). */
  objectives: SimObjective[]
  standards: { HNDL: string; TNFL: string }
}

const PROGRAM_START_YEAR = 2026
const PROGRAM_END_YEAR = 2035 // operate/govern horizon; the general-asset tracks run to here
const GENERAL_HNDL_LAG = 3 // general HNDL trails critical HNDL (framework: general after critical)
const GOVERNANCE_LEAD = 3 // governance in place ahead of critical HNDL migration

/** Named standards per scenario; defaults are generic so an untagged country still renders. */
const STANDARDS_BY_COUNTRY: Record<string, { HNDL: string; TNFL: string }> = {
  US: { HNDL: 'FIPS 203 / ML-KEM', TNFL: 'FIPS 204 / ML-DSA' },
}
const DEFAULT_STANDARDS = { HNDL: 'PQC key establishment', TNFL: 'PQC digital signatures' }

/** Map a few sim display names → timeline country codes; pass codes through unchanged. */
const NAME_TO_CODE: Record<string, string> = {
  'United States': 'US',
  France: 'FR',
  Germany: 'DE',
  'United Kingdom': 'UK',
  Japan: 'JP',
  Canada: 'CA',
  'South Korea': 'KR',
}

export function resolveCountryCode(country: string): string {
  if (TIMELINE_COUNTRY_MILESTONES[country] || country in TIMELINE_COUNTRY_DEADLINE_YEAR) {
    return country
  }
  return NAME_TO_CODE[country] ?? country
}

// Reverse of NAME_TO_CODE (+ a few common extras), for display: 'FR' → 'France'.
const CODE_TO_NAME: Record<string, string> = {
  ...Object.fromEntries(Object.entries(NAME_TO_CODE).map(([name, code]) => [code, name])),
  GB: 'United Kingdom',
  IN: 'India',
  AU: 'Australia',
  NL: 'Netherlands',
}

/** Human-readable country name for a code (falls back to the code itself). */
export function countryNameFor(code: string): string {
  return CODE_TO_NAME[code] ?? code
}

/** Build the scenario for a sim country (accepts a timeline code or a display name). */
export function getScenario(country: string): SimScenario {
  const code = resolveCountryCode(country)
  const m = TIMELINE_COUNTRY_MILESTONES[code] ?? {}
  const fallbackDeadline = TIMELINE_COUNTRY_DEADLINE_YEAR[code] ?? PROGRAM_END_YEAR
  const hndlCritical = m['hndl-critical'] ?? fallbackDeadline
  const tnflCritical = m['tnfl-critical'] ?? hndlCritical + 1
  const hndlGeneral = Math.min(PROGRAM_END_YEAR, hndlCritical + GENERAL_HNDL_LAG)
  const tnflGeneral = PROGRAM_END_YEAR
  const governanceYear =
    m['governance'] ?? Math.max(PROGRAM_START_YEAR, hndlCritical - GOVERNANCE_LEAD)
  const std = STANDARDS_BY_COUNTRY[code] ?? DEFAULT_STANDARDS

  const tracks: SimTrack[] = [
    {
      id: 'hndl-critical',
      label: 'Critical · harvest-now (key establishment)',
      track: 'HNDL',
      tier: 'critical',
      year: hndlCritical,
      standard: std.HNDL,
    },
    {
      id: 'tnfl-critical',
      label: 'Critical · forge-later (signatures / PKI)',
      track: 'TNFL',
      tier: 'critical',
      year: tnflCritical,
      standard: std.TNFL,
    },
    {
      id: 'hndl-general',
      label: 'General · harvest-now (key establishment)',
      track: 'HNDL',
      tier: 'general',
      year: hndlGeneral,
      standard: std.HNDL,
    },
    {
      id: 'tnfl-general',
      label: 'General · forge-later (signatures / PKI)',
      track: 'TNFL',
      tier: 'general',
      year: tnflGeneral,
      standard: std.TNFL,
    },
  ]
  const objectives: SimObjective[] = [
    { id: 'governance', label: 'Governance in place', byYear: governanceYear },
    { id: 'critical', label: 'Critical assets protected', byYear: tnflCritical },
    { id: 'migration', label: 'Migration completed', byYear: tnflGeneral },
  ]
  return {
    countryCode: code,
    programStartYear: PROGRAM_START_YEAR,
    programEndYear: PROGRAM_END_YEAR,
    governanceYear,
    tracks,
    objectives,
    standards: std,
  }
}
