// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { LEARN_ORDER } from './learnOrderData'

describe('learn order data', () => {
  it('matches the module catalogue and reverses every prerequisite exactly', () => {
    const catalogueIds = new Set(
      MANIFESTS.filter((manifest) => !manifest.custom).map((manifest) => manifest.id)
    )

    expect(Object.keys(LEARN_ORDER).sort()).toEqual([...catalogueIds].sort())

    for (const [moduleId, order] of Object.entries(LEARN_ORDER)) {
      expect(order.takeFirst).not.toContain(moduleId)
      expect(order.next).not.toContain(moduleId)

      for (const prerequisiteId of order.takeFirst) {
        expect(catalogueIds.has(prerequisiteId)).toBe(true)
        expect(LEARN_ORDER[prerequisiteId]?.next).toContain(moduleId)
      }

      const expectedNext = Object.entries(LEARN_ORDER)
        .filter(([, candidate]) => candidate.takeFirst.includes(moduleId))
        .map(([candidateId]) => candidateId)
      expect(order.next).toEqual(expectedNext)

      for (const nextId of order.next) expect(catalogueIds.has(nextId)).toBe(true)
    }

    expect(Object.keys(MODULE_CATALOG)).toContain('quiz')
  })
})
