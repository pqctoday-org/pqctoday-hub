// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { WAVES_FALLBACK } from './waves'

describe('migration wave teaching text', () => {
  const waves = [1, 2, 3, 4] as const

  it('keeps the wave titles the plan board and phone view look up', () => {
    expect(WAVES_FALLBACK[1].title).toBe('External-facing live traffic')
    expect(WAVES_FALLBACK[2].title).toBe('Signing & access')
    expect(WAVES_FALLBACK[3].title).toBe('Key & identity infrastructure')
    expect(WAVES_FALLBACK[4].title).toBe('Data-at-rest & messaging')
  })

  it('presents the order as conditional, not a universal sequence', () => {
    for (const w of waves) {
      const text = `${WAVES_FALLBACK[w].subtitle} ${WAVES_FALLBACK[w].rationale}`
      expect(text).not.toMatch(/Prioritized first because it is the most exposed/i)
      expect(text).not.toMatch(/Sequenced (second|third|last) because/i)
      expect(text).not.toMatch(/\bsymmetric-safe\b/i)
    }
    // Each wave says when it would move.
    expect(WAVES_FALLBACK[1].rationale).toMatch(/start there instead/i)
    expect(WAVES_FALLBACK[3].rationale).toMatch(/moves earlier/i)
  })

  it('keeps national-security milestones to national security systems, with the NSA dates', () => {
    const r = WAVES_FALLBACK[2].rationale
    expect(r).not.toMatch(/CNSA 2\.0 sets its earliest/i)
    expect(r).toMatch(/National security systems/)
    expect(r).toMatch(/not as a general order for other organizations/i)
    expect(r).toMatch(/1 January 2027/)
    expect(r).toMatch(/31 December 2030/)
    expect(r).toMatch(/31 December 2031/)
  })

  it('says when confidentiality and key history make storage urgent and rewrapping insufficient', () => {
    const r = WAVES_FALLBACK[4].rationale
    expect(r).not.toMatch(/only the key-wrapping layer/i)
    expect(r).not.toMatch(/sequenced last/i)
    expect(r).toMatch(/must stay confidential for decades/i)
    expect(r).toMatch(/rewrapping is not enough/i)
    expect(r).toMatch(/re-encryption under a new data key/i)
    expect(r).toMatch(/not as a fixed last step/i)
  })
})
