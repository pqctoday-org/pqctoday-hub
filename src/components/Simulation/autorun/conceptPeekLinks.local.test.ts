// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CONCEPT_LEARN_MODULE } from './conceptPeekLinks'
import { EXEC_TOUR_CONCEPTS } from './execTourConfig'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

describe('conceptPeekLinks', () => {
  it('every concept peek has a learn-more module that resolves in MODULE_CATALOG', () => {
    for (const id of Object.keys(EXEC_TOUR_CONCEPTS) as (keyof typeof EXEC_TOUR_CONCEPTS)[]) {
      const moduleId = CONCEPT_LEARN_MODULE[id]
      expect(moduleId, `concept "${id}" has no learn-more module mapped`).toBeTruthy()
      expect(
        MODULE_CATALOG[moduleId],
        `concept "${id}" maps to unknown module "${moduleId}"`
      ).toBeDefined()
    }
  })
})
