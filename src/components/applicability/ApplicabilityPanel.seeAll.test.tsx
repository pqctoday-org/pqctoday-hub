// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where a role's list is shortened, each section says how many items it left out and links to
 * the page that holds the full list. The derived (IR 8477) section counts what its cap left out.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ApplicabilityPanel } from './ApplicabilityPanel'
import { allApplicable, TIER_ORDER, type UserProfile } from '@/utils/applicabilityEngine'
import { applyLens, getLens, withoutDerivedCap, type SectionId } from '@/utils/applicabilityLens'
import { traverseXwalkPaths } from '@/utils/trustPathTraversal'
import { conceptXwalkData } from '@/data/conceptXwalkData'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/personaIds'

const SECTIONS: Array<{ id: SectionId; title: string; link: string; href: RegExp }> = [
  {
    id: 'frameworks',
    title: 'Compliance Frameworks',
    link: 'See all frameworks',
    href: /^\/compliance\?tab=compliance&industry=Finance%20%26%20Banking$/,
  },
  {
    id: 'threats',
    title: 'Threats',
    link: 'See all threats',
    href: /^\/threats\?industry=Finance/,
  },
  {
    id: 'library',
    title: 'Library — Standards & Specifications',
    link: 'See all library documents',
    href: /^\/library\?prefs=off$/,
  },
  {
    id: 'timeline',
    title: 'Timeline Milestones',
    link: 'See all timeline milestones',
    href: /^\/timeline\?country=United%20States$/,
  },
]

const sum = (counts: Record<string, number>) => TIER_ORDER.reduce((n, t) => n + (counts[t] ?? 0), 0) // eslint-disable-line security/detect-object-injection

function renderTab(profile: UserProfile, persona: PersonaId | null) {
  usePersonaStore.setState({ selectedPersona: persona })
  return render(
    <MemoryRouter>
      <ApplicabilityPanel variant="tab" profileOverride={profile} />
    </MemoryRouter>
  )
}

// eslint-disable-next-line testing-library/no-node-access -- a section has no accessible name to query by
const sectionOf = (title: string) => screen.getByText(title).closest('section') as HTMLElement

describe('See all links in the For You panel', () => {
  const profile = { country: 'United States', industry: 'Finance & Banking' }

  it.each(SECTIONS)(
    '$id: an omitted count and a link to the full list',
    ({ id, title, link, href }) => {
      renderTab(profile, 'executive')
      const counts = applyLens(allApplicable(profile), 'executive').droppedCounts
      const omitted = sum(counts[id]) // eslint-disable-line security/detect-object-injection
      expect(omitted).toBeGreaterThan(0)
      const section = within(sectionOf(title))
      expect(section.getByText(`${omitted} more not shown here.`)).toBeInTheDocument()
      const anchor = section.getByRole('link', { name: link })
      expect(anchor.getAttribute('href')).toMatch(href)
    }
  )

  it('offers a link only for a section that hides something', () => {
    // A tiny profile: the executive caps hide nothing from at least one section.
    const small = { country: 'Australia', industry: 'Government & Defense' }
    renderTab(small, 'executive')
    const lensed = applyLens(allApplicable(small), 'executive')
    const withLink = SECTIONS.filter((s) => sum(lensed.droppedCounts[s.id]) > 0).map((s) => s.id)
    const without = SECTIONS.filter((s) => sum(lensed.droppedCounts[s.id]) === 0).map((s) => s.id)
    expect(withLink.length).toBeGreaterThan(0)
    expect(without.length).toBeGreaterThan(0)
    for (const s of SECTIONS) {
      const section = within(sectionOf(s.title))
      if (withLink.includes(s.id)) expect(section.getByRole('link', { name: s.link })).toBeVisible()
      else expect(section.queryByRole('link', { name: s.link })).not.toBeInTheDocument()
    }
  })

  it('gives the link a 44px tap target on phones', () => {
    renderTab(profile, 'executive')
    const anchor = within(sectionOf('Threats')).getByRole('link', { name: 'See all threats' })
    expect(anchor.className).toMatch(/min-h-\[44px\]/)
  })

  it('does not say nothing matches when the role filter left every document out', () => {
    // For a developer in Australia in Finance & Banking the category filter leaves out all
    // fifteen applicable library documents, so the section is empty but not "no match".
    const hidden = { country: 'Australia', industry: 'Finance & Banking' }
    const lensed = applyLens(allApplicable(hidden), 'developer')
    expect(lensed.library).toHaveLength(0)
    const omitted = sum(lensed.droppedCounts.library)
    expect(omitted).toBeGreaterThan(0)
    renderTab(hidden, 'developer')
    const section = within(sectionOf('Library — Standards & Specifications'))
    expect(section.queryByText('No items match this profile.')).not.toBeInTheDocument()
    expect(section.getByText('Nothing is shown here for your role.')).toBeInTheDocument()
    expect(section.getByText(`${omitted} more not shown here.`)).toBeInTheDocument()
    expect(section.getByRole('link', { name: 'See all library documents' })).toBeVisible()
  })
})

describe('derived (IR 8477) results in the For You panel', () => {
  const profile = { country: 'United States', industry: 'Finance & Banking' }

  it('shows how many the persona cap left out, so shown + omitted = found', () => {
    renderTab(profile, 'architect')
    const lens = getLens('architect')
    const all = allApplicable(profile)
    const lensed = applyLens(all, 'architect')
    const found = traverseXwalkPaths(
      [...lensed.frameworks, ...all.library],
      conceptXwalkData,
      withoutDerivedCap(lens)
    ).length
    const shown = Math.min(found, lens.trustPathConfig.maxDerivedResults)
    expect(found).toBeGreaterThan(shown)
    const header = within(sectionOf('Related via IR 8477'))
    expect(
      header.getByText(
        `${shown} standards shown (+${found - shown} hidden by persona lens) — trust path derivations`
      )
    ).toBeInTheDocument()
  })

  it('adds nothing when the cap leaves out no result', () => {
    renderTab(profile, 'executive')
    const header = sectionOf('Related via IR 8477')
    expect(within(header).queryByText(/hidden by persona lens/)).not.toBeInTheDocument()
    expect(
      within(header).getByText(/standards? shown — trust path derivations/)
    ).toBeInTheDocument()
  })
})
