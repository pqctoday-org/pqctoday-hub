// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the lossless two-device progress merge (B1 #3). The invariant: a
 * merge NEVER loses progress present on either side.
 */
import { describe, it, expect } from 'vitest'
import { mergeModuleProgress } from './mergeProgress'
import type { LearningProgress } from './types'

const base = (over: Partial<LearningProgress> = {}): LearningProgress => ({
  version: '14.0.0',
  timestamp: 1000,
  modules: {},
  artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
  ejbcaConnections: {},
  preferences: { theme: 'dark', defaultKeyType: 'RSA', autoSave: true },
  notes: {},
  ...over,
})

describe('mergeModuleProgress — lossless two-device merge', () => {
  it('unions completedSteps and takes the max timeSpent / quizScores', () => {
    const local = base({
      modules: {
        'hsm-pqc': {
          status: 'in-progress',
          lastVisited: 10,
          timeSpent: 30,
          completedSteps: ['a', 'b'],
          quizScores: { q1: 70 },
        },
      },
    })
    const remote = base({
      modules: {
        'hsm-pqc': {
          status: 'completed',
          lastVisited: 20,
          timeSpent: 12,
          completedSteps: ['b', 'c'],
          quizScores: { q1: 50, q2: 90 },
        },
      },
    })
    const m = mergeModuleProgress(local, remote).modules['hsm-pqc']
    expect(m.completedSteps.sort()).toEqual(['a', 'b', 'c']) // union
    expect(m.timeSpent).toBe(30) // max
    expect(m.lastVisited).toBe(20) // latest
    expect(m.status).toBe('completed') // most-advanced
    expect(m.quizScores).toEqual({ q1: 70, q2: 90 }) // per-quiz max + union
  })

  it('keeps modules unique to either device', () => {
    const local = base({
      modules: {
        'mod-a': {
          status: 'completed',
          lastVisited: 1,
          timeSpent: 5,
          completedSteps: [],
          quizScores: {},
        },
      },
    })
    const remote = base({
      modules: {
        'mod-b': {
          status: 'in-progress',
          lastVisited: 1,
          timeSpent: 5,
          completedSteps: [],
          quizScores: {},
        },
      },
    })
    const merged = mergeModuleProgress(local, remote).modules
    expect(Object.keys(merged).sort()).toEqual(['mod-a', 'mod-b'])
  })

  it('unions quiz mastery and artifacts by id', () => {
    const local = base({
      quizMastery: { correctQuestionIds: ['x', 'y'] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal artifact mocks
      artifacts: {
        keys: [{ id: 'k1' } as any],
        certificates: [],
        csrs: [],
        executiveDocuments: [],
      },
    })
    const remote = base({
      quizMastery: { correctQuestionIds: ['y', 'z'] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal artifact mocks
      artifacts: {
        keys: [{ id: 'k2' } as any],
        certificates: [],
        csrs: [],
        executiveDocuments: [],
      },
    })
    const merged = mergeModuleProgress(local, remote)
    expect(merged.quizMastery?.correctQuestionIds.sort()).toEqual(['x', 'y', 'z'])
    expect(merged.artifacts.keys.map((k) => k.id).sort()).toEqual(['k1', 'k2'])
  })

  it('merges session tracking — max streaks, union visit dates, earliest first visit', () => {
    const local = base({
      sessionTracking: {
        firstVisit: 500,
        lastVisitDate: '2026-06-10',
        totalSessions: 3,
        currentStreak: 2,
        longestStreak: 5,
        visitDates: ['2026-06-09', '2026-06-10'],
      },
    })
    const remote = base({
      sessionTracking: {
        firstVisit: 200,
        lastVisitDate: '2026-06-12',
        totalSessions: 4,
        currentStreak: 1,
        longestStreak: 7,
        visitDates: ['2026-06-11', '2026-06-12'],
      },
    })
    const s = mergeModuleProgress(local, remote).sessionTracking!
    expect(s.firstVisit).toBe(200) // earliest
    expect(s.lastVisitDate).toBe('2026-06-12') // latest
    expect(s.totalSessions).toBe(4) // max
    expect(s.longestStreak).toBe(7) // max
    expect(s.visitDates).toEqual(['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12']) // union
  })

  it('is symmetric for additive fields (order does not lose data)', () => {
    const a = base({
      modules: {
        m: {
          status: 'in-progress',
          lastVisited: 1,
          timeSpent: 9,
          completedSteps: ['s1'],
          quizScores: {},
        },
      },
    })
    const b = base({
      modules: {
        m: {
          status: 'completed',
          lastVisited: 2,
          timeSpent: 4,
          completedSteps: ['s2'],
          quizScores: {},
        },
      },
    })
    const ab = mergeModuleProgress(a, b).modules.m
    const ba = mergeModuleProgress(b, a).modules.m
    expect(ab.completedSteps.sort()).toEqual(ba.completedSteps.sort())
    expect(ab.timeSpent).toBe(ba.timeSpent)
    expect(ab.status).toBe(ba.status)
  })
})
