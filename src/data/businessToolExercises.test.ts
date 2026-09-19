// SPDX-License-Identifier: GPL-3.0-only
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
})
