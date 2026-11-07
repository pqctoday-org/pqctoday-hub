// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Step13TimelinePressure } from './Step13TimelinePressure'
import { useAssessmentFormStore } from '../../../store/useAssessmentFormStore'
import { timelineData, transformToGanttData } from '../../../data/timelineData'

const CURRENT_YEAR = new Date().getFullYear()
const form = () => useAssessmentFormStore.getState()

/** A country that lists a published deadline more than three years away, and one within three. */
function countryWithDeadlines() {
  for (const entry of transformToGanttData(timelineData)) {
    const deadlines = entry.phases.filter((p) => p.phase === 'Deadline')
    const distant = deadlines.find((p) => p.endYear > CURRENT_YEAR + 3)
    if (distant) return { country: entry.country.countryName, deadlines, distant }
  }
  return null
}

beforeEach(() => {
  localStorage.clear()
  form().reset()
})

describe('timeline step keeps the milestone that was picked', () => {
  const found = countryWithDeadlines()

  it('has a country with a distant published deadline to test against', () => {
    expect(found).not.toBeNull()
  })

  it('stores the milestone, authority and year while the summary value stays "internal-deadline"', () => {
    const { country, distant } = found!
    form().setCountry(country)
    render(<Step13TimelinePressure />)
    fireEvent.click(
      screen.getByRole('radio', {
        name: (accessibleName) => accessibleName.includes(distant.title),
      })
    )
    expect(form().timelinePressure).toBe('internal-deadline')
    expect(form().timelineMilestone).toEqual({
      id: distant.title,
      authority: distant.events[0].orgName,
      year: distant.endYear,
    })
  })

  it('marks only the picked card as chosen when the summary value is shared by several', () => {
    const { country, deadlines, distant } = found!
    const sameSummary = deadlines.filter((p) => p.endYear > CURRENT_YEAR + 3)
    form().setCountry(country)
    render(<Step13TimelinePressure />)
    fireEvent.click(
      screen.getByRole('radio', {
        name: (accessibleName) => accessibleName.includes(distant.title),
      })
    )
    const chosen = screen
      .getAllByRole('radio')
      .filter((el) => el.getAttribute('aria-checked') === 'true')
    expect(chosen).toHaveLength(1)
    expect(chosen[0]).toHaveTextContent(distant.title)
    expect(sameSummary.length).toBeGreaterThan(0)
  })

  it('drops the milestone when the visitor then picks "no deadline"', () => {
    const { country, distant } = found!
    form().setCountry(country)
    render(<Step13TimelinePressure />)
    fireEvent.click(
      screen.getByRole('radio', {
        name: (accessibleName) => accessibleName.includes(distant.title),
      })
    )
    fireEvent.click(screen.getByRole('radio', { name: /No Specific Deadline/ }))
    expect(form().timelinePressure).toBe('no-deadline')
    expect(form().timelineMilestone).toBeNull()
  })

  it('still marks every card with the same summary value for an answer saved before milestones were kept', () => {
    const { country, deadlines } = found!
    form().setCountry(country)
    form().setTimelinePressure('internal-deadline')
    render(<Step13TimelinePressure />)
    const distantCount = deadlines.filter((p) => p.endYear > CURRENT_YEAR + 3).length
    const chosen = screen
      .getAllByRole('radio')
      .filter((el) => el.getAttribute('aria-checked') === 'true')
    expect(chosen).toHaveLength(distantCount)
  })
})
