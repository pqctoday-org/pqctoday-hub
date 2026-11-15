// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A `recommended` hybrid stance: guidance prefers hybrid where feasible but does
 * not rule out post-quantum-only (the EU coordinated roadmap's wording). A
 * pure-only choice is a caution, never a failure.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { JURISDICTION_RULES, checkChoice, recommendedChoice } from './jurisdiction'
import { SIM_MOVES, type MoveCtx } from './simMoves'

const CODE = 'ZZ-REC'
const cutToPure = Object.values(SIM_MOVES)
  .flat()
  .find((m) => m?.label === 'Cut straight to PURE PQC across Tier-1')!

describe('a recommended hybrid stance', () => {
  afterEach(() => {
    delete JURISDICTION_RULES[CODE]
  })

  it('warns, not fails, on pure-only and steers toward hybrid', () => {
    JURISDICTION_RULES[CODE] = {
      authority: 'Test authority',
      hybrid: 'recommended',
      note: 'Hybrid recommended where feasible; no end state stated.',
      force: 'guidance',
    }
    const pure = checkChoice(CODE, 'pure')
    expect(pure).toMatchObject({ ok: true, level: 'warn', evaluated: true })
    expect(pure.reason).toMatch(/recommends hybrid where feasible/)
    expect(checkChoice(CODE, 'hybrid').level).toBe('ok')
    expect(checkChoice(CODE, 'classical').level).toBe('fail')
    expect(recommendedChoice(JURISDICTION_RULES[CODE])).toBe('hybrid')
  })

  it('the "cut straight to pure" move is a caution, not the compliance trap', () => {
    const ctx: MoveCtx = {
      country: {
        id: CODE,
        label: 'Test authority',
        hybrid: 'recommended',
        endState: '',
        force: 'guidance',
      },
      sector: { id: 'financial', label: 'Finance', x: 10 },
      size: { id: 'mid', label: 'Mid' },
      over: 0,
    }
    const r = cutToPure.evaluate(ctx)
    expect(r.kind).toBe('warn')
    expect(r.outcome).toMatch(/recommends HYBRID wherever feasible/)
    expect(r.outcome).not.toMatch(/Compliance FAIL|allows a pure end-state/)
  })
})
