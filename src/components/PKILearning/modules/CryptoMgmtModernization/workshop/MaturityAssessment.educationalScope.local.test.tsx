// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MaturityAssessment } from './MaturityAssessment'
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  Radar: () => null,
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))
vi.mock('@/components/Compliance/MaturityEvidenceGrid', () => ({
  MaturityEvidenceGrid: () => null,
}))
describe('sample subjective ratings', () => {
  it('identifies defaults and cross-framework labels without established maturity', () => {
    render(<MaturityAssessment />)
    expect(
      screen.getByText(/Defaults are example ratings, not assessed maturity/)
    ).toBeInTheDocument()
    expect(screen.getByText('Average self-rating')).toBeInTheDocument()
    expect(
      screen.getByText('Existing illustrative cross-framework labels — not equivalences')
    ).toBeInTheDocument()
  })
  it('preserves the average callback but does not claim an achieved tier from maximum clicks', () => {
    const onOutput = vi.fn()
    render(<MaturityAssessment onOutput={onOutput} />)
    for (const button of screen.getAllByRole('button', { name: '4' })) fireEvent.click(button)
    expect(screen.getByText('4.0 / 4.0')).toBeInTheDocument()
    expect(onOutput).toHaveBeenLastCalledWith(expect.objectContaining({ averageScore: 4 }))
    expect(screen.getByText(/Highest Hub self-rating band selected/)).toBeInTheDocument()
    expect(screen.queryByText(/Your posture has reached/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/ratings do not show that any requirement has been met/)
    ).toBeInTheDocument()
  })
})
