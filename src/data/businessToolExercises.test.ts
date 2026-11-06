// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { BUSINESS_TOOL_EXERCISES } from './businessToolExercises'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

describe('BUSINESS_TOOL_EXERCISES (round 9, wave 2, business sittings)', () => {
  it('every key is a business tool and every business tool has an exercise', () => {
    const ids = BUSINESS_TOOLS.map((t) => t.id)
    for (const k of Object.keys(BUSINESS_TOOL_EXERCISES)) expect(ids, k).toContain(k)
    expect(ids.filter((id) => !BUSINESS_TOOL_EXERCISES[id]?.length)).toEqual([])
  })
  it('every exercise has two to four distinct options, one correct, and a reason of substance', () => {
    for (const [k, list] of Object.entries(BUSINESS_TOOL_EXERCISES)) {
      for (const ex of list) {
        expect(ex.options.length, k).toBeGreaterThanOrEqual(2)
        expect(ex.options.length, k).toBeLessThanOrEqual(4)
        expect(new Set(ex.options).size, k).toBe(ex.options.length)
        expect(ex.answer, k).toBeLessThan(ex.options.length)
        expect(ex.prompt, k).toMatch(/\?$/)
        expect(ex.why.length, k).toBeGreaterThanOrEqual(60)
      }
    }
  })
  it('Cost of Inaction exercise matches the real control range and 10-year horizon', () => {
    const prompt = BUSINESS_TOOL_EXERCISES['cost-of-inaction'][0].prompt
    expect(prompt).toMatch(/3-year migration delay/i)
    expect(prompt).toMatch(/10-year horizon/i)
    expect(prompt).not.toMatch(/from 0/i)
  })
  it('CBOM exercise teaches repeatability and its limits, not an accuracy guarantee', () => {
    const [ex] = BUSINESS_TOOL_EXERCISES['crypto-cbom-builder']
    const text = `${ex.prompt} ${ex.options.join(' ')} ${ex.why}`
    // No fixed one-week lifetime for a hand-built CBOM, and no promise of accuracy for a generated one.
    expect(text).not.toMatch(/accurate for a week/i)
    expect(text).not.toMatch(/for as long as you keep generating/i)
    expect(ex.options[ex.answer]).not.toMatch(/always accurate/i)
    // Coverage, staleness and unsupported-stack limits are stated for both kinds.
    expect(ex.why).toMatch(/only the sources you feed it/)
    expect(ex.why).toMatch(/stack the scanner does not support/)
    expect(ex.why).toMatch(/stale input/)
    expect(ex.why).toMatch(/hand-built entries drift/)
    expect(ex.why).toMatch(/dated snapshot/)
  })
})
