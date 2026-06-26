// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { encodeScenario, decodeScenario } from './scenarioCode'
import { quarterRng } from '@/simulation/rng'

describe('scenarioCode (PR7 — shareable reproducible runs)', () => {
  it('round-trips a seed through encode → decode', () => {
    for (const seed of [0, 1, 42, 123456, 0xffffffff]) {
      expect(decodeScenario(encodeScenario(seed))).toBe(seed)
    }
  })

  it('is case-insensitive and tolerant of surrounding whitespace', () => {
    const code = encodeScenario(987654)
    expect(decodeScenario(`  ${code.toLowerCase()} `)).toBe(987654)
  })

  it('rejects malformed codes', () => {
    expect(decodeScenario('')).toBeNull()
    expect(decodeScenario('!!!')).toBeNull()
    expect(decodeScenario('TOOLONGCODE')).toBeNull() // > uint32 range
  })

  it('a decoded code reproduces the same quarter rolls (determinism payoff)', () => {
    const seed = decodeScenario(encodeScenario(0xdecaf))!
    const a = quarterRng(seed, 2027, 3)
    const b = quarterRng(seed, 2027, 3)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})
