// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Step13TimelinePressure } from './Step13TimelinePressure'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

const NEAR_YEAR = new Date().getFullYear() + 1

vi.mock('../../../data/timelineData', () => ({
  timelineData: [],
  transformToGanttData: () => [
    {
      country: { countryName: 'Testland' },
      phases: [
        {
          phase: 'Deadline',
          title: 'Near published deadline',
          startYear: NEAR_YEAR,
          endYear: NEAR_YEAR,
          description: 'A published milestone close to today.',
        },
      ],
    },
    { country: { countryName: 'Emptyland' }, phases: [] },
  ],
}))

describe('Step13TimelinePressure', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
  })

  it('keeps the internal-target option selectable when the country publishes milestones', () => {
    useAssessmentStore.getState().setCountry('Testland')
    render(<Step13TimelinePressure />)

    // The published milestone is offered...
    expect(screen.getByRole('radio', { name: /Near published deadline/i })).toBeInTheDocument()
    // ...and so is an organisation's own target, independent of any milestone.
    const internal = screen.getByRole('radio', { name: /Internal Deadline Set/i })
    expect(internal).toBeInTheDocument()
    fireEvent.click(internal)
    expect(useAssessmentStore.getState().timelinePressure).toBe('internal-deadline')
    expect(screen.getByRole('radio', { name: /Internal Deadline Set/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    // The published milestone is not marked as the chosen one.
    expect(screen.getByRole('radio', { name: /Near published deadline/i })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('records a published milestone and an internal target as different choices', () => {
    useAssessmentStore.getState().setCountry('Testland')
    render(<Step13TimelinePressure />)

    fireEvent.click(screen.getByRole('radio', { name: /Near published deadline/i }))
    const afterPublished = useAssessmentStore.getState().timelinePressure
    expect(afterPublished).toBe('within-1y')

    fireEvent.click(screen.getByRole('radio', { name: /Internal Deadline Set/i }))
    expect(useAssessmentStore.getState().timelinePressure).toBe('internal-deadline')
    expect(useAssessmentStore.getState().timelinePressure).not.toBe(afterPublished)
  })

  it('restores a saved internal target when the step is reopened', () => {
    useAssessmentStore.getState().setCountry('Testland')
    useAssessmentStore.getState().setTimelinePressure('internal-deadline')
    render(<Step13TimelinePressure />)
    expect(screen.getByRole('radio', { name: /Internal Deadline Set/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('still offers the internal-target option when the country has no published milestone', () => {
    useAssessmentStore.getState().setCountry('Emptyland')
    render(<Step13TimelinePressure />)
    expect(screen.getByRole('radio', { name: /Internal Deadline Set/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /No Specific Deadline/i })).toBeInTheDocument()
  })
})
