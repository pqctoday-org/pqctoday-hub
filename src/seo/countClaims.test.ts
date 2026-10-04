// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { LAYERS } from '@/data/infrastructureLayers'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { ROUTE_META } from './routeMeta'

/**
 * Numbers typed into a page description for search engines go stale silently: the Migration page
 * said "7 technology layers" while the catalog's own list has 9. Each number below is tied to the
 * list it counts, so changing the list without the description fails here.
 */

const description = (path: string) => ROUTE_META[path]!.description

describe('counts quoted in route descriptions match the lists they count', () => {
  it('/migrate: the infrastructure layers are the ones the Migration page groups products by', () => {
    expect(description('/migrate')).toContain(`across ${LAYERS.length} infrastructure layers`)
  })

  describe('/learn/crypto-dev-apis', () => {
    const module = MANIFESTS.find((m) => m.id === 'crypto-dev-apis')!
    const text = description('/learn/crypto-dev-apis')

    it('quotes the number of languages the module itself states', () => {
      const stated = /across (\d+) languages/.exec(module.description)?.[1]
      expect(stated).toBeDefined()
      expect(text).toContain(`${stated} languages`)
    })

    it('quotes as many APIs as it lists, and the module names each of them', () => {
      const match = /(\d+) crypto APIs: ([^.]+)\./.exec(text)!
      const listed = match[2]!.split(/,\s*(?:and\s+)?/).map((name) => name.trim())
      expect(listed).toHaveLength(Number(match[1]))
      // The module writes "Windows CNG" where the description says "CNG".
      for (const name of listed) expect(module.description).toContain(name)
    })
  })
})
