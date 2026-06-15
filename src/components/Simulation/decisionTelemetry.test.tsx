// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-16 — a wrong (trap/warn) pick in the decision card emits keyed telemetry;
 * the correct pick does not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DecisionSection } from './sections'
import { logSimTrapPick } from '@/utils/analytics'
import type { MoveCtx } from '@/data/simMoves'

vi.mock('@/utils/analytics', async (orig) => ({
  ...(await orig<typeof import('@/utils/analytics')>()),
  logSimTrapPick: vi.fn(),
}))

const ctx: MoveCtx = {
  country: { id: 'DE', label: 'BSI', hybrid: 'interim', endState: 'pure' },
  sector: { id: 'healthcare', label: 'Healthcare', x: 10 },
  size: { id: 'mid', label: 'Mid' },
  over: 2,
}

const props = {
  phaseId: 'p0' as const,
  ctx,
  nextMove: {
    band: { level: 1 as const, indicator: 'x', activities: [] },
    act: { id: '1.1', title: 'Act', steps: [] },
    step: { kind: 'reference' as const, label: 'CORRECT-MOVE', to: '/threats', refId: 'threats' },
  },
  level: 0,
  stepsDone: 0,
  stepsTotal: 3,
  pitfalls: [
    { title: 'TRAP-ONE', why: 'bad idea' },
    { title: 'TRAP-TWO', why: 'also bad' },
  ],
  onVisitRef: () => {},
  canEmbed: () => false,
  onOpenStep: () => {},
}

const renderDecision = () =>
  render(
    <MemoryRouter>
      <DecisionSection {...props} />
    </MemoryRouter>
  )

beforeEach(() => vi.mocked(logSimTrapPick).mockClear())

describe('decision telemetry (WS-16)', () => {
  it('the correct pick fires no trap telemetry', () => {
    renderDecision()
    fireEvent.click(screen.getByText('CORRECT-MOVE').closest('button')!)
    expect(logSimTrapPick).not.toHaveBeenCalled()
  })

  it('a wrong pick fires a phase-keyed trap-pick event', () => {
    renderDecision()
    const wrong = screen
      .getAllByRole('button')
      .find((b) => /^[A-C]/.test(b.textContent ?? '') && !/CORRECT-MOVE/.test(b.textContent ?? ''))
    expect(wrong, 'a wrong card should render').toBeTruthy()
    fireEvent.click(wrong!)
    expect(logSimTrapPick).toHaveBeenCalledTimes(1)
    expect(vi.mocked(logSimTrapPick).mock.calls[0][0]).toBe('p0')
    expect(vi.mocked(logSimTrapPick).mock.calls[0][1]).toBeTruthy()
  })
})
