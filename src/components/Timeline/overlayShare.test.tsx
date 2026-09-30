// SPDX-License-Identifier: GPL-3.0-only
// Share + Close inside the Timeline pop-ups (deep-link PR 4).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { TimelineEvent, TimelinePhase } from '../../types/timeline'
import { GanttDetailPopover } from './GanttDetailPopover'
import { TimelineDocumentDetailPopover } from './TimelineDocumentDetailPopover'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))

function event(partial: Partial<TimelineEvent>): TimelineEvent {
  return {
    startYear: 2024,
    endYear: 2026,
    phase: 'Discovery',
    type: 'Phase',
    title: 'First event',
    description: 'd',
    orgName: 'Agency',
    orgFullName: 'Agency',
    countryName: 'Testland',
    flagCode: 'tl',
    entityType: 'government',
    ...partial,
  } as TimelineEvent
}

const first = event({ title: 'First event', eventId: 'TL-001' })
const second = event({ title: 'Second event', eventId: 'TL 002', startYear: 2027, endYear: 2028 })
const phase: TimelinePhase = {
  startYear: 2024,
  endYear: 2028,
  phase: 'Discovery',
  type: 'Phase',
  title: 'First event',
  description: 'd',
  events: [first, second],
}

async function copyFrom(shareName: RegExp, expectedPath: string, onClose: () => void) {
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: shareName }))
  const menu = screen.getByRole('menu')
  const copy = within(menu).getByRole('button', { name: /Copy link/ })
  fireEvent.pointerDown(copy)
  fireEvent.mouseDown(copy)
  fireEvent.click(copy)
  await vi.waitFor(() =>
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}${expectedPath}`
    )
  )
  expect(onClose).not.toHaveBeenCalled()
  expect(dialog).toBeInTheDocument()
}

describe('Timeline pop-ups — Share + Close', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('GanttDetailPopover shares the FOCUSED event, not the row’s first', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/timeline?country=Testland&phase=Discovery']}>
        <GanttDetailPopover isOpen onClose={onClose} phase={phase} focusEvent={second} />
      </MemoryRouter>
    )
    await copyFrom(/^Share Second event/, '/timeline?event=TL%20002', onClose)
  })

  it('GanttDetailPopover shares the row’s first event when nothing is focused', async () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <GanttDetailPopover isOpen onClose={onClose} phase={phase} />
      </MemoryRouter>
    )
    await copyFrom(/^Share First event/, '/timeline?event=TL-001', onClose)
  })

  it('GanttDetailPopover has an accessible Close button (bug: it had none)', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <GanttDetailPopover isOpen onClose={onClose} phase={phase} />
      </MemoryRouter>
    )
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    // Escape still closes too.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('TimelineDocumentDetailPopover shares the event link (event_id, else title)', async () => {
    const onClose = vi.fn()
    const row = {
      countryName: 'Testland',
      org: 'Agency',
      phase: 'Discovery',
      type: 'Milestone',
      title: 'Doc title',
      startYear: 2025,
      endYear: 2025,
      description: 'd',
    }
    const { unmount } = render(
      <MemoryRouter initialEntries={['/timeline?view=docs&q=x']}>
        <TimelineDocumentDetailPopover isOpen onClose={onClose} row={{ ...row, eventId: 'TL-9' }} />
      </MemoryRouter>
    )
    await copyFrom(/^Share Doc title/, '/timeline?event=TL-9', onClose)
    unmount()
    render(
      <MemoryRouter>
        <TimelineDocumentDetailPopover isOpen onClose={onClose} row={row} />
      </MemoryRouter>
    )
    await copyFrom(/^Share Doc title/, '/timeline?event=Doc%20title', onClose)
  })
})
