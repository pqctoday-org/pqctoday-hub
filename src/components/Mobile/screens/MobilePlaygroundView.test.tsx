// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobilePlaygroundView } from './MobilePlaygroundView'
import { WORKSHOP_TOOLS, CATEGORIES } from '@/components/Playground/workshopRegistry'
import { useBookmarkStore } from '@/store/useBookmarkStore'

// Real data throughout — WORKSHOP_TOOLS is the same real registry every
// desktop Playground surface reads. Assertions are structural (derived at
// test time), not hardcoded counts, since the registry changes over time.
const DROPPED = new Set(['vpn-sim', 'mls-group-messaging', 'openssl-studio'])
const MOBILE_TOOLS = WORKSHOP_TOOLS.filter((t) => !t.sandbox && !DROPPED.has(t.id))

function renderView() {
  return render(
    <MemoryRouter>
      <MobilePlaygroundView />
    </MemoryRouter>
  )
}

describe('MobilePlaygroundView', () => {
  afterEach(() => {
    useBookmarkStore.getState().myPlaygroundTools.forEach((id) => {
      useBookmarkStore.getState().toggleMyPlaygroundTool(id)
    })
  })

  it('shows the real hand-authored tool count, excluding sandbox scenarios', () => {
    renderView()
    expect(screen.getByText(`${MOBILE_TOOLS.length} tools · runs in-browser`)).toBeInTheDocument()
    // 34 hand-authored total minus the 3 dropped — never the full 58-tool
    // registry (that includes 24 Docker sandbox scenarios, cut from mobile).
    expect(MOBILE_TOOLS.length).toBeLessThan(34)
  })

  it('never shows a dropped tool — its own UI does not distill to a phone screen', () => {
    renderView()
    expect(screen.queryByText('PQC VPN Simulator')).not.toBeInTheDocument()
    expect(screen.queryByText('MLS Group Messaging')).not.toBeInTheDocument()
    expect(screen.queryByText('OpenSSL Studio')).not.toBeInTheDocument()
  })

  it('renders every real category as a filter chip with a live, non-invented count', () => {
    renderView()
    for (const cat of CATEGORIES) {
      const count = MOBILE_TOOLS.filter((t) => t.category === cat).length
      if (count === 0) continue // a category could be fully dropped in principle
      expect(screen.getByRole('button', { name: `${cat} · ${count}` })).toBeInTheDocument()
    }
  })

  it('selecting a category narrows the list to real matches only', () => {
    renderView()
    const target = MOBILE_TOOLS.find((t) => t.category === 'Entropy & Random')
    expect(target).toBeDefined()
    const count = MOBILE_TOOLS.filter((t) => t.category === 'Entropy & Random').length
    fireEvent.click(screen.getByRole('button', { name: `Entropy & Random · ${count}` }))
    expect(screen.getByText(target!.name)).toBeInTheDocument()
    const nonMatch = MOBILE_TOOLS.find((t) => t.category !== 'Entropy & Random')
    expect(screen.queryByText(nonMatch!.name)).not.toBeInTheDocument()
  })

  it('a difficulty chip narrows the list to exactly that difficulty', () => {
    renderView()
    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }))
    const expected = MOBILE_TOOLS.filter((t) => t.difficulty === 'advanced')
    for (const t of expected.slice(0, 3)) {
      expect(screen.getByText(t.name)).toBeInTheDocument()
    }
    const nonMatch = MOBILE_TOOLS.find((t) => t.difficulty !== 'advanced')
    if (nonMatch) expect(screen.queryByText(nonMatch.name)).not.toBeInTheDocument()
  })

  it('typing a search query narrows the list via the real synonym-expanding pipeline', () => {
    renderView()
    const sample = MOBILE_TOOLS[0]
    fireEvent.change(screen.getByPlaceholderText(/Search — try/i), {
      target: { value: sample.name },
    })
    expect(screen.getByText(sample.name)).toBeInTheDocument()
    const nonMatch = MOBILE_TOOLS.find(
      (t) => !t.name.toLowerCase().includes(sample.name.toLowerCase().slice(0, 4))
    )
    if (nonMatch) expect(screen.queryByText(nonMatch.name)).not.toBeInTheDocument()
  })

  it('toggles a tool bookmark via the real useBookmarkStore ("My tools")', () => {
    renderView()
    const first = MOBILE_TOOLS[0]
    const btn = screen.getAllByRole('button', { name: 'Add to My tools' })[0]
    fireEvent.click(btn)
    expect(useBookmarkStore.getState().myPlaygroundTools).toContain(first.id)
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(screen.getByText(/Docker-backed sandbox scenarios are on a laptop/i)).toBeInTheDocument()
  })

  it('tapping a tool card opens the real detail sheet with its algorithms, and Close dismisses it', () => {
    renderView()
    const first = MOBILE_TOOLS[0]
    fireEvent.click(screen.getByText(first.name).closest('button')!)
    const sheet = screen.getByTestId('playground-tool-detail-sheet')
    expect(sheet).toBeInTheDocument()
    for (const algo of first.algorithms) {
      expect(within(sheet).getByText(algo)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('playground-tool-detail-sheet')).not.toBeInTheDocument()
  })

  it('the detail sheet\'s "Open tool" is a real link to the real, unmodified /playground/:id route', () => {
    renderView()
    const first = MOBILE_TOOLS[0]
    fireEvent.click(screen.getByText(first.name).closest('button')!)
    const sheet = screen.getByTestId('playground-tool-detail-sheet')
    expect(within(sheet).getByRole('link', { name: 'Open tool' })).toHaveAttribute(
      'href',
      `/playground/${first.id}`
    )
  })

  it('the detail sheet shows a real related-module link only when moduleLink is a real /learn/ route', () => {
    renderView()
    // slh-dsa's real moduleLink is '/learn/slh-dsa' (workshopRegistry.tsx)
    const withModule = MOBILE_TOOLS.find((t) => t.id === 'slh-dsa')
    expect(withModule).toBeDefined()
    fireEvent.click(screen.getByText(withModule!.name).closest('button')!)
    const sheet = screen.getByTestId('playground-tool-detail-sheet')
    expect(within(sheet).getByText(/Related module/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    // cacp-kmip's real moduleLink is '/playground/cacp' — not a /learn/
    // route, so the modal never shows a "Related module" link for it either
    // (matches desktop's own real gating in PlaygroundWorkshop.tsx). Picked
    // over tpm-playground because it's requires:[] — unaffected by the
    // "Runs on this device" filter defaulting on, unlike tpm-playground
    // (requires: ['sab'], unmet in jsdom).
    const withoutModule = MOBILE_TOOLS.find((t) => t.id === 'cacp-kmip')
    expect(withoutModule).toBeDefined()
    fireEvent.click(screen.getByText(withoutModule!.name).closest('button')!)
    const sheet2 = screen.getByTestId('playground-tool-detail-sheet')
    expect(within(sheet2).queryByText(/Related module/i)).not.toBeInTheDocument()
  })
})
