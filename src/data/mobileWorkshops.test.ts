// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { MOBILE_WORKSHOP_READY } from './mobileWorkshops'

describe('MOBILE_WORKSHOP_READY (Wave D)', () => {
  it('names real modules that actually have a workshop', () => {
    for (const id of MOBILE_WORKSHOP_READY) {
      const m = MANIFEST_BY_ID[id]
      expect(m, `unknown module ${id}`).toBeDefined()
      expect(
        (m!.workshopSteps?.length ?? 0) > 0 || m!.stepCountOverride,
        `${id} has no workshop`
      ).toBeTruthy()
    }
  })
})
