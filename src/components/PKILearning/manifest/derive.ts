// SPDX-License-Identifier: GPL-3.0-only
/**
 * Derivations — reconstruct the legacy moduleData.ts maps from a manifest, so
 * those maps become derived views. Each function here is the inverse of a hand-
 * written map; the conformance test asserts derived === legacy for every module.
 */
import type { CatalogModule } from '../moduleData'
import type { ModuleManifest } from './types'

// type-only import (erased) so derive.ts has no runtime dependency on moduleData
// — required for the cut-over, where moduleData imports these builders.
type CatalogEntry = CatalogModule

/** Rebuild a module's MODULE_CATALOG entry. Optional fields are *omitted* (not
 *  set to undefined) so deep-equality with the hand-written catalog holds. */
export function deriveCatalogEntry(m: ModuleManifest): CatalogEntry {
  return {
    id: m.id,
    ...(m.lm_id !== undefined ? { lm_id: m.lm_id } : {}),
    title: m.title,
    description: m.description,
    duration: m.duration,
    ...(m.difficulty !== undefined ? { difficulty: m.difficulty } : {}),
    ...(m.workInProgress !== undefined ? { workInProgress: m.workInProgress } : {}),
    frameworkPhase: m.frameworkPhase,
  } as CatalogEntry
}

/** Rebuild MODULE_STEP_COUNTS[id]: workshop length, or the explicit override
 *  for modules without a workshop (quiz/assess). */
export function deriveStepCount(m: ModuleManifest): number {
  return m.stepCountOverride ?? m.workshopSteps?.length ?? 0
}

type Section = { id: string; label: string }
type Taxonomy = { algorithms?: string[]; standards?: string[] }

/** Fixed track display order — the one fact not derivable from manifests alone. */
const TRACK_ORDER = [
  'Role Guides',
  'Foundations',
  'Strategy',
  'Protocols',
  'Hardware Infrastructure',
  'Software Infrastructure',
  'Applications',
  'Executive',
  'Industries',
] as const

// Non-manifest specials preserved verbatim across the cut-over: 'assess' is a
// synthetic progress-only id (no catalog/module); 'hybrid-certs' is a
// Playground-tool taxonomy alias, not a learn module.
const ASSESS_STEP_COUNT: Record<string, number> = { assess: 1 }
const HYBRID_CERTS_TAXONOMY: Record<string, Taxonomy> = {
  'hybrid-certs': { algorithms: ['ML-DSA', 'ECDSA'], standards: ['X.509', 'RFC 9794'] },
}

/** Full MODULE_CATALOG from the manifest collection. */
export function buildCatalog(ms: ModuleManifest[]): Record<string, CatalogModule> {
  return Object.fromEntries(ms.map((m) => [m.id, deriveCatalogEntry(m)]))
}

/** Full MODULE_STEP_COUNTS (manifest counts + the synthetic 'assess'). */
export function buildStepCounts(ms: ModuleManifest[]): Record<string, number> {
  return { ...Object.fromEntries(ms.map((m) => [m.id, deriveStepCount(m)])), ...ASSESS_STEP_COUNT }
}

/** Full LEARN_SECTIONS (modules that have learn sections). */
export function buildLearnSections(ms: ModuleManifest[]): Record<string, Section[]> {
  return Object.fromEntries(ms.filter((m) => m.learnSections).map((m) => [m.id, m.learnSections!]))
}

/** Full WORKSHOP_STEPS (modules that have a workshop). */
export function buildWorkshopSteps(ms: ModuleManifest[]): Record<string, Section[]> {
  return Object.fromEntries(ms.filter((m) => m.workshopSteps).map((m) => [m.id, m.workshopSteps!]))
}

/** Full MODULE_TRACKS — tracks in display order, modules in trackOrder. */
export function buildModuleTracks(
  ms: ModuleManifest[]
): { track: string; modules: CatalogModule[] }[] {
  return TRACK_ORDER.map((track) => ({
    track,
    modules: ms
      .filter((m) => m.track === track)
      .sort((a, b) => (a.trackOrder ?? 0) - (b.trackOrder ?? 0))
      .map(deriveCatalogEntry),
  }))
}

/** Full MODULE_PLAYGROUND_TOOL (modules linked to a Playground tool). */
export function buildPlaygroundTools(ms: ModuleManifest[]): Record<string, string> {
  return Object.fromEntries(
    ms.filter((m) => m.playgroundTool).map((m) => [m.id, m.playgroundTool!])
  )
}

/** Full MODULE_TAXONOMY (modules with taxonomy + the 'hybrid-certs' alias). */
export function buildTaxonomy(ms: ModuleManifest[]): Record<string, Taxonomy> {
  return {
    ...Object.fromEntries(ms.filter((m) => m.taxonomy).map((m) => [m.id, m.taxonomy!])),
    ...HYBRID_CERTS_TAXONOMY,
  }
}
