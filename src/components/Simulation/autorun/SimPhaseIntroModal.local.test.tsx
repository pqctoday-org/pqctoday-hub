// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimPhaseIntroModal } from './SimPhaseIntroModal'
import { EXEC_TOUR_STAGES } from './execTourConfig'
import { FRAMEWORK_PHASE_INTROS } from '@/data/frameworkPhaseIntros.generated'

const callbacks = { onBegin: vi.fn(), onDismiss: vi.fn(), onStop: vi.fn() }

describe('chapter learning context', () => {
  it('leads with the executive decision and keeps technical gate context expandable', async () => {
    const summary = EXEC_TOUR_STAGES.find((stage) => stage.phase === 'p2')!.executiveSummary!
    render(<SimPhaseIntroModal phase="p2" executiveSummary={summary} {...callbacks} />)
    expect(screen.getByText(summary)).toBeVisible()
    expect(screen.queryByText(/You.ll work through/)).toBeNull()
    const toggle = screen.getByText('Framework context and exit gate')
    expect(screen.getByText(FRAMEWORK_PHASE_INTROS.p2.summary)).not.toBeVisible()
    await userEvent.click(toggle)
    expect(screen.getByText(FRAMEWORK_PHASE_INTROS.p2.summary)).toBeVisible()
  })

  it('retains the activity guide for the full migration journey', () => {
    render(<SimPhaseIntroModal phase="p2" {...callbacks} />)
    expect(screen.getByText(/You.ll work through/)).toBeVisible()
    expect(screen.getByText('Select CBOM Format and Tooling')).toBeVisible()
  })
})
