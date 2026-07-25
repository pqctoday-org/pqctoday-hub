// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SponsorView } from './SponsorView'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'

const renderPage = () =>
  render(
    <MemoryRouter>
      <SponsorView />
    </MemoryRouter>
  )

describe('SponsorView', () => {
  it('does not use a personal gmail contact address', () => {
    renderPage()
    expect(screen.queryByText(/pqctoday@gmail\.com/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/sponsor@pqctoday\.com/i).length).toBeGreaterThan(0)
  })

  it('routes the sample-report CTA through the ephemeral example-report path, not a bare /report', () => {
    renderPage()
    const cta = screen.getByRole('link', { name: /See a sample migration-readiness report/i })
    expect(cta).toHaveAttribute('href', EXAMPLE_REPORT_URL)
  })

  it('labels benefits with no observable artifact as planned, not current', () => {
    renderPage()
    expect(screen.getByText(/Engagement reports on listing traffic — planned/i)).toBeInTheDocument()
    expect(screen.getByText(/Named in the compliance digest — planned/i)).toBeInTheDocument()
    expect(screen.getByText(/Monthly compliance digest — planned/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Full-time PQC standards analyst — once fully funded/i)
    ).toBeInTheDocument()
  })

  it('matches /editorial-independence funding tiers exactly (Supporter, Sponsor, Patron)', () => {
    renderPage()
    // editorial-independence.md item 3: funding-sources section names exactly
    // these three GitHub Sponsors tiers by name (see EditorialIndependenceView
    // "Supporter, Sponsor, and Patron tiers"). "Consultants" below is a buyer
    // persona card, not a pricing tier, and is unrelated to that reconciliation.
    expect(screen.getByRole('heading', { name: 'Supporter' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sponsor' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Patron' })).toBeInTheDocument()
  })

  it('links verifiable funded items to a real page', () => {
    renderPage()
    const revisionsLink = screen.getByRole('link', { name: /Monthly vendor-mapping refresh/i })
    expect(revisionsLink).toHaveAttribute('href', '/revisions')
    const editorialLink = screen.getByRole('link', { name: /Protected editorial independence/i })
    expect(editorialLink).toHaveAttribute('href', '/editorial-independence')
  })
})
