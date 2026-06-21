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

  // PR-5 — broadened to ten jurisdictions.
  it('covers all ten jurisdictions', () => {
    expect(Object.keys(JURISDICTION_RULES).sort()).toEqual(
      ['AU', 'CA', 'DE', 'EU', 'FR', 'JP', 'KR', 'SG', 'UK', 'US'].sort()
    )
  })

  it('EU requires hybrid — a pure-only pilot fails; hybrid warns (sunset to pure)', () => {
    expect(checkChoice('EU', 'pure').level).toBe('fail')
    expect(checkChoice('EU', 'hybrid').level).toBe('warn')
  })

  it('CA/JP/KR/SG accept pure and warn on hybrid (pure end state, not mandated hybrid)', () => {
    for (const c of ['CA', 'JP', 'KR', 'SG'] as const) {
      expect(checkChoice(c, 'pure').level, `${c} pure`).toBe('ok')
      expect(checkChoice(c, 'hybrid').level, `${c} hybrid`).toBe('warn')
    }
  })

  it('recommends pure where hybrid is discouraged (JP)', () => {
    expect(recommendedChoice(JURISDICTION_RULES.JP)).toBe('pure')
  })
})
