// SPDX-License-Identifier: AGPL-3.0-only
/** The drawer names its date section by what the record states, not by a deadline it may not have. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceDetailDrawer } from './ComplianceDetailDrawer'
import type { ComplianceFramework } from '@/data/complianceData'

vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

function framework(overrides: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'dates-test',
    label: 'Dates Test Framework',
    description: '',
    industries: ['Technology'],
    countries: ['United States'],
    requiresPQC: false,
    pqcRequirement: 'guidance',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: '',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

function renderDrawer(fw: ComplianceFramework) {
  return render(
    <MemoryRouter>
      <ComplianceDetailDrawer framework={fw} pillar="comply" onClose={() => {}} />
    </MemoryRouter>
  )
}

describe('ComplianceDetailDrawer date section heading', () => {
  it('titles an undated record "Dates this record states" and shows the no-date step', () => {
    renderDrawer(framework({ deadlineDates: [] }))
    expect(screen.getByRole('heading', { name: 'Dates this record states' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Deadline phases' })).toBeNull()
    expect(screen.getByText('No structured date recorded')).toBeInTheDocument()
  })

  it('keeps "Deadline phases" for a record with stated dates', () => {
    renderDrawer(framework({ deadlineDates: [{ year: 2031, label: 'Migration complete' }] }))
    expect(screen.getByRole('heading', { name: 'Deadline phases' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dates this record states' })).toBeNull()
    expect(screen.getByText('Migration complete')).toBeInTheDocument()
  })
})
