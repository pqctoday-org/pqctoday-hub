// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { commandCenterIntroFor } from './commandCenterIntro'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

describe('commandCenterIntroFor', () => {
  it('gives GRC its own questions, with no ROI calculator and no executive walkthrough', () => {
    const grc = commandCenterIntroFor('grc')
    expect(grc.questions.map((q) => q.q)).toEqual([
      'What applies to us?',
      'Who owns each control?',
      'What evidence is missing?',
      'How do exceptions close?',
    ])
    expect(grc.questions.some((q) => q.to.includes('roi-calculator'))).toBe(false)
    expect(grc.showGuidedOverview).toBe(false)
  })

  it('keeps the board questions for every other persona', () => {
    for (const p of ['executive', 'ops', null] as const) {
      expect(commandCenterIntroFor(p).questions[2].cta).toBe('ROI calculator')
    }
  })

  it('gives the researcher the four research questions, with no walkthrough', () => {
    const r = commandCenterIntroFor('researcher')
    expect(r.questions.map((q) => q.to)).toEqual([
      '/library?qv=new&sort=newest',
      '/playground/drbg-demo',
      '/threats',
      '/patents',
    ])
    expect(r.showGuidedOverview).toBe(false)
  })

  it('links only to tools that exist', () => {
    const ids = new Set(BUSINESS_TOOLS.map((t) => t.id))
    for (const p of ['grc', 'developer', 'executive', 'architect', 'researcher'] as const) {
      for (const q of commandCenterIntroFor(p).questions) {
        const m = q.to.match(/^\/business\/tools\/([^/?#]+)/)
        if (m) expect(ids.has(m[1]), q.to).toBe(true)
      }
    }
  })
})
