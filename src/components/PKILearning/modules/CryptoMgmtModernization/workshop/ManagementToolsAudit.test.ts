// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeMaturityScore,
  TOOLS,
  type CoverageLevel,
} from './ManagementToolsAudit'

const at = (level: CoverageLevel) =>
  Object.fromEntries(TOOLS.map((t) => [t.id, level])) as Record<string, CoverageLevel>

describe('computeMaturityScore (W1-5)', () => {
  it('is 0 when nothing is covered and 100 when everything is automated', () => {
    expect(computeMaturityScore(at(0))).toBe(0)
    expect(computeMaturityScore(at(3))).toBe(100)
  })

  it('weights by importance — same tool count covered, different score', () => {
    // The regression: under the old flat mean these two were identical.
    const highImportance = TOOLS.filter((t) => t.importance === 3).slice(0, 2)
    const lowImportance = TOOLS.filter((t) => t.importance < 3).slice(0, 2)
    expect(highImportance.length).toBe(2)
    expect(lowImportance.length).toBe(2)

    const coverOnly = (ids: string[]) =>
      Object.fromEntries(
        TOOLS.map((t) => [t.id, ids.includes(t.id) ? 3 : 0])
      ) as Record<string, CoverageLevel>

    const coveringCritical = computeMaturityScore(coverOnly(highImportance.map((t) => t.id)))
    const coveringNiceToHave = computeMaturityScore(coverOnly(lowImportance.map((t) => t.id)))

    expect(coveringCritical).toBeGreaterThan(coveringNiceToHave)
  })

  it('missing the single most important tool costs more than missing the least important', () => {
    const most = [...TOOLS].sort((a, b) => b.importance - a.importance)[0]
    const least = [...TOOLS].sort((a, b) => a.importance - b.importance)[0]
    const without = (id: string) =>
      Object.fromEntries(
        TOOLS.map((t) => [t.id, t.id === id ? 0 : 3])
      ) as Record<string, CoverageLevel>

    expect(computeMaturityScore(without(most.id))).toBeLessThan(
      computeMaturityScore(without(least.id))
    )
  })

  it('treats an unknown tool id as uncovered rather than throwing', () => {
    expect(computeMaturityScore({})).toBe(0)
  })
})
