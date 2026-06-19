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
import { TIMELINE_COUNTRY_DEADLINE_YEAR } from './timelineFacts.generated'

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

/**
 * Government PQC deadline by country — DERIVED from the timeline reference CSV
 * (the row a human tagged `is_sim_deadline=true`), the single source of truth.
 * To change a value, edit the CSV and re-run `npm run gen:timeline-facts` (runs
 * automatically in prebuild). Countries with no tagged deadline are absent, so
 * `horizonYearFor` falls back to the Q-Day anchor for them.
 */
export const COUNTRY_DEADLINE_YEAR: Record<string, number> = TIMELINE_COUNTRY_DEADLINE_YEAR

/**
 * Provenance flag the badge layer reads — every government deadline is surfaced
 * in the sim as a planning horizon. Derived from the deadline keys so the two
 * never drift.
 */
export const COUNTRY_DEADLINE_PROVENANCE: Record<string, Provenance> = Object.fromEntries(
  Object.keys(COUNTRY_DEADLINE_YEAR).map((c) => [c, 'planning' as Provenance])
)

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
