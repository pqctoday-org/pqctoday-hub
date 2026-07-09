// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EditorialIndependenceView } from './EditorialIndependenceView'

describe('EditorialIndependenceView', () => {
  it('renders a per-section anchor for every table-of-contents entry', () => {
    render(<EditorialIndependenceView />)
    const tocLinks = screen.getAllByRole('link', { name: /./ })
    const anchorHrefs = tocLinks
      .map((a) => a.getAttribute('href'))
      .filter((href): href is string => !!href?.startsWith('#editorial-independence-'))
    expect(anchorHrefs.length).toBeGreaterThanOrEqual(7)
    for (const href of anchorHrefs) {
      const id = href.slice(1)
      expect(document.getElementById(id)).not.toBeNull()
    }
  })

  it('does not claim a distinct "Consultant tier" funding source (matches /sponsor: Supporter/Sponsor/Patron)', () => {
    render(<EditorialIndependenceView />)
    expect(screen.queryByText(/Consultant tier subscriptions/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Supporter, Sponsor, and Patron tiers/i)).toBeInTheDocument()
  })

  it('labels the tipline honestly as planned rather than implying it exists', () => {
    render(<EditorialIndependenceView />)
    expect(
      screen.getByText(/anonymous third-party tipline is planned but not yet built/i)
    ).toBeInTheDocument()
  })

  it('claims the Sponsor badge only in the context of the real /migrate listing', () => {
    render(<EditorialIndependenceView />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/marked with a.*Sponsor.*badge on its listing in.*\/migrate/i)
  })
})
