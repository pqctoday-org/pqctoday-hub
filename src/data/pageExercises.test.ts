// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PAGE_EXERCISES, PAGE_EXERCISE_ROUTES } from './pageExercises'

describe('PAGE_EXERCISES (round 9, wave 2)', () => {
  it('every key is a routed page and every exercise is well-formed', () => {
    expect(PAGE_EXERCISE_ROUTES.size).toBeGreaterThanOrEqual(19)
    for (const [route, list] of Object.entries(PAGE_EXERCISES)) {
      expect(route, route).toMatch(/^\/[a-z0-9/-]*$/)
      expect(list.length, route).toBeGreaterThanOrEqual(1)
      for (const ex of list) {
        expect(ex.options.length, route).toBeGreaterThanOrEqual(2)
        expect(ex.options.length, route).toBeLessThanOrEqual(4)
        expect(new Set(ex.options).size, route).toBe(ex.options.length)
        expect(ex.answer, route).toBeGreaterThanOrEqual(0)
        expect(ex.answer, route).toBeLessThan(ex.options.length)
        expect(ex.prompt, route).toMatch(/\?$/)
        expect(ex.why.length, route).toBeGreaterThanOrEqual(60)
        expect(ex.why.toLowerCase(), route).not.toMatch(/^correct[.!]/)
      }
    }
    expect(PAGE_EXERCISES['/simulation']).toBeUndefined()
  })
})
