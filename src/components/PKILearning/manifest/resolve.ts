// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Joins a lesson manifest with its row in the lessons data file
 * (`src/data/learn_modules_*.csv`, read through `learnModules.generated.ts`).
 *
 * A manifest carries a lesson's content and wiring (components, sections,
 * steps, learn paths). Every organising field — title, description, minutes,
 * level, track and order, framework phase, taxonomy, playground tool, content
 * version — is stored once, in the data file, and is added here.
 */
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import type { ModuleManifest, ResolvedModuleManifest } from './types'

export function resolveManifest(manifest: ModuleManifest): ResolvedModuleManifest {
  const data = LEARN_MODULE_BY_ID[manifest.id]
  if (!data) throw new Error(`missing Learn-module data for ${manifest.id}`)
  const hasTaxonomy = data.taxonomyAlgorithms.length > 0 || data.taxonomyStandards.length > 0
  return {
    ...manifest,
    ...(data.lmId !== undefined ? { lm_id: data.lmId } : {}),
    title: data.title,
    description: data.description,
    duration: `${data.durationMin} min`,
    ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
    ...(data.workInProgress !== undefined ? { workInProgress: data.workInProgress } : {}),
    frameworkPhase:
      data.frameworkPhase.length === 1 ? data.frameworkPhase[0] : [...data.frameworkPhase],
    ...(data.track !== undefined ? { track: data.track } : {}),
    ...(data.trackOrder !== undefined ? { trackOrder: data.trackOrder } : {}),
    ...(data.playgroundTool !== undefined ? { playgroundTool: data.playgroundTool } : {}),
    ...(hasTaxonomy
      ? {
          taxonomy: {
            ...(data.taxonomyAlgorithms.length ? { algorithms: [...data.taxonomyAlgorithms] } : {}),
            ...(data.taxonomyStandards.length ? { standards: [...data.taxonomyStandards] } : {}),
          },
        }
      : {}),
    ...(data.contentVersion !== undefined ? { contentVersion: data.contentVersion } : {}),
  }
}

/**
 * A manifest as a page component receives it. Module entry points hand over
 * their raw manifest; tests may hand over a hand-built resolved one. Either way
 * the component works from the resolved shape.
 */
export function asResolved(
  manifest: ModuleManifest | ResolvedModuleManifest
): ResolvedModuleManifest {
  return 'title' in manifest ? manifest : resolveManifest(manifest)
}
