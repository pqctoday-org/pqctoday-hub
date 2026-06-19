// SPDX-License-Identifier: GPL-3.0-only
/**
 * moscaClock — the simulation's Mosca's-Inequality clock (X + Y > Z).
 *
 *   X = data shelf-life (how long secrets must stay safe)
 *   Y = migration time (longer for bigger estates)
 *   Z = the year you must be migrated by — the sooner of the CRQC estimate
 *       and the country's government deadline.
 *
 * When X + Y exceeds the years left until Z, data harvested today won't be safe
 * in time: act now. Pure + deterministic — the page passes the current year in.
 */
import { QC_FIRST_YEAR } from './quantumTimeline'

export type SimSize = 'small' | 'mid' | 'large' | 'global'

/**
 * Provenance of a figure shown in the sim. `'standard'` = a published, citable
 * fact (FIPS param, RFC). `'planning'` = an illustrative planning anchor (a
 * shelf-life, a government deadline, the Q-Day year) that a learner must NOT
 * quote as a published standard. Drives the PlanningBadge affordance in the UI.
 */
export type Provenance = 'standard' | 'planning'

/**
 * CRQC horizon year Z baseline = the simulation's Q-Day (first CRQC). Single
 * source in `quantumTimeline.ts`, shared with simAssets and the Assess risk windows.
 */
export const SIM_CRQC_YEAR = QC_FIRST_YEAR

/** Default data shelf-life X (years) when no sector is chosen. */
export const DEFAULT_SHELF_LIFE_YEARS = 5

export interface SimSector {
  id: string
  label: string
  /** X — how long this sector's data must stay confidential (years). */
  shelfLifeYears: number
  hint: string
  /** Always `'planning'` — these shelf-lives are illustrative planning anchors. */
  provenance: Provenance
}

/** Sectors set X — the data shelf-life that drives Harvest-Now-Decrypt-Later risk.
 *  Every shelf-life is an illustrative planning anchor (`provenance: 'planning'`). */
export const SECTORS: SimSector[] = [
  {
    id: 'general',
    label: 'General',
    shelfLifeYears: 5,
    hint: 'mixed business data',
    provenance: 'planning',
  },
  {
    id: 'retail',
    label: 'Retail',
    shelfLifeYears: 3,
    hint: 'shorter-lived commercial data',
    provenance: 'planning',
  },
  {
    id: 'telecom',
    label: 'Telecom',
    shelfLifeYears: 7,
    hint: 'subscriber + signalling data',
    provenance: 'planning',
  },
  {
    id: 'financial',
    label: 'Financial',
    shelfLifeYears: 10,
    hint: 'transactions + records retention',
    provenance: 'planning',
  },
  {
    id: 'energy',
    label: 'Energy/OT',
    shelfLifeYears: 10,
    hint: 'grid + long-lived OT',
    provenance: 'planning',
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    shelfLifeYears: 15,
    hint: 'patient records — long retention',
    provenance: 'planning',
  },
  {
    id: 'government',
    label: 'Government',
    shelfLifeYears: 20,
    hint: 'classified / long-secret',
    provenance: 'planning',
  },
]

export const DEFAULT_SECTOR = 'general'

/** Data shelf-life X for a sector id (falls back to the default). */
export function shelfLifeFor(sectorId: string): number {
  return SECTORS.find((s) => s.id === sectorId)?.shelfLifeYears ?? DEFAULT_SHELF_LIFE_YEARS
}

/** Representative migration time Y (years) by organisation size. */
export const SIZE_MIGRATION_YEARS: Record<SimSize, number> = {
  small: 2,
  mid: 3,
  large: 4,
  global: 6,
}

/** Illustrative government PQC deadline by country (planning horizon). */
export const COUNTRY_DEADLINE_YEAR: Record<string, number> = {
  US: 2030, // CNSA 2.0
  DE: 2030, // BSI
  FR: 2030, // ANSSI
  UK: 2035, // NCSC (later roadmap)
  AU: 2030, // ASD
  // EU + CA confirmed against the hub timeline (timeline_*.csv): EC "Full EU PQC
  // Transition" 2035 and CCCS ITSM.40.001 "Full GC Migration" 2035.
  EU: 2035, // EC roadmap: high-risk by 2030, full transition by 2035 (timeline-confirmed)
  CA: 2035, // CCCS ITSM.40.001: high-priority by 2031, full GC migration by 2035 (timeline-confirmed)
  // JP/KR/SG are planning estimates beyond the timeline's authoritative dates:
  JP: 2035, // CRYPTREC roadmap pending (~2027); timeline shows critical systems ~2030, no full date — 2035 inferred
  KR: 2035, // KISA / NIS national PQC master plan (not in hub timeline — planning estimate)
  SG: 2035, // CSA (illustrative — no fixed national deadline; not in hub timeline)
}

/**
 * Provenance for each country deadline — a single source of truth the UI reads,
 * rather than the view inferring it. Every government deadline is a planning
 * horizon, not a published standard, so all entries are `'planning'`. Kept as a
 * sibling map (not a field on COUNTRY_DEADLINE_YEAR) so `computeSimMosca` inputs
 * stay numeric and pure. PR-5 extends both maps in lock-step.
 */
export const COUNTRY_DEADLINE_PROVENANCE: Record<string, Provenance> = {
  US: 'planning',
  DE: 'planning',
  FR: 'planning',
  UK: 'planning',
  AU: 'planning',
  EU: 'planning',
  CA: 'planning',
  JP: 'planning',
  KR: 'planning',
  SG: 'planning',
}

/** The binding horizon Z: the sooner of the CRQC estimate and the country deadline. */
export function horizonYearFor(country: string): number {
  return Math.min(SIM_CRQC_YEAR, COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR)
}

export interface SimMoscaClock {
  x: number
  y: number
  horizonYear: number
  yearsToHorizon: number
  /** (X + Y) − yearsToHorizon. Positive = over the line (at risk). */
  over: number
  atRisk: boolean
}

export function computeSimMosca(params: {
  migrationYears: number
  shelfLifeYears: number
  horizonYear: number
  currentYear: number
}): SimMoscaClock {
  const { migrationYears, shelfLifeYears, horizonYear, currentYear } = params
  const yearsToHorizon = horizonYear - currentYear
  const over = shelfLifeYears + migrationYears - yearsToHorizon
  return {
    x: shelfLifeYears,
    y: migrationYears,
    horizonYear,
    yearsToHorizon,
    over,
    atRisk: over > 0,
  }
}
