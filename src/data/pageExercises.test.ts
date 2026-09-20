// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PAGE_EXERCISES, PAGE_EXERCISE_ROUTES } from './pageExercises'

/**
 * Tripwire for the rule in pageExercises.ts: a page question tests a domain
 * concept, not the page's own controls. The 2026-09-19 wave-2 set had 13 of 19
 * questions about chrome ("what does Export Backup download?", "which chip",
 * "which tab hides the filter deck") — every one of them would have tripped
 * this. A regex is a tripwire, not a proof: a question can be trivia without
 * using these words, so the concept field and a human read still apply.
 */
const CHROME_WORDS =
  /\b(chip|chips|button|buttons|tab|tabs|tile|tiles|icon|icons|toggle|click|clicks|press|tap|dropdown|slider|badge|filter deck|export button|download|banner|checkbox|sidebar|popover|tooltip)\b/i

describe('PAGE_EXERCISES', () => {
  it('every key is a routed page and every exercise is well-formed', () => {
    expect(PAGE_EXERCISE_ROUTES.size).toBeGreaterThanOrEqual(5)
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

  it('every question names the domain concept it tests and asks about it, not about the page chrome', () => {
    for (const [route, list] of Object.entries(PAGE_EXERCISES)) {
      for (const ex of list) {
        expect(ex.concept.trim().length, route).toBeGreaterThanOrEqual(8)
        expect(ex.concept, `${route} concept reads like a control`).not.toMatch(CHROME_WORDS)
        expect(ex.prompt, `${route} prompt asks about page chrome: "${ex.prompt}"`).not.toMatch(
          CHROME_WORDS
        )
      }
    }
  })

  it('pages with no domain concept of their own carry no question', () => {
    for (const route of [
      '/',
      '/report',
      '/assess',
      '/explore',
      '/revisions',
      '/leaders',
      '/playground',
    ])
      expect(Object.hasOwn(PAGE_EXERCISES, route), route).toBe(false)
  })
})
