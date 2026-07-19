// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { pickQuizQuestion, questionsForModule } from './quizSelection'

describe('quizSelection', () => {
  it('finds real questions for a module known to have quiz coverage', () => {
    const pool = questionsForModule('crypto-agility')
    expect(pool.length).toBeGreaterThan(0)
    for (const q of pool) {
      expect(q.category).toBe('crypto-agility')
      expect(['multiple-choice', 'true-false']).toContain(q.type)
    }
  })

  it('returns an empty pool for a module id that is not a quiz category', () => {
    expect(questionsForModule('not-a-real-module-or-category')).toEqual([])
  })

  it('picks the SAME question for the same (moduleId, seed) — replayable, not reroll-able', () => {
    const a = pickQuizQuestion('crypto-agility', 12345)
    const b = pickQuizQuestion('crypto-agility', 12345)
    expect(a).not.toBeNull()
    expect(a?.id).toBe(b?.id)
  })

  it('different seeds can pick different questions when the pool has more than one', () => {
    const pool = questionsForModule('crypto-agility')
    if (pool.length < 2) return // nothing to differentiate
    const seen = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const q = pickQuizQuestion('crypto-agility', seed)
      if (q) seen.add(q.id)
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('different modules draw independently for the same seed', () => {
    const a = pickQuizQuestion('crypto-agility', 999)
    const b = pickQuizQuestion('hybrid-crypto', 999)
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(a?.category).toBe('crypto-agility')
    expect(b?.category).toBe('hybrid-crypto')
  })

  it('returns null for a module with no quiz coverage', () => {
    expect(pickQuizQuestion('not-a-real-module-or-category', 1)).toBeNull()
  })
})
