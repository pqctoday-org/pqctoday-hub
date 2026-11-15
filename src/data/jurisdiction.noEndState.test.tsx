// SPDX-License-Identifier: AGPL-3.0-only
/**
 * An authority can recommend hybrid without stating an end state (the EU
 * roadmap does exactly that). Such a rule must still load, must never be read
 * as "end state: pure", and the panel must say plainly that none is stated.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JURISDICTION_RULES, checkChoice } from './jurisdiction'
import { SIM_MOVES, type MoveCtx } from './simMoves'
import { JurisdictionPanel } from '@/components/Simulation/JurisdictionPanel'

const CODE = 'ZZ-TEST'
const hybridEverywhere = Object.values(SIM_MOVES)
  .flat()
  .find((m) => m?.label === 'Deploy hybrid everywhere')!

const ctx = (endState: string): MoveCtx => ({
  country: { id: CODE, label: 'Test authority', hybrid: 'required', endState, force: 'guidance' },
  sector: { id: 'financial', label: 'Finance', x: 10 },
  size: { id: 'mid', label: 'Mid' },
  over: 0,
})

describe('a jurisdiction rule with no stated end state', () => {
  afterEach(() => {
    delete JURISDICTION_RULES[CODE]
  })

  it('checks choices against the hybrid stance and never warns about a pure end state', () => {
    JURISDICTION_RULES[CODE] = {
      authority: 'Test authority',
      hybrid: 'required',
      note: 'Hybrid recommended; no end state stated.',
      force: 'guidance',
    }
    expect(checkChoice(CODE, 'hybrid')).toMatchObject({ level: 'ok', evaluated: true })
    expect(checkChoice(CODE, 'pure').level).toBe('fail')
    expect(checkChoice(CODE, 'hybrid').reason).not.toMatch(/end state is pure/)
  })

  it('the panel says no end state is stated', () => {
    JURISDICTION_RULES[CODE] = {
      authority: 'Test authority',
      hybrid: 'required',
      note: 'Hybrid recommended; no end state stated.',
      force: 'guidance',
    }
    render(<JurisdictionPanel country={CODE} size="mid" />)
    expect(screen.getByTestId('jurisdiction-no-end-state')).toHaveTextContent(
      'Test authority states no end state yet'
    )
  })

  it('the "deploy hybrid everywhere" move does not claim a pure end state', () => {
    const blank = hybridEverywhere.evaluate(ctx(''))
    expect(blank.kind).toBe('sound')
    expect(blank.outcome).not.toMatch(/pure PQC/)
    expect(blank.outcome).toMatch(/states no end state/)
    expect(hybridEverywhere.evaluate(ctx('pure')).kind).toBe('warn')
    expect(hybridEverywhere.evaluate(ctx('hybrid')).kind).toBe('sound')
  })
})
