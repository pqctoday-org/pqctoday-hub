// SPDX-License-Identifier: GPL-3.0-only
/**
 * Wave 4 (WP4.5) — /simulation must register as a tracked section so the
 * Explorer/Full Journey achievements can count a simulation visit; previously
 * it was the one major hub route absent from SECTION_MAP entirely.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AchievementSectionTracker } from './AchievementSectionTracker'
import { useAchievementStore } from '@/store/useAchievementStore'

describe('AchievementSectionTracker', () => {
  beforeEach(() => {
    useAchievementStore.setState({ sectionsVisited: [] })
  })

  it('records "simulation" when the route is /simulation', () => {
    render(
      <MemoryRouter initialEntries={['/simulation']}>
        <AchievementSectionTracker />
      </MemoryRouter>
    )
    expect(useAchievementStore.getState().sectionsVisited).toContain('simulation')
  })

  it('does not record a section for an untracked route', () => {
    render(
      <MemoryRouter initialEntries={['/some-unmapped-route']}>
        <AchievementSectionTracker />
      </MemoryRouter>
    )
    expect(useAchievementStore.getState().sectionsVisited).toEqual([])
  })
})
