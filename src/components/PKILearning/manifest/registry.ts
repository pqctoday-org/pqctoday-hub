// SPDX-License-Identifier: GPL-3.0-only
/**
 * Manifest registry — assembles every co-located modules/<X>/manifest.ts into a
 * single collection, mirroring src/simulation/index.ts's tree assembly. During
 * the A1 migration this runs alongside the legacy maps; the conformance test
 * (./conformance.test.ts) asserts the two agree until the legacy maps are
 * deleted and these manifests become the only source of truth.
 */
import type { ModuleManifest } from './types'

const modules = import.meta.glob<{ default: ModuleManifest }>('../modules/*/manifest.ts', {
  eager: true,
})

/** Every module manifest discovered on disk. */
export const MANIFESTS: ModuleManifest[] = Object.values(modules).map((m) => m.default)

/** id → manifest. */
export const MANIFEST_BY_ID: Record<string, ModuleManifest> = Object.fromEntries(
  MANIFESTS.map((m) => [m.id, m])
)
