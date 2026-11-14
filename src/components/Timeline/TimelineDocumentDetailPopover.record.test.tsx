// SPDX-License-Identifier: AGPL-3.0-only
// The shared timeline record shows the event's binding force, mandate and review status, and
// its revision history is looked up by the event id.
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  TimelineDocumentDetailPopover,
  type TimelineDocumentRow,
} from './TimelineDocumentDetailPopover'

const captured = vi.hoisted(() => ({ props: [] as Array<Record<string, unknown>> }))

vi.mock('@/components/ui/RevisionDrilldownPanel', () => ({
  RevisionDrilldownPanel: (props: Record<string, unknown>) => {
    captured.props.push(props)
    return null
  },
}))

vi.mock('@/hooks/useRevisions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useRevisions')>()
  const revisions = [
    { domain: 'timeline', record_ids: ['EVT-EU-2026-001'], pr_number: 1 },
    { domain: 'timeline', record_ids: ['EVT-OTHER'], pr_number: 2 },
    { domain: 'compliance', record_ids: ['EVT-EU-2026-001'], pr_number: 3 },
  ]
  return {
    ...actual,
    useRevisions: () => ({ revisions, isLoading: false }),
  }
})

const row: TimelineDocumentRow = {
  countryName: 'European Union',
  org: 'ENISA',
  phase: 'Migration',
  type: 'Milestone',
  title: 'Migration milestone',
  eventId: 'EVT-EU-2026-001',
  startYear: 2026,
  endYear: 2026,
  description: 'A dated milestone.',
  confidenceScore: 80,
  bindingForce: 'binding',
  mandateType: 'HARD',
  reviewStatus: 'Reviewed',
}

describe('timeline record: binding force, status and revision history', () => {
  it('shows the binding force, mandate and review status', () => {
    render(
      <MemoryRouter>
        <TimelineDocumentDetailPopover isOpen row={row} onClose={vi.fn()} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Binding force')).toBeInTheDocument()
    expect(within(dialog).getByText('binding')).toBeInTheDocument()
    expect(within(dialog).getByText('HARD')).toBeInTheDocument()
    expect(within(dialog).getByText('Reviewed')).toBeInTheDocument()
  })

  it('opens the revision history for the event id', () => {
    captured.props.length = 0
    render(
      <MemoryRouter>
        <TimelineDocumentDetailPopover isOpen row={row} onClose={vi.fn()} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Revision history' }))
    const last = captured.props[captured.props.length - 1]
    expect(last).toBeDefined()
    expect(last.domain).toBe('timeline')
    expect(last.entityId).toBe('EVT-EU-2026-001')
    // Only this event's timeline revision, not another event's or a compliance row's.
    expect(last.revisions).toHaveLength(1)
    expect(last.revisions[0]).toMatchObject({ domain: 'timeline', pr_number: 1 })
  })

  it('offers no revision history for a row without an event id', () => {
    render(
      <MemoryRouter>
        <TimelineDocumentDetailPopover
          isOpen
          row={{ ...row, eventId: undefined }}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: 'Revision history' })).not.toBeInTheDocument()
  })
})
