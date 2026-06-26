// SPDX-License-Identifier: GPL-3.0-only
/**
 * useSimClock (PR6) — the Simulation's Mosca-clock derivation, extracted from
 * SimulationView so it can be unit-tested in isolation. Pure: no React state or
 * effects, so it is exported as `deriveSimClock` (a `use`-prefixed name would
 * violate rules-of-hooks for a hookless function). This is the first thin-view
 * seam; `useQuarter` / `useSimResources` are the planned follow-ups.
 *
 * Behaviour is identical to the previous inline block — no logic change.
 */
import {
  computeSimMosca,
  shelfLifeFor,
  SIZE_MIGRATION_YEARS,
  COUNTRY_DEADLINE_YEAR,
  SIM_CRQC_YEAR,
  type SimMoscaClock,
} from '@/data/moscaClock'

/** Mosca X/Y inputs sourced from a completed assessment, when present. */
export interface AssessMoscaInputs {
  shelfLifeYears: number
  migrationYears: number
}

export interface SimClockInput {
  /** Calendar year of the current turn. */
  year: number
  /** Quarter 1–4 of the current turn. */
  q: number
  country: string
  sector: string
  size: string
  /** Years the CRQC horizon has been pulled forward by events. */
  crqcShift: number
  /** Assessment-derived Mosca inputs, or null to use the sim's sector/size tables. */
  assessMosca: AssessMoscaInputs | null
}

export interface SimClock {
  /** The full Mosca clock (X, Y, horizon, yearsToHorizon, over, atRisk). */
  clock: SimMoscaClock
  /** Fractional current year (quarter-aware). */
  currentYear: number
  /** CRQC/deadline horizon year (the earlier of CRQC estimate and country deadline). */
  horizonYear: number
  /** Shelf-life (X) used — from the assessment when present, else the sector table. */
  simShelfLifeYears: number
  /** Migration time (Y) used — from the assessment when present, else the size table. */
  simMigrationYears: number
}

/** Derive the turn-aware Mosca clock from the org dials + current turn. Pure. */
export function deriveSimClock(input: SimClockInput): SimClock {
  const { year, q, country, sector, size, crqcShift, assessMosca } = input

  const horizonYear = Math.min(
    SIM_CRQC_YEAR - crqcShift,
    COUNTRY_DEADLINE_YEAR[country] ?? SIM_CRQC_YEAR
  )
  const currentYear = year + (q - 1) * 0.25
  // Mosca X/Y from the assessment when present, else the sim's sector/size tables.
  const simShelfLifeYears = assessMosca?.shelfLifeYears ?? shelfLifeFor(sector)
  const simMigrationYears =
    assessMosca?.migrationYears ??
    SIZE_MIGRATION_YEARS[size as keyof typeof SIZE_MIGRATION_YEARS] ??
    3
  const clock = computeSimMosca({
    migrationYears: simMigrationYears,
    shelfLifeYears: simShelfLifeYears,
    horizonYear,
    currentYear,
  })

  return { clock, currentYear, horizonYear, simShelfLifeYears, simMigrationYears }
}
