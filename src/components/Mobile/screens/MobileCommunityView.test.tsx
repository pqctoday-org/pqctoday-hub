// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { MobileCommunityView } from './MobileCommunityView'
import { leadersData } from '@/data/leadersData'
import { LEADER_CATEGORIES } from '@/components/Leaders/LeaderCategorySidebar'
import { LEADERS_REGION_COUNTRIES } from '@/components/Leaders/leaderDeepLink'

// Real data throughout — leadersData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural, not hardcoded counts.
const CURATED = leadersData.filter((l) => l.sourceKind === 'curated')

const probe = { search: '' }
function LocationProbe() {
  const { search } = useLocation()
  useEffect(() => {
    probe.search = search
  }, [search])
  return null
}

function renderView(initialEntry = '/leaders') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MobileCommunityView />
      <LocationProbe />
    </MemoryRouter>
  )
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

  describe('?leader= deep link (deep-link remediation PR 1)', () => {
    it('opens the linked profile on load', () => {
      const target = CURATED[0]
      renderView(`/leaders?leader=${encodeURIComponent(target.name)}`)
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).getAllByText(target.name).length).toBeGreaterThan(0)
    })

    it('opens a document-contributor stub that the curated list does not show', () => {
      const stub = leadersData.find((l) => l.sourceKind === 'auto-imported')
      if (!stub) return
      renderView(`/leaders?leader=${encodeURIComponent(stub.name)}`)
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).getAllByText(stub.name).length).toBeGreaterThan(0)
    })

    it('matches case-insensitively', () => {
      const target = CURATED[0]
      renderView(`/leaders?leader=${encodeURIComponent(`  ${target.name.toUpperCase()} `)}`)
      expect(screen.getByTestId('leader-detail-sheet')).toBeInTheDocument()
    })

    it('opens the linked profile from its stable leader_id', () => {
      const target = CURATED[0]
      renderView(`/leaders?leader=${encodeURIComponent(target.leaderId)}`)
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).getAllByText(target.name).length).toBeGreaterThan(0)
    })

    it('writes ?leader=<leader_id> on open and clears it on close', () => {
      renderView()
      const first = CURATED[0]
      fireEvent.click(screen.getAllByText(first.name)[0].closest('button')!)
      expect(new URLSearchParams(probe.search).get('leader')).toBe(first.leaderId)
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(new URLSearchParams(probe.search).get('leader')).toBeNull()
    })

    it("forwards a merged duplicate's old leader_id to the kept profile, with a dismissible note", () => {
      renderView('/leaders?leader=dustin-moody-nist-2')
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).getAllByText('Dr. Dustin Moody').length).toBeGreaterThan(0)
      const note = within(sheet).getByTestId('deeplink-notice-moved')
      expect(note).toHaveTextContent('Dustin Moody is now listed under Dr. Dustin Moody')
      fireEvent.click(within(note).getByRole('button', { name: 'Dismiss notice' }))
      expect(within(sheet).queryByTestId('deeplink-notice-moved')).not.toBeInTheDocument()
      expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
    })

    it('opens the kept profile without a note for its own id', () => {
      renderView('/leaders?leader=dustin-moody-nist')
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    })

    it('shows a not-found notice for an unknown name instead of failing silently', () => {
      renderView('/leaders?leader=Nobody%20Atall')
      expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('Nobody Atall')
      expect(screen.queryByTestId('leader-detail-sheet')).not.toBeInTheDocument()
    })
  })

  describe('desktop /leaders filters (?cat, ?region, ?country, ?sector, ?q)', () => {
    const cardCount = () => screen.queryAllByRole('heading', { level: 2 }).length

    it("?cat selects that chip with desktop's inclusive match, and All clears it", () => {
      renderView('/leaders?cat=Patent%20Inventor')
      expect(screen.getByRole('button', { name: 'Patent Inventor' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      // Inclusive: primary category OR a real patentRefs entry (LeadersGrid semantics).
      const expected = CURATED.filter(
        (l) => l.category === 'Patent Inventor' || (l.patentRefs?.length ?? 0) > 0
      )
      expect(expected.length).toBeGreaterThan(0)
      expect(cardCount()).toBe(expected.length)
      fireEvent.click(screen.getByRole('button', { name: 'All' }))
      expect(new URLSearchParams(probe.search).get('cat')).toBeNull()
      expect(cardCount()).toBe(CURATED.length)
    })

    it('tapping a category chip writes ?cat', () => {
      renderView()
      fireEvent.click(screen.getByRole('button', { name: 'Government' }))
      expect(new URLSearchParams(probe.search).get('cat')).toBe('Government')
    })

    it('?region and ?sector narrow the list with removable, labelled chips', () => {
      const sector = CURATED[0].type
      renderView(`/leaders?region=eu&sector=${encodeURIComponent(sector)}`)
      const euCountries = new Set(LEADERS_REGION_COUNTRIES.eu)
      const expected = CURATED.filter((l) => euCountries.has(l.country) && l.type === sector)
      expect(cardCount()).toBe(expected.length)
      const chips = screen.getByTestId('leader-link-filters')
      expect(chips).toHaveTextContent('Region:Europe')
      expect(chips).toHaveTextContent(`Sector:${sector}`)
      fireEvent.click(screen.getByRole('button', { name: 'Remove Region filter' }))
      const sp = new URLSearchParams(probe.search)
      expect(sp.get('region')).toBeNull()
      expect(sp.get('sector')).toBe(sector)
      expect(cardCount()).toBe(CURATED.filter((l) => l.type === sector).length)
    })

    it('?country wins over ?region, as on desktop', () => {
      const country = CURATED.find((l) => l.country === 'USA') ? 'USA' : CURATED[0].country
      renderView(`/leaders?region=apac&country=${encodeURIComponent(country)}`)
      expect(cardCount()).toBe(CURATED.filter((l) => l.country === country).length)
    })

    it('?q filters by the lexical search fields and shows a Search chip', () => {
      const org = CURATED.find((l) => l.organizations.length > 0)!.organizations[0]
      renderView(`/leaders?q=${encodeURIComponent(org)}`)
      const q = org.toLowerCase()
      const expected = CURATED.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.organizations.some((o) => o.toLowerCase().includes(q)) ||
          l.bio.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      )
      expect(cardCount()).toBe(expected.length)
      expect(cardCount()).toBeLessThan(CURATED.length)
      expect(screen.getByTestId('leader-link-filters')).toHaveTextContent(`Search:${org}`)
    })

    it("treats desktop's 'All' values as no filter", () => {
      renderView('/leaders?cat=All&region=All&country=All&sector=All')
      expect(cardCount()).toBe(CURATED.length)
      expect(screen.queryByTestId('leader-link-filters')).not.toBeInTheDocument()
    })
  })
})
