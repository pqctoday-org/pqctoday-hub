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
const phasedRow = (label: string, years: number[]) =>
  ({
    item: {
      id: label,
      label,
      deadlineYear: years[0],
      deadlineDates: years.map((year) => ({ year, label: 'phase' })),
    },
  }) as ApplicabilityResult<ComplianceFramework>

describe('executive reference milestones', () => {
  it('does not let historic mandatory records hide future recognized milestones', () => {
    expect(upcomingReferenceMilestones([row(2024)], [row(2030)], 2026).map((x) => x.year)).toEqual([
      2030,
    ])
  })
  it('uses declared years rather than deriving planning deadlines from prose', () => {
    expect(upcomingReferenceMilestones([row(2030)], [], 2026).map((x) => x.year)).toEqual([2030])
    expect(upcomingReferenceMilestones([row(2024)], [], 2026)).toEqual([])
  })
  it('keeps a phased framework after its first year has passed', () => {
    // deadlineYear is the earliest declared year (2025); the next declared year is still ahead.
    const phased = phasedRow('Phased framework', [2025, 2033])
    expect(upcomingReferenceMilestones([phased], [], 2026).map((x) => x.year)).toEqual([2033])
    expect(upcomingReferenceMilestones([phased], [], 2025).map((x) => x.year)).toEqual([2025])
    expect(upcomingReferenceMilestones([phasedRow('Done', [2020, 2024])], [], 2026)).toEqual([])
  })
  it('lets a long source label wrap instead of overflowing a narrow row', () => {
    const label = 'A very long framework name '.repeat(5).trim()
    render(<RegulatoryClock mandatoryFrameworks={[row(2099, label)]} onSelectFramework={vi.fn()} />)
    const button = screen.getByRole('button', { name: `Inspect source for ${label}` })
    expect(button.className).toMatch(/whitespace-normal/)
    expect(button.className).not.toMatch(/whitespace-nowrap/)
  })
  it('opens the selected source record without inventing a calendar day', () => {
    const onSelect = vi.fn()
    render(<RegulatoryClock mandatoryFrameworks={[row(2099)]} onSelectFramework={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect source for Record 2099' }))
    expect(onSelect).toHaveBeenCalledWith(row(2099).item)
    expect(screen.queryByText(/30 Dec|days|Transition plan due/)).not.toBeInTheDocument()
  })
})
