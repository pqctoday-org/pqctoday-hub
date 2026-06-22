// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_MOVES, type MoveCtx } from './simMoves'

const ctx = (over: number, hybrid: string, endState: string): MoveCtx => ({
  country: { id: 'DE', label: 'Germany', hybrid, endState },
  sector: { id: 'healthcare', label: 'Healthcare', x: 15 },
  size: { id: 'mid', label: 'Mid' },
  over,
})

describe('simMoves', () => {
  it('every lifecycle phase p0–p7 has moves with at least one sound and one trap', () => {
    for (const p of ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const) {
      const moves = SIM_MOVES[p]
      expect(moves, `${p}: no moves`).toBeDefined()
      const kinds = moves!.map((m) => m.evaluate(ctx(5, 'required', 'hybrid')).kind)
      expect(kinds, `${p}: no sound move`).toContain('sound')
      expect(kinds, `${p}: no trap move`).toContain('trap')
    }
  })

  it('P5 "pure" play fails under a hybrid mandate, warns otherwise', () => {
    const pure = SIM_MOVES.p5!.find((m) => m.label.includes('PURE'))!
    expect(pure.evaluate(ctx(3, 'required', 'hybrid')).kind).toBe('trap') // DE/FR mandate
    expect(pure.evaluate(ctx(3, 'interim', 'pure')).kind).toBe('warn') // US/UK
  })

  it('context tokens are interpolated into outcomes (clock "over", sector)', () => {
    const wait = SIM_MOVES.p3!.find((m) => m.label.startsWith('Wait'))!
    expect(wait.evaluate(ctx(7, 'required', 'hybrid')).outcome).toContain('7y over the line')
  })
})
