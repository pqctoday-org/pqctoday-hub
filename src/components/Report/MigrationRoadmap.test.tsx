// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MigrationRoadmap } from './MigrationRoadmap'
import { SectionExpandContext } from '@/contexts/sectionExpandContext'
import { selectedMilestoneIn } from './countryMilestone'
import { timelineData, transformToGanttData } from '@/data/timelineData'
import type { GanttCountryData } from '@/types/timeline'
import type { RecommendedAction } from '@/hooks/assessmentTypes'

const actions: RecommendedAction[] = [
  {
    priority: 1,
    action: 'Inventory cryptography',
    category: 'immediate',
    relatedModule: '/migrate',
  },
]

/** A country whose timeline has two deadline phases, so the choice matters. */
const GANTT = transformToGanttData(timelineData)
const countryWithDeadlines = GANTT.find(
  (g) => g.phases.filter((p) => p.phase === 'Deadline').length >= 2
) as GanttCountryData
const [first, later] = countryWithDeadlines.phases.filter((p) => p.phase === 'Deadline')
const country = countryWithDeadlines.country.countryName

const roadmap = (selected?: { id: string; authority: string; year?: number } | null) => (
  <MemoryRouter>
    <MigrationRoadmap actions={actions} countryName={country} selectedMilestone={selected} />
  </MemoryRouter>
)

describe('selectedMilestoneIn', () => {
  it('resolves the chosen phase by title and year, not the next milestone', () => {
    const chosen = selectedMilestoneIn(GANTT, country, {
      id: later.title,
      authority: '',
      year: later.endYear,
    })
    expect(chosen).toMatchObject({ title: later.title, year: later.endYear })
  })

  it('returns null when the country has no such phase', () => {
    expect(
      selectedMilestoneIn(GANTT, country, { id: 'No such milestone', authority: '', year: 1999 })
    ).toBeNull()
    expect(selectedMilestoneIn(GANTT, 'Nowhere', { id: first.title, authority: '' })).toBeNull()
  })
})

describe('MigrationRoadmap deadline', () => {
  it('plots the milestone the assessment named, labelled as selected', () => {
    render(roadmap({ id: later.title, authority: '', year: later.endYear }))
    // The badge renders twice: once on screen, once for print.
    for (const badge of screen.getAllByTitle(later.title)) {
      expect(badge.textContent).toContain(`${later.endYear}`)
      expect(badge.textContent).toMatch(/selected/)
    }
  })

  it('falls back to the next milestone when the saved one is not in the timeline', () => {
    render(roadmap({ id: 'Retired milestone', authority: '', year: 1999 }))
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/next (deadline|guidance target)/).length).toBeGreaterThan(0)
  })

  it('uses the next milestone when none was chosen', () => {
    render(roadmap(null))
    expect(screen.getAllByText(/next (deadline|guidance target)/).length).toBeGreaterThan(0)
  })

  it('"Expand all" / "Collapse" from the contents list open and close it', () => {
    const withTokens = (expandToken: number, collapseToken: number) => (
      <SectionExpandContext.Provider value={{ expandToken, collapseToken }}>
        <MemoryRouter>
          <MigrationRoadmap actions={actions} countryName={country} defaultOpen={false} />
        </MemoryRouter>
      </SectionExpandContext.Provider>
    )
    const { rerender } = render(withTokens(0, 0))
    const expanded = () =>
      screen.getByRole('button', { name: /Migration Roadmap/ }).getAttribute('aria-expanded')
    expect(expanded()).toBe('false')
    rerender(withTokens(1, 0))
    expect(expanded()).toBe('true')
    rerender(withTokens(1, 1))
    expect(expanded()).toBe('false')
  })
})
