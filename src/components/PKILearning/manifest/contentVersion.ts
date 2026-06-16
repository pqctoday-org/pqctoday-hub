// SPDX-License-Identifier: GPL-3.0-only
/**
 * Learn-content versioning + drift reconciliation (B2).
 *
 * The simulation pins its content (FRAMEWORK_VERSION, CI-checked) so renames /
 * removals never silently lose progress. Learn had no equivalent: a renamed
 * module id stranded its progress, and the only rename handler was a one-off
 * hardcoded `key-management → kms/hsm` split in the store migrate.
 *
 * This brings Learn to parity, derived from A1's single-source manifests:
 *  - LEARN_CONTENT_VERSION — bump when the module set changes (add/remove/rename).
 *  - MODULE_IDS — the canonical id set (from the manifests).
 *  - MODULE_ID_RENAMES — a DECLARATIVE rename map: a renamed module is one line
 *    here (+ a version bump), not a bespoke migrate step. Applied on rehydrate.
 *  - findOrphanedModuleIds — persisted ids no longer in the catalog (removed
 *    modules), for the "What's New" surface to report. Non-destructive.
 *
 * NOTE: the historical key-management→kms-pqc/hsm-pqc case is a 1→2 SPLIT, which
 * a 1→1 rename map can't express — it stays in the store migrate (v5→v6). This
 * map is for the common 1→1 rename going forward.
 */
import type { LearningProgress } from '@/services/storage/types'
import { MANIFESTS } from './registry'

type ModuleEntry = LearningProgress['modules'][string]
type Modules = LearningProgress['modules']

/** Bump when the catalog's module set changes (drives drift detection). */
export const LEARN_CONTENT_VERSION = 1

/** Canonical module ids — the single source is the manifest collection. */
export const MODULE_IDS: ReadonlySet<string> = new Set(MANIFESTS.map((m) => m.id))

/**
 * Declarative id renames: `{ 'old-id': 'current-id' }`. Add a line + bump
 * LEARN_CONTENT_VERSION when a module id changes, so persisted progress carries
 * over. (Empty today — no 1→1 rename has occurred yet; the key-management SPLIT
 * is handled in the store migrate.)
 */
export const MODULE_ID_RENAMES: Readonly<Record<string, string>> = {}

/** Lossless carry-over when both old and new ids hold progress (rare). */
function mergeEntry(current: ModuleEntry, incoming: ModuleEntry): ModuleEntry {
  const rank = (s: ModuleEntry['status']) => (s === 'completed' ? 2 : s === 'in-progress' ? 1 : 0)
  return {
    status: rank(current.status) >= rank(incoming.status) ? current.status : incoming.status,
    lastVisited: Math.max(current.lastVisited ?? 0, incoming.lastVisited ?? 0),
    timeSpent: Math.max(current.timeSpent ?? 0, incoming.timeSpent ?? 0),
    completedSteps: [...new Set([...current.completedSteps, ...incoming.completedSteps])],
    quizScores: { ...incoming.quizScores, ...current.quizScores },
    learnSectionChecks: { ...incoming.learnSectionChecks, ...current.learnSectionChecks },
  }
}

/**
 * Apply MODULE_ID_RENAMES to a persisted modules map (idempotent): each old id's
 * progress moves to its current id (merged losslessly if the new id already has
 * progress). No-op when no rename applies. Pure — returns a new map.
 */
export function applyModuleRenames(
  modules: Modules,
  renames: Readonly<Record<string, string>> = MODULE_ID_RENAMES
): Modules {
  const out: Modules = { ...modules }
  for (const [oldId, newId] of Object.entries(renames)) {
    // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
    const old = out[oldId]
    if (!old) continue
    // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
    const existing = out[newId]
    // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
    out[newId] = existing ? mergeEntry(existing, old) : old
    // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
    delete out[oldId]
  }
  return out
}

/**
 * Persisted module ids that are no longer in the catalog and aren't covered by a
 * rename — i.e. removed modules whose progress is now orphaned. Non-destructive:
 * callers (the "What's New" surface) decide whether to keep, note, or clean.
 */
export function findOrphanedModuleIds(persistedIds: Iterable<string>): string[] {
  const renamedAway = new Set(Object.keys(MODULE_ID_RENAMES))
  return [...persistedIds].filter((id) => !MODULE_IDS.has(id) && !renamedAway.has(id))
}
