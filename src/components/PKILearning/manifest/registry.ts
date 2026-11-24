// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Manifest registry — assembles every co-located modules/<X>/manifest.ts into a
 * single collection, mirroring src/simulation/index.ts's tree assembly. During
 * the A1 migration this runs alongside the legacy maps; the conformance test
 * (./conformance.test.ts) asserts the two agree until the legacy maps are
 * deleted and these manifests become the only source of truth.
 */
import type { ModuleManifest, ResolvedModuleManifest } from './types'
import { resolveManifest } from './resolve'

const modules = import.meta.glob<{ default: ModuleManifest }>('../modules/*/manifest.ts', {
  eager: true,
})

/** Every module manifest discovered on disk, joined with its lessons-data row. */
export const MANIFESTS: ResolvedModuleManifest[] = Object.values(modules).map((m) =>
  resolveManifest(m.default)
)

/** id → manifest. */
export const MANIFEST_BY_ID: Record<string, ResolvedModuleManifest> = Object.fromEntries(
  MANIFESTS.map((m) => [m.id, m])
)
