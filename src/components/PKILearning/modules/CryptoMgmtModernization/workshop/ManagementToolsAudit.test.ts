// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeCoverageAdjustedScore,
  computeMaturityScore,
  gapReason,
  inventoryCoveragePct,
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
      Object.fromEntries(TOOLS.map((t) => [t.id, ids.includes(t.id) ? 3 : 0])) as Record<
        string,
        CoverageLevel
      >

    const coveringCritical = computeMaturityScore(coverOnly(highImportance.map((t) => t.id)))
    const coveringNiceToHave = computeMaturityScore(coverOnly(lowImportance.map((t) => t.id)))

    expect(coveringCritical).toBeGreaterThan(coveringNiceToHave)
  })

  it('missing the single most important tool costs more than missing the least important', () => {
    const most = [...TOOLS].sort((a, b) => b.importance - a.importance)[0]
    const least = [...TOOLS].sort((a, b) => a.importance - b.importance)[0]
    const without = (id: string) =>
      Object.fromEntries(TOOLS.map((t) => [t.id, t.id === id ? 0 : 3])) as Record<
        string,
        CoverageLevel
      >

    expect(computeMaturityScore(without(most.id))).toBeLessThan(
      computeMaturityScore(without(least.id))
    )
  })

  it('treats an unknown tool id as uncovered rather than throwing', () => {
    expect(computeMaturityScore({})).toBe(0)
  })
})

describe('computeCoverageAdjustedScore and gapReason (systems coverage counts)', () => {
  const pctAll = (pct: number) => Object.fromEntries(TOOLS.map((t) => [t.id, pct]))

  it('all Automated at 0% systems covered reads 0%, at 100% reads 100%', () => {
    expect(computeCoverageAdjustedScore(at(3), pctAll(0))).toBe(0)
    expect(computeCoverageAdjustedScore(at(3), pctAll(100))).toBe(100)
    expect(computeCoverageAdjustedScore(at(3), pctAll(60))).toBe(60)
  })

  it('lowering one category coverage lowers readiness but not the category rating', () => {
    const levels = at(3)
    const pct = { ...pctAll(100), 'crypto-scanner': 30 }
    expect(computeMaturityScore(levels)).toBe(100)
    expect(computeCoverageAdjustedScore(levels, pct)).toBeLessThan(100)
  })

  it('flags a Partial/Automated category under 50% systems as a coverage gap', () => {
    expect(gapReason(3, 40)).toBe('low-systems-coverage')
    expect(gapReason(2, 50)).toBeNull()
    expect(gapReason(1, 100)).toBe('rating-below-partial')
  })
})

describe('inventory coverage counts', () => {
  it('keeps distinct coverage decisions through the exact half-coverage boundary', () => {
    const before = inventoryCoveragePct({ inScope: '64', covered: '31' })!
    const boundary = inventoryCoveragePct({ inScope: '64', covered: '32' })!
    expect(before).toBe(48.4375)
    expect(boundary).toBe(50)
    expect(gapReason(3, before)).toBe('low-systems-coverage')
    expect(gapReason(3, boundary)).toBeNull()
    expect(inventoryCoveragePct({ inScope: '64', covered: '0' })).toBe(0)
  })

  it.each([
    ['', '0'],
    ['0', '0'],
    ['25', '26'],
    ['64', '-1'],
    ['64', '31.5'],
    ['9007199254740992', '31'],
  ])('withholds coverage for in-scope %s and covered %s', (inScope, covered) => {
    expect(inventoryCoveragePct({ inScope, covered })).toBeNull()
  })
})
