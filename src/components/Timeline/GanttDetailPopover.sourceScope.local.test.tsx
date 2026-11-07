// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GanttDetailPopover } from './GanttDetailPopover'
import type { TimelineEvent, TimelinePhase } from '@/types/timeline'
const first: TimelineEvent = {
  title: 'First sample event',
  description: 'First source description',
  startYear: 2016,
  endYear: 2016,
  phase: 'Guidance',
  type: 'Milestone',
  countryName: 'Australia',
  flagCode: 'AU',
  orgName: 'Sample body',
  orgFullName: 'Sample body',
  entityType: 'government',
  eventId: 'sample-first',
  sourceUrl: 'https://example.test/first',
  sourceDate: '2016-01-01',
}
const later: TimelineEvent = {
  ...first,
  title: 'Later sample event',
  description: 'Later source description',
  eventId: 'sample-later',
  startYear: 2024,
  endYear: 2024,
  sourceUrl: 'https://example.test/later',
  sourceDate: '2024-01-01',
  status: 'Updated',
}
const phase: TimelinePhase = {
  title: 'Aggregate sample summary',
  description: 'Aggregate description',
  startYear: 2016,
  endYear: 2035,
  openEnded: true,
  phase: 'Guidance',
  type: 'Phase',
  status: 'New',
  events: [first, later],
}
describe('Gantt details preserve source-event scope', () => {
  it('shows the first source event own period, description, link and status instead of aggregate fields', () => {
    render(<GanttDetailPopover isOpen phase={phase} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: first.title })).toBeInTheDocument()
    expect(screen.getAllByText('2016', { exact: true })).toHaveLength(2)
    expect(screen.getByText(first.description)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', first.sourceUrl)
    expect(screen.queryByText('Not stated by source')).not.toBeInTheDocument()
    expect(screen.queryByText('New', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('2035', { exact: true })).not.toBeInTheDocument()
  })
  it('keeps a focused later event own fields and status', () => {
    render(<GanttDetailPopover isOpen phase={phase} focusEvent={later} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: later.title })).toBeInTheDocument()
    expect(screen.getAllByText('2024', { exact: true })).toHaveLength(2)
    expect(screen.getByText(later.description)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', later.sourceUrl)
    expect(screen.getByText('Updated', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('New', { exact: true })).not.toBeInTheDocument()
  })
  it('uses aggregate dates and description only when there is no source event', () => {
    render(
      <GanttDetailPopover
        isOpen
        phase={{ ...phase, events: [], openEnded: false }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { name: phase.title })).toBeInTheDocument()
    expect(screen.getByText(phase.description)).toBeInTheDocument()
    expect(screen.getByText('2016', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('2035', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('New', { exact: true })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
  })
})
