// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { TOOL_EXERCISES } from './toolExercises'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

describe('TOOL_EXERCISES (round 9, wave 2, playground sittings)', () => {
  it('every key is a live playground tool and every live tool has at least one exercise', () => {
    const live = WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => t.id)
    for (const k of Object.keys(TOOL_EXERCISES)) expect(live, k).toContain(k)
    expect(live.filter((id) => !TOOL_EXERCISES[id]?.length)).toEqual([])
  })
  it('every exercise has two to four distinct options, one correct, and a reason of substance', () => {
    for (const [k, list] of Object.entries(TOOL_EXERCISES)) {
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
