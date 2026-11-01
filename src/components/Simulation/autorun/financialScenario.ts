// SPDX-License-Identifier: AGPL-3.0-only
import type { CostModelInputs } from '@/utils/costModelSim'
import type { DemoSector } from './demoDocs'

/** Fictional planning inputs, not discovered counts or an approved migration budget. */
export function costingInputsForSector(sector: string): CostModelInputs {
  const systems: Record<DemoSector, number> = {
    financial: 250,
    healthcare: 90,
    government: 200,
    energy: 140,
    telecom: 160,
    retail: 70,
    general: 90,
  }
  const known = Object.hasOwn(systems, sector) ? (sector as DemoSector) : 'general'
  return { systems: systems[known], itBudgetAnnual: 50_000_000, complexity: 1, horizonYears: 5 }
}
