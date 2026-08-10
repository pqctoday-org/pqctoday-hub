// SPDX-License-Identifier: GPL-3.0-only
/**
 * The guidance block is also a set of filter shortcuts. A category string that
 * no longer exists in the data would render a confident recommendation that
 * lands the reader on an empty grid — worse than the undifferentiated list it
 * replaced.
 */
import { describe, it, expect } from 'vitest'
import { PERSONA_LEADER_GUIDANCE } from './leadersConstants'
import { leadersData } from '@/data/leadersData'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

describe('PERSONA_LEADER_GUIDANCE — B+ remediation 4.1', () => {
  const liveCategories = new Set(leadersData.map((l) => l.category))

  it('covers every persona', () => {
    for (const id of Object.keys(PERSONAS) as PersonaId[]) {
      expect(PERSONA_LEADER_GUIDANCE[id]?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('only recommends categories that exist and are non-empty in the live data', () => {
    for (const [persona, guidance] of Object.entries(PERSONA_LEADER_GUIDANCE)) {
      for (const g of guidance) {
        expect(liveCategories.has(g.category), `${persona}: category "${g.category}"`).toBe(true)
        const count = leadersData.filter((l) => l.category === g.category).length
        expect(count, `${persona}: category "${g.category}" is empty`).toBeGreaterThan(0)
      }
    }
  })

  it('says something specific — a reason, not a restatement of the category', () => {
    for (const guidance of Object.values(PERSONA_LEADER_GUIDANCE)) {
      for (const g of guidance) {
        expect(g.why.length).toBeGreaterThan(40)
        expect(g.why.toLowerCase()).not.toBe(g.category.toLowerCase())
      }
    }
  })
})
