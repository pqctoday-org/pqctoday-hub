// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
import { RETIRED_STEPS, retiredEntry } from './retiredSteps'

/** Every lesson and section tag the Hub holds now. */
const live = new Set<string>()
for (const m of LEARN_MODULES) {
  if (!m.lmId) continue
  live.add(m.lmId)
  // eslint-disable-next-line security/detect-object-injection
  for (const s of LEARN_SECTIONS[m.id] ?? []) live.add(`${m.lmId}/s:${s.id}`)
}

describe('the list of retired lessons and sections', () => {
  it('is not empty and has one entry per tag', () => {
    expect(RETIRED_STEPS.length).toBeGreaterThan(0)
    expect(new Set(RETIRED_STEPS.map((e) => e.tag)).size).toBe(RETIRED_STEPS.length)
  })

  it('lists only tags the Hub no longer holds', () => {
    expect(RETIRED_STEPS.filter((e) => live.has(e.tag)).map((e) => e.tag)).toEqual([])
  })

  it('names a target the Hub holds now', () => {
    expect(RETIRED_STEPS.filter((e) => !live.has(e.to)).map((e) => e.tag)).toEqual([])
  })

  it('has no chains: a target is never itself retired, and nothing points at itself', () => {
    const keys = new Set(RETIRED_STEPS.map((e) => e.tag))
    expect(RETIRED_STEPS.filter((e) => keys.has(e.to)).map((e) => e.tag)).toEqual([])
    expect(RETIRED_STEPS.filter((e) => e.to === e.tag)).toEqual([])
  })

  it('keeps a lesson with a lesson and a section with a section of the same kind of place', () => {
    for (const e of RETIRED_STEPS) {
      expect(e.tag.includes('/s:')).toBe(e.to.includes('/s:'))
    }
  })

  it('gives every entry a relation, a plain reason and a real date', () => {
    for (const e of RETIRED_STEPS) {
      expect(['replaced-by', 'parent']).toContain(e.relation)
      expect(e.reason.trim().length).toBeGreaterThan(10)
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(new Date(e.date).getTime())).toBe(false)
    }
  })

  it('finds an entry by tag', () => {
    expect(retiredEntry('LM-032')?.to).toBe('LM-074')
    expect(retiredEntry('LM-008')).toBeUndefined()
  })
})
