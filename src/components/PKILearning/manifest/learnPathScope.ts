// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are manifest module ids */
/**
 * Learn-path scoping rules (WS-0, 2026-09-24) — the one place that decides
 * which Learn sections, Workshop steps and tagged items are VISIBLE and which
 * are REQUIRED for a given module + active learn path.
 *
 * Pure functions over the manifest, so the store (completion), the shell
 * (stepper), LearnSection (rendering) and every progress widget agree.
 *
 * Rules
 *  - No path active, or the stored id no longer names a path of this module
 *    (renamed/removed between releases): everything is visible and every
 *    non-optional section/step is required — exactly what a module without
 *    `learnPaths` does.
 *  - Learn sections under path P: visible if listed in `P.sections`, or if the
 *    section is `optional` and listed in no path at all (a module-wide
 *    reference). Required: `P.sections` minus optional ones. If that leaves
 *    nothing (a typo'd manifest), fall back to all non-optional sections so a
 *    module can never complete by checking nothing.
 *  - Workshop steps and any {@link PathScoped} item under path P: visible if
 *    untagged or tagged with P. Required: visible and not optional.
 *  - `optional` items are never required, on any path.
 */
import type { LearnPath, ModuleManifest, PathScoped } from './types'
import { MANIFEST_BY_ID } from './registry'

export type ScopeManifest = Pick<
  ModuleManifest,
  'learnSections' | 'learnPaths' | 'workshopSteps' | 'offPathSections'
>

/** The active path object, or undefined when none/unknown. */
export function resolveLearnPath(
  m: ScopeManifest | undefined,
  pathId: string | undefined
): LearnPath | undefined {
  if (!pathId) return undefined
  return m?.learnPaths?.find((p) => p.id === pathId)
}

/** Normalises a stored path id: returns it only if it names a real path. */
export function validLearnPathId(
  m: ScopeManifest | undefined,
  pathId: string | undefined
): string | undefined {
  return resolveLearnPath(m, pathId)?.id
}

export function isLearnSectionOptional(m: ScopeManifest | undefined, sectionId: string): boolean {
  return Boolean(m?.learnSections?.find((s) => s.id === sectionId)?.optional)
}

/** Whether a Learn section belongs on the active path (see header rules). */
export function isLearnSectionInPath(
  m: ScopeManifest | undefined,
  sectionId: string,
  pathId: string | undefined
): boolean {
  const path = resolveLearnPath(m, pathId)
  if (!path) return true
  if (path.sections.includes(sectionId)) return true
  if (!isLearnSectionOptional(m, sectionId)) return false
  // An optional section that no path claims is a module-wide reference.
  return !(m?.learnPaths ?? []).some((p) => p.sections.includes(sectionId))
}

/** Learn-section ids that must be read/checked for the module to complete. */
export function requiredLearnSectionIds(
  m: ScopeManifest | undefined,
  pathId: string | undefined
): string[] {
  const sections = m?.learnSections ?? []
  const all = sections.filter((s) => !s.optional).map((s) => s.id)
  const path = resolveLearnPath(m, pathId)
  if (!path) return all
  // Intersect with real, non-optional section ids so a typo'd manifest can't
  // make a module completable by checking nothing.
  const known = new Set(all)
  const required = path.sections.filter((id) => known.has(id))
  return required.length > 0 ? required : all
}

/** Whether a tagged item (step, exercise, …) is shown on the active path. */
export function isInLearnPath(item: PathScoped | undefined, pathId: string | undefined): boolean {
  if (!pathId) return true
  const tags = item?.paths
  if (!tags || tags.length === 0) return true
  return tags.includes(pathId)
}

/**
 * Keeps the items visible on the active path. `pathId` must already be a
 * validated id (see {@link validLearnPathId}); pass undefined for "no path".
 */
export function filterByLearnPath<T extends PathScoped>(
  items: readonly T[],
  pathId: string | undefined
): T[] {
  return items.filter((item) => isInLearnPath(item, pathId))
}

/** Workshop-step ids visible on the active path, in manifest order. */
export function visibleWorkshopStepIds(
  m: ScopeManifest | undefined,
  pathId: string | undefined
): string[] {
  const valid = validLearnPathId(m, pathId)
  return filterByLearnPath(m?.workshopSteps ?? [], valid).map((s) => s.id)
}

/** Workshop-step ids that must be completed for the module to complete. */
export function requiredWorkshopStepIds(
  m: ScopeManifest | undefined,
  pathId: string | undefined
): string[] {
  const valid = validLearnPathId(m, pathId)
  return filterByLearnPath(m?.workshopSteps ?? [], valid)
    .filter((s) => !s.optional)
    .map((s) => s.id)
}

export function isWorkshopStepOptional(m: ScopeManifest | undefined, stepId: string): boolean {
  return Boolean(m?.workshopSteps?.find((s) => s.id === stepId)?.optional)
}

/**
 * By-id conveniences for progress widgets (catalogue card, sidebar, checklist,
 * phone shell). `storedPathId` is the raw `activeLearnPath` from the store —
 * it is validated here, so a stale id means "no path".
 */
export const requiredLearnSectionIdsFor = (moduleId: string, storedPathId?: string): string[] =>
  requiredLearnSectionIds(MANIFEST_BY_ID[moduleId], storedPathId)

export const requiredWorkshopStepIdsFor = (moduleId: string, storedPathId?: string): string[] =>
  requiredWorkshopStepIds(MANIFEST_BY_ID[moduleId], storedPathId)
