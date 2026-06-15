// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeReadiness } from './readiness'
import { ARCHITECTURES } from '@/data/simArchitecture'

const vulnerableCount = (size: keyof typeof ARCHITECTURES) =>
  ARCHITECTURES[size].edges.filter((e) => e.vulnerable && e.pqcPath !== 'none').length

describe('computeReadiness (WS-04 — per-edge, continuous)', () => {
  it('0% at no P5 progress, 100% when all P5 activities are done', () => {
    const v = vulnerableCount('mid')
    expect(computeReadiness('mid', 0)).toEqual({ pct: 0, migrated: 0, vulnerable: v })
    expect(computeReadiness('mid', 1)).toEqual({ pct: 100, migrated: v, vulnerable: v })
  })

  it('moves continuously and attributably with the P5 fraction', () => {
    const v = vulnerableCount('mid')
    const half = computeReadiness('mid', 0.5)
    expect(half.migrated).toBe(Math.round(v * 0.5))
    // each additional fraction migrates more edges (monotonic, not a 4-step jump)
    const a = computeReadiness('mid', 0.25).migrated
    const b = computeReadiness('mid', 0.5).migrated
    const c = computeReadiness('mid', 0.75).migrated
    expect(a).toBeLessThanOrEqual(b)
    expect(b).toBeLessThanOrEqual(c)
  })

  it('clamps out-of-range fractions and falls back to a known size', () => {
    expect(computeReadiness('mid', -1).migrated).toBe(0)
    expect(computeReadiness('mid', 2).pct).toBe(100)
    // unknown size falls back to the mid topology (no throw)
    expect(computeReadiness('does-not-exist', 1).vulnerable).toBe(vulnerableCount('mid'))
  })
})
