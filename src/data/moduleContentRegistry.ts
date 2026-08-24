// SPDX-License-Identifier: GPL-3.0-only
/**
 * moduleContentRegistry — every module's `lastReviewed` date, surfaced for the
 * UI (remediation item 5: freshness should be visible in-product, not only
 * discoverable by grepping source or running the local staleness validator).
 * Mirrors the `import.meta.glob` pattern already used by the manifest registry
 * (`manifest/registry.ts`) — same discovery mechanism, no new infrastructure.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import type { StandardRef } from './standardsRegistry'

const modules = import.meta.glob<{ content: ModuleContent }>(
  '../components/PKILearning/modules/*/content.ts',
  { eager: true }
)

/**
 * moduleId → ISO `lastReviewed` date, for every module a human has actually checked.
 *
 * A module with no entry here has NEVER been reviewed — the key is absent rather than
 * holding a placeholder, and ModuleReferencesTab renders nothing for it. Three modules
 * are in that state as of 2026-08-23 (sbom, soc-implementation-pqc,
 * verification-closure); they postdate the 2026-03-28 baseline review.
 *
 * Until 2026-08-23 this map was not what it said it was: `apply_approved` bumped
 * `lastReviewed` on every applied edit, so 55 of 64 dates overstated the real review
 * (median 13 days, max 148) and the tab showed those numbers to readers. See
 * ModuleContentTypes.ts for the split into `lastReviewed` / `lastEdited`.
 */
export const MODULE_LAST_REVIEWED: Record<string, string> = Object.fromEntries(
  Object.values(modules)
    .map((m) => m.content)
    .filter((c): c is ModuleContent & { lastReviewed: string } =>
      Boolean(c?.moduleId && c?.lastReviewed)
    )
    .map((c) => [c.moduleId, c.lastReviewed])
)

/**
 * moduleId → ISO `lastEdited` date. Separate from the map above on purpose: this one
 * answers "when did this file last change", which is not evidence that anything was
 * checked. Absent for a module that has not been edited since the fields were split.
 */
export const MODULE_LAST_EDITED: Record<string, string> = Object.fromEntries(
  Object.values(modules)
    .map((m) => m.content)
    .filter((c): c is ModuleContent & { lastEdited: string } =>
      Boolean(c?.moduleId && c?.lastEdited)
    )
    .map((c) => [c.moduleId, c.lastEdited])
)

/**
 * moduleId → the standards that module's own `content.ts` cites.
 *
 * Added 2026-08-21. The References tab was driven entirely by the library's
 * `module_ids` column — the library's opinion of which documents belong to a
 * module — and never showed what the module itself cites. Measured across the
 * corpus, 47 of 64 modules cited at least one standard that never appeared in
 * their References tab: 152 documents in total, including the standards whose
 * numbers and deadlines the module teaches from.
 *
 * Both views are worth having, so the tab now renders both. This is the
 * module's half.
 */
export const MODULE_CITED_STANDARDS: Record<string, StandardRef[]> = Object.fromEntries(
  Object.values(modules)
    .map((m) => m.content)
    .filter((c): c is ModuleContent => Boolean(c?.moduleId))
    .map((c) => [c.moduleId, (c.standards ?? []).filter(Boolean)])
    .filter(([, refs]) => (refs as StandardRef[]).length > 0)
)
