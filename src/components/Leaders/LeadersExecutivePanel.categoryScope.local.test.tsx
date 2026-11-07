// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { LeadersExecutivePanel } from './LeadersExecutivePanel'
import { LEADER_CATEGORIES } from './leadersConstants'
import type { Leader } from '@/data/leadersData'

describe('Executive directory category context', () => {
  it('explains every offered category even when the directory is empty', () => {
    render(<LeadersExecutivePanel leaders={[]} />)
    for (const category of LEADER_CATEGORIES) {
      const row = screen
        .getAllByRole('listitem')
        .find((item) => within(item).queryByText(category))!
      expect(row).toHaveTextContent(/— \S.+/)
      expect(within(row).getByText('(0)')).toBeInTheDocument()
    }
    expect(screen.getByText(/Counts use each profile's primary category/)).toBeInTheDocument()
  })

  it('keeps primary-category counts distinct from cross-reference matches', () => {
    const leader: Leader = {
      id: 'sample-contributor',
      leaderId: 'sample-contributor',
      name: 'Sample contributor',
      country: 'Example',
      title: 'Example role',
      organizations: ['Example project'],
      type: 'Academic',
      category: 'Standards',
      bio: 'Fictional sample.',
      sourceKind: 'curated',
      patentRefs: ['sample-patent'],
      migrateCatalogRefs: ['sample-project'],
    }
    render(<LeadersExecutivePanel leaders={[leader]} />)
    const standardsRow = screen
      .getAllByRole('listitem')
      .find((item) => within(item).queryByText('Standards'))!
    expect(within(standardsRow).getByText('(1)')).toBeInTheDocument()
    for (const category of ['Patent Inventor', 'Open Source Maintainer']) {
      const row = screen
        .getAllByRole('listitem')
        .find((item) => within(item).queryByText(category))!
      expect(within(row).getByText('(0)')).toBeInTheDocument()
    }
    expect(screen.getByText(/not a legal opinion/)).toBeInTheDocument()
  })
})
