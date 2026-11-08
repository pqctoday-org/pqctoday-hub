// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionInfoModal } from './SectionInfoModal'

// The live Finance configuration is .30/.20/.30/.20. These are Hub model
// assumptions, not externally prescribed weights.
describe('Finance weight explanation uses the scorer configuration', () => {
  afterEach(() => {
    vi.doUnmock('@/hooks/assessmentData')
    vi.resetModules()
  })
  it('renders the actual Finance weights in the reader modal', () => {
    render(<SectionInfoModal isOpen onClose={vi.fn()} sectionId="riskBreakdown" />)
    expect(screen.getByText(/Finance: QE=0.30, MC=0.20, RP=0.30, OR=0.20/)).toBeInTheDocument()
    expect(screen.queryByText(/MC=0.25, RP=0.25/)).not.toBeInTheDocument()
  })
  it('follows a changed canonical configuration rather than another copied example', async () => {
    vi.doMock('@/hooks/assessmentData', () => ({
      INDUSTRY_COMPOSITE_WEIGHTS: {
        'Finance & Banking': { qe: 0.11, mc: 0.22, rp: 0.33, or: 0.34 },
      },
    }))
    vi.resetModules()
    const { SECTION_INFO } = await import('./sectionInfoContent')
    expect(SECTION_INFO.riskBreakdown.scoringPrinciples).toContain(
      'Category weights are industry-specific in the Hub model (e.g., Finance: QE=0.11, MC=0.22, RP=0.33, OR=0.34).'
    )
  })
})
