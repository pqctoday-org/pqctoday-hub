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
import { CRQC_ESTIMATES } from './regulatoryTimelines'

export type SimSize = 'small' | 'mid' | 'large' | 'global'

/** CRQC horizon year Z baseline (moderate research consensus). */
export const SIM_CRQC_YEAR = CRQC_ESTIMATES.moderate

/** Default data shelf-life X (years) — a sector dial will set this later. */
export const DEFAULT_SHELF_LIFE_YEARS = 5

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
