// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  formatSourceCaveat,
  getSourceCaveat,
  SOURCE_CAVEAT_TEXT,
  sourceCaveatFor,
  type ThreatClaimStatusFile,
} from './threatClaimStatus'

const FILE: ThreatClaimStatusFile = {
  version: 1,
  rows: {
    'T-SUP': { claims: { threat_description: { verdict: 'supported', decidedAt: '2026-09-16' } } },
    'T-UND': {
      claims: { threat_description: { verdict: 'undeterminable', decidedAt: '2026-09-16' } },
    },
    'T-CON': {
      claims: { threat_description: { verdict: 'contradicted', decidedAt: '2026-09-17' } },
    },
    // Only another claim decided — no verdict on the description.
    'T-OTHER': { claims: { crypto_at_risk: { verdict: 'undeterminable' } } },
  },
}

describe('threat source caveat', () => {
  it('no caveat when the description is supported by the cited source', () => {
    expect(sourceCaveatFor('T-SUP', FILE)).toBeNull()
  })

  it('caveat, with its date, when the verdict is undeterminable', () => {
    const c = sourceCaveatFor('T-UND', FILE)
    expect(c).toEqual({ text: SOURCE_CAVEAT_TEXT, checkedAt: '2026-09-16' })
    expect(formatSourceCaveat(c!)).toBe(`${SOURCE_CAVEAT_TEXT} (checked 2026-09-16)`)
  })

  it('"contradicted" gets exactly the same caveat — the page never says the source disagrees', () => {
    const c = sourceCaveatFor('T-CON', FILE)
    expect(c?.text).toBe(SOURCE_CAVEAT_TEXT)
    expect(formatSourceCaveat(c!)).not.toMatch(/contradict|disagree/i)
  })

  it('no caveat when the row, its description verdict, or the whole file is absent', () => {
    expect(sourceCaveatFor('T-MISSING', FILE)).toBeNull()
    expect(sourceCaveatFor('T-OTHER', FILE)).toBeNull()
    expect(sourceCaveatFor('T-UND', null)).toBeNull()
    expect(sourceCaveatFor('T-UND', {})).toBeNull()
  })

  it('the bundled lookup never throws, whether or not the file is present', () => {
    expect(getSourceCaveat('NO-SUCH-THREAT')).toBeNull()
  })
})
