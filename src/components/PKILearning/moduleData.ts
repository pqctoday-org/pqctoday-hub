// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleItem } from './ModuleCard'
import type { PhaseId } from '@/data/frameworkPhases'
import { MANIFESTS } from './manifest/registry'
import {
  buildCatalog,
  buildStepCounts,
  buildLearnSections,
  buildWorkshopSteps,
  buildModuleTracks,
} from './manifest/derive'

/**
 * A MODULE_CATALOG entry: the shared {@link ModuleItem} card shape plus the
 * Wave-1 `frameworkPhase` tag mapping the module onto the canonical Applied
 * Quantum Phase 0–7 + Foundations model (see `@/data/frameworkPhases`). Use a
 * single {@link PhaseId} for a module that teaches one phase, or `PhaseId[]`
 * when a module genuinely spans two phases.
 */
export interface CatalogModule extends ModuleItem {
  frameworkPhase: PhaseId | PhaseId[]
}

/** Validates every MODULE_CATALOG entry's id field matches its object key (dev only) */
function validateCatalog(entries: Record<string, CatalogModule>): Record<string, CatalogModule> {
  if (import.meta.env.DEV) {
    for (const [key, val] of Object.entries(entries)) {
      if (val.id !== key) {
        console.error(`[moduleData] MODULE_CATALOG key "${key}" doesn't match id "${val.id}"`)
      }
    }
  }
  return entries
}

/**
 * Strip undefined entries from track module arrays. A dangling
 * `MODULE_CATALOG['some-removed-id']` reference returns undefined and
 * crashes downstream `.map((m) => m.id)` consumers (Dashboard, LearnTrackStack).
 * In dev we log the dropped slot so the broken track row is visible during
 * triage; in prod we silently drop it so the page still renders.
 */
function validateTracks(
  tracks: { track: string; modules: (ModuleItem | undefined)[] }[]
): { track: string; modules: ModuleItem[] }[] {
  return tracks.map((t) => {
    const kept: ModuleItem[] = []
    for (let i = 0; i < t.modules.length; i++) {
      const m = t.modules[i]
      if (m) {
        kept.push(m)
      } else if (import.meta.env.DEV) {
        console.error(
          `[moduleData] MODULE_TRACKS "${t.track}" slot ${i} is undefined ` +
            `— a referenced module id is missing from MODULE_CATALOG`
        )
      }
    }
    return { track: t.track, modules: kept }
  })
}

/** All module metadata keyed by module ID */
export const MODULE_CATALOG: Record<string, CatalogModule> = validateCatalog(
  buildCatalog(MANIFESTS)
)

/** Actual step counts per module for progress calculation.
 * Must match WORKSHOP_STEPS[id].length exactly — keep in sync. */
export const MODULE_STEP_COUNTS: Record<string, number> = buildStepCounts(MANIFESTS)

/** Track badge colors (semantic tokens only) */
export const TRACK_COLORS: Record<string, string> = {
  Foundations: 'bg-primary/10 text-primary',
  Strategy: 'bg-secondary/10 text-secondary',
  Protocols: 'bg-status-info/15 text-status-info',
  'Hardware Infrastructure': 'bg-status-warning/20 text-status-warning',
  'Software Infrastructure': 'bg-status-warning/10 text-status-warning',
  Applications: 'bg-status-success/15 text-status-success',
  Executive: 'bg-status-error/15 text-status-error',
  Industries: 'bg-tertiary/10 text-tertiary',
  'Role Guides': 'bg-accent/10 text-accent',
}

/** Module tracks for the grid display */
export const MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = validateTracks(
  buildModuleTracks(MANIFESTS)
)

/** Reverse lookup: module ID → track name (derived from MODULE_TRACKS) */
export const MODULE_TO_TRACK: Record<string, string> = Object.fromEntries(
  MODULE_TRACKS.flatMap(({ track, modules }) => modules.map((m) => [m.id, track]))
)

/** Reverse lookup: module slug → LM-ID (e.g. 'pqc-101' → 'LM-001') */
export const LM_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_CATALOG)
    .filter((m) => m.lm_id)
    .map((m) => [m.id, m.lm_id as string])
)

/**
 * Learn sections per module — user manually checks each after reading.
 * These drive the LearnSectionChecklist in the module sidebar and the
 * pie chart on ModuleCard. Completing all → status: 'completed'.
 */
export const LEARN_SECTIONS: Record<string, { id: string; label: string }[]> =
  buildLearnSections(MANIFESTS)

/**
 * Workshop step IDs per module — auto-checked as user completes each step.
 * IDs must match exactly what markStepComplete() receives (the PARTS[i].id values).
 */
export const WORKSHOP_STEPS: Record<string, { id: string; label: string }[]> =
  buildWorkshopSteps(MANIFESTS)

/** IDs exempt from cross-structure completeness checks */
const SPECIAL_IDS = new Set(['quiz', 'assess'])

/** Dev-time validation: catches missing entries and step-count drift across all structures */
if (import.meta.env.DEV) {
  for (const [id, count] of Object.entries(MODULE_STEP_COUNTS)) {
    if (SPECIAL_IDS.has(id)) continue
    const steps = WORKSHOP_STEPS[id]
    if (!steps) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from WORKSHOP_STEPS`)
    } else if (steps.length !== count) {
      console.error(
        `[moduleData] Step count mismatch for "${id}": MODULE_STEP_COUNTS=${count}, WORKSHOP_STEPS.length=${steps.length}`
      )
    }
    if (!MODULE_CATALOG[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from MODULE_CATALOG`)
    }
    if (!LEARN_SECTIONS[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_STEP_COUNTS but missing from LEARN_SECTIONS`)
    }
  }
  const trackModuleIds = new Set(MODULE_TRACKS.flatMap((t) => t.modules.map((m) => m.id)))
  for (const id of Object.keys(MODULE_CATALOG)) {
    if (SPECIAL_IDS.has(id)) continue
    if (!trackModuleIds.has(id)) {
      console.error(`[moduleData] "${id}" is in MODULE_CATALOG but missing from MODULE_TRACKS`)
    }
    if (!MODULE_STEP_COUNTS[id]) {
      console.error(`[moduleData] "${id}" is in MODULE_CATALOG but missing from MODULE_STEP_COUNTS`)
    }
  }
}
