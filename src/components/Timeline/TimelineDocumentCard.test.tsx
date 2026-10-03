// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TimelineDocumentCard } from './TimelineDocumentCard'
import type { TimelineDocumentRow } from './TimelineDocumentDetailPopover'
import { timelineEventPageUrl } from '@/data/timelineData'
import { useEndorsementStore } from '@/store/useEndorsementStore'

const row: TimelineDocumentRow = {
  countryName: 'Canada',
  org: 'CCCS',
  phase: 'Migration',
  type: 'Milestone',
  title: 'Card Link Test Event',
  eventId: 'CA-TEST-001',
  startYear: 2026,
  endYear: 2030,
  description: 'Test row',
}

/** The "View on PQC Today" page link embedded in the discussion body. */
function pageUrlFrom(openedUrl: string): string {
  const body = new URL(openedUrl).searchParams.get('body') ?? ''
  const m = body.match(/\(https:\/\/pqctoday\.com([^)]*)\)/)
  return m?.[1] ?? ''
}

describe('TimelineDocumentCard Endorse / Flag links', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    useEndorsementStore.persist?.clearStorage?.()
  })

  // Same event URL the Documents table view builds (timelineEventPageUrl),
  // not a country-only link.
  it.each([
    ['Endorse', `Endorse ${row.title}`],
    ['Flag', `Flag issue with ${row.title}`],
  ])('%s links the event, matching the table view', (_kind, label) => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<TimelineDocumentCard row={row} onViewDetails={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(open).toHaveBeenCalledTimes(1)
    expect(pageUrlFrom(String(open.mock.calls[0][0]))).toBe(
      timelineEventPageUrl(row.countryName, row.eventId)
    )
  })

  it('falls back to the title as the event key when there is no event_id', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const noId = { ...row, eventId: undefined, title: 'Card Link Untitled Id' }
    render(<TimelineDocumentCard row={noId} onViewDetails={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: `Endorse ${noId.title}` }))
    expect(pageUrlFrom(String(open.mock.calls[0][0]))).toBe(
      timelineEventPageUrl(noId.countryName, noId.title)
    )
  })
})
