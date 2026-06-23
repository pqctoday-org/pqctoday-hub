// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { topBandLevel, normalizeLevel, phaseReadinessFraction } from './maturityScale'
import { SIM_TREES } from './index'
import type { PhaseTree } from './types'

const tree = (levels: number[]): PhaseTree => ({
  phase: 'p1',
  generated: '00000000',
  source: 'test',
  levels: levels.map((level) => ({ level: level as 1, indicator: 'x', activities: [] })),
  pitfalls: [],
})

describe('topBandLevel', () => {
  it('is the highest band a tree ships', () => {
    expect(topBandLevel(tree([1, 2]), 4)).toBe(2)
    expect(topBandLevel(tree([2, 3]), 4)).toBe(3)
    expect(topBandLevel(tree([1, 2, 3, 4]), 4)).toBe(4)
  })
  it('falls back when there is no tree / no levels', () => {
    expect(topBandLevel(undefined, 4)).toBe(4)
    expect(topBandLevel(tree([]), 4)).toBe(4)
  })
  it('matches the real shipped trees (p3 caps at 2, p6 at 3)', () => {
    expect(topBandLevel(SIM_TREES.p3, 4)).toBe(2)
    expect(topBandLevel(SIM_TREES.p6, 4)).toBe(3)
    expect(topBandLevel(SIM_TREES.p4, 4)).toBe(4)
  })
})

describe('normalizeLevel — a phase at its own top band reads as maxed', () => {
  it('clearing a 2-band phase (p3) scores full, not half', () => {
    expect(normalizeLevel(2, 2, 4)).toBe(4) // was 2 on the old fixed scale → frozen
    expect(normalizeLevel(1, 2, 4)).toBe(2)
    expect(normalizeLevel(0, 2, 4)).toBe(0)
  })
  it('clearing a 3-band phase (p6) scores full', () => {
    expect(normalizeLevel(3, 3, 4)).toBe(4)
    expect(normalizeLevel(2, 3, 4)).toBe(3) // round(2/3*4)=2.67→3
  })
  it('a full 4-band phase is unchanged', () => {
    expect(normalizeLevel(4, 4, 4)).toBe(4)
    expect(normalizeLevel(2, 4, 4)).toBe(2)
  })
  it('clamps over-top and guards top=0', () => {
    expect(normalizeLevel(5, 2, 4)).toBe(4)
    expect(normalizeLevel(3, 0, 4)).toBe(0)
  })
})

describe('phaseReadinessFraction', () => {
  it('a fully-cleared phase contributes 1 regardless of ladder length', () => {
    expect(phaseReadinessFraction(2, 2)).toBe(1)
    expect(phaseReadinessFraction(3, 3)).toBe(1)
    expect(phaseReadinessFraction(4, 4)).toBe(1)
  })
  it('partial progress is the level over the top band', () => {
    expect(phaseReadinessFraction(1, 2)).toBe(0.5)
    expect(phaseReadinessFraction(0, 4)).toBe(0)
  })
  it('guards top=0', () => {
    expect(phaseReadinessFraction(1, 0)).toBe(0)
  })
})
