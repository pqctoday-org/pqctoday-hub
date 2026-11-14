// SPDX-License-Identifier: AGPL-3.0-only
// The timeline event popover (used on the desktop Gantt and in the mobile list) shows the
// event's binding force and review status, and offers its revision history by event id.
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { TimelineEvent, TimelinePhase } from '../../types/timeline'
import { GanttDetailPopover } from './GanttDetailPopover'

const captured = vi.hoisted(() => ({ props: [] as Array<Record<string, unknown>> }))

vi.mock('@/components/ui/RevisionDrilldownPanel', () => ({
  RevisionDrilldownPanel: (props: Record<string, unknown>) => {
    captured.props.push(props)
    return null
  },
}))

vi.mock('@/hooks/useRevisions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useRevisions')>()
  const revisions = [{ domain: 'timeline', record_ids: ['EVT-EU-2026-001'], pr_number: 1 }]
  return { ...actual, useRevisions: () => ({ revisions, isLoading: false }) }
})

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))

const event = {
  startYear: 2026,
  endYear: 2026,
  phase: 'Discovery',
  type: 'Phase',
  title: 'Migration milestone',
  description: 'A dated milestone.',
  orgName: 'ENISA',
  orgFullName: 'ENISA',
  countryName: 'European Union',
  flagCode: 'eu',
  entityType: 'government',
  eventId: 'EVT-EU-2026-001',
  bindingForce: 'binding',
  reviewStatus: 'Reviewed',
} as unknown as TimelineEvent

const phase: TimelinePhase = {
  startYear: 2026,
  endYear: 2026,
  phase: 'Discovery',
  type: 'Phase',
  title: 'Migration milestone',
  description: 'A dated milestone.',
  events: [event],
} as unknown as TimelinePhase

describe('timeline event popover: binding force, status and revision history', () => {
  it('shows the binding force and review status of the event', () => {
    render(
      <MemoryRouter>
        <GanttDetailPopover isOpen onClose={vi.fn()} phase={phase} focusEvent={event} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    // Shown once, by the shared record facts.
    expect(within(dialog).getAllByTestId('timeline-record-facts')).toHaveLength(1)
    expect(within(dialog).getByText('Binding')).toBeInTheDocument()
    expect(within(dialog).getByText(/^Status:/)).toHaveTextContent('Status: Reviewed')
  })

  it('opens the revision history for the event id', () => {
    captured.props.length = 0
    render(
      <MemoryRouter>
        <GanttDetailPopover isOpen onClose={vi.fn()} phase={phase} focusEvent={event} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTitle(/^Reviewed by/))
    const last = captured.props[captured.props.length - 1]
    expect(last).toBeDefined()
    expect(last.domain).toBe('timeline')
    expect(last.entityId).toBe('EVT-EU-2026-001')
  })
})
