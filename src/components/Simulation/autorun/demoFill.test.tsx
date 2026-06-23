// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Force the auto-run flag on so the tools take their demo-fill path at mount.
vi.mock('@/components/Simulation/autorun/autoRunFill', () => ({
  isAutoRunFillActive: () => true,
  setAutoRunFill: () => {},
}))

import { ContractClauseGenerator } from '@/components/PKILearning/modules/VendorRisk/components/ContractClauseGenerator'
import { AcceleratedExecutionProfile } from '@/components/BusinessCenter/tools/AcceleratedExecutionProfile'

describe('auto-run demo fill (genuinely-blank tools)', () => {
  it('Contract Clause fills its blank fields during a run', () => {
    render(<ContractClauseGenerator />)
    // penalty textarea + audit access — the two free-text fields that were blank.
    expect(screen.getByDisplayValue(/material breach/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/under NDA/i)).toBeTruthy()
  })

  it('Accelerated Execution fills its blank fields during a run', () => {
    render(<AcceleratedExecutionProfile />)
    expect(screen.getByDisplayValue(/Collapse Phases 4/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/Executive Sponsor \(CISO\)/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/Emergency budget uplift/i)).toBeTruthy()
  })
})
