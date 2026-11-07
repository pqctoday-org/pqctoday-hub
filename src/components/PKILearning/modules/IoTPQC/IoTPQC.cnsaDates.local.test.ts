// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import { content } from './content'

describe('IoT module states the CNSA 2.0 FAQ v2.2 dates', () => {
  it('lists the three national security system dates with their years', () => {
    const cnsa = content.deadlines.filter((d) => d.source === 'CNSA 2.0')
    expect(cnsa.map((d) => [d.label, d.year])).toEqual([
      ['CNSA 2.0: new national security system acquisitions (from 1 January 2027)', 2027],
      [
        'CNSA 2.0: unsupported national security system equipment phased out (31 December 2030)',
        2030,
      ],
      ['CNSA 2.0 mandated for national security systems (31 December 2031)', 2031],
    ])
    expect(content.deadlines.some((d) => /signing (preferred|exclusive)/.test(d.label))).toBe(false)
  })

  it('names the firmware algorithms CNSA 2.0 allows and the ones it does not', () => {
    expect(ragSummary).toContain(
      'CNSA 2.0 accepts only LMS, XMSS and ML-DSA-87 for national-security-system firmware, not HSS, XMSSMT or SLH-DSA'
    )
    expect(ragSummary).toContain('new national security system acquisitions from 1 January 2027')
    expect(ragSummary).toContain('unsupported equipment phased out by 31 December 2030')
    expect(ragSummary).toContain('CNSA 2.0 mandated by 31 December 2031')
    expect(ragSummary).not.toContain('prefer from 2025, exclusive by 2030')
  })
})
