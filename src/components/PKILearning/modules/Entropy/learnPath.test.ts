// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PERSONA_IDS } from '@/data/personaIds'
import { defaultEntropyLearnPath } from './learnPath'

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
