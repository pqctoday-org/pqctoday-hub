// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { STEP_EXERCISES } from './stepExercises'

describe('pqc-101 algorithm-families exercise: resistance is not zero speedup', () => {
  const ex = STEP_EXERCISES['pqc-101/algorithm-families']

  it('feedback separates "no efficient quantum break known" from "no quantum speedup whatsoever"', () => {
    expect(ex.why).toMatch(/No efficient quantum algorithm is known/)
    expect(ex.why).toMatch(/does not mean no quantum speedup at all/)
    expect(ex.why).toMatch(/Grover/)
    expect(ex.why).toMatch(/parameters are chosen with it in mind/)
    expect(ex.why).not.toMatch(/have no known quantum speedup/)
  })

  it('still marks the factoring / discrete-logarithm option as the correct answer for Shor', () => {
    expect(ex.options[ex.answer]).toMatch(/Integer factorisation and the discrete logarithm/)
  })
})
