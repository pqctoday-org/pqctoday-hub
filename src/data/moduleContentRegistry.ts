// SPDX-License-Identifier: GPL-3.0-only
/**
 * moduleContentRegistry — every module's `lastReviewed` date, surfaced for the
 * UI (remediation item 5: freshness should be visible in-product, not only
 * discoverable by grepping source or running the local staleness validator).
 * Mirrors the `import.meta.glob` pattern already used by the manifest registry
 * (`manifest/registry.ts`) — same discovery mechanism, no new infrastructure.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'

const modules = import.meta.glob<{ content: ModuleContent }>(
  '../components/PKILearning/modules/*/content.ts',
  { eager: true }
)

/** moduleId → ISO `lastReviewed` date, for every module that has a content.ts. */
export const MODULE_LAST_REVIEWED: Record<string, string> = Object.fromEntries(
  Object.values(modules)
    .map((m) => m.content)
    .filter((c): c is ModuleContent => Boolean(c?.moduleId && c?.lastReviewed))
    .map((c) => [c.moduleId, c.lastReviewed])
)
