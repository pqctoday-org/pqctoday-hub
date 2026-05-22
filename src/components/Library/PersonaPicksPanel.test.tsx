// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PersonaPicksPanel } from './PersonaPicksPanel'
import type { LibraryCuriousPick } from '@/data/libraryCuriousPicks'
import type { LibraryItem } from '@/data/libraryData'

// Five picks — enough to exercise the "Show all N" expander (cap=5).
const FIVE_PICKS: readonly LibraryCuriousPick[] = [
  { referenceId: 'A', label: 'Doc A', blurb: 'A blurb' },
  { referenceId: 'B', label: 'Doc B', blurb: 'B blurb' },
  { referenceId: 'C', label: 'Doc C', blurb: 'C blurb' },
  { referenceId: 'D', label: 'Doc D', blurb: 'D blurb' },
  { referenceId: 'E', label: 'Doc E', blurb: 'E blurb' },
] as const

// Seven picks → 5 visible, 2 hidden behind "Show all 7".
const SEVEN_PICKS: readonly LibraryCuriousPick[] = [
  ...FIVE_PICKS,
  { referenceId: 'F', label: 'Doc F', blurb: 'F blurb' },
  { referenceId: 'G', label: 'Doc G', blurb: 'G blurb' },
] as const

function buildItem(referenceId: string): LibraryItem {
  return {
    referenceId,
    documentTitle: `Title ${referenceId}`,
    downloadUrl: '',
    initialPublicationDate: '',
    lastUpdateDate: '',
    documentStatus: 'Final',
    documentStatusBucket: 'Published',
    shortDescription: '',
    documentType: '',
    applicableIndustries: [],
    authorsOrOrganization: '',
    dependencies: '',
    regionScope: '',
    algorithmFamily: '',
    securityLevels: '',
    protocolOrToolImpact: '',
    toolchainSupport: '',
    migrationUrgency: '',
    categories: [],
  }
}

describe('PersonaPicksPanel', () => {
  it('renders the title, subtitle, and one button per pick', () => {
    render(
      <PersonaPicksPanel
        personaId="executive"
        title="Boardroom set"
        subtitle="Regulator-level PQC docs"
        picks={FIVE_PICKS}
        resolveItem={buildItem}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText('Boardroom set')).toBeInTheDocument()
    expect(screen.getByText('Regulator-level PQC docs')).toBeInTheDocument()
    for (const pick of FIVE_PICKS) {
      expect(screen.getByText(pick.label)).toBeInTheDocument()
      expect(screen.getByText(pick.blurb)).toBeInTheDocument()
    }
  })

  it('renders nothing when picks is empty', () => {
    const { container } = render(
      <PersonaPicksPanel
        personaId="developer"
        title="Should not show"
        subtitle=""
        picks={[]}
        resolveItem={buildItem}
        onOpen={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('caps visible picks at 5 and reveals the rest via "Show all N"', () => {
    render(
      <PersonaPicksPanel
        personaId="ops"
        title="Cert-relevant set"
        subtitle="FIPS"
        picks={SEVEN_PICKS}
        resolveItem={buildItem}
        onOpen={vi.fn()}
      />
    )
    // Default: 5 visible
    expect(screen.getByText('Doc A')).toBeInTheDocument()
    expect(screen.getByText('Doc E')).toBeInTheDocument()
    expect(screen.queryByText('Doc F')).toBeNull()
    expect(screen.queryByText('Doc G')).toBeNull()

    const expand = screen.getByRole('button', { name: /Show all 7/ })
    fireEvent.click(expand)

    expect(screen.getByText('Doc F')).toBeInTheDocument()
    expect(screen.getByText('Doc G')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Show fewer/ })).toBeInTheDocument()
  })

  it('calls onOpen with the resolved LibraryItem when a pick is clicked', () => {
    const onOpen = vi.fn()
    render(
      <PersonaPicksPanel
        personaId="curious"
        title="Start here"
        subtitle=""
        picks={FIVE_PICKS}
        resolveItem={buildItem}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByText('Doc B'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen.mock.calls[0][0].referenceId).toBe('B')
  })

  it('disables the pick button when resolveItem returns undefined', () => {
    const onOpen = vi.fn()
    render(
      <PersonaPicksPanel
        personaId="curious"
        title="Start here"
        subtitle=""
        picks={FIVE_PICKS}
        resolveItem={() => undefined}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByText('Doc A'))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('exposes a stable data-testid so persona switches can be asserted', () => {
    render(
      <PersonaPicksPanel
        personaId="executive"
        title="Boardroom set"
        subtitle=""
        picks={FIVE_PICKS}
        resolveItem={buildItem}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByTestId('persona-picks-executive')).toBeInTheDocument()
  })
})
