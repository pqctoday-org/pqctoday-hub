// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  trackForFunction,
  criticalPathLength,
  criticalPathSpanYears,
  TRACK_META,
  type RoadmapMilestone,
} from './roadmapTracks'

describe('trackForFunction', () => {
  it('routes signatures to Track B (integrity)', () => {
    expect(trackForFunction('Signature')).toBe('B')
    expect(trackForFunction('Composite Signature')).toBe('B')
  })

  it('routes key-exchange / encryption / symmetric / hash to Track A (confidentiality)', () => {
    expect(trackForFunction('Encryption/KEM')).toBe('A')
    expect(trackForFunction('Hybrid KEM')).toBe('A')
    expect(trackForFunction('Composite KEM')).toBe('A')
    expect(trackForFunction('Symmetric')).toBe('A')
    expect(trackForFunction('Hash')).toBe('A')
  })

  it('matches the canonical twoTrack.ts identities (A = Confidentiality, B = Integrity)', () => {
    expect(TRACK_META.A.label).toMatch(/Confidentiality/)
    expect(TRACK_META.B.label).toMatch(/Integrity|Signatures/)
  })
})

describe('criticalPathLength', () => {
  const ms = (id: string, dependsOn?: string[]): RoadmapMilestone => ({
    id,
    label: id,
    year: 2027,
    phaseId: 'p5',
    track: 'A',
    dependsOn,
  })

  it('is 0 for an empty roadmap', () => {
    expect(criticalPathLength([])).toBe(0)
  })

  it('is 1 for independent milestones', () => {
    expect(criticalPathLength([ms('a'), ms('b'), ms('c')])).toBe(1)
  })

  it('counts the longest dependency chain', () => {
    // c → b → a  (depth 3)
    const chain = [ms('a'), ms('b', ['a']), ms('c', ['b'])]
    expect(criticalPathLength(chain)).toBe(3)
  })

  it('takes the max across branches', () => {
    // d → c → b → a (4) ; e → a (2)
    const graph = [ms('a'), ms('b', ['a']), ms('c', ['b']), ms('d', ['c']), ms('e', ['a'])]
    expect(criticalPathLength(graph)).toBe(4)
  })

  it('ignores missing dependency ids', () => {
    expect(criticalPathLength([ms('a', ['ghost'])])).toBe(1)
  })

  it('does not loop forever on a cycle', () => {
    // a ↔ b — must terminate and return a finite depth
    const cyclic = [ms('a', ['b']), ms('b', ['a'])]
    const result = criticalPathLength(cyclic)
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBeGreaterThan(0)
  })
})

describe('criticalPathSpanYears (duration, not depth)', () => {
  const ms = (id: string, year: number, dependsOn?: string[]): RoadmapMilestone => ({
    id,
    label: id,
    year,
    phaseId: 'p5',
    track: 'A',
    dependsOn,
  })

  it('is 0 for an empty roadmap or independent same-year milestones', () => {
    expect(criticalPathSpanYears([])).toBe(0)
    expect(criticalPathSpanYears([ms('a', 2027), ms('b', 2027)])).toBe(0)
  })

  it('measures the year span of the longest-duration chain', () => {
    // a(2026) <- b(2030): span 4, even though it is only 2 milestones deep.
    const longDuration = [ms('a', 2026), ms('b', 2030, ['a'])]
    expect(criticalPathSpanYears(longDuration)).toBe(4)
  })

  it('prefers a 2-deep 4-year chain over a 3-deep same-year chain', () => {
    const sameYearDeep = [ms('x', 2027), ms('y', 2027, ['x']), ms('z', 2027, ['y'])]
    const twoYearWide = [ms('a', 2026), ms('b', 2030, ['a'])]
    // criticalPathLength (count) ranks the 3-deep chain higher...
    expect(criticalPathLength(sameYearDeep)).toBeGreaterThan(criticalPathLength(twoYearWide))
    // ...but the duration metric correctly flags the wider one as the constraint.
    expect(criticalPathSpanYears(sameYearDeep)).toBe(0)
    expect(criticalPathSpanYears(twoYearWide)).toBe(4)
  })

  it('does not loop on a cyclic graph', () => {
    const cyclic = [ms('a', 2026, ['b']), ms('b', 2030, ['a'])]
    expect(() => criticalPathSpanYears(cyclic)).not.toThrow()
  })
})
