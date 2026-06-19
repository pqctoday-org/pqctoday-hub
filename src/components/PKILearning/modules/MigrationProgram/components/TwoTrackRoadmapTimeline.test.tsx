// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TwoTrackRoadmapTimeline } from './TwoTrackRoadmapTimeline'
import type { RoadmapMilestone } from './roadmapTracks'

const milestones: RoadmapMilestone[] = [
  { id: 'a', label: 'Crypto inventory complete', year: 2026, phaseId: 'p1', track: 'program' },
  {
    id: 'b',
    label: 'Pilot ML-KEM in TLS',
    year: 2027,
    phaseId: 'p5',
    track: 'A',
    dependsOn: ['a'],
  },
  {
    id: 'c',
    label: 'Migrate code-signing to ML-DSA',
    year: 2028,
    phaseId: 'p5',
    track: 'B',
    dependsOn: ['a'],
  },
]

describe('TwoTrackRoadmapTimeline (render smoke)', () => {
  it('renders the three lanes, milestones, deadlines and a critical-path readout', () => {
    render(
      <TwoTrackRoadmapTimeline
        milestones={milestones}
        deadlines={[{ label: 'CNSA 2.0', year: 2030, source: 'US' }]}
        yearRange={[2025, 2032]}
        onChange={vi.fn()}
      />
    )
    // lane labels also appear as <select> options, so target the lane headings
    expect(screen.getByRole('heading', { name: /Program — Foundations/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Track A — Confidentiality/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Track B — Integrity/ })).toBeInTheDocument()
    // appears both as a lane card and as a dependency-toggle in the add form
    expect(screen.getAllByText('Pilot ML-KEM in TLS').length).toBeGreaterThan(0)
    expect(screen.getByText(/Critical path/)).toBeInTheDocument()
    expect(screen.getByText(/CNSA 2.0/)).toBeInTheDocument()
  })

  it('adds a milestone through the form (and never renders raw years as NaN)', () => {
    const onChange = vi.fn()
    render(
      <TwoTrackRoadmapTimeline
        milestones={[]}
        deadlines={[]}
        yearRange={[2025, 2032]}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByLabelText('Milestone label'), {
      target: { value: 'New KEM milestone' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Add milestone/ }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as RoadmapMilestone[]
    expect(next).toHaveLength(1)
    expect(next[0].label).toBe('New KEM milestone')
    expect(Number.isFinite(next[0].year)).toBe(true)
  })
})
