// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  trackForFunction,
  criticalPathLength,
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
