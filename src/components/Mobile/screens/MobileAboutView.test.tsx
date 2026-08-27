// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileAboutView } from './MobileAboutView'
import { getCurrentVersion } from '@/store/useVersionStore'
import { timelineData } from '@/data/timelineData'
import { patentsData } from '@/data/patentsData'
import { threatsData } from '@/data/threatsData'
import { leadersData } from '@/data/leadersData'
import { DISCUSSIONS, CRYPTO_BUFF_SITES, CRYPTO_BUFF_BOOKS } from '@/components/About/aboutData'

const mockSetTheme = vi.fn()
let mockTheme: 'light' | 'dark' = 'dark'
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}))

let mockIsEmbedded = false
vi.mock('@/embed/EmbedProvider', () => ({
  useIsEmbedded: () => mockIsEmbedded,
}))

function renderView() {
  return render(
    <MemoryRouter>
      <MobileAboutView />
    </MemoryRouter>
  )
}

// Real data throughout — every count below is derived the same way the
// component derives it, from the same real modules, not hardcoded. The
// README's own "fifteen desktop sections"/"1,185"-style stale-number defect
// class is exactly what this guards against for About.
describe('MobileAboutView', () => {
  beforeEach(() => {
    mockIsEmbedded = false
    mockTheme = 'dark'
    mockSetTheme.mockClear()
  })

  it('renders all 5 real groups (README §23\'s "five-section accordion")', () => {
    renderView()
    expect(screen.getByText('Vision & how it adapts')).toBeInTheDocument()
    expect(screen.getByText('Trust & verification')).toBeInTheDocument()
    expect(screen.getByText('Data & privacy')).toBeInTheDocument()
    expect(screen.getByText('Open source & enterprise')).toBeInTheDocument()
    expect(screen.getByText('Assistant, community & preferences')).toBeInTheDocument()
  })

  it('shows the real app version, not a typed one', () => {
    renderView()
    expect(screen.getByText(new RegExp(`v${getCurrentVersion()}`))).toBeInTheDocument()
  })

  it('expands a group on tap to reveal its real content', () => {
    renderView()
    expect(screen.queryByText(/Transparency & disclaimer/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Trust & verification').closest('button')!)
    expect(screen.getByText(/Transparency & disclaimer/i)).toBeInTheDocument()
    expect(screen.getByText(/Security audit/i)).toBeInTheDocument()
  })

  it('shows real, live-computed platform-data counts, not stale figures', () => {
    renderView()
    fireEvent.click(screen.getByText('Data & privacy').closest('button')!)
    const timelineEventCount = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length
    expect(screen.getByText(timelineEventCount.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText(patentsData.length.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText(threatsData.length.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText(leadersData.length.toLocaleString())).toBeInTheDocument()
  })

  it('the theme toggle is real and functional, not decorative', () => {
    renderView()
    fireEvent.click(screen.getByText('Assistant, community & preferences').closest('button')!)
    fireEvent.click(screen.getByRole('button', { name: /^light$/i }))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('shows real community/crypto-buff data when not embedded', () => {
    renderView()
    fireEvent.click(screen.getByText('Assistant, community & preferences').closest('button')!)
    expect(screen.getByText(DISCUSSIONS[0].label)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${CRYPTO_BUFF_SITES.length} curated websites`))
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${CRYPTO_BUFF_BOOKS.length} essential books`))
    ).toBeInTheDocument()
  })

  it("hides the 5 standalone-only rows when embedded, matching AboutView.tsx's own gate", () => {
    mockIsEmbedded = true
    renderView()
    fireEvent.click(screen.getByText('Data & privacy').closest('button')!)
    expect(screen.queryByText(/Google Drive sync/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open source & enterprise').closest('button')!)
    expect(screen.queryByText(/^Enterprise$/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Assistant, community & preferences').closest('button')!)
    expect(screen.queryByText(/^Community$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Cryptography buff$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Appearance$/i)).not.toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/The full Content Audit Trail feed, per-package SBOM listing/i)
    ).toBeInTheDocument()
  })
})
