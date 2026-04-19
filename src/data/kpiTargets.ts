// SPDX-License-Identifier: GPL-3.0-only
/**
 * KPI targets — per-persona × per-country overrides for the `defaultTarget`
 * values declared in `kpiCatalog.ts`. Used to render red-line ticks on
 * scorecard sliders (e.g. "NSM-10 expects 30% migrated by 2027").
 *
 * Lookup order (most specific → fallback):
 *   1. targets[persona][country][kpiId]
 *   2. targets[persona]['*'][kpiId]
 *   3. KpiDefinition.defaultTarget
 */
import type { KpiPersonaId } from './kpiCatalog'

type TargetMap = Record<string, Partial<Record<string, number>>>

export const KPI_TARGETS: Partial<Record<KpiPersonaId, TargetMap>> = {
  executive: {
    'United States': {
      // NSM-10 — agencies are expected to migrate high-priority crypto by 2035
      // with meaningful progress by 2027. Bar is set higher than the global
      // default to reflect federal pacing expectations.
      'algorithms-migrated': 80,
      'pace-to-deadline': 70,
      'compliance-gaps': 85,
    },
    France: {
      // ANSSI hybrid mandate starts 2026 for high-assurance systems.
      'hybrid-deployment': 60,
      'pace-to-deadline': 65,
    },
    Germany: {
      'compliance-gaps': 80,
    },
    '*': {
      'compliance-gaps': 80,
      'threat-exposure': 70,
    },
  },
  architect: {
    '*': {
      'algorithms-migrated': 75,
      'vendor-readiness': 70,
      'hybrid-deployment': 50,
      'cbom-completeness': 85,
    },
  },
  ops: {
    '*': {
      'systems-inventoried': 95,
      'change-failure-rate': 95,
      'canary-coverage': 80,
      'vendor-readiness': 70,
    },
  },
  researcher: {
    '*': {
      'algorithm-diversity': 80,
      'standards-coverage': 90,
    },
  },
}

/** Resolve the effective target for a (persona, country, kpiId) tuple. */
export function getKpiTarget(
  persona: KpiPersonaId,
  country: string | null | undefined,
  kpiId: string,
  fallback?: number
): number | undefined {
  const personaMap = KPI_TARGETS[persona]
  if (!personaMap) return fallback
  if (country && personaMap[country]?.[kpiId] !== undefined) {
    return personaMap[country][kpiId]
  }
  if (personaMap['*']?.[kpiId] !== undefined) {
    return personaMap['*'][kpiId]
  }
  return fallback
}
