// SPDX-License-Identifier: AGPL-3.0-only
// /leaders 4.208: every cited Library ref is a /library?ref= link on desktop
// and phone, external sources are listed separately (never paired by
// position), the Timeline link only appears where the Timeline has events, and
// an expanded card / table row shows the whole profile.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { leadersData, type Leader } from '@/data/leadersData'
import { LeaderDetailSection } from './LeaderDetailSection'
import { LeaderDetailPopover } from './LeaderDetailPopover'
import { LeaderCard } from './LeaderCard'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const withRefs = leadersData.filter((l) => (l.keyResourceRefs?.length ?? 0) > 0)
const refsOnly = withRefs.find((l) => !l.keyResourceUrl?.length)!
const mismatched = leadersData.find(
  (l) =>
    (l.keyResourceRefs?.length ?? 0) > 0 &&
    (l.keyResourceUrl?.length ?? 0) > 0 &&
    l.keyResourceRefs!.length !== l.keyResourceUrl!.length
)!
const noTimeline = leadersData.find((l) => l.country === 'Ireland')!
const longBio = leadersData.find((l) => l.sourceKind === 'curated' && l.bio.length > 300)!

function libraryHrefs(scope: HTMLElement): string[] {
  return within(scope)
    .queryAllByRole('link')
    .map((a) => a.getAttribute('href') ?? '')
    .filter((h) => h.startsWith('/library?ref='))
}

describe('Leader key resources', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('the data still has the cases these tests need', () => {
    expect(refsOnly).toBeTruthy()
    expect(mismatched).toBeTruthy()
    expect(noTimeline).toBeTruthy()
    expect(longBio).toBeTruthy()
  })

  it.each([
    ['refs only', () => refsOnly],
    ['refs and URLs of different lengths', () => mismatched],
  ])('expanded section links every Library ref (%s)', (_label, pick) => {
    const leader = pick() as Leader
    render(
      <MemoryRouter>
        <LeaderDetailSection leader={leader} onClose={() => {}} />
      </MemoryRouter>
    )
    const region = screen.getByRole('region')
    const expected = leader
      .keyResourceRefs!.slice(0, 6)
      .map((r) => `/library?ref=${encodeURIComponent(r)}`)
    expect(libraryHrefs(region)).toEqual(expected)
    const external = within(region)
      .queryAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h?.startsWith('http') && !h.includes('linkedin'))
    for (const url of (leader.keyResourceUrl ?? []).slice(0, 6)) expect(external).toContain(url)
  })

  it('pop-up links every Library ref', () => {
    render(
      <MemoryRouter>
        <LeaderDetailPopover isOpen onClose={() => {}} leader={mismatched} />
      </MemoryRouter>
    )
    expect(libraryHrefs(document.body)).toEqual(
      mismatched.keyResourceRefs!.map((r) => `/library?ref=${encodeURIComponent(r)}`)
    )
  })

  it('no "Events from" link for a country with no Timeline events', () => {
    render(
      <MemoryRouter>
        <LeaderDetailSection leader={noTimeline} onClose={() => {}} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/Events from/)).not.toBeInTheDocument()
  })

  it('the Timeline link uses the Timeline spelling', () => {
    const us = leadersData.find((l) => l.country === 'United States')!
    render(
      <MemoryRouter>
        <LeaderDetailSection leader={us} onClose={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByText('Events from United States').closest('a')).toHaveAttribute(
      'href',
      '/timeline?country=United%20States'
    )
  })

  it('table rows show the full role, every organization and the bio', () => {
    render(
      <MemoryRouter>
        <LeaderDetailSection leader={longBio} onClose={() => {}} showProfile />
      </MemoryRouter>
    )
    const profile = screen.getByTestId('leader-detail-profile')
    expect(profile).toHaveTextContent(longBio.bio)
    for (const org of longBio.organizations) expect(profile).toHaveTextContent(org)
  })

  it('an expanded card does not clamp the bio; a collapsed one does', () => {
    const { rerender } = render(
      <MemoryRouter>
        <LeaderCard leader={longBio} onClick={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('leader-card-bio')).toHaveClass('line-clamp-3')
    rerender(
      <MemoryRouter>
        <LeaderCard leader={longBio} onClick={() => {}} isExpanded onCloseExpanded={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('leader-card-bio')).not.toHaveClass('line-clamp-3')
  })
})
