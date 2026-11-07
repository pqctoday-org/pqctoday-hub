// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FrameworkDeadlineList } from './FrameworkDeadlineList'
import type { TrackedFramework } from '../hooks/useBusinessMetrics'

const make = (overrides: Partial<TrackedFramework>): TrackedFramework =>
  ({
    id: 'fw-1',
    label: 'Sample Framework',
    deadline: '2020',
    requiresPQC: false,
    source: 'compliance',
    applicability: null,
    daysUntilDeadline: -30,
    urgency: 'critical',
    ...overrides,
  }) as TrackedFramework

const thisYear = new Date().getFullYear()

describe('FrameworkDeadlineList passed dates', () => {
  it('says "Date passed" in the neutral style when the deadline year is behind us', () => {
    render(
      <FrameworkDeadlineList
        frameworks={[make({ deadline: String(thisYear - 3), daysUntilDeadline: -30 })]}
      />
    )
    const badge = screen.getByText('Date passed')
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(badge).toHaveClass('text-muted-foreground')
    expect(badge).not.toHaveClass('text-status-error')
  })

  it.each([
    ['a phased range that starts this year', `${thisYear}-${thisYear + 4} (phased transition)`],
    ['an ongoing entry that names this year', `Ongoing (v${thisYear}-01 update)`],
    ['a single date in this year', `${thisYear} (Member States to provide)`],
  ])('does not say "Date passed" for %s', (_name, deadline) => {
    // days until 1 January of the first year in the text is already behind us
    render(<FrameworkDeadlineList frameworks={[make({ deadline, daysUntilDeadline: -30 })]} />)
    expect(screen.queryByText('Date passed')).not.toBeInTheDocument()
    expect(screen.getByText(deadline)).toBeInTheDocument()
  })

  it('keeps the urgency colour for a future date', () => {
    render(
      <FrameworkDeadlineList
        frameworks={[make({ daysUntilDeadline: 400, urgency: 'warning', deadline: '2030' })]}
      />
    )
    const badge = screen.getByText('1y 1m')
    expect(badge).toHaveClass('text-status-warning')
  })
})
