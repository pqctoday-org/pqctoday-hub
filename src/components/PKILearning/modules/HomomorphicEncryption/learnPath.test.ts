// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PERSONA_IDS } from '@/data/personaIds'
import { FHE_ADVANCED_PERSONAS, canUseFheAdvancedPath, defaultFheLearnPath } from './learnPath'

describe('FHE learning paths', () => {
  it('defaults certification engineers to custody and everyone else to foundations', () => {
    expect(defaultFheLearnPath('cert-engineer')).toBe('hsm-custody')
    for (const persona of PERSONA_IDS.filter((id) => id !== 'cert-engineer')) {
      expect(defaultFheLearnPath(persona)).toBe('fhe-foundations')
    }
    expect(defaultFheLearnPath(null)).toBe('fhe-foundations')
  })

  it('offers advanced custody only to the five selected roles', () => {
    expect(FHE_ADVANCED_PERSONAS).toEqual([
      'developer',
      'architect',
      'researcher',
      'cert-engineer',
      'ops',
    ])
    for (const persona of PERSONA_IDS) {
      expect(canUseFheAdvancedPath(persona)).toBe(FHE_ADVANCED_PERSONAS.includes(persona))
    }
    expect(canUseFheAdvancedPath(null)).toBe(false)
  })
})
