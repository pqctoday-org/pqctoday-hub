// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { CRQCScenarioPlanner, buildCrqcScenarioMarkdown } from './CRQCScenarioPlanner'
import { useModuleStore } from '@/store/useModuleStore'

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    migrationDeadlineYear: null,
    industry: '',
    country: '',
    hndlRiskWindow: null,
  }),
}))
vi.mock('@/hooks/useThreatsData', () => ({ useThreatsData: () => ({ data: [] }) }))

beforeEach(() => {
  useModuleStore.setState({
    artifacts: { ...useModuleStore.getState().artifacts, executiveDocuments: [] },
  })
})

describe('CRQC scenario compliance deadline ticks', () => {
  it('starts with every deadline ticked and counts only ticked deadlines before the CRQC year', () => {
    render(
      <MemoryRouter>
        <CRQCScenarioPlanner />
      </MemoryRouter>
    )
    const boxes = screen.getAllByRole('checkbox', { name: /^Applies to my systems:/ })
    expect(boxes.length).toBeGreaterThanOrEqual(8)
    for (const b of boxes) expect(b).toBeChecked()
    const tile = screen.getByText('Pre-CRQC Deadlines').closest('div')!.parentElement!
    const before = Number(tile.querySelector('.text-2xl')!.textContent)
    const cnsa = screen.getByRole('checkbox', {
      name: /Applies to my systems: CNSA 2\.0 .*National Security System acquisitions/,
    })
    fireEvent.click(cnsa)
    expect(cnsa).not.toBeChecked()
    expect(tile).toHaveTextContent(`ticked milestones (${boxes.length - 1} of ${boxes.length})`)
    expect(Number(tile.querySelector('.text-2xl')!.textContent)).toBe(before - 1)
  })

  it('exports only ticked deadlines and lists the unticked ones separately', () => {
    const framework = 'CNSA 2.0 — New National Security System acquisitions'
    const md = buildCrqcScenarioMarkdown({
      crqcYear: 2033,
      currentYear: 2026,
      urgencyLevel: 'medium',
      excludedDeadlines: [framework],
    })
    expect(md).not.toMatch(/\| CNSA 2\.0 - New National Security System acquisitions \| 2027 \|/)
    expect(md).toContain(
      '**Unticked as not applying to these systems:** CNSA 2.0 - New National Security System acquisitions (2027)'
    )
    expect(md).toMatch(/\| CNSA 2\.0 - National Security System cryptography \| 2031 \|/)
  })
})
