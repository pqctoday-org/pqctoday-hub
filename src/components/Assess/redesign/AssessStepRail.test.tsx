// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AssessStepRail } from './AssessStepRail'
import { RENDER_ORDER_FULL, RENDER_ORDER_QUICK } from './assessFlowModel'
import type { AssessFlow } from './useAssessFlow'

// The report contract is swapped for a fixture with a different number of locked
// sections. The rail's fast-track note must follow it, not carry its own list.
vi.mock('./reportContract', () => ({
  FAST_REPORT_SECTIONS: ['Summary'],
  FULL_LOCKED_SECTIONS: ['Alpha view', 'Beta view', 'Gamma view'],
  FAST_LOCKED_COUNT: 3,
}))

const flow = {
  renderOrder: RENDER_ORDER_QUICK,
  total: RENDER_ORDER_QUICK.length,
  stepIdx: 0,
  activeKey: RENDER_ORDER_QUICK[0],
  maxIdx: 0,
  answeredCount: 0,
  attempted: false,
  isValid: () => false,
  canProceed: false,
  next: vi.fn(),
  back: vi.fn(),
  jumpTo: vi.fn(),
  renderIndexOf: (key: string) => RENDER_ORDER_QUICK.findIndex((k) => k === key),
} as unknown as AssessFlow

describe('AssessStepRail fast-track note', () => {
  it('names the locked sections and the extra-question count from the shared contracts', () => {
    render(<AssessStepRail flow={flow} mode="quick" onSwitchToFull={vi.fn()} />)
    const extra = RENDER_ORDER_FULL.length - RENDER_ORDER_QUICK.length
    const note = screen.getByText(/to unlock/i)
    expect(note).toHaveTextContent(`Answer the ${extra} extra full-track questions`)
    expect(note).toHaveTextContent('alpha view, beta view, and gamma view')
  })

  it('does not name sections the report keeps open on both tracks', () => {
    render(<AssessStepRail flow={flow} mode="quick" onSwitchToFull={vi.fn()} />)
    const note = screen.getByText(/to unlock/i)
    expect(note).not.toHaveTextContent(/algorithm map|dated roadmap|trending/i)
  })

  it('shows no fast-track note on the full track', () => {
    render(<AssessStepRail flow={flow} mode="comprehensive" onSwitchToFull={vi.fn()} />)
    expect(screen.queryByText(/to unlock/i)).not.toBeInTheDocument()
  })
})
