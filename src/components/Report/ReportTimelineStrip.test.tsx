// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportTimelineStrip } from './ReportTimelineStrip'

// The strip's axis runs 2024 to 2035 inclusive. Each fixture phase probes one
// edge of that range independently, so a start edge and an end edge cannot
// hide each other.
vi.mock('../../data/timelineData', () => {
  const phase = (name: string, title: string, startYear: number, endYear: number) => ({
    phase: name,
    title,
    startYear,
    endYear,
    description: '',
    type: 'Milestone',
    events: [],
  })
  return {
    timelineData: [],
    phaseColors: {
      Deadline: { start: 'rgb(1, 2, 3)', end: 'rgb(1, 2, 3)', glow: 'rgb(1, 2, 3)' },
      Guidance: { start: 'rgb(4, 5, 6)', end: 'rgb(4, 5, 6)', glow: 'rgb(4, 5, 6)' },
    },
    transformToGanttData: () => [
      {
        country: { countryName: 'Testland' },
        phases: [
          phase('Guidance', 'Before the axis', 2022, 2023),
          phase('Guidance', 'Point at the first year', 2024, 2024),
          phase('Guidance', 'Mid-range span', 2027, 2030),
          phase('Deadline', 'Point at the last year', 2035, 2035),
          phase('Guidance', 'After the axis', 2036, 2040),
        ],
      },
    ],
  }
})

function barFor(title: string): HTMLElement | null {
  return document.querySelector(`[title="${title}"]`)
}

describe('ReportTimelineStrip', () => {
  it('draws a point milestone dated at the last year of the axis (2035)', () => {
    render(<ReportTimelineStrip countryName="Testland" />)
    const bar = barFor('Deadline: 2035')
    expect(bar).not.toBeNull()
    // The bar stays inside the track rather than spilling past the right edge.
    const left = parseFloat(bar!.style.left)
    const width = parseFloat(bar!.style.width)
    expect(width).toBeGreaterThan(0)
    expect(left + width).toBeLessThanOrEqual(100.0001)
  })

  it('draws a point milestone dated at the first year of the axis (2024)', () => {
    render(<ReportTimelineStrip countryName="Testland" />)
    const bar = barFor('Guidance: 2024')
    expect(bar).not.toBeNull()
    expect(parseFloat(bar!.style.left)).toBe(0)
  })

  it('still draws a span inside the range and shows its years', () => {
    render(<ReportTimelineStrip countryName="Testland" />)
    expect(barFor('Guidance: 2027–2030')).not.toBeNull()
    expect(screen.getByText('2027–2030')).toBeInTheDocument()
  })

  it('shows a single year, not a repeated range, for a point milestone', () => {
    render(<ReportTimelineStrip countryName="Testland" />)
    // One 2035 is the axis tick; the other is the milestone's own label.
    expect(screen.getAllByText('2035').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('2035–2035')).not.toBeInTheDocument()
  })

  it('leaves out milestones that lie entirely outside the axis', () => {
    render(<ReportTimelineStrip countryName="Testland" />)
    expect(barFor('Guidance: 2022–2023')).toBeNull()
    expect(barFor('Guidance: 2036–2040')).toBeNull()
  })

  it('says so when the country has no timeline data', () => {
    render(<ReportTimelineStrip countryName="Nowhere" />)
    expect(
      screen.getByText(/No country selected or no timeline data available/i)
    ).toBeInTheDocument()
  })
})
