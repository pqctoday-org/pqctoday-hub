// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { classifyCswp39Step } from './generators'
import type { RecommendedAction } from '../assessmentTypes'

const act = (action: string, relatedModule = ''): RecommendedAction => ({
  priority: 1,
  action,
  category: 'immediate',
  relatedModule,
})

describe('classifyCswp39Step', () => {
  it('maps actions to the right CSWP.39 step by intent', () => {
    expect(classifyCswp39Step(act('Build a cryptographic inventory / CBOM'))).toBe('inventory')
    expect(classifyCswp39Step(act('Deploy hybrid TLS to Tier-1 systems'))).toBe('implement')
    expect(classifyCswp39Step(act('Prioritise the migration roadmap'))).toBe('prioritise')
    expect(classifyCswp39Step(act('Score quantum risk and identify gaps'))).toBe('identify-gaps')
    expect(classifyCswp39Step(act('Establish a cryptography policy and charter'))).toBe('govern')
  })
  it('defaults to govern when nothing matches', () => {
    expect(classifyCswp39Step(act('Brief the executive sponsor'))).toBe('govern')
  })
})
