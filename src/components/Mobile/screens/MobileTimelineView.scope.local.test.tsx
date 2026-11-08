// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileTimelineView } from './MobileTimelineView'
import { usePersonaStore } from '@/store/usePersonaStore'
vi.mock('@/data/timelineData', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/data/timelineData')>()
  return {
    ...original,
    transformToGanttData: () =>
      ['United States', 'Canada'].map((countryName, i) => ({
        country: { countryName, flagCode: i ? 'CA' : 'US', bodies: [] },
        phases: [
          {
            phase: 'Migration',
            type: 'Milestone',
            title: i ? 'Canada sample milestone' : 'US sample milestone',
            startYear: i ? 2026 : 2027,
            endYear: 2035,
            description: 'Fictional scope fixture',
            events: [],
          },
        ],
      })),
  }
})
const view = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/timeline?${query}`]}>
      <MobileTimelineView />
    </MemoryRouter>
  )
describe('Mobile timeline teaching highlights follow visible scope', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01'))
    usePersonaStore.getState().setRegion('americas')
    localStorage.removeItem('timeline-mobile-view-mode')
  })
  afterEach(() => {
    vi.useRealTimers()
    act(() => usePersonaStore.getState().setRegion('global'))
  })
  it('uses the explicitly displayed Canada rather than the representative US country', () => {
    view('country=Canada')
    expect(
      screen.getByRole('heading', { name: 'What is recorded for Canada?' })
    ).toBeInTheDocument()
    expect(screen.getByText('Canada sample milestone (2026).')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'What is recorded for United States?' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('US sample milestone (2027).')).not.toBeInTheDocument()
  })
  it('does not retain either highlight when search excludes that country', () => {
    view('country=Canada&q=no-such-country')
    expect(screen.getByText(/No countries match/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /What is recorded for/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Next recorded milestone')).not.toBeInTheDocument()
  })
  it('does not show representative-country highlights outside the explicit visible region', () => {
    view('region=eu')
    expect(screen.queryByRole('heading', { name: /What is recorded for/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Next recorded milestone')).not.toBeInTheDocument()
  })
})
