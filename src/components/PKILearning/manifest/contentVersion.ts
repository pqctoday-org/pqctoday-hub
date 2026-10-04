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
import { MANIFESTS, MANIFEST_BY_ID } from './registry'
import { requiredLearnSectionIds, requiredWorkshopStepIds } from './learnPathScope'

type ModuleEntry = LearningProgress['modules'][string]
type Modules = LearningProgress['modules']

/** Bump when the catalog's module set changes (drives drift detection). */
export const LEARN_CONTENT_VERSION = 3

/** Canonical module ids — the single source is the manifest collection. */
export const MODULE_IDS: ReadonlySet<string> = new Set(MANIFESTS.map((m) => m.id))

/**
 * Declarative id renames: `{ 'old-id': 'current-id' }`. Add a line + bump
 * LEARN_CONTENT_VERSION (and MODULE_STORE_VERSION, so persist re-runs migrate)
 * when a module id changes, so persisted progress carries over. The
 * key-management SPLIT is handled in the store migrate.
 *
 * fips-pci-certification (2026-09-27): the FIPS 140-3 & PCI deep dive was
 * split into fips-140-3-certification (LM-067) and pci-certification (LM-071).
 * A 1→1 map can only send its progress one way; it goes to LM-067 (user
 * decision), and PCI step/section ids left in it are ignored there.
 */
export const MODULE_ID_RENAMES: Readonly<Record<string, string>> = {
  'fips-pci-certification': 'fips-140-3-certification',
  // 2026-10-01 IoT/OT split: IoT & OT Security (LM-032) became IoT & Embedded
  // Device PQC (LM-074); Energy & Utilities PQC (LM-042) became the cross-sector
  // OT & Industrial Control Systems PQC module (LM-075).
  'iot-ot-pqc': 'iot-pqc',
  'energy-utilities-pqc': 'ot-pqc',
}

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
 * Progress for CONTENT that moved from one live module to another (the old id
 * stays). MODULE_ID_RENAMES moves a whole module id; this moves single workshop
 * steps and learn sections.
 *
 *  - `steps`: workshop step ids that moved (same id in the new module).
 *  - `sections`: old learn-section id → the new module's section ids that
 *    replace it. One old section can become several; reading the old one counts
 *    as reading all of them.
 *
 * confidential-computing → homomorphic-encryption (2026-10-04): the FHE section
 * (one learn section, now five) and the "FHE + HSM Flows" workshop step moved to
 * Homomorphic Encryption (LM-076).
 */
export interface ContentMove {
  from: string
  to: string
  steps: readonly string[]
  sections: Readonly<Record<string, readonly string[]>>
}

export const MODULE_CONTENT_MOVES: readonly ContentMove[] = [
  {
    from: 'confidential-computing',
    to: 'homomorphic-encryption',
    steps: ['fhe-hsm-flows'],
    sections: {
      'homomorphic-encryption': [
        'fhe-fundamentals',
        'fhe-keys-operations',
        'fhe-quantum',
        'fhe-hsm-custody',
        'fhe-implementations',
      ],
    },
  },
]

/** Whether the manifest's required workshop steps or learn sections are all done. */
function isModuleDone(moduleId: string, entry: ModuleEntry): boolean {
  const manifest = MANIFEST_BY_ID[moduleId]
  const steps = requiredWorkshopStepIds(manifest, entry.activeLearnPath)
  const sections = requiredLearnSectionIds(manifest, entry.activeLearnPath)
  const checks = entry.learnSectionChecks ?? {}
  const stepsDone = steps.length > 0 && steps.every((id) => entry.completedSteps.includes(id))
  const sectionsDone = sections.length > 0 && sections.every((id) => checks[id])
  return stepsDone || sectionsDone
}

/**
 * Carry progress for moved content to the module that now holds it (idempotent;
 * pure — returns a new map). Moved steps and read sections leave the old
 * module's entry and join the new module's, created in-progress when it has no
 * entry yet. Time spent stays with the old module: it cannot be attributed.
 *
 * Each module that received or lost progress is then re-checked once with the
 * store's own completion rule (all required steps done, or all required
 * sections read), so a learner is never left "in progress" on a module whose
 * remaining content they have finished. A completed module is never demoted.
 * Nothing moves when the old module has no progress for the moved content, so a
 * second run changes nothing.
 */
export function applyContentMoves(
  modules: Modules,
  moves: readonly ContentMove[] = MODULE_CONTENT_MOVES
): Modules {
  const out: Modules = { ...modules }
  for (const move of moves) {
    const old = out[move.from]
    if (!old) continue
    const movedSteps = old.completedSteps.filter((id) => move.steps.includes(id))
    const oldChecks = old.learnSectionChecks ?? {}
    const movedSections = Object.keys(move.sections).filter((id) =>
      Object.prototype.hasOwnProperty.call(oldChecks, id)
    )
    if (movedSteps.length === 0 && movedSections.length === 0) continue

    const readSections = movedSections.filter((id) => oldChecks[id]) // eslint-disable-line security/detect-object-injection -- ids from our own constants
    const incoming: ModuleEntry = {
      status: 'in-progress',
      lastVisited: old.lastVisited,
      timeSpent: 0,
      completedSteps: movedSteps,
      quizScores: {},
      learnSectionChecks: Object.fromEntries(
        // eslint-disable-next-line security/detect-object-injection -- ids from our own constants
        readSections.flatMap((id) => move.sections[id].map((newId) => [newId, true]))
      ),
    }

    const existing = out[move.to]
    const merged = existing ? mergeEntry(existing, incoming) : incoming

    out[move.to] = {
      ...merged,
      status:
        merged.status !== 'completed' && isModuleDone(move.to, merged)
          ? 'completed'
          : merged.status,
    }

    const keptChecks = Object.fromEntries(
      Object.entries(oldChecks).filter(([id]) => !movedSections.includes(id))
    )
    const trimmed: ModuleEntry = {
      ...old,
      completedSteps: old.completedSteps.filter((id) => !move.steps.includes(id)),
      learnSectionChecks: keptChecks,
    }

    out[move.from] = {
      ...trimmed,
      status:
        trimmed.status === 'in-progress' && isModuleDone(move.from, trimmed)
          ? 'completed'
          : trimmed.status,
    }
  }
  return out
}

/**
 * One-time reconcile for the module that gave content away: a learner who had
 * finished everything the module still teaches but not the part that moved
 * (steps 1-5 of Confidential Computing, never the FHE step) was never "completed"
 * and would stay "in progress" until their next click. Run once, in the store
 * migration that introduced the move, not on every load: after that a learner
 * can legitimately sit "in progress" with every step done (a section unchecked).
 */
export function reconcileMovedContentStatus(
  modules: Modules,
  moves: readonly ContentMove[] = MODULE_CONTENT_MOVES
): Modules {
  const out: Modules = { ...modules }
  for (const { from } of moves) {
    // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
    const entry = out[from]
    if (entry && entry.status === 'in-progress' && isModuleDone(from, entry)) {
      // eslint-disable-next-line security/detect-object-injection -- ids are our own declared constants
      out[from] = { ...entry, status: 'completed' }
    }
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

/** Per-module content version when a manifest omits one (B2 decision D2). */
export const DEFAULT_CONTENT_VERSION = 1

/** The current id → content-version map (the manifests are the single source). */
export function getModuleVersionFingerprint(): Record<string, number> {
  const fp: Record<string, number> = {}
  for (const m of MANIFESTS) {
    fp[m.id] = m.contentVersion ?? DEFAULT_CONTENT_VERSION
  }
  return fp
}

export interface ModuleChanges {
  /** brand-new module ids (added to the catalog) */
  added: string[]
  /** removed module ids — progress is KEPT and shown with a "retired" note (D1) */
  retired: string[]
  /** ids whose content version was bumped since last seen */
  updated: string[]
  /** declarative renames whose new id is now live */
  renamed: { from: string; to: string }[]
}

/**
 * Diff a previously-seen fingerprint against the current one — rename-aware, so a
 * declarative rename surfaces as "renamed" rather than a spurious retired+added
 * pair. Powers the "What's New" learn-module section.
 */
export function diffModuleVersions(
  lastSeen: Record<string, number>,
  current: Record<string, number> = getModuleVersionFingerprint()
): ModuleChanges {
  const renamedTo = new Set(Object.values(MODULE_ID_RENAMES))
  const lastIds = Object.keys(lastSeen)
  const curIds = Object.keys(current)
  const has = (obj: Record<string, number>, id: string) =>
    Object.prototype.hasOwnProperty.call(obj, id)
  const ver = (obj: Record<string, number>, id: string) =>
    // eslint-disable-next-line security/detect-object-injection -- id is a known module id
    obj[id]

  return {
    added: curIds.filter((id) => !has(lastSeen, id) && !renamedTo.has(id)),
    retired: lastIds.filter(
      (id) => !has(current, id) && !Object.prototype.hasOwnProperty.call(MODULE_ID_RENAMES, id)
    ),
    updated: curIds.filter((id) => has(lastSeen, id) && ver(current, id) !== ver(lastSeen, id)),
    renamed: lastIds
      .filter(
        (id) =>
          Object.prototype.hasOwnProperty.call(MODULE_ID_RENAMES, id) &&
          // eslint-disable-next-line security/detect-object-injection -- id is a known module id
          has(current, MODULE_ID_RENAMES[id])
      )
      // eslint-disable-next-line security/detect-object-injection -- id is a known module id
      .map((id) => ({ from: id, to: MODULE_ID_RENAMES[id] })),
  }
}
