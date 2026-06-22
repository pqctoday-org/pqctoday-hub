// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { mulberry32, chanceWith, sampleWith, quarterRng, newSeed } from './rng'

describe('simulation rng (mulberry32)', () => {
  it('is deterministic: same seed → identical sequence', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    const seqA = Array.from({ length: 8 }, () => a())
    const seqB = Array.from({ length: 8 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('different seeds → different sequences', () => {
    const a = Array.from({ length: 8 }, mulberry32(1))
    const b = Array.from({ length: 8 }, mulberry32(2))
    expect(a).not.toEqual(b)
  })

  it('emits values in [0, 1)', () => {
    const r = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('quarterRng reproduces a quarter from seed + turn, and varies by turn', () => {
    const q1a = Array.from({ length: 5 }, quarterRng(777, 2026, 1))
    const q1b = Array.from({ length: 5 }, quarterRng(777, 2026, 1))
    const q2 = Array.from({ length: 5 }, quarterRng(777, 2026, 2))
    expect(q1a).toEqual(q1b) // same seed+turn → identical
    expect(q1a).not.toEqual(q2) // different turn → different
  })

  it('chanceWith / sampleWith are deterministic under a fixed seed', () => {
    const mk = () => quarterRng(42, 2026, 3)
    const arr = ['a', 'b', 'c', 'd'] as const
    const flips1 = (() => {
      const r = mk()
      return [chanceWith(r, 0.5), chanceWith(r, 0.5), sampleWith(r, arr)]
    })()
    const flips2 = (() => {
      const r = mk()
      return [chanceWith(r, 0.5), chanceWith(r, 0.5), sampleWith(r, arr)]
    })()
    expect(flips1).toEqual(flips2)
  })

  it('newSeed returns a 32-bit unsigned integer', () => {
    const s = newSeed()
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(0xffffffff)
  })
})
