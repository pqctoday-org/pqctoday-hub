// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ListChecks } from 'lucide-react'
import { ActionItemsSection } from './ActionItemsSection'
import type { ActionItem, BusinessMetrics } from '../hooks/useBusinessMetrics'
import '@testing-library/jest-dom'

function item(title: string, priority: number): ActionItem {
  return {
    priority,
    icon: ListChecks,
    title,
    description: `${title} description`,
    action: { label: 'Open', path: '/assess' },
  }
}

describe('ActionItemsSection row border by priority', () => {
  it('styles whole-number tiers and rounds nudged fractional priorities into 1..3', () => {
    const metrics = {
      actionItems: [
        item('Base urgent', 1),
        item('Base important', 2),
        item('Base nice-to-have', 3),
        // Profile nudges leave fractions (see useBusinessMetrics adjustPriority).
        item('Nudged to 0.7', 0.7),
        item('Nudged to 1.6', 1.6),
        item('Nudged to 2.5', 2.5),
        item('Below range', 0.2),
      ],
    } as unknown as BusinessMetrics

    render(
      <MemoryRouter>
        <ActionItemsSection metrics={metrics} />
      </MemoryRouter>
    )

    const borderOf = (title: string) => screen.getByText(title).closest('.border-l-2')
    expect(borderOf('Base urgent')).toHaveClass('border-l-status-error')
    expect(borderOf('Base important')).toHaveClass('border-l-status-warning')
    expect(borderOf('Base nice-to-have')).toHaveClass('border-l-border')
    expect(borderOf('Nudged to 0.7')).toHaveClass('border-l-status-error')
    expect(borderOf('Nudged to 1.6')).toHaveClass('border-l-status-warning')
    expect(borderOf('Nudged to 2.5')).toHaveClass('border-l-border')
    expect(borderOf('Below range')).toHaveClass('border-l-status-error')
  })
})
