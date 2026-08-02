// SPDX-License-Identifier: GPL-3.0-only
//
// Grade-A remediation, Phase 2 correctness fix (2026-08-02): table view never
// received onSelectFramework, so clicking a row in table view did nothing —
// the traceability drawer (ComplianceDetailDrawer) was unreachable from that
// view mode entirely. Card view already wired onSelectFramework into
// FrameworkCard's onSelectDetail; this asserts table view now wires the SAME
// callback into FrameworkTable/FrameworkTableRow, and that switching view
// mode doesn't change which framework the callback reports.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceLandscape } from './ComplianceLandscape'
import type { ComplianceFramework } from '@/data/complianceData'

function framework(overrides: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'test-framework',
    label: 'Test Framework',
    description: 'A framework used for testing.',
    industries: [],
    countries: [],
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

const FRAMEWORKS: ComplianceFramework[] = [
  framework({ id: 'fw-a', label: 'Framework Alpha' }),
  framework({ id: 'fw-b', label: 'Framework Beta' }),
]

describe('ComplianceLandscape — table view row selection', () => {
  it('calls onSelectFramework when a table row is clicked, with the clicked framework', () => {
    const onSelectFramework = vi.fn()
    render(
      <MemoryRouter>
        <ComplianceLandscape
          frameworks={FRAMEWORKS}
          viewMode="table"
          onSelectFramework={onSelectFramework}
        />
      </MemoryRouter>
    )

    const row = screen.getByText('Framework Alpha').closest('tr')
    expect(row).not.toBeNull()
    fireEvent.click(row!)

    expect(onSelectFramework).toHaveBeenCalledTimes(1)
    expect(onSelectFramework).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fw-a', label: 'Framework Alpha' })
    )
  })

  it('is keyboard-activatable (Enter) — matches the card grid keyboard affordance', () => {
    const onSelectFramework = vi.fn()
    render(
      <MemoryRouter>
        <ComplianceLandscape
          frameworks={FRAMEWORKS}
          viewMode="table"
          onSelectFramework={onSelectFramework}
        />
      </MemoryRouter>
    )

    const row = screen.getByText('Framework Beta').closest('tr')!
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onSelectFramework).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fw-b', label: 'Framework Beta' })
    )
  })

  it('reports the SAME framework object whether selected from card view or table view', () => {
    const onSelectFromCard = vi.fn()
    const { unmount } = render(
      <MemoryRouter>
        <ComplianceLandscape
          frameworks={FRAMEWORKS}
          viewMode="cards"
          onSelectFramework={onSelectFromCard}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /View details for Framework Alpha/i }))
    expect(onSelectFromCard).toHaveBeenCalledWith(expect.objectContaining({ id: 'fw-a' }))
    unmount()

    const onSelectFromTable = vi.fn()
    render(
      <MemoryRouter>
        <ComplianceLandscape
          frameworks={FRAMEWORKS}
          viewMode="table"
          onSelectFramework={onSelectFromTable}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Framework Alpha').closest('tr')!)
    expect(onSelectFromTable).toHaveBeenCalledWith(expect.objectContaining({ id: 'fw-a' }))

    // Both view modes hand the callback the exact same framework record.
    expect(onSelectFromCard.mock.calls[0][0]).toEqual(onSelectFromTable.mock.calls[0][0])
  })

  it('does not attach a click handler to rows when onSelectFramework is not provided', () => {
    render(
      <MemoryRouter>
        <ComplianceLandscape frameworks={FRAMEWORKS} viewMode="table" />
      </MemoryRouter>
    )
    const row = screen.getByText('Framework Alpha').closest('tr')!
    expect(row).not.toHaveAttribute('aria-label')
    expect(row).not.toHaveAttribute('tabindex')
  })
})
