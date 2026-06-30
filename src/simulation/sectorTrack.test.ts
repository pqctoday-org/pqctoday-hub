// SPDX-License-Identifier: GPL-3.0-only
/**
 * sectorTrack.test.ts — CI guard: every moduleId in SECTOR_STEPS must resolve
 * in SIM_LEARN_MODULES (i.e. have embeddable: true in its manifest).
 * A renamed or removed module fails here instead of silently breaking the sim.
 */
import { describe, it, expect } from 'vitest'
import { SECTOR_STEPS } from './sectorTrack'
import { isEmbeddableModule } from '@/components/PKILearning/simEmbedModules'

describe('sectorTrack', () => {
  it('every moduleId is embeddable', () => {
    for (const [sector, phases] of Object.entries(SECTOR_STEPS)) {
      for (const [phase, steps] of Object.entries(phases ?? {})) {
        for (const step of steps ?? []) {
          expect(
            isEmbeddableModule(step.moduleId),
            `${sector}/${phase}: moduleId '${step.moduleId}' not in SIM_LEARN_MODULES`
          ).toBe(true)
        }
      }
    }
  })

  it('every step has a valid /learn/ to URL matching its moduleId', () => {
    for (const [sector, phases] of Object.entries(SECTOR_STEPS)) {
      for (const [phase, steps] of Object.entries(phases ?? {})) {
        for (const step of steps ?? []) {
          expect(step.to, `${sector}/${phase}: step missing 'to' field`).toMatch(/^\/learn\//)
          expect(step.to, `${sector}/${phase}: 'to' URL doesn't match moduleId`).toBe(
            `/learn/${step.moduleId}`
          )
        }
      }
    }
  })
})
