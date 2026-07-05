// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BoardBriefSection } from './BoardBriefSection'
import type { AssessmentResult } from '../../hooks/assessmentTypes'

const result: AssessmentResult = {
  riskScore: 55,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: 'n',
  generatedAt: '2026-01-01T00:00:00.000Z',
}

const baseProps = {
  result,
  industry: 'Technology',
  country: 'United States',
  roiSummary: null,
  generatedAt: result.generatedAt,
  visible: true,
}

describe('BoardBriefSection — program ownership', () => {
  it('shows no ownership block when ownership is absent', () => {
    render(<BoardBriefSection {...baseProps} />)
    expect(screen.queryByText('Program Owner')).not.toBeInTheDocument()
  })

  it('shows no ownership block when all fields are empty', () => {
    render(
      <BoardBriefSection
        {...baseProps}
        ownership={{ programOwner: '', budgetOwner: '', accountableExecutive: '' }}
      />
    )
    expect(screen.queryByText('Program Owner')).not.toBeInTheDocument()
  })

  it('shows only the filled-in ownership fields', () => {
    render(
      <BoardBriefSection
        {...baseProps}
        ownership={{
          programOwner: 'Jane Doe, CISO',
          budgetOwner: '',
          accountableExecutive: 'Alex Lee, CEO',
        }}
      />
    )
    expect(screen.getByText('Program Owner')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe, CISO')).toBeInTheDocument()
    expect(screen.getByText('Accountable Executive')).toBeInTheDocument()
    expect(screen.getByText('Alex Lee, CEO')).toBeInTheDocument()
    expect(screen.queryByText('Budget Owner')).not.toBeInTheDocument()
  })

  it('renders nothing at all when not visible', () => {
    const { container } = render(<BoardBriefSection {...baseProps} visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
