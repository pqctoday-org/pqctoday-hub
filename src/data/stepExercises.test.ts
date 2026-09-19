// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { STEP_EXERCISES } from './stepExercises'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

describe('STEP_EXERCISES (round 9, wave 2)', () => {
  it('every key is a real module workshop step', () => {
    for (const key of Object.keys(STEP_EXERCISES)) {
      const [moduleId, stepId] = key.split('/')
      const m = MANIFEST_BY_ID[moduleId]
      expect(m, key).toBeDefined()
      expect(
        m!.workshopSteps?.some((s) => s.id === stepId),
        key
      ).toBe(true)
    }
  })
  it('every exercise has two to four options, one correct, and a reason that names the concept', () => {
    for (const [key, ex] of Object.entries(STEP_EXERCISES)) {
      expect(ex.options.length, key).toBeGreaterThanOrEqual(2)
      expect(ex.options.length, key).toBeLessThanOrEqual(4)
      expect(ex.answer, key).toBeGreaterThanOrEqual(0)
      expect(ex.answer, key).toBeLessThan(ex.options.length)
      expect(new Set(ex.options).size, key).toBe(ex.options.length)
      expect(ex.prompt, key).toMatch(/\?$/)
      expect(ex.why.length, key).toBeGreaterThanOrEqual(60)
      expect(ex.why.toLowerCase(), key).not.toMatch(/^correct[.!]/)
    }
  })
})
