// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { JURISDICTION_RULES, checkChoice, recommendedChoice } from './jurisdiction'

describe('jurisdiction', () => {
  it('countries whose guidance expects hybrid reject a pure choice', () => {
    expect(checkChoice('DE', 'pure').level).toBe('fail') // BSI guidance expects hybrid
    expect(checkChoice('DE', 'hybrid').level).toBe('ok')
  })

  it('does not call published guidance a requirement', () => {
    for (const c of ['DE', 'FR', 'EU']) {
      const rule = JURISDICTION_RULES[c]
      expect(rule.hybrid, `${c} hybrid stance`).toBe('required')
      expect(rule.force, `${c} instrument force`).toBe('guidance')
      const verdict = checkChoice(c, 'pure')
      expect(verdict.reason, `${c} reason`).toContain('expects hybrid in its published guidance')
      expect(verdict.reason, `${c} reason`).not.toMatch(/requires hybrid|non-compliant/)
    }
  })

  it('claims neither a requirement nor published guidance where the instrument force is not recorded', () => {
    const rule = JURISDICTION_RULES.DE
    const onFile = rule.force
    rule.force = ''
    try {
      const reason = checkChoice('DE', 'pure').reason
      expect(reason).toContain("BSI's recorded stance is hybrid")
      expect(reason).not.toMatch(/requires hybrid|published guidance|non-compliant/)
    } finally {
      rule.force = onFile
    }
  })

  it('says "requires" only for an instrument on file as a requirement', () => {
    const rule = JURISDICTION_RULES.DE
    const onFile = rule.force
    rule.force = 'requirement'
    try {
      expect(checkChoice('DE', 'pure').reason).toContain(
        'requires hybrid — a pure choice is non-compliant.'
      )
    } finally {
      rule.force = onFile
    }
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
