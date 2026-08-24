// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MobileCommunityView } from './MobileCommunityView'
import { leadersData } from '@/data/leadersData'
import { LEADER_CATEGORIES } from '@/components/Leaders/LeaderCategorySidebar'

// Real data throughout — leadersData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural, not hardcoded counts.
const CURATED = leadersData.filter((l) => l.sourceKind === 'curated')

function renderView() {
  return render(<MobileCommunityView />)
}

describe('MobileCommunityView', () => {
  it('defaults to the curated set, matching the real count, and never shows an invented denominator', () => {
    renderView()
    expect(screen.getByText(`${CURATED.length} hand-curated profiles`)).toBeInTheDocument()
  })

  it('uses the real consent sentence verbatim from LeaderConsentModal.tsx, not an invented subtitle', () => {
    renderView()
    expect(
      screen.getByText(/People contributing to the advances of post-quantum cryptography/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/only with written consent/i)).toBeInTheDocument()
  })

  it('renders every real LEADER_CATEGORIES value as a filter chip', () => {
    renderView()
    for (const cat of LEADER_CATEGORIES) {
      expect(screen.getByRole('button', { name: cat })).toBeInTheDocument()
    }
  })

  it('selecting a category narrows the list to real matches only', () => {
    renderView()
    const target = LEADER_CATEGORIES[0]
    fireEvent.click(screen.getByRole('button', { name: target }))
    const expected = CURATED.filter((l) => l.category === target)
    if (expected.length > 0) {
      expect(screen.getByText(expected[0].name)).toBeInTheDocument()
    }
    const nonMatch = CURATED.find((l) => l.category !== target)
    if (nonMatch) expect(screen.queryByText(nonMatch.name)).not.toBeInTheDocument()
  })

  it('shows "{type} Sector" verbatim, matching the real desktop badge text', () => {
    renderView()
    const withType = CURATED.find((l) => l.type)
    expect(withType).toBeDefined()
    expect(screen.getAllByText(`${withType!.type} Sector`).length).toBeGreaterThan(0)
  })

  it('renders real keyResourceRefs as citation chips when present', () => {
    renderView()
    const withRefs = CURATED.find((l) => l.keyResourceRefs && l.keyResourceRefs.length > 0)
    if (withRefs) {
      expect(screen.getAllByText(withRefs!.keyResourceRefs![0]).length).toBeGreaterThan(0)
    }
  })

  // 2026-08-24 audit R4.2: the card showed Cite: chips, but tapping through
  // to the detail sheet dropped them entirely — a claim with "a name and a
  // reference behind it" (the screen's own stated point) had no reachable
  // reference once you opened the profile. keyResourceRefs[i] pairs
  // positionally with keyResourceUrl[i] (leadersData.ts's documented
  // convention); this only asserts on a leader where both arrays are
  // actually present at that index, since the pairing isn't type-guaranteed.
  it('the detail sheet keeps the citation chips and links each to its real keyResourceUrl', () => {
    renderView()
    const withLinkedRef = CURATED.find((l) => l.keyResourceRefs?.[0] && l.keyResourceUrl?.[0])
    expect(
      withLinkedRef,
      'fixture assumption: no curated leader has a linked citation'
    ).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(withLinkedRef!.name) }))
    const sheet = screen.getByTestId('leader-detail-sheet')
    const link = within(sheet).getByRole('link', { name: withLinkedRef!.keyResourceRefs![0] })
    expect(link).toHaveAttribute('href', withLinkedRef!.keyResourceUrl![0])
  })

  it('shows peer-reviewed alongside verification, not as a mutually exclusive state', () => {
    renderView()
    const both = CURATED.find((l) => l.peerReviewed === 'yes' && l.verifiedDate)
    if (both) {
      const card = screen.getByText(both.name).closest('button')
      expect(card).not.toBeNull()
      expect(card!.textContent).toMatch(/verified/i)
      expect(card!.textContent).toMatch(/peer reviewed/i)
    }
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(screen.getByText(/document-contributor stubs/i)).toBeInTheDocument()
  })

  it('tapping a leader card opens the real detail sheet with their bio, and Close dismisses it', () => {
    renderView()
    const first = CURATED[0]
    fireEvent.click(screen.getAllByText(first.name)[0].closest('button')!)
    expect(screen.getByTestId('leader-detail-sheet')).toBeInTheDocument()
    if (first.bio) {
      expect(screen.getByText(first.bio)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('leader-detail-sheet')).not.toBeInTheDocument()
  })
})
