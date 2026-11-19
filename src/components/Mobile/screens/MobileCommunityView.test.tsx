// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { MobileCommunityView } from './MobileCommunityView'
import { leadersData } from '@/data/leadersData'
import { LEADER_CATEGORIES } from '@/components/Leaders/LeaderCategorySidebar'
import { LEADERS_REGION_COUNTRIES } from '@/components/Leaders/leaderDeepLink'
import { PAGE_PERSONA_NOTES } from '@/data/pagePersonaNotes'
import { usePersonaStore } from '@/store/usePersonaStore'

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

describe('MobileCommunityView — role note', () => {
  afterEach(() => usePersonaStore.setState({ selectedPersona: null }))

  it('shows the same certification-role note as desktop, above the category chips', () => {
    usePersonaStore.setState({ selectedPersona: 'cert-engineer' })
    renderView()
    const note = screen.getByTestId('persona-page-note')
    expect(note).toHaveTextContent('What this means for you')
    expect(note).toHaveTextContent(PAGE_PERSONA_NOTES['/leaders']['cert-engineer'])
    expect(note).toHaveTextContent('the directory lists few certification-programme')
    const firstChip = screen.getByRole('button', { name: 'All' })
    expect(note.compareDocumentPosition(firstChip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows no note when no role is chosen', () => {
    renderView()
    expect(screen.queryByTestId('persona-page-note')).not.toBeInTheDocument()
  })
})

describe('MobileCommunityView', () => {
  it('defaults to the curated set, matching the real count, and never shows an invented denominator', () => {
    renderView()
    expect(screen.getByText(`${CURATED.length} hand-curated profiles`)).toBeInTheDocument()
  })

  it('states directory limits and how profiles are compiled, with a working removal route', () => {
    renderView()
    expect(screen.getByText(/Inclusion is not an endorsement or ranking/i)).toBeInTheDocument()
    // Owner decision 2026-11-14 (Leaders A-1): 109 profiles are auto-imported, so
    // "listed only with written consent" was not true.
    expect(screen.queryByText(/only with written consent/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Profiles are compiled from cited public sources/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'ask for a correction or removal' })
    expect(link.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/pqctoday-org\/pqctoday-hub\/discussions\/new\?category=i-consent-to-be-added-as-a-pqc-leader/
    )
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
  // reference once you opened the profile. 4.208: refs and URLs are NOT
  // paired by position (31 rows have different lengths, and most equal-length
  // rows do not pair either), so refs open in the Library and URLs are listed
  // as external sources.
  it('the detail sheet links every Library ref to /library and lists external sources separately (never paired by position)', () => {
    renderView()
    const leader = CURATED.find(
      (l) =>
        (l.keyResourceRefs?.length ?? 0) > 0 &&
        (l.keyResourceUrl?.length ?? 0) > 0 &&
        l.keyResourceRefs!.length !== l.keyResourceUrl!.length
    )
    expect(
      leader,
      'fixture assumption: a curated leader with refs and URLs of different lengths'
    ).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(leader!.name) }))
    const sheet = screen.getByTestId('leader-detail-sheet')
    for (const ref of leader!.keyResourceRefs!) {
      expect(within(sheet).getByRole('link', { name: ref })).toHaveAttribute(
        'href',
        `/library?ref=${encodeURIComponent(ref)}`
      )
    }
    const hrefs = within(sheet)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    for (const url of leader!.keyResourceUrl!) expect(hrefs).toContain(url)
  })

  it('the detail sheet shows patents and catalogue products', () => {
    renderView()
    const withPatents = CURATED.find((l) => (l.patentRefs?.length ?? 0) > 0)
    if (withPatents) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(withPatents.name) }))
      const sheet = screen.getByTestId('leader-detail-sheet')
      expect(within(sheet).getByRole('link', { name: /View \d+ patents?/ })).toHaveAttribute(
        'href',
        expect.stringMatching(/^\/patents\?patentIds=/)
      )
    }
  })

  it('shows recorded review metadata alongside the profile-check date, not as a mutually exclusive state', () => {
    renderView()
    const both = CURATED.find((l) => l.peerReviewed === 'yes' && l.verifiedDate)
    if (both) {
      const card = screen.getByText(both.name).closest('button')
      expect(card).not.toBeNull()
      expect(card!.textContent).toMatch(/profile checked/i)
      expect(card!.textContent).toMatch(/review flag recorded/i)
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

    it('?q filters by the lexical search fields and restores the search field', () => {
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
      expect(
        screen.getByRole('searchbox', { name: 'Search community by name or role' })
      ).toHaveValue(org)
    })

    it("treats desktop's 'All' values as no filter", () => {
      renderView('/leaders?cat=All&region=All&country=All&sector=All')
      expect(cardCount()).toBe(CURATED.length)
      expect(screen.queryByTestId('leader-link-filters')).not.toBeInTheDocument()
    })
  })
})
