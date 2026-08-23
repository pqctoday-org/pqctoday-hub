// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileTimelineView } from './MobileTimelineView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { timelineData, transformToGanttData } from '@/data/timelineData'
import { applyTimelineScope } from '@/data/timelineScope'

// Real data throughout — timelineData is parsed synchronously from a bundled
// CSV at module load (no fixture needed, matching TimelineView.test.tsx's
// own approach). Assertions are structural (derived from the real data at
// test time) rather than hardcoded counts, since the underlying CSV changes
// over time.
const REAL_GANTT_DATA = transformToGanttData(applyTimelineScope(timelineData, {}))

describe('MobileTimelineView', () => {
  afterEach(() => {
    usePersonaStore.getState().setRegion('global')
  })

  it("scopes the country list to the reader's region, matching REGION_COUNTRIES_MAP exactly", () => {
    usePersonaStore.getState().setRegion('americas')
    render(<MobileTimelineView />)
    const expected = REAL_GANTT_DATA.filter((d) =>
      ['United States', 'Canada'].includes(d.country.countryName)
    )
    expect(
      screen.getByText(`${expected.length} countries tracked`, { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText('Americas PQC timeline')).toBeInTheDocument()
  })

  it('shows every tracked country when the region is global — matches the full real dataset', () => {
    usePersonaStore.getState().setRegion('global')
    render(<MobileTimelineView />)
    expect(screen.getByText('Global PQC timeline')).toBeInTheDocument()
    expect(
      screen.getByText(`${REAL_GANTT_DATA.length} countries tracked`, { exact: false })
    ).toBeInTheDocument()
  })

  it("shows the reader's-country panel for a region with a real representative country (americas -> United States)", () => {
    usePersonaStore.getState().setRegion('americas')
    render(<MobileTimelineView />)
    expect(screen.getByText(/When does this reach me, in United States\?/i)).toBeInTheDocument()
  })

  it("renders no reader's-country panel for a region with no single representative country (eu)", () => {
    usePersonaStore.getState().setRegion('eu')
    render(<MobileTimelineView />)
    expect(screen.queryByText(/When does this reach me/i)).not.toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    render(<MobileTimelineView />)
    expect(
      screen.getByText(/Region and category filters, search, calendar export/i)
    ).toBeInTheDocument()
  })
})
