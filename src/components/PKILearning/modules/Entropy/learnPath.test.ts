// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PERSONA_IDS } from '@/data/personaIds'
import { visibleWorkshopStepIds } from '@/components/PKILearning/manifest/learnPathScope'
import { defaultEntropyLearnPath } from './learnPath'
import manifest from './manifest'

describe('defaultEntropyLearnPath', () => {
  it('uses the certification path for the certification engineer role', () => {
    expect(defaultEntropyLearnPath('cert-engineer')).toBe('certification-engineer')
  })

  it('uses the general path for every other selected role', () => {
    for (const persona of PERSONA_IDS.filter((id) => id !== 'cert-engineer')) {
      expect(defaultEntropyLearnPath(persona)).toBe('general-practitioner')
    }
  })

  it('waits for runtime role selection', () => {
    expect(defaultEntropyLearnPath(null)).toBeNull()
  })
})

describe('Entropy workshop paths', () => {
  it('keeps the Evidence Lab available to both runtime-selected roles', () => {
    for (const path of ['general-practitioner', 'certification-engineer']) {
      expect(visibleWorkshopStepIds(manifest, path)).toContain('entropy-evidence-lab')
    }
  })
})
