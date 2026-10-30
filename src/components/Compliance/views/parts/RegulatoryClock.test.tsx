// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegulatoryClock } from './RegulatoryClock'
import { upcomingReferenceMilestones } from './regulatoryMilestones'
import type { ComplianceFramework } from '@/data/complianceData'
import type { ApplicabilityResult } from '@/utils/applicabilityEngine'
const row = (year: number, label = `Record ${year}`) =>
  ({
    item: { id: label, label, deadlineYear: year, notes: 'Planning in 2026; cutover by 2030' },
  }) as ApplicabilityResult<ComplianceFramework>

describe('executive reference milestones', () => {
  it('does not let historic mandatory records hide future recognized milestones', () => {
    expect(
      upcomingReferenceMilestones([row(2024)], [row(2030)], 2026).map((x) => x.deadlineYear)
    ).toEqual([2030])
  })
  it('uses declared years rather than deriving planning deadlines from prose', () => {
    expect(upcomingReferenceMilestones([row(2030)], [], 2026).map((x) => x.deadlineYear)).toEqual([
      2030,
    ])
    expect(upcomingReferenceMilestones([row(2024)], [], 2026)).toEqual([])
  })
  it('opens the selected source record without inventing a calendar day', () => {
    const onSelect = vi.fn()
    render(<RegulatoryClock mandatoryFrameworks={[row(2099)]} onSelectFramework={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect source for Record 2099' }))
    expect(onSelect).toHaveBeenCalledWith(row(2099).item)
    expect(screen.queryByText(/30 Dec|days|Transition plan due/)).not.toBeInTheDocument()
  })
})
