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

describe('FrameworkDeadlineList passed dates', () => {
  it('says "Date passed" in the neutral style when the date is behind us', () => {
    render(<FrameworkDeadlineList frameworks={[make({ daysUntilDeadline: -30 })]} />)
    const badge = screen.getByText('Date passed')
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(badge).toHaveClass('text-muted-foreground')
    expect(badge).not.toHaveClass('text-status-error')
  })

  it('treats a deadline that falls today as a passed date', () => {
    render(<FrameworkDeadlineList frameworks={[make({ daysUntilDeadline: 0 })]} />)
    expect(screen.getByText('Date passed')).toBeInTheDocument()
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
