// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BoardBriefSection } from './BoardBriefSection'
import { EXAMPLE_REPORT_RESULT } from '@/data/exampleReport'

const props = {
  result: EXAMPLE_REPORT_RESULT,
  industry: 'Fictional sender',
  country: 'United States',
  generatedAt: EXAMPLE_REPORT_RESULT.generatedAt,
  visible: true,
  ownership: {
    programOwner: 'RECIPIENT-OWNER',
    budgetOwner: 'RECIPIENT-BUDGET',
    accountableExecutive: 'RECIPIENT-EXEC',
  },
  roiSummary: {
    migrationCost: 987654321,
    avoidedBreachCost: 987654321,
    complianceSavings: 987654321,
    netRoiPercent: 987654321,
    paybackMonths: 987654321,
    totalCost: 987654321,
    costOfInaction: 987654321,
    npv: 987654321,
  },
}
describe('shared executive print boundary', () => {
  it('omits explicitly supplied recipient ownership and ROI even if caller passes them', () => {
    const { container } = render(<BoardBriefSection {...props} shared />)
    expect(container.textContent).not.toContain('RECIPIENT-')
    expect(container.textContent).not.toContain('987,654,321')
    expect(
      screen.getByText(/programme ownership and interactive ROI scenarios are not included/)
    ).toBeTruthy()
    expect(container.textContent).toContain('Fictional sender')
  })
  it('keeps ownership in the recipient own brief', () => {
    render(<BoardBriefSection {...props} />)
    expect(screen.getByText('RECIPIENT-OWNER')).toBeTruthy()
    expect(screen.getByText('RECIPIENT-BUDGET')).toBeTruthy()
  })
})
