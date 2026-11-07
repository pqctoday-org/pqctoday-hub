// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A deadline date that has passed is shown as a date that has passed, not as
 * "Overdue": the page does not know whether the rule binds the reader or
 * whether anything is still outstanding. The PQC count tile likewise says it
 * includes records that are only expected, not yet codified.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceLandscape, DeadlineTimeline } from './ComplianceLandscape'
import { complianceFrameworks } from '@/data/complianceData'
import { deadlineUrgency } from '@/utils/deadlineUrgency'

const renderLandscape = () =>
  render(
    <MemoryRouter>
      <ComplianceLandscape />
    </MemoryRouter>
  )

describe('ComplianceLandscape past dates', () => {
  it('labels the timeline legend "Date passed", not "Overdue"', () => {
    render(<DeadlineTimeline frameworks={[]} />)
    expect(screen.getByText('Date passed')).toBeInTheDocument()
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })

  it('never writes "Overdue" next to a record whose year has passed', () => {
    const passed = complianceFrameworks.filter((f) => deadlineUrgency(f.deadline) === 'overdue')
    expect(passed.length).toBeGreaterThan(0)
    const { container } = renderLandscape()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/overdue/i)
    expect(text).toMatch(/— date passed/)
  })
})

describe('ComplianceLandscape PQC count tile', () => {
  it('says it includes expected records instead of calling them mandates', () => {
    expect(complianceFrameworks.some((f) => f.pqcRequirement === 'expected')).toBe(true)
    renderLandscape()
    const tile = screen.getByRole('button', { name: /Requires or expects PQC/ })
    expect(tile).toHaveAttribute('title', expect.stringMatching(/expected, not yet codified/))
    expect(tile.textContent).not.toMatch(/Mandate PQC/)
    expect(screen.queryByText('Mandate PQC')).not.toBeInTheDocument()
  })
})
