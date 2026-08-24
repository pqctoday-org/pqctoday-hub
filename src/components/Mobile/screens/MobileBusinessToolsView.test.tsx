// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileBusinessToolsView } from './MobileBusinessToolsView'
import {
  BUSINESS_TOOLS,
  BUSINESS_CATEGORIES,
} from '@/components/BusinessCenter/businessToolsRegistry'

// Real data throughout — BUSINESS_TOOLS is the same real registry
// BusinessToolsGrid.tsx/BusinessToolRoute.tsx already read. Assertions are
// structural (derived at test time), not hardcoded counts, since the
// registry changes over time.
const DROPPED = new Set(['crypto-architecture-diagram'])
const MOBILE_TOOLS = BUSINESS_TOOLS.filter((t) => !DROPPED.has(t.id))

function renderView() {
  return render(
    <MemoryRouter>
      <MobileBusinessToolsView />
    </MemoryRouter>
  )
}

describe('MobileBusinessToolsView', () => {
  it('shows the real tool count, excluding the dropped tool', () => {
    renderView()
    expect(screen.getByText(`${MOBILE_TOOLS.length} tools`)).toBeInTheDocument()
    // 37 real tools minus the 1 dropped — never the design doc's stale "six".
    expect(MOBILE_TOOLS.length).toBeLessThan(BUSINESS_TOOLS.length)
    expect(MOBILE_TOOLS.length).toBeGreaterThan(30)
  })

  it('never shows the dropped tool — its own UI does not distill to a phone screen', () => {
    renderView()
    expect(screen.queryByText('Crypto Architecture Diagram')).not.toBeInTheDocument()
  })

  it('renders every real category as a filter chip with a live, non-invented count', () => {
    renderView()
    for (const cat of BUSINESS_CATEGORIES) {
      const count = MOBILE_TOOLS.filter((t) => t.category === cat).length
      if (count === 0) continue
      expect(screen.getByRole('button', { name: `${cat} · ${count}` })).toBeInTheDocument()
    }
  })

  it('selecting a category narrows the list to real matches only', () => {
    renderView()
    const target = MOBILE_TOOLS.find((t) => t.category === 'Vendor & Supply Chain')
    expect(target).toBeDefined()
    const count = MOBILE_TOOLS.filter((t) => t.category === 'Vendor & Supply Chain').length
    fireEvent.click(screen.getByRole('button', { name: `Vendor & Supply Chain · ${count}` }))
    expect(screen.getByText(target!.name)).toBeInTheDocument()
    const nonMatch = MOBILE_TOOLS.find((t) => t.category !== 'Vendor & Supply Chain')
    expect(screen.queryByText(nonMatch!.name)).not.toBeInTheDocument()
  })

  it('typing a search query narrows the list to real matches', () => {
    renderView()
    const sample = MOBILE_TOOLS[0]
    fireEvent.change(screen.getByPlaceholderText('Search tools or keywords...'), {
      target: { value: sample.name },
    })
    expect(screen.getByText(sample.name)).toBeInTheDocument()
    const nonMatch = MOBILE_TOOLS.find(
      (t) => !t.name.toLowerCase().includes(sample.name.toLowerCase().slice(0, 4))
    )
    if (nonMatch) expect(screen.queryByText(nonMatch.name)).not.toBeInTheDocument()
  })

  it('states what was cut, including why the dropped tool is missing, rather than silently dropping it', () => {
    renderView()
    expect(screen.getByText(/Zone, Phase and Audience filters/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Crypto Architecture Diagram tool needs a wider screen/i)
    ).toBeInTheDocument()
  })

  it('tapping a tool card opens the real detail sheet with its real goodAnswer sentence, and Close dismisses it', () => {
    renderView()
    const first = MOBILE_TOOLS[0]
    fireEvent.click(screen.getByText(first.name).closest('button')!)
    const sheet = screen.getByTestId('business-tool-detail-sheet')
    expect(sheet).toBeInTheDocument()
    const snippet = first.goodAnswer.slice(0, 30)
    expect(within(sheet).getByText((content) => content.includes(snippet))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('business-tool-detail-sheet')).not.toBeInTheDocument()
  })

  it('the detail sheet\'s "Open tool" is a real link to the real, unmodified /business/tools/:id route', () => {
    renderView()
    const first = MOBILE_TOOLS[0]
    fireEvent.click(screen.getByText(first.name).closest('button')!)
    const sheet = screen.getByTestId('business-tool-detail-sheet')
    expect(within(sheet).getByRole('link', { name: 'Open tool' })).toHaveAttribute(
      'href',
      `/business/tools/${first.id}`
    )
  })

  it('shows the real audience badge only for non-default (architect/developer) tools', () => {
    renderView()
    const architectTool = MOBILE_TOOLS.find((t) => t.audience === 'architect')
    expect(architectTool).toBeDefined()
    const card = screen.getByText(architectTool!.name).closest('article')!
    expect(within(card).getByText('For architects')).toBeInTheDocument()

    const businessTool = MOBILE_TOOLS.find((t) => !t.audience || t.audience === 'business')
    expect(businessTool).toBeDefined()
    const businessCard = screen.getByText(businessTool!.name).closest('article')!
    expect(
      within(businessCard).queryByText(/For architects|For developers/)
    ).not.toBeInTheDocument()
  })
})
