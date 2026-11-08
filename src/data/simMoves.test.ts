// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_MOVES, type MoveCtx } from './simMoves'

const ctx = (over: number, hybrid: string, endState: string, force?: string): MoveCtx => ({
  country: { id: 'DE', label: 'Germany', hybrid, endState, force },
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

  it('P5 "pure" play calls a hybrid expectation a mandate only where the jurisdiction record says binding', () => {
    const pure = SIM_MOVES.p5!.find((m) => m.label.includes('PURE'))!
    const guidance = pure.evaluate(ctx(3, 'required', 'hybrid', 'guidance'))
    expect(guidance.kind).toBe('trap')
    expect(guidance.outcome).toMatch(/published guidance/)
    expect(guidance.outcome).not.toMatch(/mandate|Compliance FAIL|non-compliant/i)
    // A record with no force label is not treated as binding either.
    expect(pure.evaluate(ctx(3, 'required', 'hybrid')).outcome).not.toMatch(
      /mandate|Compliance FAIL/i
    )
    const binding = pure.evaluate(ctx(3, 'required', 'hybrid', 'requirement'))
    expect(binding.kind).toBe('trap')
    expect(binding.outcome).toMatch(/requires HYBRID/)
    expect(binding.outcome).not.toMatch(/mandates/)
  })

  it('P5 hybrid-everywhere verdict does not call the end state a mandate', () => {
    const hybrid = SIM_MOVES.p5!.find((m) => m.label.startsWith('Deploy hybrid everywhere'))!
    const verdict = hybrid.evaluate(ctx(3, 'required', 'hybrid', 'guidance'))
    expect(verdict.kind).toBe('sound')
    expect(verdict.outcome).not.toMatch(/mandate/i)
  })

  it('context tokens are interpolated into outcomes (clock "over", sector)', () => {
    const wait = SIM_MOVES.p3!.find((m) => m.label.startsWith('Wait'))!
    expect(wait.evaluate(ctx(7, 'required', 'hybrid')).outcome).toContain('7y over the line')
  })
  it('P2 spreadsheet move: explains why the gate needs a structured CBOM while accepting spreadsheets and phased inventories', () => {
    const sheet = SIM_MOVES.p2!.find((m) => m.label.includes('shared spreadsheet'))!
    const verdict = sheet.evaluate(ctx(5, 'required', 'hybrid'))
    expect(verdict.kind).toBe('trap')
    // The old text called any spreadsheet un-queryable and "stuck at Level 1" without qualification.
    expect(verdict.outcome).not.toMatch(/can't be queried, diffed, or fed to compliance automation/)
    expect(verdict.outcome).toMatch(/Fails in this scenario/)
    expect(verdict.outcome).toMatch(/structured, validated records/)
    expect(verdict.outcome).toMatch(/spreadsheet or CSV is a reasonable place to start collecting/)
    expect(verdict.outcome).toMatch(/phased inventory/)
    expect(verdict.outcome).toMatch(/CycloneDX CBOM generated or imported from that data/)
    // The structured option stays the sound one.
    const cbom = SIM_MOVES.p2!.find((m) => m.label.startsWith('Build a CycloneDX CBOM'))!
    expect(cbom.evaluate(ctx(5, 'required', 'hybrid')).kind).toBe('sound')
  })
})
