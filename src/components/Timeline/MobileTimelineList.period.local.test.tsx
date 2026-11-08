// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileTimelineList } from './MobileTimelineList'
import type { GanttCountryData } from '@/types/timeline'

const fixture = (openEnded: boolean): GanttCountryData[] => [
  {
    country: { countryName: 'Canada', flagCode: 'CA', bodies: [] },
    phases: [
      {
        phase: 'Migration',
        type: 'Phase',
        title: 'Sample period',
        startYear: 2027,
        endYear: 2035,
        openEnded,
        description: 'Fictional display fixture',
        events: [],
      },
    ],
  },
]
describe('Mobile timeline source period fidelity', () => {
  it.each(['compact', 'swipe'] as const)('keeps finite 2035 finite in %s mode', (mode) => {
    render(<MobileTimelineList data={fixture(false)} defaultMode={mode} />)
    expect(screen.getByText(mode === 'compact' ? '2027–2035' : '2027 - 2035')).toBeInTheDocument()
    expect(screen.queryByText(/2035\+/)).not.toBeInTheDocument()
  })
  it.each(['compact', 'swipe'] as const)(
    'uses only the explicit open-ended flag in %s mode',
    (mode) => {
      render(<MobileTimelineList data={fixture(true)} defaultMode={mode} />)
      expect(screen.getByText('2027 onward')).toBeInTheDocument()
      expect(screen.queryByText(/2035\+/)).not.toBeInTheDocument()
    }
  )
})
