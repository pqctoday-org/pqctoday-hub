// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { JURISDICTION_RULES, checkChoice, recommendedChoice } from './jurisdiction'

describe('jurisdiction', () => {
  it('mandate countries reject a pure choice', () => {
    expect(checkChoice('DE', 'pure').level).toBe('fail') // BSI requires hybrid
    expect(checkChoice('DE', 'hybrid').level).toBe('ok')
  })

  it('pure-end-state countries accept pure and warn on hybrid', () => {
    expect(checkChoice('US', 'pure').level).toBe('ok') // CNSA end state pure
    expect(checkChoice('US', 'hybrid').level).toBe('warn')
  })

  it('classical-only fails everywhere', () => {
    for (const c of Object.keys(JURISDICTION_RULES)) {
      expect(checkChoice(c, 'classical').level, `${c} classical`).toBe('fail')
    }
  })

  it('recommends hybrid for mandate, pure for discouraged', () => {
    expect(recommendedChoice(JURISDICTION_RULES.DE)).toBe('hybrid')
    expect(recommendedChoice(JURISDICTION_RULES.AU)).toBe('pure')
  })
})
