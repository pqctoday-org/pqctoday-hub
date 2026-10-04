// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { ROUTE_META } from './routeMeta'

/** The Learn module routes, with the module each one belongs to. */
const routedModules = MANIFESTS.filter((m) => Object.hasOwn(ROUTE_META, `/learn/${m.id}`)).map(
  (manifest) => ({ manifest, meta: ROUTE_META[`/learn/${manifest.id}`]! })
)

describe('Learn module route metadata matches the module itself', () => {
  it('states the study time the module shows, in the page data search engines read', () => {
    const disagree = routedModules
      .filter(({ manifest }) => manifest.id !== 'quiz')
      .map(({ manifest, meta }) => ({
        id: manifest.id,
        module: `PT${Number.parseInt(manifest.duration, 10)}M`,
        route: String(meta.structuredData?.timeRequired),
      }))
      .filter((m) => m.module !== m.route)
    expect(disagree).toEqual([])
  })

  it('has study time on every routed module except the quiz', () => {
    const missing = routedModules
      .filter(({ manifest }) => manifest.id !== 'quiz')
      .filter(({ meta }) => typeof meta.structuredData?.timeRequired !== 'string')
      .map(({ manifest }) => manifest.id)
    expect(missing).toEqual([])
  })
})
